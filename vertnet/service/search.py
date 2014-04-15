from google.appengine.api import namespace_manager
import json
import logging
from datetime import datetime
from google.appengine.api import search
from google.appengine.api.search import SortOptions, SortExpression
import re
import htmlentitydefs
import os


IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Development')


def _get_rec(doc):
    for field in doc.fields:
        if field.name == 'verbatim_record':
            rec = json.loads(field.value)
            rec['rank'] = doc._rank
            return rec

def query(q, limit, index_name='dwc', sort=None, curs=search.Cursor()):

    # limit = limit + 1
    if not curs:
        curs = search.Cursor()
    
    if q.startswith('id:'):
        did = q.split(':')[1].strip()
        namespace = namespace_manager.get_namespace()
        results = search.Index(name=index_name, namespace=namespace).get_range(start_id=did, limit=1)
        if results:
            recs = map(_get_rec, results)
            logging.info('SUCCESS recs=%s' % recs)
            return recs, None, 1
        else:
            logging.info('No search results for: %s' % q)
            return [], None, 0

    expressions = []
    # [SortExpression(expression='rank', default_value=0,
    #     direction=SortExpression.DESCENDING)]    

    if sort:
        expressions.append(SortExpression(expression=sort, default_value='z', 
            direction=SortExpression.ASCENDING))
        sort_options = SortOptions(expressions=expressions, limit=limit)
        logging.info(sort_options)
    
        options = search.QueryOptions(
            limit=limit,
            # number_found_accuracy=limit+1,
            cursor=curs,
            sort_options=sort_options)
            #returned_fields=['record', 'location'])        
    else:
        options = search.QueryOptions(
            limit=limit,
            # See Stucky research, Mar 2014.
            number_found_accuracy=10000,
#            number_found_accuracy=limit+1,
            cursor=curs) #,
            #returned_fields=['record', 'location'])        

    logging.info('QUERY %s' % q)

    max_retries = 2
    retry_count = 0
    error = None
    while retry_count < max_retries:
        try:
            query = search.Query(query_string=q, options=options)
            namespace = namespace_manager.get_namespace()
            results = search.Index(name=index_name, namespace=namespace).search(query)
#            logging.info('NS %s NAME %s RESULTS %s' % (namespace, index_name, results))
            if results:
                recs = map(_get_rec, results)
                logging.info('NS %s NAME %s RECORD_COUNT %s' % (namespace, index_name, results.number_found))
                return recs, results.cursor, results.number_found
            else:
                logging.info('No search results for: %s' % q)
                return [], None, 0
        except Exception, e:
            logging.exception('Search failed: %s' % e)   
            error = e
            retry_count += 1

    return [error]










