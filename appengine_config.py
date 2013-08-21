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