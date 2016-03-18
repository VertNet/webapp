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

    # Monthly
    query = "select concat(year,'-',month) as date, queries, records from ( select extract(month from date(created_at)) as month, extract(year from date(created_at)) as year, count(*) as queries, sum(count) as records from query_log_master where type='download' and created_at>date '{0}' group by extract(month from date(created_at)), extract(year from date(created_at)) order by extract(year from date(created_at)), extract(month from date(created_at))) as foo".format(query_date_limit)
    # Daily
    #url = "https://vertnet.cartodb.com/api/v2/sql?api_key={1}q=select%20date%28created_at%29,%20count%28*%29%20as%20queries,%20sum%28count%29%20as%20records%20from%20query_log_master%20where%20type=%27download%27%20and%20created_at%3E=date%20%27{0}%27%20group%20by%20date%28created_at%29%20order%20by%20date%28created_at%29".format(query_date_limit, api_key)
    d = cartodb(query)
    downloadsdata = []
    for i in d:
        date = str(i['date'])
        queries = i['queries']
        downloadsdata.append([date, queries])

    logging.info("Got downloads data")
    return str(downloadsdata)