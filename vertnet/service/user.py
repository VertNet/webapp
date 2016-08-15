#!/usr/bin/env python

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = "John Wieczorek"
__contributors__ = "Aaron Steele, John Wieczorek"
__copyright__ = "Copyright 2016 vertnet.org"
__version__ = "user.py 2016-08-15T15:54+02:00"

import json
import logging
import os
import webapp2

from google.appengine.ext import ndb
from google.appengine.ext.webapp.util import run_wsgi_app

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Development')

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