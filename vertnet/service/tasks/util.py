from datetime import datetime
import os
import urllib
import logging
import json
from google.appengine.api import urlfetch

# Date when logging started
threshold_date = datetime(2014, 04, 01)

# Update urlfetch limit to 60 seconds
URLFETCH_DEADLINE = 60

# Get API key from file
def apikey():
    """Return credentials file as a JSON object."""
    path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'cdbkey.txt')
    key = open(path, "r").read().rstrip()
    return key
api_key=apikey()

# CartoDB requests
def cartodb(query):
    """Launch a query to CartoDB."""
    url = "https://vertnet.cartodb.com/api/v2/sql"
    params = {
        'api_key': api_key,
        'q': query
    }
    data = urllib.urlencode(params)
    urlfetch.set_default_fetch_deadline(URLFETCH_DEADLINE)
    res = json.loads(urlfetch.fetch(url=url, payload=data, method=urlfetch.POST).content)
    d = res['rows']
    return d

def get_date_limit():
    """Extract the value in 'created_at' from the last entry of daily_portal_stats."""
    query = "select created_at from daily_portal_stats order by created_at desc limit 1;"
    d = cartodb(query)
    return d[0]['created_at']
query_date_limit = get_date_limit()

# Get last entry of daily_portal_stats table
def get_last_entry():
    """Retrieve last data from daily_portal_stats."""
    query = "select * from daily_portal_stats order by created_at desc limit 1;"
    d = cartodb(query)
    return d[0]

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

def check_new_data():
    """Check if new data exists in query_log_master."""
    q = "select count(*) as entries from query_log_master where created_at>date '%s'" % query_date_limit
    entries = cartodb(q)[0]['entries']
    return entries > 0

def insertDataCartoDB(vals, mindate):
    """Insert a new record in daily_portal_stats table."""
    record = "'{0}', {1}, {2}, {3}, {4}, '{5}', '{6}', '{7}'".format(
        mindate,
        vals['searches'],
        vals['records_viewed'],
        vals['records_downloaded'],
        vals['downloads'],
        json.dumps(vals['download_data']),
        json.dumps(vals['class_data']),
        json.dumps(vals['institution_data'])
    )
    
    q = "insert into daily_portal_stats "
    q += "(mindate, searches, records_viewed, records_downloaded, downloads, download_data, class_data, institution_data) "
    q += "values ({0})".format(record)

    url = "https://vertnet.cartodb.com/api/v2/sql"
    params = {
        'api_key': api_key,
        'q': q
    }

    data = urllib.urlencode(params)
    req = urllib2.Request(url, data)
    res = urllib2.urlopen(req).read()
    logging.info("Result: {0}".format(res))
    return