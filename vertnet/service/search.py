from google.appengine.api import namespace_manager
import json
import logging
from datetime import datetime
from google.appengine.api import search
from google.appengine.api.search import SortOptions, SortExpression
import re
import htmlentitydefs
import os

SEARCH_VERSION='search.py 2015-08-24T21:18:59+02:00'

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Development')

OMIT_FROM_API_RESULTS = ['location', 'record', 'verbatim_record', 'count', 'icode',
                         'keyname', 'harvestid']

TRANSLATE_HEADER = {'pubdate':'dataset_pubdate', 'url':'dataset_url', 
                    'eml':'dataset_eml', 'dwca':'dataset_dwca', 'title':'dataset_title',
                    'description':'dataset_description', 'contact':'dataset_contact',
                    'orgname':'dataset_orgname', 'email':'dataset_contact_email',
                    'emlrights':'dataset_rights', 'citation':'dataset_citation', 
                    'networks':'dataset_networks'}

def _get_api_rec(doc):
#    logging.info('Doc.fields: %s' % (doc.fields))
    # Look through all the fields in the doc
    for field in doc.fields:
      # Ignore all fields except verbatim_record for now
      if field.name == 'verbatim_record':
        # Load the verbatim_record as the basis for the response for this rec
        rec = json.loads(field.value)
#    logging.info('Rec from verbatim_record: %s' % (rec))
    # Look through all the fields in the doc again
    for field in doc.fields:
      # If the field name isn't already in the response for this rec
      if rec.get(field.name) is None:
        # Add the field.name:field.value pair to the response for this rec
        rec[field.name] = field.value
#    rec['doc_rank'] = doc._rank
#    rec['doc_id'] = doc.doc_id
#    rec['doc_language'] = doc.language

    # Remove unwanted fields from the api results    
    for popme in OMIT_FROM_API_RESULTS:
      if rec.get(popme) is not None:
#        logging.info('Omitting field: %s from rec' % (popme))
        rec.pop(popme)
    
    # Translate field names to be explicit in the api results    
    for changeme in TRANSLATE_HEADER:
      if rec.get(changeme) is not None:
        value = rec.get(changeme)
        rec.pop(changeme)
        rec[TRANSLATE_HEADER.get(changeme)]=value  
    return rec

def api_query(q, limit, index_name='dwc', log=0, sort=None, curs=search.Cursor()):
    if not curs:
        curs = search.Cursor()
    
    if q.startswith('id:'):
        did = q.split(':')[1].strip()
        namespace = namespace_manager.get_namespace()
        results = search.Index(name=index_name, namespace=namespace).get_range(
            start_id=did, limit=1)
        if results:
            recs = map(_get_api_rec, results)
            logging.info('One result from search.Index() for namespace=%s index_name=%s \
                query=%s' % (namespace, index_name, q))
            if log==1:
              logging.info('Results:\n%s' % (results))          
            return recs, None, 1, SEARCH_VERSION
        else:
            logging.info('No results from search.Index() for namespace=%s index_name=%s \
                query=%s' % (namespace, index_name, q))
            return [], None, 0, SEARCH_VERSION

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
            # See Stucky research, Mar 2014.
            number_found_accuracy=10000,
            cursor=curs,
            sort_options=sort_options)
            #returned_fields=['record', 'location'])        
    else:
        # Always use 10,000 as the value for number_found_accuracy.  Based on
        # extensive testing, using this maximum allowed value results in the best
        # count accuracy and incurs only a minor performance penalty.
        options = search.QueryOptions(
            limit=limit,
            # See Stucky research, Mar 2014.
            number_found_accuracy=10000,
            cursor=curs) #,
            #returned_fields=['record', 'location'])        

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
                recs = map(_get_api_rec, results)
                logging.info('%s results from search.Index() for namespace=%s \
                    index_name=%s query=%s' % (results.number_found, namespace, 
                    index_name, q))
                if log==1:
                  logging.info('Results:\n%s' % (results))          
                return recs, results.cursor, results.number_found, SEARCH_VERSION
            else:
                logging.info('No results from search.Index() for namespace=%s \
                    index_name=%s query=%s' % (namespace, index_name, q))
                return [], None, 0, SEARCH_VERSION
        except Exception, e:
            logging.error('Search failed.\nQUERY:\n %s\nERROR:\n%s' % (q,e) )
            error = e
            retry_count += 1

    return [error]

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
        # Always use 10,000 as the value for number_found_accuracy. Based on
        # extensive testing, using this maximum-allowed value results in the best
        # count accuracy and incurs only a minor performance penalty.
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
            logging.exception('Search failed.\nQUERY:\n %s\nERROR:\n%s' % (q,e) )   
            error = e
            retry_count += 1

    return [error]
