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
# along with Foobar.  If not, see: http://www.gnu.org/licenses

# This module contains request handlers for admin APIs.
import logging
import os
import webapp2

from vertnet.service.model import IndexJob

from google.appengine.api import files, namespace_manager
from google.appengine.ext.webapp.util import run_wsgi_app
from mapreduce import control as mrc
from mapreduce import input_readers

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Development')

# App routes:
routes = [
    webapp2.Route(r'/mr/finalize', handler='app.AppHandler:mapreduce_finalize', 
        name='mapreduce_finalize'),
    webapp2.Route(r'/mr/indexall', handler='app.AppHandler:index', name='index'),
]

class AppHandler(webapp2.RequestHandler):
    def mapreduce_finalize(self):
        """Finalizes indexing MR job by finalizing files on GCS."""
        mrid = self.request.headers.get('Mapreduce-Id')
        namespace = namespace_manager.get_namespace()
        job = IndexJob.get_by_id(mrid, namespace=namespace)
        if not job:
            return
        logging.info('Finalizing index job for resource %s' % job.resource)
        files.finalize(job.write_path)
        job.done = True
        job.put()
        logging.info('Index job finalized for resource %s' % job.resource)

    def index(self):
        """Fires off an indexing MR job over files in GCS at supplied path."""
        input_class = (input_readers.__name__ + "." + input_readers.FileInputReader.__name__)
        path = self.request.get('path')
        shard_count = self.request.get_range('shard_count', default=8)
        processing_rate = self.request.get_range('processing_rate', default=100)
        files_pattern = '/gs/%s' % path

        # Create file on GCS to log any failed index puts:
        namespace = namespace_manager.get_namespace()
        filename = '/gs/vn-staging/errors/failures-%s-all.csv' % namespace
        write_path = files.gs.create(filename, mime_type='text/tab-separated-values', 
            acl='public-read')

        mrid = mrc.start_map(
            path,
            "vertnet.service.search.build_search_index",
            input_class,
            {
                "input_reader": dict(
                    files=[files_pattern], 
                    format='lines'),
                "resource": path,
                "write_path": write_path,
                "processing_rate": processing_rate,
                "shard_count": shard_count
            },
            mapreduce_parameters={'done_callback': '/mr/finalize'},
            shard_count=shard_count)

        IndexJob(id=mrid, namespace=namespace, resource=path, write_path=write_path, 
            failed_logs=['NONE']).put()

handler = webapp2.WSGIApplication(routes, debug=IS_DEV)
         
def main():
    run_wsgi_app(handler)
