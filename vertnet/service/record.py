"""API handlers for VertNet records."""

import webapp2
from vertnet.service.model import RecordIndex, Record, RecordList, RecordPayload
from protorpc import remote
from protorpc.wsgi import service
from google.appengine.datastore.datastore_query import Cursor
import json
from google.appengine.api import taskqueue
import logging
from protorpc.message_types import VoidMessage
from google.appengine.api import search
from google.appengine.api.search import SortOptions, SortExpression


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
        record = Record.get_by_id(message.id)
        return RecordPayload(id=message.id, json=record.record)

    @remote.method(RecordList, RecordList)
    def _search(self, message):
        """Return a RecordList."""
        curs = None
        if message.cursor:
            curs = Cursor(urlsafe=message.cursor)
        q = json.loads(message.q)
        taskqueue.add(url='/apitracker', params=dict(query=message.q), queue_name="apitracker")
        response = record_list(message.limit, curs, q, message=True)
        return response

    @remote.method(RecordList, RecordList)
    def search(self, message):
        curs = None
        if message.cursor:
            curs = Cursor(urlsafe=message.cursor)
        q = json.loads(message.q)
        #terms = q['terms'] # dict
        keywords = ' '.join(q['keywords'])
        limit = message.limit
        sort = SortOptions(expressions=[
            SortExpression(expression='genus', default_value='z',
                direction=SortExpression.ASCENDING), 
            SortExpression(expression='specificepithet', default_value='z',
                direction=SortExpression.ASCENDING),
            # SortExpression(expression='country', default_value='z',
            #     direction=SortExpression.ASCENDING),
            SortExpression(expression='eventdate',
                direction=SortExpression.ASCENDING)],
            limit=limit)

        options = search.QueryOptions(
            limit=limit,
            cursor=curs,
            sort_options=sort,
            returned_fields=['record'])        

        query = search.Query(query_string=keywords, options=options)
        result = {}
        try:
            results = search.Index(name='dwc_search').search(query)
            recs = []
            for doc in results:
                for field in doc.fields:
                    if field.name == 'record':
                        recs.append(json.loads(field.value))  
            result['recs'] = recs
            if results.cursor:
                result['cursor'] = results.cursor.web_safe_string
            else:
                result['cursor'] = None
            result['count'] = results.number_found
        except search.Error:
            logging.exception('Search failed')            

        items = [RecordPayload(id=x['keyname'], json=json.dumps(x)) \
            for x in result['recs'] if x]
        more = result['count'] > 0
        response = RecordList(items=items, cursor=result['cursor'], 
            more=more, count=result['count'])
        return response

    @remote.method(RecordList, RecordList)
    def count(self, message):
        q = json.loads(message.q)
        return RecordList(count=RecordIndex.search(q, None, count=True))
         
rpc = service.service_mappings([('/service/rpc/record', RecordService),],)
