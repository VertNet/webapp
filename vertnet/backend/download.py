"""Download backend."""

from google.appengine.api import files
from google.appengine.api import mail

from vertnet.service.model import RecordIndex
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

class DownloadApi(webapp2.RequestHandler):
    def post(self):
        q = json.loads(self.request.get('q'))
        email = self.request.get('email')
        filename = '/gs/vn-downloads/%s' % uuid.uuid4().hex
        logging.info('Creating filename %s' % filename)
        writable_file_name = files.gs.create(filename, 
            mime_type='text/tab-separated-values', acl='public-read')
        logging.info('Writing to %s' % writable_file_name)
        with files.open(writable_file_name, 'a') as f:
            records, cursor, more, count = RecordIndex.search(q, 500)
            chunk = _get_tsv_chunk(records)
            f.write(chunk)  
            f.close(finalize=False)  
            while more:
                records, cursor, more, count = RecordIndex.search(q, 500, cursor=cursor)
                chunk = _get_tsv_chunk(records)
                with files.open(writable_file_name, 'a') as f:
                    f.write(chunk)    
        files.finalize(writable_file_name)
        mail.send_mail(sender="VertNet Downloads <eightysteele@gmail.com>", 
            to=email, subject="Your VertNet download is ready!",
                      body="""
        You can download it here: https://storage.cloud.google.com/vn-downloads/%s 
        """ % filename.split('/')[-1])

api = webapp2.WSGIApplication([
    webapp2.Route(r'/_ah/start', StartHandler),
    webapp2.Route(r'/backend/download', handler=DownloadApi)],
    debug=True)
        