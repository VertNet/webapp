"""API handlers for Darwin Core records."""

import webapp2
from vertnet.service.model import RecordIndex, RecordList
from protorpc import remote
from protorpc.wsgi import service
from google.appengine.datastore.datastore_query import Cursor
import json

def record_list(limit, cursor, q, message=False):
    """Return CommentList or triple (comments, next_cursor, more)."""
    i, n, m = RecordIndex.search(q, limit, cursor=cursor, message=message)
    if message:
        if n:
            n = n.urlsafe()
        return RecordList(items=i, cursor=n, more=m)
    return i, n, m

class DwcService(remote.Service):
    """RPC services for working with Darwin Core Records."""

    @remote.method(RecordList, RecordList)
    def search(self, message):
        """Return a RecordList."""
        curs = None
        if message.cursor:
            curs = Cursor(urlsafe=message.cursor)
        q = json.loads(message.q)
        return record_list(message.limit, curs, q, message=True)

class Search(webapp2.RequestHandler):
    """Handler for searching Darwin Core records."""

    def post(self):
        self.get()
    
    def get(self):
    	q = self.request.get('q')
    	results, cursor, more = RecordIndex.search(q)

handler = webapp2.WSGIApplication([
    webapp2.Route(r'/api/dwc', handler=Search),],
    debug=True)
         
rpc = service.service_mappings([('/service/dwc', DwcService),],)
