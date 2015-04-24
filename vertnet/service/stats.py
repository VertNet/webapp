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
    logging.info("CARTODB KEY %s" % api_key)

    url = "https://vertnet.cartodb.com/api/v2/sql"
    q = 'select * from daily_portal_stats order by created_at desc limit 1'

    params = {'api_key':api_key, 'q':q}
    data = urlencode(params)

    raw = urlopen(url, data=data).read()
    d = json.loads(raw)['rows'][0]
    logging.info(d.keys())

#    return [str(d)]
    return [str(d['mindate']), "|", str(d['created_at']), "|", str(d['searches']), "|", str(d['records_viewed']), "|", str(d['downloads']), "|", str(d['records_downloaded']), "|", str(d['institution_data'])[1:-1], "|", str(d['class_data'])[1:-1], "|", str(d['download_data'])[1:-1]]
