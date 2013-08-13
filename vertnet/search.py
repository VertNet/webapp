"""API handlers for searching Darwin Core records.

"""

import json
import logging
import webapp2

from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api import search

class SearchHandler(webapp2.RequestHandler):

    def post(self):
        self.get()
    
    def get(self):
        q = self.request.get('q')
        limit = self.request.get_range('l', min_value=1, max_value=1000, default=10)
        options = search.QueryOptions(
            limit=limit,
            cursor=None,
            sort_options=None,
            returned_fields=['json'])
        query = search.Query(query_string=q, options=options)
        result = {}
        try:
            results = search.Index(name='dwc_search').search(query)
            recs = []
            for doc in results:
                for field in doc.fields:
                    if field.name == 'record':
                        recs.append(json.loads(field.value))  
            result['recs'] = recs
            if results.cursor:
                result['cursor'] = results.cursor.web_safe_string
            result['count'] = results.number_found
        except search.Error:
            logging.exception('Search failed')            
        
        self.response.out.write(json.dumps(result))

handler = webapp2.WSGIApplication([
    webapp2.Route('/api/search', handler=SearchHandler)],
    debug=True)
        