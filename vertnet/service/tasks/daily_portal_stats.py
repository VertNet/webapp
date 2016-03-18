"""Service to run cron tasks."""

import ast
import os
import urllib
import urllib2
from datetime import datetime
import json
import logging
from google.appengine.api import urlfetch, modules

from util import *

URLFETCH_DEADLINE = 60

def main(environ, start_response):
    logging.info("Main stats function called")
    status = 200
    headers = {}
    logging.info("Starting response")
    start_response(status, headers)
    logging.info("Response started")

    mindate = format(threshold_date, '%b %d, %Y')
    
    # Get last entry in daily_portal_stats
    last_vals = get_last_entry()

    # Check if new data is available
    newdata = check_new_data()
    if newdata is False:
        logging.warning("There is no new data in this period. Aborting.")
        return
    
    # Launching RPCs    
    logging.info("Getting Downloads data")
    downloads_url = 'http://'+modules.get_hostname()+'/tasks/get_downloads'
    urlfetch.set_default_fetch_deadline(URLFETCH_DEADLINE)
    downloads_rpc = urlfetch.create_rpc()
    downloads_call = urlfetch.make_fetch_call(downloads_rpc, downloads_url)

    logging.info("Getting Metadata")
    metadata_url = 'http://'+modules.get_hostname()+'/tasks/get_metadata'
    urlfetch.set_default_fetch_deadline(URLFETCH_DEADLINE)
    metadata_rpc = urlfetch.create_rpc()
    metadata_call = urlfetch.make_fetch_call(metadata_rpc, metadata_url)

    logging.info("Getting Records Queried")
    records_url = 'http://'+modules.get_hostname()+'/tasks/get_records'
    urlfetch.set_default_fetch_deadline(URLFETCH_DEADLINE)
    records_rpc = urlfetch.create_rpc()
    records_call = urlfetch.make_fetch_call(records_rpc, records_url)
    
    logging.info("Getting Explicit Institutioncodes")
    explicitInstitutionsGood = getExplicitStuff('institutioncode')
    logging.info("Got icodes")
    
    logging.info("Getting explicit class")
    explicitClassGood = getExplicitStuff('class')
    logging.info("Got Explicit class")

    # Retrieving RPC objects
    downloadsdata = downloads_call.get_result().content
    downloadsdata = ast.literal_eval(downloadsdata)
    metadata = ast.literal_eval(metadata_call.get_result().content)
    records_queried = records_call.get_result().content
    records_queried = int(records_queried)

    # Adding new values to last entry in daily_portal_stats
    last_vals['searches'] += metadata['query']['searches']
    last_vals['records_viewed'] += records_queried
    last_vals['records_downloaded'] += metadata['download']['records']
    last_vals['downloads'] += metadata['download']['searches']
    
    for i in downloadsdata:
        new_download = True
        for j in list(range(len(last_vals['download_data']))):
            if last_vals['download_data'][j][0] == i[0]:
                last_vals['download_data'][j][1] += i[1]
                new_download = False
        if new_download is True:
            last_vals['download_data'].append(i)

    for i in explicitClassGood:
        new_class = True
        for j in list(range(len(last_vals['class_data']))):
            if last_vals['class_data'][j][0] == i[0]:
                last_vals['class_data'][j][1] += i[1]
                new_class = False
        if new_class is True:
            last_vals['class_data'].append(i)

    for i in explicitInstitutionsGood:
        new_class = True
        for j in list(range(len(last_vals['institution_data']))):
            if last_vals['institution_data'][j][0] == i[0]:
                last_vals['institution_data'][j][1] += i[1]
                new_class = False
        if new_class is True:
            last_vals['institution_data'].append(i)
    
    logging.info("Inserting data into CartoDB")

    res = insertDataCartoDB(last_vals, mindate)
    
    logging.info("FINISHED PROCESSING")
    return
