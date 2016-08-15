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
__version__ = "tracker.py 2016-08-15T17:20+02:00"

import webapp2
import urllib
import logging
import os
import time
from google.appengine.api import urlfetch
# In an attempt to overcome timeouts in searches
urlfetch.set_default_fetch_deadline(30)

TRACKER_VERSION=__version__
IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Development')

if IS_DEV:
    CLIENT = 'portal-dev'
else:
    CLIENT = 'portal-prod'

from google.appengine.api import urlfetch

#cdb_url = "http://vertnet.cartodb.com/api/v2/sql?%s"
cdb_url = "http://vertnet.carto.com/api/v2/sql?%s"

def apikey():
    """Return credentials file as a JSON object."""
    path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'cdbkey.txt')
    key = open(path, "r").read()
    return key

class TrackerHandler(webapp2.RequestHandler):
    def post(self):  
        query, error, type, count, downloader, download, latlon = \
            map(self.request.get, ['query', 'error', 'type', 'count', 'downloader', \
            'download', 'latlon'])
        api_version=self.request.get('api_version')
        query_version=self.request.get('query_version')
        request_source=self.request.get('request_source')
        response_records=self.request.get('response_records')
        matching_records=self.request.get('matching_records')
        try:
            count = int(str(count))
        except:
            count = 0
        try:
            response_records = int(str(response_records))
        except:
            response_records = 0
        try:
            matching_records = int(str(matching_records))
        except:
            matching_records = 0
        try:
            lat, lon = map(float, latlon.split(','))
        except:
            lat, lon = -99999, -99999
        try:
            res_counts = self.request.get('res_counts')
        except:
            res_counts = {}
            
        log_sql = """INSERT INTO query_log_master( \
            api_version, client, count, download, downloader, error, lat, lon, \
            matching_records, query, query_version, request_source, response_records, \
            results_by_resource, type) VALUES ( \
            '%s', '%s', %s, '%s', '%s', '%s', %s, %s, \
            %s, '%s', '%s', '%s', %s, \
            '%s', '%s');
            update query_log_master set the_geom = CDB_LatLng(lat,lon)"""
        log_sql = log_sql % (
            api_version, CLIENT, count, download, downloader, error, lat, lon,
            matching_records, query, query_version, request_source, response_records,
            res_counts, type)
        
        rpc = urlfetch.create_rpc(deadline=50)
        log_url = cdb_url % (urllib.urlencode(dict(q=log_sql, api_key=apikey())))
        urlfetch.make_fetch_call(rpc, log_url)
        try:
            logging.info("Trying SQL: %s\nURL: %s\nVersion:%s" 
                % (log_sql, log_url, TRACKER_VERSION))            
#            resp = rpc.get_result()
            # Don't wait for the response
            start_time = time.time()
            rpc.get_result()
            elapsed_time = time.time() - start_time
            s = 'Tracked successfully in %.1fs.' % elapsed_time
            s += '\nVersion:%s' % TRACKER_VERSION
            logging.info(s)
        except urlfetch.DownloadError, e:
            # Even though INSERT to Carto is successful, an error 'Deadline exceeded 
            # while waiting for response' is usually returned
            errorstr = ("%s" % e)
#            if e is not None and errorstr.find('Deadline exceeded while waiting') == -1:
            elapsed_time = time.time() - start_time
            s = 'RPC warning (%.1fs): %s' % (elapsed_time, errorstr)
            s += '\nVersion:%s' % TRACKER_VERSION
            logging.warning(s)
            pass
            
api = webapp2.WSGIApplication(
    [('/apitracker', TrackerHandler)],
    debug=False)
