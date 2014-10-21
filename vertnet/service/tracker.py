
import webapp2
import urllib
import logging
import os

IS_DEV = 'Development' in os.environ['SERVER_SOFTWARE']
if IS_DEV:
    CLIENT = 'portal-dev'
else:
    CLIENT = 'portal-prod'

from google.appengine.api import urlfetch

cdb_url = "http://vertnet.cartodb.com/api/v2/sql?%s"

def apikey():
    """Return credentials file as a JSON object."""
    path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'cdbkey.txt')
    key = open(path, "r").read()
#    logging.info("CARTODB KEY %s" % key)
    return key

class TrackerHandler(webapp2.RequestHandler):
    def post(self):  
        self.VERSION='TrackerHandler:2014-10-21T14:56'
        query, error, type, count, downloader, latlon, api_version, matching_records, response_records, request_source = map(self.request.get, ['query', 'error', 'type', 'count', 'downloader', 'latlon', 'api_version', 'matching_records', 'response_records', 'request_source'])
        try:
            count = int(count)
        except:
            count = 0
        try:
            lat, lon = map(float, latlon.split(','))
        except:
            lat, lon = -99999, -99999
        log_sql = """INSERT INTO query_log(client,query,error,type,count,downloader,lat,lon,api_version,matching_records,response_records,request_source) VALUES ('%s','%s','%s','%s',%s,'%s',%s, %s, '%s', %s, %s, '%s'); update query_log set the_geom = CDB_LatLng(lat,lon)""" 
        log_sql = log_sql % (CLIENT, query, error, type, count, downloader, lat, lon, api_version, matching_records, response_records, request_source)
#        log_sql = """INSERT INTO query_log(client,query,error,type,count,downloader,lat,lon) VALUES ('%s','%s','%s','%s',%s,'%s',%s,%s);update query_log set the_geom = CDB_LatLng(lat,lon)""" 
#        log_sql = log_sql % (CLIENT, query, error, type, count, downloader,lat,lon)
        rpc = urlfetch.create_rpc()
        log_url = cdb_url % (urllib.urlencode(dict(q=log_sql, api_key=apikey())))
        urlfetch.make_fetch_call(rpc, log_url)
        logging.error("Version: %s SQL: %s\nURL: %s" % (self.VERSION, log_sql, log_url))            
        try:
            rpc.get_result()
        except urlfetch.DownloadError, e:
#            logging.error("Version: %s Error logging API - %s\nError:\n%s" % (self.VERSION, query, e))            
            
api = webapp2.WSGIApplication(
    [('/apitracker', TrackerHandler)],
    debug=False)
