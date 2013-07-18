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
        recs, cursor, count = vnsearch.query('id:%s' % message.id, 1)
        return RecordPayload(id=message.id, json=json.dumps(recs[0]))

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
            curs = search.Cursor(web_safe_string=message.cursor)
        else:
            curs = search.Cursor()
        q = json.loads(message.q)
        logging.info('Q %s' % q)
        keywords = ' '.join([x for x in q['keywords'] if x])
        sort = message.sort
        if 'distance' in keywords:
            sort = None
        limit = message.limit

        logging.info('keywords=%s, limit=%s, sort=%s, curs=%s' % (keywords, limit, sort, curs))

        recs, cursor, count = vnsearch.query(keywords, limit, sort=sort, curs=curs)
        if cursor:
            cursor = cursor.web_safe_string

        items = [RecordPayload(id=x['keyname'], json=json.dumps(x)) \
            for x in recs if x]

        logging.info('ITEMS CHECK')
        response = RecordList(items=items, cursor=cursor, count=count)
        logging.info('RESPONSE CHECK %s ' % response)

        return response

    @remote.method(RecordList, RecordList)
    def count(self, message):
        q = json.loads(message.q)
        return RecordList(count=RecordIndex.search(q, None, count=True))
         
rpc = service.service_mappings([('/service/rpc/record', RecordService),],)
