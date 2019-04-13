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

__author__ = "Javier Otegui"
__contributors__ = "Javier Otegui, John Wieczorek"
__copyright__ = "Copyright 2018 vertnet.org"
__version__ = "stats.py 2018-10-09T15:46-03:00"
STATS_VERSION=__version__

"""Service to generate stats for the stats page."""

import os
from urllib2 import urlopen
from urllib import urlencode
import json
import logging

def main(environ, start_response):
    status = 200
    headers={}
    start_response(status, headers)
    
    path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'cdbkey.txt')
    api_key = open(path, "r").read().rstrip()
    logging.info("CARTO KEY %s" % api_key)

    url = "https://vertnet.carto.com/api/v2/sql"
    q = 'select * from daily_portal_stats order by created_at desc limit 1'

    params = {'api_key':api_key, 'q':q}
    data = urlencode(params)

    raw = urlopen(url, data=data).read()
    d = json.loads(raw)['rows'][0]
    logging.info(d.keys())

    return [str(d['mindate'].split('T')[0]), "|", str(d['created_at'].split('T')[0]), "|", str(d['searches']), "|", str(d['records_viewed']), "|", str(d['downloads']), "|", str(d['records_downloaded']), "|", str(d['institution_data'])[1:-1], "|", str(d['class_data'])[1:-1], "|", str(d['download_data'])[1:-1]]
