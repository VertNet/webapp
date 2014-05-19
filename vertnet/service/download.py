"""Download service."""

from google.appengine.api import files
from google.appengine.api import mail
from google.appengine.api import taskqueue
from vertnet.service import util
from google.appengine.api import search
from vertnet.service import search as vnsearch
import webapp2
import json
import logging
import uuid
import time

def _write_record(f, record):
    f.write('%s\n' % record.csv)

def _tsv(json):
    json['datasource_and_rights'] = json.get('url')
    header = util.DWC_HEADER_LIST
    values = []
    for x in header:
        if json.has_key(x):
            values.append(unicode(json[x]))
        else:
            values.append(u'')
    return u'\t'.join(values).encode('utf-8')

def _get_tsv_chunk(records):
    if len(records) > 0:
        tsv_lines = map(_tsv, records)
        chunk = reduce(lambda x,y: '%s\n%s' % (x,y), tsv_lines)
    else:
        chunk = ''

    return chunk

# TODO: Make idempotent.
class WriteHandler(webapp2.RequestHandler):
    def post(self):
        q, email, name, latlon = map(self.request.get, ['q', 'email', 'name', 'latlon'])
        q = json.loads(q)
        writable_file_name = self.request.get('writable_file_name')
        filename = self.request.get('filename')
        cursor = self.request.get('cursor')
        if cursor:
            curs = search.Cursor(web_safe_string=cursor)
        else:
            curs = None
        logging.info('CURSOR %s' % curs)

        # Retrieve the next chunk of records and write it to the output file.
        max_retries = 4
        retry_count = 0
        success = False
        while not success and retry_count < max_retries:
            # First, try retrieving the data from App Engine.
            result = vnsearch.query(q, 400, curs=curs)
            if len(result) == 3:
                # The query succeeded, so proceed with trying to write the results
                # to the output file.
                records, next_cursor, count = result
                try:
                    with files.open(writable_file_name, 'a') as f:
                        if not curs:
                            params = dict(query=q, type='download', count=count, downloader=email, latlon=latlon)
                            taskqueue.add(url='/apitracker', params=params, queue_name="apitracker") 
                        chunk = '%s\n' % _get_tsv_chunk(records)
                        f.write(chunk) 
                        f.close(finalize=False)
                        success = True
                except Exception as e:
                    logging.error("I/O error %s" % e)
                    retry_count += 1
                    raise e
            else:
                # The query failed.  Wait 1 second, then try the query again.
                retry_count += 1
                time.sleep(1)

        # Queue up next chunk or current chunk if failed to write
        if not success:    
            next_cursor = curs
        if next_cursor:
            curs = next_cursor.web_safe_string
        else:
            curs = ''
        
        if curs:
            taskqueue.add(url='/service/download/write', 
                params=dict(q=self.request.get('q'), email=email, filename=filename, 
                    writable_file_name=writable_file_name, name=name, 
                    cursor=curs), queue_name="downloadwrite")
        
        # Finalize and email.  Only try to do so if the query actually succeeded.
        elif success:
            files.finalize(writable_file_name)
            mail.send_mail(sender="VertNet Downloads <eightysteele@gmail.com>", 
                to=email, subject="Your VertNet download from the testing instance is ready!",
                body="""
You can download "%s" here within the next 24 hours: https://storage.cloud.google.com/vn-downloads2/%s
""" % (name, filename.split('/')[-1]))

class DownloadHandler(webapp2.RequestHandler):

    def _queue(self, q, email, name, latlon):
        filename = '/gs/vn-downloads2/%s-%s.txt' % (name, uuid.uuid4().hex)
        writable_file_name = files.gs.create(filename, 
            mime_type='text/tab-separated-values', acl='public-read')
        
        # Write header
        with files.open(writable_file_name, 'a') as f:
            f.write('%s\n' % util.DWC_HEADER)
            f.close(finalize=False) 
        
        # Queue up downloads
        taskqueue.add(url='/service/download/write', params=dict(q=json.dumps(q), 
            email=email, name=name, filename=filename, writable_file_name=writable_file_name, latlon=latlon), 
            queue_name="downloadwrite")

    def post(self):
        self.get()
    
    def get(self):
        count, keywords, email, name = map(self.request.get, 
            ['count', 'keywords', 'email', 'name'])
        logging.info(' . '.join([count, keywords, email, name]))
        q = ' '.join(json.loads(keywords))
        count = int(count)
        latlon = self.request.headers.get('X-AppEngine-CityLatLong')
        if count <= 1000:
            fname = str('%s.txt' % name)
            self.response.headers['Content-Type'] = "text/tab-separated-values"
            self.response.headers['Content-Disposition'] = "attachment; filename=%s" % fname
            records, cursor, count = vnsearch.query(q, count)
            params = dict(query=q, type='download', count=count, downloader=email, latlon=latlon)
            taskqueue.add(url='/apitracker', params=params, queue_name="apitracker") 
            data = '%s\n%s' % (util.DWC_HEADER, _get_tsv_chunk(records))
            self.response.out.write(data)
        else:
            self._queue(q, email, name, latlon)

api = webapp2.WSGIApplication([
    webapp2.Route(r'/service/download', handler=DownloadHandler),
    webapp2.Route(r'/service/download/write', handler=WriteHandler)],
    debug=True)
        
