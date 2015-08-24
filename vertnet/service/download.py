"""Download service."""

# Removing dependency on Files API due to its deprecation by Google
import cloudstorage as gcs
from oauth2client.client import GoogleCredentials
from apiclient import discovery
from datetime import datetime

from google.appengine.api import mail
from google.appengine.api import taskqueue
from google.appengine.api import search
from vertnet.service import util
from vertnet.service import search as vnsearch
import webapp2
import json
import logging
import uuid

DOWNLOAD_VERSION='download.py 2015-08-24T18:50:15+02:00'

SEARCH_CHUNK_SIZE=1000 # limit on documents in a search result: rows per file
COMPOSE_FILE_LIMIT=32 # limit on the number of files in a single compose request
COMPOSE_OBJECT_LIMIT=1024 # limit on the number of files in a composition
TEMP_BUCKET='vn-dltest' # bucket for temp compositions
DOWNLOAD_BUCKET='vn-downloads2' # production bucket for downloads
FILE_EXTENSION='tsv'

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

def compose_request(bucketname, filepattern, begin, end):
    """Construct a API Compose dictionary from a bucketname and filepattern.
    bucketname - the GCS bucket in which the files will be composed. Ex. 'vn-downloads2'
    filepattern - the naming pattern for the composed files. Ex. 'MyResult-UUID'
    begin - the index of the first file in the composition used to grab a range of files.
    end - begin plus the number of files to put in the composition (i.e., end index + 1)
    """

    objectlist=[]
    for i in range(begin,end):
        objectdict={}
        filename='%s-%s.%s' % (filepattern,i,FILE_EXTENSION)
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

def acl_update_request():
    mbody={}
    # An acl property cannot be included in the request body  
    # if the predefinedAcl parameter is given in the update request
    # the request body is required, and the contentType is required in the request body
    mbody['contentType']='text/tab-separated-values'
    return mbody

class DownloadHandler(webapp2.RequestHandler):
    def _queue(self, q, email, name, latlon):
        # Create a base filename for all chunks to be composed for this download
        filepattern = '%s-%s' % (name, uuid.uuid4().hex)
        requesttime = datetime.utcnow().isoformat()

        # Start the download process with the first file having fileindex 0
        # Start the record count at 0
        taskqueue.add(url='/service/download/write', 
            params=dict(q=json.dumps(q), email=email, name=name, filepattern=filepattern, 
            latlon=latlon, fileindex=0, reccount=0, requesttime=requesttime), 
            queue_name="downloadwrite")

    def post(self):
        self.get()

    def get(self):
        count, keywords, email, name, download = map(self.request.get, 
            ['count', 'keywords', 'email', 'name', 'filepattern'])
        logging.info(' . '.join([count, keywords, email, name, download]))
        q = ' '.join(json.loads(keywords))
        count = int(count)
        latlon = self.request.headers.get('X-AppEngine-CityLatLong')
        if count > SEARCH_CHUNK_SIZE:
            # The results are larger than SEARCH_CHUNK_SIZE, compose a file for download
            self._queue(q, email, name, latlon)
        else:
            # The results are smaller than SEARCH_CHUNK_SIZE, download directly and make
            # a copy of the file in the download bucket
            filename = str('%s.txt' % name)
            self.response.headers['Content-Type'] = "text/tab-separated-values"
            self.response.headers['Content-Disposition'] = "attachment; filename=%s" \
                % filename
            records, cursor, count, version = vnsearch.query(q, count)
            params = dict(query=q, type='download', count=count, downloader=email, 
                download=download, latlon=latlon)
            taskqueue.add(url='/apitracker', params=params, queue_name="apitracker") 
            data = '%s\n%s' % (util.DWC_HEADER, _get_tsv_chunk(records))
            self.response.out.write(data)

            # Write single chunk to file in DOWNLOAD_BUCKET
            max_retries = 10
            retry_count = 0
            success = False
            while not success and retry_count < max_retries:
                try:
                    filepattern = '%s-%s' % (name, uuid.uuid4().hex)
                    filename = '/%s/%s.%s' % (DOWNLOAD_BUCKET, filepattern, 
                        FILE_EXTENSION)
                    logging.info('Writing copy of %s records to  %s.\nVersion: %s' 
                        % (len(records), filename, DOWNLOAD_VERSION) )
                    with gcs.open(filename, 'w', content_type='text/tab-separated-values',
                            options={'x-goog-acl': 'public-read'}) as f:
                        records, cursor, count, version = vnsearch.query(q, count)
                        chunk = '%s\n' % _get_tsv_chunk(records)
                        f.write('%s\n' % util.DWC_HEADER)
                        f.write(chunk)
                        success = True
                except Exception, e:
                    logging.error("I/O error writing small results to \
                        %s.\nError: %s\nVersion: %s" % (filename,e,DOWNLOAD_VERSION) )
                    retry_count += 1
#                    raise e

class WriteHandler(webapp2.RequestHandler):
    def post(self):
        q, email, name, latlon = map(self.request.get, ['q', 'email', 'name', 'latlon'])
        q = json.loads(q)
        requesttime = self.request.get('requesttime')
        filepattern = self.request.get('filepattern')
        fileindex = int(self.request.get('fileindex'))
        reccount = int(self.request.get('reccount'))
        filename = '/%s/%s-%s.%s' % (TEMP_BUCKET, filepattern, fileindex, FILE_EXTENSION)
        cursor = self.request.get('cursor')

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
                    records, next_cursor, count, version = \
                        vnsearch.query(q, SEARCH_CHUNK_SIZE, curs=curs)
                    if not curs:
                        params = dict(query=q, type='download', count=count, 
                            downloader=email, download=filename, latlon=latlon)
                        taskqueue.add(url='/apitracker', params=params, 
                            queue_name="apitracker") 
                    chunk = '%s\n' % _get_tsv_chunk(records)
                    if fileindex==0:
                        f.write('%s\n' % util.DWC_HEADER)
                    f.write(chunk)
                    success = True
                    reccount = reccount+len(records)
                    logging.info('Download chunk saved to  %s: total %s \
                        records.\nVersion: %s' % (filename, reccount, DOWNLOAD_VERSION) )
            except Exception, e:
                logging.error("I/O error writing chunk to FILE: %s for\nQUERY: %s \
                    \nError: %s\nVersion: %s" % (filename, q, e, DOWNLOAD_VERSION) )
                retry_count += 1
#                raise e

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
                        filepattern=filepattern, latlon=latlon, cursor=curs, 
                        fileindex=fileindex, reccount=reccount, requesttime=requesttime)
            if fileindex>COMPOSE_OBJECT_LIMIT:
                # Opt not to support downloads of more than 
                # COMPOSE_OBJECT_LIMIT*SEARCH_CHUNK_SIZE records
                # Stop composing results at this limit.
                taskqueue.add(url='/service/download/compose', params=params,
                    queue_name="compose")
            else:
                # Keep writing search chunks to files
                taskqueue.add(url='/service/download/write', params=params,
                    queue_name="downloadwrite")

        # Finalize and email.
        else:
            params=dict(email=email, name=name, filepattern=filepattern, 
                fileindex=fileindex, reccount=reccount, requesttime=requesttime)
            taskqueue.add(url='/service/download/compose', params=params,
                queue_name="compose")

class ComposeHandler(webapp2.RequestHandler):
    def post(self):
        email, name, filepattern = map(self.request.get, ['email', 'name', 'filepattern'])
        requesttime = self.request.get('requesttime')
        composed_filepattern='%s-cl' % filepattern
        reccount = self.request.get('reccount')
        total_files_to_compose = int(self.request.get('fileindex'))+1
        compositions=total_files_to_compose

        # Get the application default credentials.
        credentials = GoogleCredentials.get_application_default()

        # Construct the service object for interacting with the Cloud Storage API.
        service = discovery.build('storage', 'v1', credentials=credentials)

        # Compose chunks into composite objects until there is one composite object
        # Then remove all the chunks and return a URL to the composite
        # Only 32 objects can be composed at once, limit 1024 in a composition of 
        # compositions. Thus, a composition of compositions is sufficient for the worst
        # case scenario.
        # See https://cloud.google.com/storage/docs/composite-objects#_Compose
        # See https://cloud.google.com/storage/docs/json_api/v1/objects/compose#examples

        if total_files_to_compose>COMPOSE_FILE_LIMIT:
            # Need to do a composition of compositions
            # Compose first round as sets of COMPOSE_FILE_LIMIT or fewer files

            compositions=0
            begin=0

            while begin<total_files_to_compose:
                end=total_files_to_compose
                if end-begin>COMPOSE_FILE_LIMIT:
                    end=begin+COMPOSE_FILE_LIMIT

                composed_filename='%s-%s.%s' % (composed_filepattern, compositions, 
                    FILE_EXTENSION)
#                logging.info('Prelim composing files into %s. Begin \
#                     index: %s End index: %s\nVersion: %s' % (composed_filename, \
#                     begin, end, DOWNLOAD_VERSION) )
                mbody=compose_request(TEMP_BUCKET, filepattern, begin, end)
                req = service.objects().compose(
                    destinationBucket=TEMP_BUCKET,
                    destinationObject=composed_filename,
                    destinationPredefinedAcl='publicRead',
                    body=mbody)
                resp = req.execute()
                begin=begin+COMPOSE_FILE_LIMIT
                compositions=compositions+1

        composed_filename='%s.%s' % (filepattern,FILE_EXTENSION)
        if compositions==1:
            logging.info('%s requires no composition.\nVersion: %s' 
                % (composed_filename, DOWNLOAD_VERSION) )
        else:
            # Compose remaining files
            fp = filepattern
            if total_files_to_compose>COMPOSE_FILE_LIMIT:
                # If files were composed, compose them further
                fp = composed_filepattern
            mbody=compose_request(TEMP_BUCKET, fp, 0, compositions)
#            logging.info('Composing %s files into %s\nmbody:\n%s 
#                \nVersion: %s' % (compositions,composed_filename, mbody, \
#                DOWNLOAD_VERSION) )
            req = service.objects().compose(
                destinationBucket=TEMP_BUCKET,
                destinationObject=composed_filename,
                destinationPredefinedAcl='publicRead',
                body=mbody)
            resp = req.execute()

        # Now, can we zip the final result?
        # Not directly with GCS. It would have to be done using gsutil in Google 
        # Compute Engine

        # Copy the file from temporary storage bucket to the download bucket
        src = '/%s/%s' % (TEMP_BUCKET, composed_filename)
        dest = '/%s/%s' % (DOWNLOAD_BUCKET, composed_filename)
        gcs.copy2(src, dest)

        mbody=acl_update_request()
        # Change the ACL so that the download file is publicly readable.
#        logging.info('Requesting update for /%s/%s\nmbody%s \
#            \nVersion: %s' % (DOWNLOAD_BUCKET,composed_filename, mbody, 
#            DOWNLOAD_VERSION) )
        req = service.objects().update(
                bucket=DOWNLOAD_BUCKET,
                object=composed_filename,
                predefinedAcl='publicRead',
                body=mbody)
        resp=req.execute()

        resulttime=datetime.utcnow().isoformat()
        if total_files_to_compose>COMPOSE_OBJECT_LIMIT:
            mail.send_mail(sender="VertNet Downloads <vertnetinfo@vertnet.org>", 
                to=email, subject="Your truncated VertNet download is ready!",
                body="""
The number of records in the results of your query exceeded the limit. Only the first 
"%s" matching results were saved. You can download "%s" here within the next 24 hours: 
https://storage.googleapis.com/%s/%s. Request generated: %s\nRequest fulfilled: %s
""" % (COMPOSE_OBJECT_LIMIT*SEARCH_CHUNK_SIZE, name, DOWNLOAD_BUCKET,
    composed_filename, requesttime, resulttime))
        else:
            mail.send_mail(sender="VertNet Downloads <vertnetinfo@vertnet.org>", 
                to=email, subject="Your VertNet download is ready!",
                body="""
You can download %s records in the file "%s" within the next 24 hours from 
https://storage.googleapis.com/%s/%s.\nRequest generated: %s\nRequest fulfilled: %s
""" % (reccount, name, DOWNLOAD_BUCKET, composed_filename, requesttime, resulttime))

        logging.info('Finalized writing /%s/%s\nVersion: %s' 
            % (DOWNLOAD_BUCKET, composed_filename, DOWNLOAD_VERSION) )

        params = dict(filepattern=filepattern, fileindex=total_files_to_compose, 
            compositions=compositions)
        taskqueue.add(url='/service/download/cleanup', params=params, 
            queue_name="cleanup")

class CleanupHandler(webapp2.RequestHandler):
    def post(self):
        filepattern = self.request.get('filepattern')
        compositions = int(self.request.get('compositions'))
        composed_filepattern='%s-cl' % filepattern
        composed_filename='%s.%s' % (filepattern,FILE_EXTENSION)
        total_files_to_compose = int(self.request.get('fileindex'))

        # Get the application default credentials.
        credentials = GoogleCredentials.get_application_default()

        # Construct the service object for interacting with the Cloud Storage API.
        service = discovery.build('storage', 'v1', credentials=credentials)

        # Remove all of the chunk files used in the composition.
        for j in range(total_files_to_compose):
            filename='%s-%s.%s' % (filepattern, j, FILE_EXTENSION)
            req = service.objects().delete(bucket=TEMP_BUCKET, object=filename)

            max_retries = 10
            retry_count = 0
            success = False
            # Execute the delete request until successful or until our patience runs out
            while not success and retry_count < max_retries:
                try:
                    resp = req.execute()
                    success=True
                except Exception, e:
                    logging.error("Error deleting chunk file %s attempt %s\nError: \
                        %s\nVersion: %s" % (filename, retry_count+1, e, 
                        DOWNLOAD_VERSION) )
                    retry_count += 1
#                    raise e

        if total_files_to_compose>COMPOSE_FILE_LIMIT:
            # Remove the temporary compositions
            for j in range(compositions):
                filename='%s-%s.%s' % (composed_filepattern, j, FILE_EXTENSION)
                req = service.objects().delete(bucket=TEMP_BUCKET, object=filename)

                max_retries = 10
                retry_count = 0
                success = False
                # Try the delete request until successful or until our patience runs out
                while not success and retry_count < max_retries:
                    try:
                        resp = req.execute()
                        success=True
                    except Exception, e:
                        logging.error("Error deleting composed file %s \
                            attempt %s\nError: %s\nVersion: %s" % (filename, 
                            retry_count+1, e, DOWNLOAD_VERSION) )
                        retry_count += 1
#                            raise e

        # Delete the temporary composed file from the TEMP_BUCKET
        req = service.objects().delete(bucket=TEMP_BUCKET, object=composed_filename)
        resp=req.execute()

        logging.info('Finalized cleaning temporary files from /%s\nVersion: %s' 
            % (TEMP_BUCKET, DOWNLOAD_VERSION) )

api = webapp2.WSGIApplication([
    webapp2.Route(r'/service/download', handler=DownloadHandler),
    webapp2.Route(r'/service/download/write', handler=WriteHandler),
    webapp2.Route(r'/service/download/compose', handler=ComposeHandler),
    webapp2.Route(r'/service/download/cleanup', handler=CleanupHandler)
    ], debug=True)
