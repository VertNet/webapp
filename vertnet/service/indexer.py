import webapp2
import json
import os
import logging

from google.appengine.api import search, taskqueue


class IndexerHandler(webapp2.RequestHandler):
    def post(self):  
        from vertnet.service import search as vnsearch
        data = json.loads(self.request.get('data'))
        issue = self.request.get('issue')
        vnsearch.index_record(data, issue=issue)     
            
class IndexDeleter(webapp2.RequestHandler):
    def post(self):  
        name, ns, id = map(self.request.get, ['name', 'ns', 'id'])
        logging.info('DELETE RESOURCE INDEX %s/%s/%s' % (name, ns, id))
        index = search.Index(name, namespace=ns)
        logging.info("INDEX %s" % index)
        docs = index.get_range(start_id=id, ids_only=True, limit=100).results
        logging.info("INDEX DOCS %s" % docs)
        if len(docs) < 1:
            logging.info('NO DOCS FOR INDEX %s/%s/%s' % (name, ns, id))
            return
        blast, next_id = docs[:-1], docs[-1]
        index.delete(docs)
        params = dict(name=name, ns=ns, id=next_id)
        if len(docs) >= 100:
            taskqueue.add(url='/indexer-delete', params=params, queue_name="deleteindex")

api = webapp2.WSGIApplication(
    [('/indexer', IndexerHandler),
     ('/indexer-delete', IndexDeleter)],
    debug=False)
