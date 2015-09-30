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

    records_queried = 0
    query = "select sum(value::numeric) as records_queried from (select (json_each_text(results_by_resource::json)).* from query_log_master where client='portal-prod' and results_by_resource is not null and created_at>=date '%s' and results_by_resource <> '{}' and results_by_resource <> '') as foo" % (query_date_limit)
    records_queried = cartodb(query)[0]['records_queried']
    
    # for r in [1, 2]:
    #     if r == 1:
    #         limit_string = "limit {0}".format(count/2)
    #     elif r == 2:
    #         limit_string = "offset {0}".format(count/2)

    #     logging.info("ROUND {0}".format(r))
    #     query = "select results_by_resource from query_log_master where client='portal-prod' and results_by_resource is not null and created_at>=date '%s' and results_by_resource <> '{}' %s" % (query_date_limit, limit_string)
    #     d = cartodb(query)
    #     for x in list(range(len(d))):
    #         try:
    #             records_queried += sum(json.loads(d[x]['results_by_resource']).values())
    #         except:
    #             pass
    
    logging.info("Got Records Queried")
    logging.info("{0} records queried".format(records_queried))
    return str(records_queried)