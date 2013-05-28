"""Download backend."""

import webapp2
import json
import logging

class StartHandler(webapp2.RequestHandler):
    def get(self):
        logging.info('DOWNLOAD BACKEND STARTUP')

class DownloadApi(webapp2.RequestHandler):
    def post(self):
        #q = json.loads(self.request.get('q'))
        #email = self.request.get('email')
        logging.info('EMAIL: %s Q: %s' % (self.request.get('email'), self.request.get('q')));

api = webapp2.WSGIApplication([
    webapp2.Route(r'/_ah/start', StartHandler),
    webapp2.Route(r'/backend/download', handler=DownloadApi)],
    debug=True)
        