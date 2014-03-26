
import webapp2
import urllib
import logging
import os

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Development')

if IS_DEV:
    CLIENT = 'portal-dev'
else:
    CLIENT = 'portal-prod'

from google.appengine.api import urlfetch

cdb_url = "http://vertnet.cartodb.com/api/v2/sql?%s"

def apikey():
    """Return credentials file as a JSON object."""
    path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'cdbkey.txt')
    key = open(path, "r").read().rstrip()
    logging.info("CARTODB KEY %s" % key)
    return key

class TrackerHandler(webapp2.RequestHandler):
    def post(self):  
        query, error, type, count, downloader, download, latlon = map(self.request.get, ['query', 'error', 'type', 'count', 'downloader', 'download', 'latlon'])
        try:
            count = int(count)
        except:
            count = 0
        try:
            lat, lon = map(float, latlon.split(','))
        except:
            lat, lon = -99999, -99999
        try:
            res_counts = self.request.get('res_counts')
        except:
            res_counts = {}
        logging.info("RESCOUNTS from TRACKER: %s" % res_counts)
#        log_sql = """INSERT INTO query_log(client,query,error,type,count,downloader,download,lat,lon, res_counts) VALUES ('%s','%s','%s','%s',%s,'%s','%s',%s,%s,'%s');update query_log set the_geom = CDB_LatLng(lat,lon)"""
#        log_sql = log_sql % (CLIENT, query, error, type, count, downloader,download,lat,lon,res_counts)
        log_sql = """INSERT INTO query_log(client,query,error,type,count,downloader,download,lat,lon) VALUES ('%s','%s','%s','%s',%s,'%s','%s',%s,%s);update query_log set the_geom = CDB_LatLng(lat,lon)""" 
        log_sql = log_sql % (CLIENT, query, error, type, count, downloader,download,lat,lon)
        
        rpc = urlfetch.create_rpc()
        log_url = cdb_url % (urllib.urlencode(dict(q=log_sql, api_key=apikey())))
        logging.info(log_url)
        urlfetch.make_fetch_call(rpc, log_url)
        try:
            rpc.get_result()
        except urlfetch.DownloadError:
            logging.error("Error logging API - %s" % (query))            
            
api = webapp2.WSGIApplication(
    [('/apitracker', TrackerHandler)],
    debug=False)
