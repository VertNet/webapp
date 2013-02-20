
from google.appengine.ext.webapp.util import run_wsgi_app
from webapp2_extras import jinja2

import os
import webapp2

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')

# App routes:
routes = [
    webapp2.Route(r'/', handler='app.AppHandler:page', name='page'),
]

class AppHandler(webapp2.RequestHandler):

    @webapp2.cached_property
    def jinja2(self):
        this = jinja2.get_jinja2(app=self.app)
        this.environment.filters['static'] = self.static
        return this

    def render_template(self, template_name, template_values={}):
        self.response.write(self.jinja2.render_template(template_name))

    def static(self, foo):
        if IS_DEV:
            return ''
        else:
            return '/' + '1.0' 

    def page(self):
        """Render page html."""
        self.render_template('base.html')

handler = webapp2.WSGIApplication(routes, debug=IS_DEV)
         
def main():
    run_wsgi_app(handler)
