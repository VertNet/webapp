"""API handlers for VertNet records."""

from vertnet.service.model import RecordIndex, Record, RecordList, RecordPayload
from vertnet.service import search as vnsearch
from vertnet.service import util as vnutil
from protorpc import remote
from protorpc.wsgi import service
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.api import taskqueue
from google.appengine.api import search
import logging
import json

RECORD_VERSION='record.py 2015-08-28T23:42:06+02:00'

def record_list(limit, cursor, q, message=False):
    """Return CommentList or triple (comments, next_cursor, more)."""
    i, n, m, c = RecordIndex.search(q, limit, cursor=cursor, message=message)
    if message:
        if n:
            n = n.urlsafe()
        return RecordList(items=i, cursor=n, more=m, count=c)
    return i, n, m, c

def _get_tsv_chunk(records):
    tsv_lines = [x.tsv for x in records if x]
    chunk = reduce(lambda x,y: '%s\n%s\n' % (x,y), tsv_lines)
    return chunk

class RecordService(remote.Service):
    """RPC services for working with Records."""

    @remote.method(RecordPayload, RecordPayload)
    def get(self, message):
        """Return a RecordList."""
        recs, cursor, count, version = vnsearch.query('id:%s' % message.id, 1)
        return RecordPayload(id=message.id, json=json.dumps(recs[0]))

    @remote.method(RecordList, RecordList)
    def _search(self, message):
        """Return a RecordList."""
        curs = None
        if message.cursor:
            curs = Cursor(urlsafe=message.cursor)
        q = json.loads(message.q)
        taskqueue.add(url='/apitracker', params=dict(query=message.q), 
            queue_name="apitracker")
        response = record_list(message.limit, curs, q, message=True)
        return response

    def initialize_request_state(self, state):
        self.cityLatLong = state.headers.get('X-AppEngine-CityLatLong')
#        logging.info('CITY_LAT_LONG %s\nVersion: %s' % (state.headers, RECORD_VERSION))

    @remote.method(RecordList, RecordList)
    def search(self, message):
        curs = None
        if message.cursor:
            curs = search.Cursor(web_safe_string=message.cursor)
        else:
            curs = search.Cursor()
        q = json.loads(message.q)
#        logging.info('Q %s' % q)
        keywords = ' '.join([x for x in q['keywords'] if x])
        sort = message.sort
        if 'distance' in keywords:
            sort = None
        limit = message.limit
#        logging.info('Portal Search keywords=%s\nVersion: %s' 
#            % (keywords, RECORD_VERSION))
#        logging.info('REQUEST LATLON %s\nVersion: %s' 
#            % (self.cityLatLong, RECORD_VERSION) )
        result = vnsearch.query(keywords, limit, sort=sort, curs=curs)
        if len(result) == 4:
            recs, cursor, count, query_version = result
            # Build json for search counts
            res_counts = vnutil.search_resource_counts(recs)
            
            if not message.cursor:
                type = 'query'
            else:
                type = 'query-view'

            apitracker_params = dict(
                api_version=None, count=len(recs), download=None, downloader=None, 
                error=None, latlon=self.cityLatLong, matching_records=count, 
                query=keywords, query_version=query_version, 
                request_source='SearchPortal', response_records=len(recs), 
                res_counts=json.dumps(res_counts), type=type)
            
            taskqueue.add(url='/apitracker', params=apitracker_params, 
                queue_name="apitracker")
        else:
            error = result[0].__class__.__name__

            apitracker_params = dict(
                api_version=None, count=0, download=None, downloader=None, 
                error=error, latlon=self.cityLatLong, matching_records=0, 
                query=keywords, query_version=query_version, 
                request_source='SearchPortal', response_records=0, 
                res_counts=json.dumps({}), type='query')

            taskqueue.add(url='/apitracker', params=apitracker_params, 
                queue_name="apitracker")
            response = RecordList(error=unicode(error))
            return response

        if cursor:
            cursor = cursor.web_safe_string

        items = [RecordPayload(id=x['keyname'], json=json.dumps(x)) \
            for x in recs if x]

        response = RecordList(items=items, cursor=cursor, count=count)
        return response

    @remote.method(RecordList, RecordList)
    def count(self, message):
        q = json.loads(message.q)
        return RecordList(count=RecordIndex.search(q, None, count=True))
         
rpc = service.service_mappings([('/service/rpc/record', RecordService),],)
