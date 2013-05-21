
from google.appengine.ext.webapp.util import run_wsgi_app

from vertnet.service.model import Record
from vertnet.service import util

from webapp2_extras import jinja2

import logging
import json
import os
import webapp2

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')

# App routes:
routes = [
    webapp2.Route(r'/', handler='app.AppHandler:home', name='home'),
    webapp2.Route(r'/explore/<type>', handler='app.AppHandler:explore', 
        name='explore'),
    # webapp2.Route(r'/<publisher>/<resource>/:.*/<tab>', 
    webapp2.Route(r'/<:([a-zA-Z0-9]*-?[a-zA-Z0-9]*)*>/<:([a-zA-Z0-9]*-?[a-zA-Z0-9]*)*>', 
        handler='app.AppHandler:occ', name='occ'),
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

    def explore(self, type):
        """Render the explore page."""
        logging.info('TYPE ' + type)
        self.render_template('explore.html')

    def home(self):
        """Render page html."""
        self.render_template('home.html')

    def occ(self, publisher, resource):
        occurrence = self.request.get('id')
        logging.info('%s/%s/%s' % (publisher, resource, occurrence))
        record = Record.get_by_id('%s/%s/%s' % (publisher, resource, occurrence))
        values = dict(rec=util.classify(json.loads(record.record)))
        self.render_template('occurrence.html', template_values=values)        

handler = webapp2.WSGIApplication(routes, debug=IS_DEV)
         
def main():
    run_wsgi_app(handler)
