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
# along with VertNet.  If not, see: http://www.gnu.org/licenses
import os
import sys

def fix_path():
	sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))
	sys.path.append(os.path.join(os.path.dirname(__file__), 'vertnet'))

fix_path()

IS_DEV = 'Development' in os.environ['SERVER_SOFTWARE']

# Set namespace:
def namespace_manager_default_namespace_for_request():
    if IS_DEV:
    	return ''
    else:
    	return 'index-2013-08-08'

engineauth = {
    # Login uri. The user will be returned here if an error occures.
    'login_uri': '/', # default 'login/'
    # The user is sent here after successfull authentication.
    'success_uri': '/',
    'secret_key': 'CHANGE_TO_A_SECRET_KEY',
    # Comment out the following lines to use default
    # User and UserProfile models.
    #'user_model': 'models.CustomUser',
}

if IS_DEV:
    # GitHub settings for Development
    GITHUB_APP_KEY = 'cf7a23281644715323e2'
    GITHUB_APP_SECRET = 'faffff031a9479d4691c43cd8e8d92b930fcedae'
else:
    # GitHub settings for Production
    GITHUB_APP_KEY = '7d8ea7c70e29925779d7'
    GITHUB_APP_SECRET = 'e8c6493c20fd33bc97fea2f9473c952318a51f91'

engineauth['provider.github'] = {
    'client_id': GITHUB_APP_KEY,
    'client_secret': GITHUB_APP_SECRET,
    'scope': 'user,user:email,repo'
    }

def webapp_add_wsgi_middleware(app):
    from engineauth import middleware
    return middleware.AuthMiddleware(app)
