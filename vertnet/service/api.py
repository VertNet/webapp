# This file is part of VertNet: https://github.com/VertNet/webapp
#
# VertNet is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# VertNet is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with VertNet.  If not, see: http://www.gnu.org/licenses

from google.appengine.api import search, taskqueue
from vertnet.service import search as vnsearch

import json
import logging
import urllib
import webapp2

class SearchApi(webapp2.RequestHandler):
    def __init__(self, request, response):
        self.cityLatLong = request.headers.get('X-AppEngine-CityLatLong')
        self.initialize(request, response)

    def post(self):
        self.get()

    def get(self):
        logging.info('HI')
        
        request = json.loads(self.request.get('q'))
        q, c, limit = map(request.get, ['q', 'c', 'l'])
        if not limit:
            limit = 20
        if limit > 20:
            limit = 20
        if limit < 0:
            limit = 1

        curs = None
        if c:
            curs = search.Cursor(web_safe_string=c)
        else:
            curs = search.Cursor()

        logging.info('q=%s, l=%s, c=%s' % (q, limit, curs))

        result = vnsearch.query(q, limit, curs=curs)
        response = None

        if len(result) == 3:
            recs, cursor, count = result
            if not c:
                type = 'query'
                query_count = count
            else:
                type = 'query-view'
                query_count = limit
            if cursor:
                cursor = cursor.web_safe_string
            response = json.dumps(dict(recs=recs, cursor=cursor, count=count))
            params = dict(query=q, type=type, count=query_count, latlon=self.cityLatLong)
            taskqueue.add(url='/apitracker', params=params, queue_name="apitracker")
        else:
            error = result[0].__class__.__name__
            params = dict(error=error, query=q, type='query', latlon=self.cityLatLong)
            taskqueue.add(url='/apitracker', params=params, queue_name="apitracker")
            self.response.clear()
            message='Please try again. Error: %s' % error
            self.response.set_status(500, message=message)
            response = message
        
        self.response.out.headers['Content-Type'] = 'application/json'
        self.response.headers['charset'] = 'utf-8'
        self.response.out.write(response)

class DownloadApi(webapp2.RequestHandler):
    def post(self):
        self.get()

    def get(self):
        request = json.loads(self.request.get('q'))
        q, c, e, n = map(request.get, ['q', 'c', 'e', 'n'])
        keywords = q.split()
        params = urllib.urlencode(dict(keywords=json.dumps(keywords), count=c, email=e, name=n))
        url = '/service/download?%s' % params
        self.redirect(url)

class FeedbackApi(webapp2.RequestHandler):
    def post(self):
        self.get()

    def get(self):
        pass

handlers = webapp2.WSGIApplication([
    webapp2.Route(r'/api/search', handler=SearchApi),
    webapp2.Route(r'/api/download', handler=DownloadApi),],
    debug=True)
        