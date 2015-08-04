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
    logging.info("CARTODB KEY %s" % key)
    return key
api_key=apikey()

# CartoDB requests
def cartodb(query):
    """Launch a query to CartoDB."""
    urlbase = "https://vertnet.cartodb.com/api/v2/sql"
    params = {
        'api_key': api_key,
        'q': query
    }
    url = '?'.join([urlbase, urllib.urlencode(params)])
    logging.info('QUERY URL: {}'.format(url))
    d = json.loads(urllib2.urlopen(url).read())['rows']
    return d

# Get actual stats from query_log_master
def getExplicitStuff(tag):
    query = "select query, sum(count) from query_log_master where query like '%{0}:%' and created_at>=date '{1}' group by query".format(tag, query_date_limit)
    d = cartodb(query)
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
    query = "select concat(year,'-',month) as date, queries, records from ( select extract(month from date(created_at)) as month, extract(year from date(created_at)) as year, count(*) as queries, sum(count) as records from query_log_master where type='download' and created_at>=date '{0}' group by extract(month from date(created_at)), extract(year from date(created_at)) order by extract(year from date(created_at)), extract(month from date(created_at))) as foo".format(query_date_limit)
    # Daily
    #url = "https://vertnet.cartodb.com/api/v2/sql?api_key={1}q=select%20date%28created_at%29,%20count%28*%29%20as%20queries,%20sum%28count%29%20as%20records%20from%20query_log_master%20where%20type=%27download%27%20and%20created_at%3E=date%20%27{0}%27%20group%20by%20date%28created_at%29%20order%20by%20date%28created_at%29".format(query_date_limit, api_key)
    d = cartodb(query)
    downloadsdata = []
    for i in d:
        date = str(i['date'])
        queries = i['queries']
        downloadsdata.append([date, queries])
    return downloadsdata

def getMetadata():
    query = "select type, count(*) as searches, sum(count) as records from query_log_master where created_at>=date '{0}' group by type".format(query_date_limit)
    d = cartodb(query)
    metadata = {}
    for i in d:
        t = i['type']
        searches = i['searches']
        records = i['records']
        metadata[t] = {'searches':searches, 'records':records}
    return metadata

def getRecordsQueried():
    records_queried = 0
    query = "select count(*) from query_log_master where client='portal-prod' and results_by_resource is not null and created_at>=date '%s' and results_by_resource <> '{}'" % (query_date_limit)
    count = cartodb(query)[0]['count']
    
    for r in [1, 2, 3]:
        if r == 1:
            limit_string = "limit {0}".format(count/3)
        elif r == 2:
            limit_string = "limit {0} offset {0}".format(count/3)
        elif r == 3:
            limit_string = "offset {0}".format(count/3*2)

        logging.info("ROUND {0}".format(r))
        query = "select results_by_resource from query_log_master where client='portal-prod' and results_by_resource is not null and created_at>=date '%s' and results_by_resource <> '{}' %s" % (query_date_limit, limit_string)
        d = cartodb(query)
        for x in list(range(len(d))):
            try:
                records_queried += sum(json.loads(d[x]['results_by_resource']).values())
            except:
                pass

    logging.info("{0} records queried".format(records_queried))
    return records_queried

def getMaxDate():
    query = "select max(created_at) as d from query_log_master"
    d = cartodb(query)[0]['d']
    
    formatin = '%Y-%m-%dT%H:%M:%SZ'
    formatout = '%b %d, %Y'
    
    d2 = datetime.strptime(d,formatin).strftime(formatout)
    return d2

def insertDataCartoDB(mindate, searches, records_viewed, records_downloaded, downloads, download_data, class_data, institution_data):
    record = "'{0}', {1}, {2}, {3}, {4}, '[{5}]', '[{6}]', '[{7}]'".format(mindate, searches, records_viewed, records_downloaded, downloads, download_data.replace("'", '"'), class_data.replace("'", '"'), institution_data.replace("'", '"'))
    q = "insert into daily_portal_stats (mindate, searches, records_viewed, records_downloaded, downloads, download_data, class_data, institution_data) values ({0})".format(record)
    
    url = "https://vertnet.cartodb.com/api/v2/sql"
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
    
    logging.info("Inserting data into CartoDB")
    res = insertDataCartoDB(str(mindate),
        str(metadata['query']['searches']), str(records_queried),
        str(metadata['download']['records']), str(metadata['download']['searches']),
        str(downloadsdata)[1:-1], str(explicitClassGood)[1:-1], str(explicitInstitutionsGood)[1:-1])
    
    logging.info("FINISHED PROCESSING")
    return
