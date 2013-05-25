
import webapp2
import urllib
import logging
import os
import json

from google.appengine.api import urlfetch

cdb_url = "http://vertnet.cartodb.com/api/v2/sql?%s"

def apikey():
    """Return credentials file as a JSON object."""
    path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'cdbkey.txt')
    key = open(path, "r").read()
    logging.info("CARTODB KEY %s" % key)
    return key

class TrackerHandler(webapp2.RequestHandler):
    def post(self):  
        log_sql = """INSERT INTO api_log(version,keywords,genus,specificepithet,year,country,institutioncode) 
           VALUES ('%s','%s','%s','%s','%s','%s','%s')"""
        rpc = urlfetch.create_rpc()
        query = json.loads(self.request.get('query'))
        keywords = ' '.join(query['keywords'])
        g = query['terms'].get('genus', '')
        se = query['terms'].get('specificepithet', '')
        y = query['terms'].get('year', '')
        c = query['terms'].get('country', '')
        ic = query['terms'].get('institutioncode', '')
        version = '0.0.1'
        log_sql = log_sql % (version, keywords, g, se, y, c, ic)
        log_url = cdb_url % (urllib.urlencode(dict(q=log_sql, api_key=apikey())))
        urlfetch.make_fetch_call(rpc, log_url)
        try:
            rpc.get_result()
        except urlfetch.DownloadError:
            logging.error("Error logging API(%s, %s)" % (query, version))            
            
api = webapp2.WSGIApplication(
    [('/apitracker', TrackerHandler)],
    debug=False)
