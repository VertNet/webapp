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

__author__ = "John Wieczorek"
__contributors__ = "Aaron Steele, John Wieczorek"
__copyright__ = "Copyright 2016 vertnet.org"
#__version__ = "search.py 2016-08-15T16:43+02:00"
__version__ = "search.py 2020-07-04T11:35-03:00"

from google.appengine.api import namespace_manager
from google.appengine.api import search
from google.appengine.api.search import SortOptions, SortExpression
from vertnet.service import util as vnutil
from datetime import datetime
import time
import re
import htmlentitydefs
import os
import json
import logging
from google.appengine.api import urlfetch
# In an attempt to overcome timeouts in searches
urlfetch.set_default_fetch_deadline(30)

SEARCH_VERSION=__version__
IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Development')

def _get_rec(doc):
    """ Construct an output record from the index document """
    lastindexed = None
    for field in doc.fields:
        if field.name == 'verbatim_record':
            rec = json.loads(field.value)
            # The following are not in the verbatim_record, as they are provided by the 
            # indexer in their own fields.
            rec['rank'] = doc._rank
        elif field.name == 'lastindexed':
            lastindexed = field.value
#            logging.debug('search.py:_get_rec() doc.fields: %s' % doc.fields)
    rec['lastindexed'] = lastindexed
    return rec

def query(q, limit, index_name='dwc', sort=None, curs=search.Cursor()):
    if not curs:
        curs = search.Cursor()
    
    namespace = namespace_manager.get_namespace()
    if q.startswith('id:'):
        did = q.split(':')[1].strip()
        results = search.Index(name=index_name, namespace=namespace).get_range(
            start_id=did, limit=1)
        if results:
            recs = map(_get_rec, results)
#            logging.info('One result from search.Index() for namespace=%s index_name=%s \
#                query=%s\nVersion: %s' % (namespace, index_name, q, SEARCH_VERSION))
            return recs, None, 1, SEARCH_VERSION
        else:
#            logging.info('No results from search.Index() for namespace=%s index_name=%s \
#                query=%s\nVersion: %s' % (namespace, index_name, q, SEARCH_VERSION))
            return [], None, 0, SEARCH_VERSION

    expressions = []
    # [SortExpression(expression='rank', default_value=0,
    #     direction=SortExpression.DESCENDING)]    

    if sort:
        expressions.append(SortExpression(expression=sort, default_value='z', 
            direction=SortExpression.ASCENDING))
        sort_options = SortOptions(expressions=expressions, limit=limit)
        s = 'Sorting is supposedly disabled, '
        s += 'this code should never be executed: %s' % sort_options
        s += '\nVersion: %s' % SEARCH_VERSION
        logging.info(s)
#        logging.info('Sort options: %s\nVersion: %s' % (sort_options, SEARCH_VERSION) )
    
        options = search.QueryOptions(
            limit=limit,
            # See Stucky research, Mar 2014.
            number_found_accuracy=10000,
            cursor=curs,
            sort_options=sort_options)
    else:
        # Always use 10,000 as the value for number_found_accuracy.  Based on
        # extensive testing, using this maximum allowed value results in the best
        # count accuracy and incurs only a minor performance penalty.
        options = search.QueryOptions(
            limit=limit,
            # See Stucky research, Mar 2014.
            number_found_accuracy=10000,
            cursor=curs)

    max_retries = 2
    retry_count = 0
    error = None
    while retry_count < max_retries:
        try:
            query = search.Query(query_string=q, options=options)
            logging.info('Trying Query: %s\nOptions: %s\nVersion: %s' % (q, options, SEARCH_VERSION))
            start_time = time.time()
            results = search.Index(name=index_name, namespace=namespace).search(query,deadline=30)
            elapsed_time = time.time() - start_time
            # Try with an explicitly set deadline to overcome failed queries on
            # multiple "booleans" such as haslength, hasmass, hasmedia, isfossil, etc.
#            results = search.Index(name=index_name, namespace=namespace).search(query, deadline=50)
            if results:
                logging.info('Found %s records in %.1fs' % (results.number_found, elapsed_time))
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
            logging.error('Search failed.\nQUERY: %s\nERROR:%s\nVersion: %s' 
                % (q,e,SEARCH_VERSION) )
            error = e
            retry_count += 1
    logging.info('Finally no results from query %s for namespace=%s \
        index_name=%s\nVersion: %s' % (q, namespace, index_name, 
        SEARCH_VERSION))
    return [], None, 0, SEARCH_VERSION

def query_rec_counter(q, limit, index_name='dwc', sort=None, curs=search.Cursor()):
    """ Makes a search from curs. Returns count of records in search, new cursor """
    if not curs:
        curs = search.Cursor()
    
    if q.startswith('id:'):
        did = q.split(':')[1].strip()
        namespace = namespace_manager.get_namespace()
        results = search.Index(name=index_name, namespace=namespace).get_range(
            start_id=did, limit=1)
        if results:
            recs = len(results.results)
            return recs, None, SEARCH_VERSION
        else:
#            logging.info('No results from search.Index() for namespace=%s index_name=%s \
#                query=%s\nVersion: %s' % (namespace, index_name, q, SEARCH_VERSION))
            return 0, None, SEARCH_VERSION

    # Always use 10,000 as the value for number_found_accuracy.  Based on
    # extensive testing, using this maximum allowed value results in the best
    # count accuracy and incurs only a minor performance penalty.
    options = search.QueryOptions(
        limit=limit,
        # See Stucky research, Mar 2014.
        number_found_accuracy=10000,
        cursor=curs,
        ids_only=True)

    max_retries = 2
    retry_count = 0
    error = None
    while retry_count < max_retries:
        try:
            query = search.Query(query_string=q, options=options)
            namespace = namespace_manager.get_namespace()
            results = search.Index(name=index_name, namespace=namespace).search(query)
            # Try with an explicitly set deadline to overcome failed queries on
            # multiple "booleans" such as haslength, hasmass, hasmedia, isfossil, etc.
#            results = search.Index(name=index_name, namespace=namespace).search(query, deadline=50)
            if results:
                recs = len(results.results)
                return recs, results.cursor, SEARCH_VERSION
            else:
                logging.info('No results from query %s for namespace=%s \
                    index_name=%s\nVersion: %s' % (q, namespace, index_name, 
                    SEARCH_VERSION))
                return 0, None, SEARCH_VERSION
        except Exception, e:
            logging.error('Search failed.\nQUERY:\n %s\nERROR:\n%s\nVersion: %s' 
                % (q,e,SEARCH_VERSION) )
            error = e
            retry_count += 1
    logging.info('Finally no results from query %s for namespace=%s \
        index_name=%s\nVersion: %s' % (q, namespace, index_name, 
        SEARCH_VERSION))
    return 0, None, SEARCH_VERSION
