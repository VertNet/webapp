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
import json
import logging
import os
import webapp2

from google.appengine.ext import ndb
from google.appengine.ext.webapp.util import run_wsgi_app
from jinja2.filters import do_pprint
from vertnet.service import github
from webapp2_extras import jinja2

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')

# App routes:
routes = [
    webapp2.Route(r'/', handler='app.AppHandler:home', name='home'),
    webapp2.Route(r'/sitemap.xml', handler='app.AppHandler:sitemap', name='sitemap'),
    webapp2.Route(r'/search', handler='app.AppHandler:search', name='explore'),
    webapp2.Route(r'/about', handler='app.AppHandler:about', name='about'),
    webapp2.Route(r'/publishers', handler='app.AppHandler:publishers', name='publishers'),
    webapp2.Route(r'/o/<:([a-zA-Z0-9]*-?[a-zA-Z0-9]*)*>/<:([a-zA-Z0-9]*-?[a-zA-Z0-9]*)*>', 
        handler='app.AppHandler:occ', name='occ'),
    webapp2.Route(r'/p/<:([a-zA-Z0-9]*-?[a-zA-Z0-9]*)*>', handler='app.AppHandler:pub', 
        name='pub'),
    webapp2.Route(r'/stats', handler='app.AppHandler:stats', name='stats'),
]

config = {
    'webapp2_extras.sessions': {
        'secret_key': 'wIDjEesObzp5nonpRHDzSp40aba7STuqC6ZRY'
    },
    'webapp2_extras.jinja2': {
        'filters': {
            'do_pprint': do_pprint,
            },
        },
    }

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

    def sitemap(self):
        self.render_template('sitemap.xml')
        
    def home(self):
        """Render page html."""
        # session = self.request.session if self.request.session else None
        # user = self.request.user if self.request.user else None
        # if user:
        #     auth_id = user.auth_ids[0]
        #     profile = ndb.Key('UserProfile', auth_id).get()
        #     logging.info(profile)
        #     access_token = json.loads(profile.credentials.to_json())['access_token']
        #     github.issues('create', 'VertNet', 'webapp', access_token, dict(title='whoa'))
        logging.info(self.request)
        self.render_template('home.html')

    def occ(self, publisher, resource):
        self.render_template('base.html')

    def pub(self, publisher):
        self.render_template('base.html')
    
    def stats(self):
        logging.info("Calling stats from app.py")
        self.render_template('base.html')

handler = webapp2.WSGIApplication(routes, config=config, debug=IS_DEV)
         
def main():
    run_wsgi_app(handler)
