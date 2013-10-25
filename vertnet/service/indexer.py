import webapp2
import json
import os

from vertnet.service import search

class IndexerHandler(webapp2.RequestHandler):
    def post(self):  
        data = json.loads(self.request.get('data'))
        issue = self.request.get('issue')
        search.index_record(data, issue=issue)     
            
api = webapp2.WSGIApplication(
    [('/indexer', IndexerHandler)],
    debug=False)
