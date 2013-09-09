# This file is part of VertNet: https://github.com/VertNet/webapp
#
# VertNet is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# VertNet is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Foobar.  If not, see: http://www.gnu.org/licenses

# This module contains the user service.
import json
import logging
import os
import webapp2

from google.appengine.ext import ndb
from google.appengine.ext.webapp.util import run_wsgi_app

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')

routes = [
    webapp2.Route(r'/api/user/get', handler='vertnet.service.user.UserHandler:get', name='get'),
    webapp2.Route(r'/api/user/logout', handler='vertnet.service.user.UserHandler:logout', name='logout'),
]

class UserHandler(webapp2.RequestHandler):
    def get(self):
        user = self.request.user if self.request.user else None
        logging.info(self.request)
        if user:
            auth_id = user.auth_ids[0]
            profile = ndb.Key('UserProfile', auth_id).get()
            info = profile.user_info['info']
            info['login'] = profile.user_info['extra']['raw_info']['login']
        else:
            info = None
        self.response.out.headers['Content-Type'] = 'application/json'
        self.response.headers['charset'] = 'utf-8'
        self.response.out.write(json.dumps(info))

    def logout(self):
        session = self.request.session if self.request.session else None
        session.key.delete();
        self.response.delete_cookie('_eauth') 

handler = webapp2.WSGIApplication(routes, debug=IS_DEV)
         
def main():
    run_wsgi_app(handler)