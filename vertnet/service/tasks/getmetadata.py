import logging
import json

from util import *

def main(environ, start_response):
    
    logging.info("Main stats function called")
    status = 200
    headers = {}
    logging.info("Starting response")
    start_response(status, headers)
    logging.info("Response started")

    query = "select type, count(*) as searches, sum(count) as records from query_log_master where created_at>=date '{0}' group by type".format(query_date_limit)
    d = cartodb(query)
    metadata = {}
    for i in d:
        t = i['type']
        searches = i['searches']
        records = i['records']
        metadata[t] = {'searches':searches, 'records':records}

    logging.info("Got Metadata")
    return str(metadata)