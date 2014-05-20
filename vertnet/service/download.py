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

        # The variable requeuecnt keeps track of how many times a query for a single "chunk" of records
        # has been requeued due to query or file write failure.
        requeuecnt = int(self.request.get('requeuecnt'))
        max_requeues = 4

        writable_file_name = self.request.get('writable_file_name')
        filename = self.request.get('filename')
        cursor = self.request.get('cursor')
        if cursor:
            curs = search.Cursor(web_safe_string=cursor)
        else:
            curs = None
        logging.info('CURSOR %s' % curs)

        # Set maximum retries and a variable for tracking overall record retrieval and output
        # success or failure.
        max_retries = 4
        success = False

        # Keep track of whether the query succeeded.  If the query succeeds but the file I/O fails,
        # then we have to give up because we can no longer guarantee that the results will be
        # correct (and because something is not working!).
        query_success = False

        # Keep track of file writing success separately.
        # That way, we can prevent writing the same chunk to the file more than once
        # if the file write succeeds but the close operation fails.
        fwrite_success = False

        # Attempt to retrieve the next chunk of records.
        result = None
        retry_count = 0
        retry_time = 1
        while not query_success and retry_count <= max_retries:
            # Check if this is a retry attempt and if so, wait before running the query.
            if retry_count > 0:
                logging.warning("The previous query attempt failed.  Waiting " + str(retry_time) +
                        " second(s) before retry " + str(retry_count) + ".")
                time.sleep(retry_time)
                # Increase successive retry times multiplicatively.
                retry_time *= 2

            # Try running the query.
            result = vnsearch.query(q, 400, curs=curs)

            if len(result) == 3:
                # The query succeeded.
                query_success = True
            else:
                # The query failed.  Retry on the next loop iteration.
                retry_count += 1

        # If the query succeeded, try to write the next chunk of records to the output file.
        retry_count = 0
        retry_time = 1
        if query_success:
            records, next_cursor, count = result
            chunk = '%s\n' % _get_tsv_chunk(records)

            while not success and retry_count <= max_retries:
                # Check if this is a retry attempt and if so, wait before running the query.
                if retry_count > 0:
                    logging.warning("The previous file I/O attempt failed.  Waiting " + str(retry_time) +
                            " second(s) before retry " + str(retry_count) + ".")
                    time.sleep(retry_time)
                    # Increase successive retry times multiplicatively.
                    retry_time *= 2

                # Try to write the results to the output file.
                try:
                    with files.open(writable_file_name, 'a') as f:
                        if not curs:
                            params = dict(query=q, type='download', count=count, downloader=email, latlon=latlon)
                            taskqueue.add(url='/apitracker', params=params, queue_name="apitracker")
                        if not fwrite_success:
                            f.write(chunk)
                            fwrite_success = True
                        f.close(finalize=False)
                        success = True
                except Exception as e:
                    # Writing the chunk to or closing the file failed.
                    # Retry on the next loop iteration.
                    logging.error("I/O error: %s" % e)
                    retry_count += 1
                    #raise e

        # Set the appropriate cursor value for the next request.
        if not success:    
            next_cursor = curs
        if next_cursor:
            curs = next_cursor.web_safe_string
        else:
            curs = ''
        
        if success:
            if curs == '':
                # The query succeeded and there are no more results, so finalize and email.
                files.finalize(writable_file_name)
                mail.send_mail(sender="VertNet Downloads <eightysteele@gmail.com>", 
                    to=email, subject="Your VertNet download from the testing instance is ready!",
                    body="""
You can download "%s" here within the next 24 hours: https://storage.cloud.google.com/vn-downloads2/%s
""" % (name, filename.split('/')[-1]))
            else:
                # The query succeeded and there are more results to retrieve, so queue up
                # a request to retrieve the next set of records.
                taskqueue.add(url='/service/download/write', 
                    params=dict(q=self.request.get('q'), requeuecnt=0, email=email,
                        filename=filename, writable_file_name=writable_file_name, name=name, 
                        cursor=curs),
                    queue_name="downloadwrite")
        else:
            # The query or attempt to write to the output file failed.
            if (requeuecnt < max_requeues) and not query_success:
                # The query failed, so re-enqueue the same request to try again.
                taskqueue.add(url='/service/download/write',
                    params=dict(q=self.request.get('q'), requeuecnt=(requeuecnt + 1),
                        email=email, filename=filename, writable_file_name=writable_file_name,
                        name=name, cursor=curs),
                    queue_name="downloadwrite")
            else:
                # The maximum number of repeat enqueues was exceeded, or data retrieval succeeded
                # but file I/O failed.  In the latter case, we have to give up because we can no
                # longer guarantee that the results will be correct (e.g., if the chunk was written
                # but the close() operation failed).  Send an email to the user indicating that
                # the query failed, and give up.
                if query_success and not fwrite_success:
                    logging.error('Download file I/O failed after the maximum number (' +
                            str(max_retries) + ') of retries.')
                    msg = """
We are sorry to report that VertNet was unable to complete your request for the results of the query "%s" because of a failure while writing the results file.  Please try again at a later time.
""" % (q)
                else:
                    logging.error('The maximum number of re-enqueues (' + str(max_requeues) +
                        ') for this download file writing task was exceeded.')
                    msg = """
We are sorry to report that VertNet was unable to complete your request for the results of the query "%s" because of a failure while trying to retrieve the data records.  Please try again at a later time.
""" % (q)
                # Send the email and make a last attempt to finalize the file.
                mail.send_mail(sender="VertNet Downloads <eightysteele@gmail.com>", 
                    to=email, subject="VertNet query failure",
                    body=msg)
                try:
                    files.finalize(writable_file_name)
                except Exception as e:
                    logging.error("I/O error during last attempt at finalize() before terminating: %s" % e)
        

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
        taskqueue.add(url='/service/download/write', params=dict(q=json.dumps(q), requeuecnt=0,
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
        
