from datetime import datetime
import os
import urllib
#import urllib2
import logging
import json
from google.appengine.api import urlfetch

# Date when logging started
threshold_date = datetime(2014, 04, 01)
query_date_limit = format(threshold_date, '%Y-%m-%d')

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