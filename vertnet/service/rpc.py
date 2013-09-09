from gaesessions import get_current_session
from google.appengine.api import memcache
from protorpc import remote

class VertNetService(remote.Service):
    
    def get_user(self):
        """Return user from session."""
        from hylo.service import person
        username = self.session.get('person_username')
        if username:
            p = memcache.get(username)
            if not p:
                p = person.Person.get_by_id(username)
                if p:
                    memcache.add(username, p)
            return p
        else:
            return None

class AuthService(VertNetService):
    """Base class for authenticated services."""
    def __init__(self):
        self.session = self.request.session if self.request.session else None
        self.user = self.request.user if self.request.user else None
        if not self.session or not self.user:
            raise Exception('Authentication required.')
        

    