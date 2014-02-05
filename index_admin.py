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

# This module contains request handlers for admin APIs.
import logging
import os
import webapp2
from google.appengine.api import taskqueue


IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')


class IndexDeleter(webapp2.RequestHandler):
    def get(self):
        name, ns, id = map(self.request.get, ['name', 'ns', 'id'])
        params = dict(name=name, ns=ns, id=id)
        taskqueue.add(url='/indexer-delete', params=params, queue_name="deleteindex")
            

handler = webapp2.WSGIApplication(
    [
     ('/index-admin/delete-resource', IndexDeleter)],
    debug=False)
