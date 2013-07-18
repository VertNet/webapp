import os
import sys
from google.appengine.api import namespace_manager

def fix_path():
	sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))
	sys.path.append(os.path.join(os.path.dirname(__file__), 'vertnet'))

fix_path()

appstats_CALC_RPC_COSTS = True
COOKIE_KEY = "\xb4\xa4\x94x\xee6\x16\x84r'\xf2~a\xad^\xaf,<2\x84!\xc35m\xd9.f\xad~\xdd\xb2q\xac\xda\xb3\xd7\xc5\xc3{\x05tx\xfd\x94\xc0J\xbdw\xe2\xa7\xbfjc\x90\x1f\xac\xb0\xe7K\xedg,\x1a\xdb"

# def webapp_add_wsgi_middleware(app):
#   #from google.appengine.ext.appstats import recording
#   from gaesessions import SessionMiddleware
#   app = SessionMiddleware(app, cookie_key=COOKIE_KEY)
#   #app = recording.appstats_wsgi_middleware(app)
#   return app


# Called only if the current namespace is not set.
def namespace_manager_default_namespace_for_request():
    # The returned string will be used as the Google Apps domain.
    return 'test'