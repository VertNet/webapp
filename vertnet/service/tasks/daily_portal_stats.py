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
__copyright__ = "Copyright 2016 vertnet.org"
__version__ = "search.py 2016-08-15T16:07+02:00"

"""Service to run cron tasks."""

import os
import urllib
import urllib2
from datetime import datetime
import json
import logging

# Date when logging started
threshold_date = datetime(2014, 04, 01)
query_date_limit = format(threshold_date, '%Y-%m-%d')

# Get API key from file
def apikey():
    """Return credentials file as a JSON object."""
    path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'cdbkey.txt')
    key = open(path, "r").read().rstrip()
    logging.info("CARTO KEY %s" % key)
    return key
api_key=apikey()

# Get actual stats from query_log_master
def getExplicitStuff(tag):
#    url = "https://vertnet.cartodb.com/api/v2/sql?api_key={2}&q=select+query,%20sum%28count%29+from+query_log_master+where+query+like+%27%25{0}%3A%25%27%20and%20created_at%3E=date%20%27{1}%27%20group%20by%20query".format(tag, query_date_limit, api_key)
    url = "https://vertnet.carto.com/api/v2/sql?api_key={2}&q=select+query,%20sum%28count%29+from+query_log_master+where+query+like+%27%25{0}%3A%25%27%20and%20created_at%3E=date%20%27{1}%27%20group%20by%20query".format(tag, query_date_limit, api_key)
    logging.info('QUERY URL: %s' % url)
    d = json.loads(urllib2.urlopen(url).read())['rows']
    stuffQ = {}
    stuffR = {}
    stuffSgood = []
    for i in d:
        records = i['sum']
        l = i['query'].split()
        indexes = [i for i,term in enumerate(l) if term.startswith('{0}:'.format(tag))]
        for j in indexes:
            if j>0 and l[j-1] == "(NOT":
                continue
            stuff0 = str(l[j].split(':')[1]).upper()
            if stuff0 not in stuffQ.keys():
                stuffQ[stuff0] = 1
                stuffR[stuff0] = records
            else:
                stuffQ[stuff0] += 1
                stuffR[stuff0] += records
    stuffLQ = sorted(stuffQ, key=stuffQ.__getitem__, reverse=True)
    stuffLR = sorted(stuffR, key=stuffR.__getitem__, reverse=True)
    
    for i in stuffLQ:
        if stuffR[i] > 0:
            stuffSgood.append([i, stuffQ[i]])
    
    return stuffSgood

def getDownloadsData():
    # Monthly
#    url = "https://vertnet.cartodb.com/api/v2/sql?api_key={1}&q=select%20concat%28year,%27-%27,month%29%20as%20date,%20queries,%20records%20from%20%28%20select%20extract%28month%20from%20date%28created_at%29%29%20as%20month,%20extract%28year%20from%20date%28created_at%29%29%20as%20year,%20count%28*%29%20as%20queries,%20sum%28count%29%20as%20records%20from%20query_log_master%20where%20type=%27download%27%20and%20created_at%3E=date%20%27{0}%27%20group%20by%20extract%28month%20from%20date%28created_at%29%29,%20extract%28year%20from%20date%28created_at%29%29%20order%20by%20extract%28year%20from%20date%28created_at%29%29,%20extract%28month%20from%20date%28created_at%29%29%29%20as%20foo".format(query_date_limit, api_key)
    url = "https://vertnet.carto.com/api/v2/sql?api_key={1}&q=select%20concat%28year,%27-%27,month%29%20as%20date,%20queries,%20records%20from%20%28%20select%20extract%28month%20from%20date%28created_at%29%29%20as%20month,%20extract%28year%20from%20date%28created_at%29%29%20as%20year,%20count%28*%29%20as%20queries,%20sum%28count%29%20as%20records%20from%20query_log_master%20where%20type=%27download%27%20and%20created_at%3E=date%20%27{0}%27%20group%20by%20extract%28month%20from%20date%28created_at%29%29,%20extract%28year%20from%20date%28created_at%29%29%20order%20by%20extract%28year%20from%20date%28created_at%29%29,%20extract%28month%20from%20date%28created_at%29%29%29%20as%20foo".format(query_date_limit, api_key)
    # Daily
    #url = "https://vertnet.cartodb.com/api/v2/sql?api_key={1}q=select%20date%28created_at%29,%20count%28*%29%20as%20queries,%20sum%28count%29%20as%20records%20from%20query_log_master%20where%20type=%27download%27%20and%20created_at%3E=date%20%27{0}%27%20group%20by%20date%28created_at%29%20order%20by%20date%28created_at%29".format(query_date_limit, api_key)
    logging.info('QUERY URL: %s' % url)
    d = json.loads(urllib2.urlopen(url).read())['rows']
    downloadsdata = []
    for i in d:
        date = str(i['date'])
        queries = i['queries']
        downloadsdata.append([date, queries])
    return downloadsdata

def getMetadata():
#    url = "https://vertnet.cartodb.com/api/v2/sql?api_key={1}&q=select%20type,%20count%28*%29%20as%20searches,%20sum%28count%29%20as%20records%20from%20query_log_master%20where%20created_at%3E=date%20%27{0}%27%20group%20by%20type".format(query_date_limit, api_key)
    url = "https://vertnet.carto.com/api/v2/sql?api_key={1}&q=select%20type,%20count%28*%29%20as%20searches,%20sum%28count%29%20as%20records%20from%20query_log_master%20where%20created_at%3E=date%20%27{0}%27%20group%20by%20type".format(query_date_limit, api_key)
    logging.info('QUERY URL: %s' % url)
    d = json.loads(urllib2.urlopen(url).read())['rows']
    metadata = {}
    for i in d:
        t = i['type']
        searches = i['searches']
        records = i['records']
        metadata[t] = {'searches':searches, 'records':records}
    return metadata

def getRecordsQueried():
#    url = "https://vertnet.cartodb.com/api/v2/sql?api_key={1}&q=select%20results_by_resource%20from%20query_log_master%20where%20client=%27portal-prod%27%20and%20results_by_resource%20is%20not%20null%20and%20created_at%3E=date%20%27{0}%27%20and%20results_by_resource%20%3C%3E%20%27%27".format(query_date_limit, api_key)
    url = "https://vertnet.carto.com/api/v2/sql?api_key={1}&q=select%20results_by_resource%20from%20query_log_master%20where%20client=%27portal-prod%27%20and%20results_by_resource%20is%20not%20null%20and%20created_at%3E=date%20%27{0}%27%20and%20results_by_resource%20%3C%3E%20%27%27".format(query_date_limit, api_key)
    logging.info('QUERY URL: %s' % url)
    d = json.loads(urllib2.urlopen(url).read())['rows']
    records_queried = sum([sum(json.loads(d[x]['results_by_resource']).values()) for x in list(range(len(d)))])
    return records_queried

def getMaxDate():
#    url = "https://vertnet.cartodb.com/api/v2/sql?api_key={0}&q=select%20max%28created_at%29%20from%20query_log_master".format(api_key)
    url = "https://vertnet.carto.com/api/v2/sql?api_key={0}&q=select%20max%28created_at%29%20from%20query_log_master".format(api_key)
    logging.info('QUERY URL: %s' % url)
    d = json.loads(urllib2.urlopen(url).read())['rows'][0]['max']
    
    formatin = '%Y-%m-%dT%H:%M:%SZ'
    formatout = '%b %d, %Y'
    
    d2 = datetime.strptime(d,formatin).strftime(formatout)
    return d2

def insertDataCartoDB(mindate, searches, records_viewed, records_downloaded, downloads, download_data, class_data, institution_data):
    record = "'{0}', {1}, {2}, {3}, {4}, '[{5}]', '[{6}]', '[{7}]'".format(mindate, searches, records_viewed, records_downloaded, downloads, download_data.replace("'", '"'), class_data.replace("'", '"'), institution_data.replace("'", '"'))
    q = "insert into daily_portal_stats (mindate, searches, records_viewed, records_downloaded, downloads, download_data, class_data, institution_data) values ({0})".format(record)
    
#    url = "https://vertnet.cartodb.com/api/v2/sql"
    url = "https://vertnet.carto.com/api/v2/sql"
    vals = {
        'api_key': api_key,
        'q': q
    }
    data = urllib.urlencode(vals)
    req = urllib2.Request(url, data)
    res = urllib2.urlopen(req).read()
    logging.info("Result: {0}".format(res))

    return


def main(environ, start_response):
    logging.info("Main stats function called")
    status = 200
    headers = {}
    logging.info("Starting response")
    start_response(status, headers)
    logging.info("Response started")
    mindate = format(threshold_date, '%b %d, %Y')
    logging.info("Getting Max Date")
    maxdate = getMaxDate()
    logging.info("Got Max Date")
    logging.info("Getting Downloads data")
    downloadsdata = getDownloadsData()
    logging.info("Got downloads data")
    logging.info("Getting Metadata")
    metadata = getMetadata()
    logging.info("Got Metadata")
    logging.info("Getting Records Queried")
    records_queried = getRecordsQueried()
    logging.info("Got Records Queried")
    logging.info("Getting Explicit Institutioncodes")
    explicitInstitutionsGood = getExplicitStuff('institutioncode')
    logging.info("Got icodes")
    logging.info("Getting explicit class")
    explicitClassGood = getExplicitStuff('class')
    logging.info("Got Explicit class")
    
    logging.info("Inserting data into Carto")
    res = insertDataCartoDB(str(mindate),
        str(metadata['query']['searches']), str(records_queried),
        str(metadata['download']['records']), str(metadata['download']['searches']),
        str(downloadsdata)[1:-1], str(explicitClassGood)[1:-1], str(explicitInstitutionsGood)[1:-1])
    
    logging.info("FINISHED PROCESSING")
    return
