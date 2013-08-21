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

# This module contains request handlers for APIs and pages.
import os
import webapp2

from google.appengine.ext.webapp.util import run_wsgi_app
from webapp2_extras import jinja2

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')

# App routes:
routes = [
    webapp2.Route(r'/', handler='app.AppHandler:home', name='home'),
    webapp2.Route(r'/search', handler='app.AppHandler:search', name='explore'),
    webapp2.Route(r'/about', handler='app.AppHandler:about', name='about'),
    webapp2.Route(r'/publishers', handler='app.AppHandler:publishers', name='publishers'),
    webapp2.Route(r'/o/<:([a-zA-Z0-9]*-?[a-zA-Z0-9]*)*>/<:([a-zA-Z0-9]*-?[a-zA-Z0-9]*)*>', 
        handler='app.AppHandler:occ', name='occ'),
    webapp2.Route(r'/p/<:([a-zA-Z0-9]*-?[a-zA-Z0-9]*)*>', handler='app.AppHandler:pub', 
        name='pub'),
]

class AppHandler(webapp2.RequestHandler):

    @webapp2.cached_property
    def jinja2(self):
        this = jinja2.get_jinja2(app=self.app)
        this.environment.filters['static'] = self.static
        return this

    def render_template(self, template_name, template_values={}):
        self.response.write(self.jinja2.render_template(template_name, 
            **template_values))

    def static(self, foo):
        if IS_DEV:
            return ''
        else:
            return '/' + '1.0' 

    def search(self):
        """Render the explore page."""
        self.render_template('base.html')
    
    def about(self):
        """Render the about page."""
        self.render_template('base.html')

    def publishers(self):
        """Render the publishers page."""
        self.render_template('base.html')

    def home(self):
        """Render page html."""
        self.render_template('home.html')

    def occ(self, publisher, resource):
        self.render_template('base.html')

    def pub(self, publisher):
        self.render_template('base.html')

handler = webapp2.WSGIApplication(routes, debug=IS_DEV)
         
def main():
    run_wsgi_app(handler)
