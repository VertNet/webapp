#!/usr/bin/env python

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = "John Wieczorek"
__contributors__ = "Aaron Steele, John Wieczorek"
__copyright__ = "Copyright 2016 vertnet.org"
__version__ = "download.py 2016-08-15T15:54+02:00"

# Removing dependency on Files API due to its deprecation by Google
import cloudstorage as gcs
from oauth2client.client import GoogleCredentials
from apiclient import discovery
from datetime import datetime

from google.appengine.api import mail
from google.appengine.api import taskqueue
from google.appengine.api import search
from vertnet.service import util as vnutil
from vertnet.service.util import UTIL_VERSION
from vertnet.service import search as vnsearch
import webapp2
import json
import logging
import uuid
import sys
import gc

DOWNLOAD_VERSION=__version__
SEARCH_CHUNK_SIZE=1000 # limit on documents in a search result: rows per file
OPTIMUM_CHUNK_SIZE=500 # See api_cnt_performance_analysis.pdf at https://goo.gl/xbLIGz
COMPOSE_FILE_LIMIT=32 # limit on the number of files in a single compose request
COMPOSE_OBJECT_LIMIT=1024 # limit on the number of files in a composition
TEMP_BUCKET='vn-dltest' # bucket for temp compositions
DOWNLOAD_BUCKET='vn-downloads2' # production bucket for downloads
FILE_EXTENSION='txt'

def _tsv(json):
    # These should be the names of the original fields in the index document.
    download_fields = vnutil.download_field_list()
    values = []
    for x in download_fields:
        if json.has_key(x):
            if x=='dynamicproperties':
                dp = vnutil.format_json(json[x])
                values.append(unicode(dp.rstrip()))
            else:
                values.append(unicode(json[x]).rstrip())        
        else:
            values.append(u'')
#     logging.debug('%s: JSON: %s' % (DOWNLOAD_VERSION, json))
#     logging.debug('%s: DOWNLOAD_FIELDS: %s' % (UTIL_VERSION, download_fields))
#     logging.debug('%s: VALUES: %s' % (DOWNLOAD_VERSION, values))
    return u'\t'.join(values).encode('utf-8')

def _get_tsv_chunk(records):
    if records is None or len(records)==0:
        return '\n'
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
    def _queue(self, q, email, name, latlon, fromapi, source, countonly):
        # Create a base filename for all chunks to be composed for this download
        filepattern = '%s-%s' % (name, uuid.uuid4().hex)
        requesttime = datetime.utcnow().isoformat()

        # Start the download process with the first file having fileindex 0
        # Start the record count at 0
        params=dict(q=json.dumps(q), email=email, name=name, filepattern=filepattern, 
            latlon=latlon, fileindex=0, reccount=0, requesttime=requesttime, 
            source=source, fromapi=fromapi)

        if countonly is not None and len(countonly)>0:
            taskqueue.add(url='/service/download/count', params=params, 
                queue_name="count")
        else:
            taskqueue.add(url='/service/download/write', params=params, 
                queue_name="downloadwrite")

    def post(self):
        self.get()

    def get(self):
        count, keywords, email, name = map(self.request.get, 
            ['count', 'keywords', 'email', 'name'])
        q = ' '.join(json.loads(keywords))
        latlon = self.request.headers.get('X-AppEngine-CityLatLong')
        fromapi = self.request.get('api')
        countonly = self.request.get('countonly')
        # Force count to be an integer
        # count is a limit on the number of records to download
        count=int(str(count))

        source='DownloadPortal'
        if fromapi is not None and len(fromapi)>0:
            source='DownloadAPI'
            # Try to send an indicator to the browser if it came from one.
            body = ''
            if countonly is not None and len(countonly)>0:
                body = 'Counting results:<br>'
                source = 'CountAPI'
            else:
                body = 'Downloading results:<br>'
            if email is None or len(email)==0 or email=='None':
                body += 'ERROR: You must provide an email address.'
            else:
                body += 'File name: %s<br>' % name
                body += 'Email: %s<br>' % email
                body += 'Keywords: %s<br>' % keywords
                body += 'X-AppEngine-CityLatLong: %s<br>' % latlon
                body += 'Source: %s<br>' % source
                body += 'API: %s<br>' % fromapi
                body += 'len(API): %s<br>' % len(fromapi)
                body += 'Request headers: %s<br>' % self.request.headers
            
            self.response.out.write(body)
            logging.info('API download request. API: %s Source: %s Count: %s \
Keywords: %s Email: %s Name: %s LatLon: %s\nVersion: %s' 
                % (fromapi, source, count, keywords, email, name, latlon, 
                DOWNLOAD_VERSION) )
            if email is None or len(email)==0:
                return
        else:
            logging.info('Portal download request. API: %s Source: %s Count: %s \
Keywords: %s Email: %s Name: %s LatLon: %s\nVersion: %s' 
                % (fromapi, source, count, keywords, email, name, latlon, 
                DOWNLOAD_VERSION) )

        if count==0 or count > SEARCH_CHUNK_SIZE:
            # The results are larger than SEARCH_CHUNK_SIZE, compose a file for download
            self._queue(q, email, name, latlon, fromapi, source, countonly)
        else:
            # The results are smaller than SEARCH_CHUNK_SIZE, download directly and make
            # a copy of the file in the download bucket
            filename = str('%s.txt' % name)
            self.response.headers['Content-Type'] = "text/tab-separated-values"
            self.response.headers['Content-Disposition'] = "attachment; filename=%s" \
                % filename
            records, cursor, count, query_version = vnsearch.query(q, count)
            # logging.debug('%s: RECORDS: %s' % (DOWNLOAD_VERSION, records))

            # Build dictionary for search counts
            res_counts = vnutil.search_resource_counts(records)

            # Write the header for the output file 
            data = '%s\n%s' % (vnutil.download_header(), _get_tsv_chunk(records))
            self.response.out.write(data)

            # Write single chunk to file in DOWNLOAD_BUCKET
            filepattern = '%s-%s' % (name, uuid.uuid4().hex)
            filename = '/%s/%s.%s' % (DOWNLOAD_BUCKET, filepattern, 
                FILE_EXTENSION)

            # Parameters for the coming apitracker taskqueue
            apitracker_params = dict(
                api_version=fromapi, count=len(records), download=filename, 
                downloader=email, error=None, latlon=latlon, 
                matching_records=len(records), query=q, query_version=query_version, 
                request_source=source, response_records=len(records), 
                res_counts=json.dumps(res_counts), type='download')

            max_retries = 2
            retry_count = 0
            success = False
            while not success and retry_count < max_retries:
                try:
                    with gcs.open(filename, 'w', content_type='text/tab-separated-values',
                            options={'x-goog-acl': 'public-read'}) as f:
                        f.write(data)
                        success = True
#                        logging.info('Sending small res_counts to apitracker: %s' 
#                            % res_counts ) 
                        taskqueue.add(url='/apitracker', params=apitracker_params, 
                            queue_name="apitracker") 
                except Exception, e:
                    logging.error("Error writing small result set to %s.\nError: %s \n\
Version: %s" % (filename,e,DOWNLOAD_VERSION) )
                    retry_count += 1
#                    raise e

class CountHandler(webapp2.RequestHandler):
    def post(self):
        q = json.loads(self.request.get('q'))
        latlon = self.request.get('latlon')
        requesttime = self.request.get('requesttime')
        reccount = int(self.request.get('reccount'))
        fromapi=self.request.get('fromapi')
        source=self.request.get('source')
        cursor = self.request.get('cursor')
        email = self.request.get('email')

        if cursor:
            curs = search.Cursor(web_safe_string=cursor)
        else:
            curs = None

        records, next_cursor, query_version = \
            vnsearch.query_rec_counter(q, OPTIMUM_CHUNK_SIZE, curs=curs)

        # Update the total number of records retrieved
        reccount = reccount+records

        if next_cursor:
            curs = next_cursor.web_safe_string
        else:
            curs = ''

        if curs:
            countparams=dict(q=self.request.get('q'), cursor=curs, reccount=reccount, 
                requesttime=requesttime, fromapi=fromapi, source=source, latlon=latlon,
                email=email)

            logging.info('Record counter. Count: %s Email: %s Query: %s Cursor: %s\
Version: %s' % (reccount, q, next_cursor, DOWNLOAD_VERSION) )
            # Keep counting
            taskqueue.add(url='/service/download/count', params=countparams,
                queue_name="count")

        else:
            # Finished counting. Log the results and send email.
            logging.info('Finished counting. Record total: %s Email: %s Query %s \
Cursor: %s\nVersion: %s' % (reccount, email, q, next_cursor, DOWNLOAD_VERSION) )

            apitracker_params = dict(
                api_version=fromapi, count=reccount, query=q, latlon=latlon,
                query_version=query_version, request_source=source, type='count',
                downloader=email)

            taskqueue.add(url='/apitracker', params=apitracker_params, 
                queue_name="apitracker")

            resulttime=datetime.utcnow().isoformat()
            mail.send_mail(sender="VertNet Counts <vertnetinfo@vertnet.org>", 
                to=email, subject="Your VertNet count is ready!",
                body="""Your query found %s matching records.\nQuery: %s
Request submitted: %s\nRequest fulfilled: %s""" % (reccount, q, requesttime, resulttime) )

class WriteHandler(webapp2.RequestHandler):
    def post(self):
        q, email, name, latlon = map(self.request.get, ['q', 'email', 'name', 'latlon'])
        q = json.loads(q)
        requesttime = self.request.get('requesttime')
        filepattern = self.request.get('filepattern')
        fileindex = int(self.request.get('fileindex'))
        reccount = int(self.request.get('reccount'))
        fromapi=self.request.get('fromapi')
        source=self.request.get('source')
        filename = '/%s/%s-%s.%s' % (TEMP_BUCKET, filepattern, fileindex, FILE_EXTENSION)
        cursor = self.request.get('cursor')

        try:
            total_res_counts = json.loads(self.request.get('res_counts'))
        except:
            total_res_counts = {}

        if cursor:
            curs = search.Cursor(web_safe_string=cursor)
        else:
            curs = None

        gc.collect()
        # Write single chunk to file, GCS does not support append
        records, next_cursor, count, query_version = \
            vnsearch.query(q, SEARCH_CHUNK_SIZE, curs=curs)
        # Build dict for search counts
        res_counts = vnutil.search_resource_counts(records, total_res_counts)

        # Now merge the two dictionaries, summing counts
        if total_res_counts is None or len(total_res_counts)==0:
            total_res_counts=res_counts
        else:
            for r in res_counts:
                try:
                    count = total_res_counts[r]
                    total_res_counts[r]=count+res_counts[r]
                except:
                    total_res_counts[r]=res_counts[r]

        # Update the total number of records retrieved
        reccount = reccount+len(records)

        # Make a chunk to write to a file
        chunk = '%s\n' % _get_tsv_chunk(records)
        
        if fileindex==0 and not next_cursor:
            # This is a query with fewer than SEARCH_CHUNK_SIZE results
            filename = '/%s/%s.%s' % (TEMP_BUCKET, filepattern, FILE_EXTENSION)

        max_retries = 2
        retry_count = 0
        success = False
        while not success and retry_count < max_retries:
            try:
                with gcs.open(filename, 'w', content_type='text/tab-separated-values',
                             options={'x-goog-acl': 'public-read'}) as f:
                    if fileindex==0:
                        f.write('%s\n' % vnutil.download_header())
                    f.write(chunk)
                    success = True
#                    logging.info('Download chunk saved to %s: Total %s records. Has next \
#cursor: %s \nVersion: %s' 
#                        % (filename, reccount, not next_cursor is None, DOWNLOAD_VERSION))
            except Exception, e:
                logging.error("Error writing chunk to FILE: %s for\nQUERY: %s \
Error: %s\nVersion: %s" % (filename, q, e, DOWNLOAD_VERSION) )
                retry_count += 1
#                raise e

        # Queue up next chunk or current chunk if failed to write
        if not success:    
            next_cursor = curs
        if next_cursor:
            curs = next_cursor.web_safe_string
        else:
            curs = ''

        # Parameters for the coming apitracker taskqueue
        finalfilename = '/%s/%s.%s' % (DOWNLOAD_BUCKET, filepattern, 
            FILE_EXTENSION)

        if curs:
            fileindex = fileindex + 1

            if fileindex>COMPOSE_OBJECT_LIMIT:
                # Opt not to support downloads of more than 
                # COMPOSE_OBJECT_LIMIT*SEARCH_CHUNK_SIZE records
                # Stop composing results at this limit.

                apitracker_params = dict(
                    api_version=fromapi, count=reccount, download=finalfilename, 
                    downloader=email, error=None, latlon=latlon, 
                    matching_records=reccount, query=q, query_version=query_version, 
                    request_source=source, response_records=len(records), 
                    res_counts=json.dumps(total_res_counts), type='download')

                composeparams=dict(email=email, name=name, filepattern=filepattern, q=q,
                    fileindex=fileindex, reccount=reccount, requesttime=requesttime)

                # Log the download
                taskqueue.add(url='/apitracker', params=apitracker_params, 
                    queue_name="apitracker") 

                taskqueue.add(url='/service/download/compose', params=composeparams,
                    queue_name="compose")
            else:
                writeparams=dict(q=self.request.get('q'), email=email, name=name, 
                    filepattern=filepattern, latlon=latlon, cursor=curs, 
                    fileindex=fileindex, res_counts=json.dumps(total_res_counts), 
                    reccount=reccount, requesttime=requesttime, fromapi=fromapi,
                    source=source)

#                logging.info('Sending total_res_counts to write again: %s' 
#                    % total_res_counts ) 
                # Keep writing search chunks to files
                taskqueue.add(url='/service/download/write', params=writeparams,
                    queue_name="downloadwrite")

        else:
            # Log the download
            apitracker_params = dict(
                api_version=fromapi, count=reccount, download=finalfilename, 
                downloader=email, error=None, latlon=latlon, matching_records=reccount, 
                query=q, query_version=query_version, request_source=source, 
                response_records=len(records), res_counts=json.dumps(total_res_counts), 
                type='download')

            composeparams=dict(email=email, name=name, filepattern=filepattern, q=q,
                fileindex=fileindex, reccount=reccount, requesttime=requesttime)

            taskqueue.add(url='/apitracker', params=apitracker_params, 
                queue_name="apitracker") 

            # Finalize and email.
            taskqueue.add(url='/service/download/compose', params=composeparams,
                queue_name="compose")

class ComposeHandler(webapp2.RequestHandler):
    def post(self):
        q, email, name, filepattern, latlon = map(self.request.get, 
            ['q', 'email', 'name', 'filepattern', 'latlon'])
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
                # As long as there are files to compose, compose them in sets of up to
                # COMPOSE_FILE_LIMIT files.
                end=total_files_to_compose
                if end-begin>COMPOSE_FILE_LIMIT:
                    end=begin+COMPOSE_FILE_LIMIT

                composed_filename='%s-%s.%s' % (composed_filepattern, compositions, 
                    FILE_EXTENSION)
                mbody=compose_request(TEMP_BUCKET, filepattern, begin, end)
                req = service.objects().compose(
                    destinationBucket=TEMP_BUCKET,
                    destinationObject=composed_filename,
                    destinationPredefinedAcl='publicRead',
                    body=mbody)

                try:
#                        resp = req.execute()
                        # Don't worry about getting the response. Just execute the request.
                    req.execute()
                except Exception, e:
                    # There is a timeout fetching the url for the response. This
                    # tends to happen in compose requests for LARGE downloads.
                    logging.warning("Deadline exceeded error (not to worry) \
composing file: %s Query: %s Email: %s Error: %s\nVersion: %s" 
                        % (composed_filename, q, email, e, DOWNLOAD_VERSION) )
                    pass
                        
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
            try:
                # Don't worry about getting the response. Just execute the request.
                req.execute()
            except Exception, e:
                # There is a timeout fetching the url for the response. This
                # tends to happen in compose requests for LARGE downloads when composing
                # already composed files. Just log it and hope for the best.
                logging.warning("Deadline exceeded error (not to worry) composing \
file: %s Error: %s\nVersion: %s" % (composed_filename, e, DOWNLOAD_VERSION) )
                pass
#                    logging.error("Error composing file: %s Error: %s\nVersion: %s" 
#                        % (composed_filename, e, DOWNLOAD_VERSION) )
#                retry_count += 1
                
        # Now, can we zip the final result?
        # Not directly with GCS. It would have to be done using gsutil in Google 
        # Compute Engine

        # Copy the file from temporary storage bucket to the download bucket
        src = '/%s/%s' % (TEMP_BUCKET, composed_filename)
        dest = '/%s/%s' % (DOWNLOAD_BUCKET, composed_filename)
        try:
            gcs.copy2(src, dest)
        except Exception, e:
            s = 'Error copying %s to %s\n' % (src, dest)
            s += 'Error: %s Version: %s' % (e, DOWNLOAD_VERSION) 
            logging.error()

        # Change the ACL so that the download file is publicly readable.
        mbody=acl_update_request()
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
Your VertNet download file is now available for a limited time at 
https://storage.googleapis.com/%s/%s.\n
The results in this file are not complete based on your query\n
%s\n
The number of records in the results of your query exceeded the limit. This is a limit 
based on the VertNet architecture. If you need more results than what you received, 
consider making multiple queries with distinct criteria, such as before and after a 
given year.
If you need very large data sets, such as all Mammals, these are pre-packaged 
periodically and accessible for download. Please contact vertnetinfo@vertnet.org for 
more information.\n
Matching records: %s\nRequest submitted: %s\nRequest fulfilled: %s""" 
                    % (DOWNLOAD_BUCKET, composed_filename, q, reccount, requesttime, 
                    resulttime))
        else:
            mail.send_mail(sender="VertNet Downloads <vertnetinfo@vertnet.org>", 
                to=email, subject="Your VertNet download is ready!",
                body="""
Your VertNet download file is now available for a limited time at 
https://storage.googleapis.com/%s/%s.\n
Query: %s\nMatching records: %s\nRequest submitted: %s\nRequest fulfilled: %s""" 
                    % (DOWNLOAD_BUCKET, composed_filename, q, reccount, requesttime, 
                    resulttime))

        logging.info('Finalized writing /%s/%s\nVersion: %s' 
            % (DOWNLOAD_BUCKET, composed_filename, DOWNLOAD_VERSION) )

        cleanupparams = dict(filepattern=filepattern, fileindex=total_files_to_compose, 
            compositions=compositions)
        taskqueue.add(url='/service/download/cleanup', params=cleanupparams, 
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

        if total_files_to_compose>COMPOSE_FILE_LIMIT:
            # Remove the temporary compositions
            for j in range(compositions):
                filename='%s-%s.%s' % (composed_filepattern, j, FILE_EXTENSION)
                req = service.objects().delete(bucket=TEMP_BUCKET, object=filename)

                max_retries = 2
                retry_count = 0
                success = False
                # Try the delete request until successful or until our patience runs out
                while not success and retry_count < max_retries:
                    try:
                        resp = req.execute()
                        success=True
                    except Exception, e:
                        logging.error("Error deleting composed file %s \
attempt %s\nError: %s\nVersion: %s" % (filename, retry_count+1, e, DOWNLOAD_VERSION) )
                        retry_count += 1
#                            raise e

        if total_files_to_compose>1:
            # Remove all of the chunk files used in the composition.
            for j in range(total_files_to_compose):
                filename='%s-%s.%s' % (filepattern, j, FILE_EXTENSION)
                req = service.objects().delete(bucket=TEMP_BUCKET, object=filename)

                max_retries = 2
                retry_count = 0
                success = False
                # Execute the delete request until successful or patience runs out
                while not success and retry_count < max_retries:
                    try:
                        resp = req.execute()
                        success=True
                    except Exception, e:
                        logging.error("Error deleting chunk file %s attempt %s\nError: \
%s\nVersion: %s" % (filename, retry_count+1, e, DOWNLOAD_VERSION) )
                        retry_count += 1
#                        raise e

        # After all else...
        # Delete the temporary composed file from the TEMP_BUCKET
        req = service.objects().delete(bucket=TEMP_BUCKET, object=composed_filename)
        try:
            resp=req.execute()
        except Exception, e:
            logging.error("Error deleting temporary composed file %s \nError: %s\n\
Version: %s" % (filename, e, DOWNLOAD_VERSION) )

        logging.info('Finalized cleaning temporary files from /%s\nVersion: %s' 
            % (TEMP_BUCKET, DOWNLOAD_VERSION) )

routes = [
    webapp2.Route(r'/service/download', handler=DownloadHandler),
    webapp2.Route(r'/service/download/write', handler=WriteHandler),
    webapp2.Route(r'/service/download/compose', handler=ComposeHandler),
    webapp2.Route(r'/service/download/count', handler=CountHandler),
    webapp2.Route(r'/service/download/cleanup', handler=CleanupHandler)
    ]
    
api = webapp2.WSGIApplication(routes, debug=True)
