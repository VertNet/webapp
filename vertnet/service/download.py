"""Download service."""

from google.appengine.api import files
from google.appengine.api import mail
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.api import taskqueue
from vertnet.service import util

from vertnet.service.model import RecordIndex
import webapp2
import json
import logging
import uuid

def _write_record(f, record):
    f.write('%s\n' % record.csv)

def _get_tsv_chunk(records):
    tsv_lines = [x.tsv for x in records if x]
    chunk = reduce(lambda x,y: '%s\n%s' % (x,y), tsv_lines)
    return chunk

# TODO: Make idempotent.
class WriteHandler(webapp2.RequestHandler):
    def post(self):
        q, email, name = map(self.request.get, ['q', 'email', 'name'])
        q = json.loads(q)
        writable_file_name = self.request.get('writable_file_name')
        filename = self.request.get('filename')
        cursor = self.request.get('cursor')
        if cursor:
            cursor = Cursor(urlsafe=cursor)
        more = False

        # Write chunk.
        max_retries = 10
        retry_count = 0
        success = False
        while not success and retry_count < max_retries:
            try:
                with files.open(writable_file_name, 'a') as f:
                    records, next_cursor, more, count = RecordIndex.search(q, 100, cursor=cursor)
                    chunk = _get_tsv_chunk(records)
                    f.write(chunk) 
                    f.close(finalize=False)     
                    success = True
            except files.exception.Error as e:
                logging.error("I/O error({0}): {1}".format(e.errno, e.strerror))
                retry_count += 1


        # Queue up next chunk or current chunk if failed to write
        if not success:
            next_cursor = cursor
        if more or not success:    
            taskqueue.add(url='/service/download/write', 
                params=dict(q=self.request.get('q'), email=email, filename=filename, 
                    writable_file_name=writable_file_name, name=name, 
                    cursor=next_cursor.urlsafe()), queue_name="downloadwrite")
        
        # Finalize and email.
        else:
            files.finalize(writable_file_name)
            mail.send_mail(sender="VertNet Downloads <eightysteele@gmail.com>", 
                to=email, subject="Your VertNet download is ready!",
                body="""
You can download "%s" here within the next 24 hours: https://storage.cloud.google.com/vn-downloads/%s
""" % (name, filename.split('/')[-1]))

class DownloadHandler(webapp2.RequestHandler):

    def _queue(self, q, email, name):
        filename = '/gs/vn-downloads/%s-%s.tsv' % (name, uuid.uuid4().hex)
        writable_file_name = files.gs.create(filename, 
            mime_type='text/tab-separated-values', acl='public-read')
        
        # Write header
        with files.open(writable_file_name, 'a') as f:
            f.write('%s\n' % util.DWC_HEADER)
            f.close(finalize=False) 
        
        # Queue up downloads
        taskqueue.add(url='/service/download/write', params=dict(q=json.dumps(q), 
            email=email, name=name, filename=filename, writable_file_name=writable_file_name), 
            queue_name="downloadwrite")

    def post(self):
        self.get()
    
    def get(self):
        count, terms, keywords, email, name = map(self.request.get, 
            ['count', 'terms', 'keywords', 'email', 'name'])
        logging.info(' . '.join([count, terms, keywords, email, name]))
        q = dict(terms=json.loads(terms), keywords=json.loads(keywords))
        count = int(count)
        if count <= 1000:
            fname = str('%s.tsv' % name)
            self.response.headers['Content-Type'] = "text/tab-separated-values"
            self.response.headers['Content-Disposition'] = "attachment; filename=%s" % fname
            records, cursor, more, count = RecordIndex.search(q, count)
            data = '%s\n%s' % (util.DWC_HEADER, _get_tsv_chunk(records))
            self.response.out.write(data)
        else:
            self._queue(q, email, name)

api = webapp2.WSGIApplication([
    webapp2.Route(r'/service/download', handler=DownloadHandler),
    webapp2.Route(r'/service/download/write', handler=WriteHandler)],
    debug=True)
        