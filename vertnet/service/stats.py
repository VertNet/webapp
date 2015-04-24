"""Service to generate stats for the stats page."""

import os
from urllib2 import urlopen
from urllib import urlencode
import json
import logging


def main(environ, start_response):

    path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'cdbkey.txt')
    api_key = open(path, "r").read().rstrip()
    logging.info("CARTODB KEY %s" % key)

    url = "https://vertnet.cartodb.com/api/v2/sql?api_key={0}&q=select * from daily_portal_stats where created_at=max(created_at)".format(api_key)
    d = json.loads(urlopen(urlencode(url)).read())['rows']
    console.log(d)
    
    return str(d)
