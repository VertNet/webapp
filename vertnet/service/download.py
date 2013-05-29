"""Download backend."""

from google.appengine.api import files
from google.appengine.api import mail
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.api import taskqueue

from vertnet.service.model import RecordIndex, Record
import webapp2
import json
import logging
import uuid

def _write_record(f, record):
    f.write('%s\n' % record.csv)

def _get_tsv_chunk(records):
    tsv_lines = [x.tsv for x in records]
    chunk = reduce(lambda x,y: '%s\n%s' % (x,y), tsv_lines)
    return chunk

class StartHandler(webapp2.RequestHandler):
    def get(self):
        logging.info('DOWNLOAD BACKEND STARTUP')

# TODO: Make idempotent.
class WriteHandler(webapp2.RequestHandler):
    def post(self):
        logging.info('Q %s' % self.request.get('q'))
        q = json.loads(self.request.get('q'))
        name = self.request.get('name')
        email = self.request.get('email')
        writable_file_name = self.request.get('writable_file_name')
        filename = self.request.get('filename')
        cursor = self.request.get('cursor')
        if cursor:
            cursor = Cursor(urlsafe=cursor)
        more = False

        # Write chunk.
        with files.open(writable_file_name, 'a') as f:
            records, cursor, more, count = RecordIndex.search(q, 100, cursor=cursor)
            chunk = _get_tsv_chunk(records)
            f.write(chunk) 
            f.close(finalize=False)     

        # Queue up next chunk.
        if more:
            taskqueue.add(url='/service/download/write', 
                params=dict(q=self.request.get('q'), email=email, filename=filename, 
                    writable_file_name=writable_file_name, name=name, 
                    cursor=cursor.urlsafe()), queue_name="downloadwrite")
        
        # Finalize and email.
        else:
            files.finalize(writable_file_name)
            mail.send_mail(sender="VertNet Downloads <eightysteele@gmail.com>", 
                to=email, subject="Your VertNet download is ready!",
                body="""
        You can download "%s" here: https://storage.cloud.google.com/vn-downloads/%s 
        """ % (name, filename.split('/')[-1]))

class DownloadHandler(webapp2.RequestHandler):
    def post(self):
        q = self.request.get('q')
        email = self.request.get('email')
        name = self.request.get('name')
        filename = '/gs/vn-downloads/%s' % uuid.uuid4().hex
        writable_file_name = files.gs.create(filename, 
            mime_type='text/tab-separated-values', acl='public-read')
        
        # Write header
        with files.open(writable_file_name, 'a') as f:
            f.write('%s\n' % Record.header())
            f.close(finalize=False) 

        # Email confirmation
        mail.send_mail(sender="VertNet Downloads <eightysteele@gmail.com>", 
                to=email, subject="Your VertNet download request was received!",
                body="""
        We'll email you when your result set "%s" is ready.
        """ % name)    
        
        # Queue up downloads
        taskqueue.add(url='/service/download/write', params=dict(q=q, email=email, 
            name=name, filename=filename, writable_file_name=writable_file_name), 
                queue_name="downloadwrite")


api = webapp2.WSGIApplication([
    webapp2.Route(r'/_ah/start', StartHandler),
    webapp2.Route(r'/service/download', handler=DownloadHandler),
    webapp2.Route(r'/service/download/write', handler=WriteHandler)],
    debug=True)
        