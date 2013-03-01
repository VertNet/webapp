"""Organization request handlers, RPC services, APIs, and associated stuff."""

from google.appengine.datastore.datastore_query import Cursor

from protorpc import remote
from protorpc.wsgi import service

from vertnet.model import Organization, OrganizationPayload, PagePayload

import webapp2

class OrganizationRPC(remote.Service):
    """Organization RPC service."""

    @remote.method(OrganizationPayload, OrganizationPayload)
    def get(self, message):
        """Get organization."""
        props = dict()
        return OrganizationPayload(**props)

    @remote.method(PagePayload, PagePayload)
    def page(self, message):
        """Return page of organizations."""
        curs = None
        if message.cursor:
            curs = Cursor(urlsafe=message.cursor)
        page, next, more = Organization.page(message.limit, cursor=curs, 
            format='message')        
        return page

class OrganizationAsync(webapp2.RequestHandler):
    """Async organization handler for taskqueue def."""

    def post(self):
        """Dispatches incoming task job.""" 
        pass

# RPC service endpoint.
rpc = service.service_mappings([('/api/organization', OrganizationRPC),],)

# Taskqueue endpoint for async services.
handler = webapp2.WSGIApplication([
    ('/api/async/organization', OrganizationAsync),], debug=True)
