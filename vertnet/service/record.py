"""API handlers for VertNet records."""

from vertnet.service.model import RecordIndex, Record, RecordList, RecordPayload
from vertnet.service import search as vnsearch
from protorpc import remote
from protorpc.wsgi import service
from google.appengine.datastore.datastore_query import Cursor
import json
from google.appengine.api import taskqueue
import logging
from google.appengine.api import search

RECORD_VERSION='record.py 2015-08-25T13:30:49+02:00'

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
#        logging.info('CITY_LAT_LONG %s' % self.cityLatLong)

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
        logging.info('keywords=%s, limit=%s, sort=%s, curs=%s\nVersion: %s' 
            % (keywords, limit, sort, curs, RECORD_VERSION))
#        logging.info('REQUEST LATLON %s\nVersion: %s' 
#            % (self.cityLatLong, RECORD_VERSION) )
        result = vnsearch.query(keywords, limit, sort=sort, curs=curs)
        if len(result) == 4:
            recs, cursor, count, version = result
            # Build json for search counts
            res_counts = {}
            for i in recs:
                dwca = i['url']
                if dwca not in res_counts:
                    res_counts[dwca] = 1
                else:
                    res_counts[dwca] += 1
#            logging.info("RESOURCE COUNTS: %s\nVersion: %s" 
#                % (res_counts, RECORD_VERSION) )
            
            if not message.cursor:
                type = 'query'
                query_count = count
            else:
                type = 'query-view'
                query_count = limit
            params = dict(query=keywords, type=type, count=query_count, 
                latlon=self.cityLatLong, res_counts=json.dumps(res_counts))
            taskqueue.add(url='/apitracker', params=params, queue_name="apitracker")
        else:
            error = result[0].__class__.__name__
            params = dict(error=error, query=keywords, type='query', 
                latlon=self.cityLatLong)
            taskqueue.add(url='/apitracker', params=params, queue_name="apitracker")
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
