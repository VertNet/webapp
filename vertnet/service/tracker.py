
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
    logging.info("CARTODB KEY %s" % key)
    return key

class TrackerHandler(webapp2.RequestHandler):
    def post(self):  
        query = self.request.get('query')
        log_sql = """INSERT INTO query_log(client, query) VALUES ('%s','%s')""" % (CLIENT, query)
        rpc = urlfetch.create_rpc()
        log_url = cdb_url % (urllib.urlencode(dict(q=log_sql, api_key=apikey())))
        urlfetch.make_fetch_call(rpc, log_url)
        try:
            rpc.get_result()
        except urlfetch.DownloadError:
            logging.error("Error logging API - %s" % (query))            
            
api = webapp2.WSGIApplication(
    [('/apitracker', TrackerHandler)],
    debug=False)
