from google.appengine.api import namespace_manager
import json
import logging
from datetime import datetime
from google.appengine.api import search
from google.appengine.api.search import SortOptions, SortExpression
import re
import htmlentitydefs
import os

SEARCH_VERSION='search.py 2015-08-25T14:32:31+02:00'

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Development')

OMIT_FROM_API_RESULTS = ['location', 'record', 'verbatim_record', 'count', 'icode',
                         'keyname', 'harvestid']

TRANSLATE_HEADER = {'pubdate':'dataset_pubdate', 'url':'dataset_url', 
                    'eml':'dataset_eml', 'dwca':'dataset_dwca', 'title':'dataset_title',
                    'description':'dataset_description', 'contact':'dataset_contact',
                    'orgname':'dataset_orgname', 'email':'dataset_contact_email',
                    'emlrights':'dataset_rights', 'citation':'dataset_citation', 
                    'networks':'dataset_networks'}

def _get_rec(doc):
    for field in doc.fields:
        if field.name == 'verbatim_record':
            rec = json.loads(field.value)
            rec['rank'] = doc._rank
            return rec

def _get_rec_for_api(doc):
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

def query(q, limit, index_name='dwc', sort=None, curs=search.Cursor(), api=None):
    if not curs:
        curs = search.Cursor()
    
    if q.startswith('id:'):
        did = q.split(':')[1].strip()
        namespace = namespace_manager.get_namespace()
        results = search.Index(name=index_name, namespace=namespace).get_range(
            start_id=did, limit=1)
        if results:
            if api is not None:
                recs = map(_get_rec_for_api, results)
            else:
                recs = map(_get_rec, results)
            logging.info('One result from search.Index() for namespace=%s index_name=%s \
                query=%s\nVersion: %s' % (namespace, index_name, q, SEARCH_VERSION))
            return recs, None, 1, SEARCH_VERSION
        else:
            logging.info('No results from search.Index() for namespace=%s index_name=%s \
                query=%s\nVersion: %s' % (namespace, index_name, q, SEARCH_VERSION))
            return [], None, 0, SEARCH_VERSION

    expressions = []
    # [SortExpression(expression='rank', default_value=0,
    #     direction=SortExpression.DESCENDING)]    

    if sort:
        expressions.append(SortExpression(expression=sort, default_value='z', 
            direction=SortExpression.ASCENDING))
        sort_options = SortOptions(expressions=expressions, limit=limit)
        logging.info('Sort options: %s\nVersion: %s' % (sort_options, SEARCH_VERSION) )
    
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
            if results:
                if api is not None:
                    recs = map(_get_rec_for_api, results)
                else:
                    recs = map(_get_rec, results)
#                logging.info('Query: %s results from search.Index() for namespace=%s \
#                    index_name=%s query=%s\nVersion: %s' % (q, results.number_found, 
#                    namespace, index_name, SEARCH_VERSION))
                return recs, results.cursor, results.number_found, SEARCH_VERSION
            else:
                logging.info('No results from query %s for namespace=%s \
                    index_name=%s\nVersion: %s' % (q, namespace, index_name, 
                    SEARCH_VERSION))
                return [], None, 0, SEARCH_VERSION
        except Exception, e:
            logging.error('Search failed.\nQUERY:\n %s\nERROR:\n%s\nVersion: %s' 
                % (q,e,SEARCH_VERSION) )
            error = e
            retry_count += 1
    return [error]
