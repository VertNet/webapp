"""Download service."""

# Removing dependency on Files API due to its deprecation by Google
#from google.appengine.api import files
import cloudstorage as gcs
from oauth2client.client import GoogleCredentials
from apiclient import discovery

from google.appengine.api import mail
from google.appengine.api import taskqueue
from google.appengine.api import search
from vertnet.service import util
from vertnet.service import search as vnsearch
import webapp2
import json
import logging
import uuid

def _write_record(f, record):
    f.write('%s\n' % record.csv)

def _tsv(json):
    json['datasource_and_rights'] = json.get('url')
    header = util.DWC_HEADER_LIST
    values = []
    for x in header:
        if json.has_key(x):
            values.append(unicode(json[x]).rstrip())
        else:
            values.append(u'')
    return u'\t'.join(values).encode('utf-8')

def _get_tsv_chunk(records):
    tsv_lines = map(_tsv, records)
    chunk = reduce(lambda x,y: '%s\n%s' % (x,y), tsv_lines)
    return chunk

# An example of a message body to pass to compose
# def alt_composer():
#     c={
#         'sourceObjects': [
#         {
#             'name': 'JRWComposeTestCtenomys-16a46b1b08dc4d1baa667097d48acf5d-0.tsv'
#         },
#         {
#             'name': 'JRWComposeTestCtenomys-16a46b1b08dc4d1baa667097d48acf5d-1.tsv'
#         }
#         ],
#         'kind': 'storage#composeRequest',
#         'destination': {
#             'bucket': 'vn-dltest',
#             'contentType': 'text/plain'
#         }
#     }
#     return c

def compose_request(bucketname, filepattern, filecount):
    """Construct a API Compose dictionary from a bucketname, filepattern and 
    number of files."""
    
    objectlist=[]
    for i in range(filecount+1):
        objectdict={}
        filename='%s-%s.tsv' % (filepattern,i)
        objectdict['name']=filename
        objectlist.append(objectdict)

    composedict={}
    composedict['sourceObjects']=objectlist
    dest={}
    dest['contentType']='text/tab-separated-values'
    dest['bucket']=bucketname
    composedict['destination']=dest
    composedict['kind']='storage#composeRequest'
    return composedict
    # Do not turn this into JSON
#    return json.dumps(composedict)

# TODO: Make idempotent.
class WriteHandler(webapp2.RequestHandler):
    def post(self):
        SEARCH_CHUNK_SIZE=1000
        q, email, name, latlon = map(self.request.get, ['q', 'email', 'name', 'latlon'])
        q = json.loads(q)
        bucketname  = self.request.get('bucketname')
        filepattern = self.request.get('filepattern')
        fileindex = int(self.request.get('fileindex'))
        filename = '/%s/%s-%s.tsv' % (bucketname, filepattern, fileindex)
        cursor = self.request.get('cursor')
        large_file = True if self.request.get('large_file')=='True' else False
        if cursor:
            curs = search.Cursor(web_safe_string=cursor)
        else:
            curs = None

        # Write single chunk to file, GCS does not support append
        max_retries = 10
        retry_count = 0
        success = False
        while not success and retry_count < max_retries:
            try:
                with gcs.open(filename, 'w', content_type='text/tab-separated-values',
                             options={'x-goog-acl': 'public-read'}) as f:
                    records, next_cursor, count = vnsearch.query(q, SEARCH_CHUNK_SIZE, curs=curs)
                    if not curs:
                        params = dict(query=q, type='download', count=count, 
                                      downloader=email, download=filename, latlon=latlon)
                        taskqueue.add(url='/apitracker', params=params, queue_name="apitracker") 
                    chunk = '%s\n' % _get_tsv_chunk(records)
                    if fileindex==0:
                        f.write('%s\n' % util.DWC_HEADER)
                    f.write(chunk)
                    success = True
#                    logging.info('Download chunk saved to  %s' % filename)
            except Exception, e:
                logging.error("I/O error writing chunk to FILE: %s for\nQUERY: %s" 
                    % (filename,q) )
                retry_count += 1
                raise e

        # Queue up next chunk or current chunk if failed to write
        if not success:    
            next_cursor = curs
        if next_cursor:
            curs = next_cursor.web_safe_string
        else:
            curs = ''
        
        if curs:
            fileindex = fileindex + 1
            params=dict(q=self.request.get('q'), email=email, name=name, 
                        filepattern=filepattern, bucketname=bucketname, 
                        latlon=latlon, cursor=curs, large_file=large_file, 
                        fileindex=fileindex)
            taskqueue.add(url='/service/download/write', params=params,
                         queue_name="downloadwrite")
        
        # Finalize and email.
        else:
            params=dict(q=self.request.get('q'), email=email, name=name, 
                        filepattern=filepattern, bucketname=bucketname, 
                        latlon=latlon, cursor=curs, large_file=large_file, 
                        fileindex=fileindex)
            taskqueue.add(url='/service/download/compose', params=params,
                         queue_name="compose")

class ComposeHandler(webapp2.RequestHandler):
    def post(self):
        q, email, name, latlon = map(self.request.get, ['q', 'email', 'name', 'latlon'])
        q = json.loads(q)
        bucketname  = self.request.get('bucketname')
        filepattern = self.request.get('filepattern')
        files_to_compose = int(self.request.get('fileindex'))
        filename = '/%s/%s-%s.tsv' % (bucketname, filepattern, files_to_compose)
        large_file = True if self.request.get('large_file')=='True' else False

        # Finalize and email.
        # Compose chunks into composite objects until there is one composite object
        # Then remove all the chunks and return a URL to the composite
        # Only 32 objects can be composed at once, limit 1024 in a composition of 
        # compositions. 
        # See https://cloud.google.com/storage/docs/composite-objects#_Compose
#        if files_to_compose>32:
            # Going to need to do this in multiple passes
#                 # Compose in sets of 32 or less until there are no more than
#                 logging.info('There are >32 (%s) files to compose into the result set.' % files_to_compose)
#                 if files_to_compose>1024:
#                     # Houston, we have a problem
#                     logging.warning('There are too many files (%s) to compose into the result set.' % files_to_compose)
        composed_filename='%s.tsv' % filepattern            
        mbody=compose_request(bucketname, filepattern, files_to_compose)

        # Get the application default credentials.
        credentials = GoogleCredentials.get_application_default()

        # Construct the service object for interacting with the Cloud Storage API.
        service = discovery.build('storage', 'v1', credentials=credentials)

        # Getting bucket info in GCS
        # Make a request to buckets.get to retrieve information about the given bucket.
#            req = service.buckets().get(bucket=bucketname)
#            resp = req.execute()
#            logging.info('Bucket Info: %s' % json.dumps(resp, indent=2) )

        # Composing objects in GCS
        # See https://cloud.google.com/storage/docs/json_api/v1/objects/compose#examples
        
        req = service.objects().compose(
            destinationBucket=bucketname,
            destinationObject=composed_filename,
            destinationPredefinedAcl='publicRead',
            body=mbody)
#            logging.info('Composed file name: %s\nMessage body: %s' % (composed_filename, mbody))
        resp = req.execute()
#            logging.info('Compose response: %s' % (resp) )

        # Remove all chunk files
        for i in range(files_to_compose+1):
            filename='%s-%s.tsv' % (filepattern,i)
            req = service.objects().delete(bucket=bucketname, object=filename)
            resp=req.execute()

        # Now, can we zip it?
            
        logging.info("Finalized writing %s/%s" % (bucketname,composed_filename) )
        if large_file is True:
            mail.send_mail(sender="VertNet Downloads <vertnetinfo@vertnet.org>", 
                to=email, subject="Your VertNet download is ready!",
                body="""
You can download "%s" here within the next 24 hours: https://storage.googleapis.com/%s/%s
""" % (name, bucketname, composed_filename))

class DownloadHandler(webapp2.RequestHandler):
    def _queue(self, q, email, name, latlon, large_file):
        # Google Cloud Storage bucket for downloads to be stored in
#        bucketname='/vn-downloads2'
        bucketname='vn-dltest'

        # Create a base filename for all chunks to be composed for this download
        filepattern = '%s-%s' % (name, uuid.uuid4().hex)

        # Start the download process with the first file having fileindex 0
        taskqueue.add(url='/service/download/write', params=dict(q=json.dumps(q),
            email=email, name=name, filepattern=filepattern, bucketname=bucketname,
                latlon=latlon, large_file=large_file, fileindex=0),
                queue_name="downloadwrite")

    def post(self):
        self.get()
    
    def get(self):
        count, keywords, email, name, download, bucketname = map(self.request.get, 
            ['count', 'keywords', 'email', 'name', 'filepattern', 'bucketname'])
        logging.info(' . '.join([count, keywords, email, name, download]))
        q = ' '.join(json.loads(keywords))
        count = int(count)
        latlon = self.request.headers.get('X-AppEngine-CityLatLong')
        if count <= 1000:
            self._queue(q, email, name, latlon, 'False')
            filename = str('%s.txt' % name)
            self.response.headers['Content-Type'] = "text/tab-separated-values"
            self.response.headers['Content-Disposition'] = "attachment; filename=%s" % filename
            records, cursor, count = vnsearch.query(q, count)
            params = dict(query=q, type='download', count=count, downloader=email, 
                download=download, latlon=latlon)
            taskqueue.add(url='/apitracker', params=params, queue_name="apitracker") 
            data = '%s\n%s' % (util.DWC_HEADER, _get_tsv_chunk(records))
            self.response.out.write(data)
        else:
            self._queue(q, email, name, latlon, 'True')

api = webapp2.WSGIApplication([
    webapp2.Route(r'/service/download', handler=DownloadHandler),
    webapp2.Route(r'/service/download/write', handler=WriteHandler),
    webapp2.Route(r'/service/download/compose', handler=ComposeHandler)
    ], debug=True)
