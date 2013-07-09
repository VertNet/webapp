
from google.appengine.ext.webapp.util import run_wsgi_app

from webapp2_extras import jinja2

import os
import webapp2

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')

# App routes:
routes = [
    webapp2.Route(r'/', handler='app.AppHandler:home', name='home'),
    webapp2.Route(r'/search/<type>', handler='app.AppHandler:search', 
        name='explore'),
    webapp2.Route(r'/about', handler='app.AppHandler:about', name='about'),
    webapp2.Route(r'/test', handler='app.AppHandler:test', name='test'),
    webapp2.Route(r'/feedback', handler='app.AppHandler:feedback', name='feedback'),
    webapp2.Route(r'/publishers', handler='app.AppHandler:publishers', name='publishers'),
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

    def search(self, type):
        """Render the explore page."""
        self.render_template('explore.html')
    
    def about(self):
        """Render the about page."""
        self.render_template('about.html')        

    def publishers(self):
        """Render the publishers page."""
        self.render_template('publishers.html')        

    def feedback(self):
        """Render the feedback page."""
        self.render_template('feedback.html')        

    def home(self):
        """Render page html."""
        self.render_template('home.html')

    def occ(self, publisher, resource):
        self.render_template('occurrence.html')        

handler = webapp2.WSGIApplication(routes, debug=IS_DEV)
         
def main():
    run_wsgi_app(handler)
