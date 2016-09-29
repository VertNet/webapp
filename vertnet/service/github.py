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
__version__ = "github.py 2016-09-29T03:33+02:00"

from google.appengine.api import mail
from google.appengine.api import urlfetch
import json
import logging
import os
import urllib
import webapp2

from google.appengine.ext import ndb
from google.appengine.ext.webapp.util import run_wsgi_app

GITHUBBERS = None

# Load GitHub deets from CDB:
def load_githubbers():
    global GITHUBBERS
    if GITHUBBERS is not None:
        return GITHUBBERS
    cdb_url = "http://vertnet.carto.com/api/v2/sql?%s"
    sql = "SELECT icode, gbifdatasetid, github_reponame as repo, github_orgname as owner FROM resource_staging WHERE ipt=True and networks LIKE '%VertNet%' order by icode, gbifdatasetid"
    rpc = urlfetch.create_rpc()
    carto_url = cdb_url % (urllib.urlencode(dict(q=sql)))
    urlfetch.make_fetch_call(rpc, carto_url)
    logging.info('CARTO URL: %s\nversion: %s' % (carto_url,__version__))
    try:
        result = rpc.get_result()
        GITHUBBERS = json.loads(result.content)
        # logging.info('GITHUBBERS: %s\nversion: %s' % (GITHUBBERS,__version__))
        return GITHUBBERS
    except urlfetch.DownloadError:
        logging.error("Error github module - %s\nversion: %s" % (sql,__version__))
        GITHUBBERS = {}

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Development')

routes = [
    webapp2.Route(r'/api/github/issue/create', 
        handler='vertnet.service.github.GitHubHandler:issue_create', 
        name='issue_create', methods=['GET', 'POST']),
]

PUBLISHER_ORGS = {
    'museum-of-vertebrate-zoology-uc-berkeley': 'museum-of-vertebrate-zoology'    
}

def get_owner_repo(gbifdatasetid):
    """Return 2-tuple owner,repo for supplied resource gbifdatasetid."""
    GITHUBBERS = load_githubbers()
    for row in GITHUBBERS['rows']:
        if row['gbifdatasetid'] == gbifdatasetid:
            return (row['owner'], row['repo'])

def markdown(text):
    """Return markdown from supplied text."""
    data = json.dumps(dict(text=text,mode='markdown'))
    result = urlfetch.fetch(
            url='https://api.github.com/markdown',
            payload=data,
            method=urlfetch.POST)
    return result.content
    
def repos(action, user, access_token, params):
    """Execute repo request based on action."""
    if action == 'create':
        data = json.dumps(params)
        result = urlfetch.fetch(
            url='https://api.github.com/user/repos',
            payload=data,
            method=urlfetch.POST,
            headers={'Authorization': 'token %s' % access_token})
        if result.status_code == 201:
            logging.info('Repo created %s\nversion: %s' % (result.content,__version__))
            return result.content
        else:
            logging.info(result.status_code)
            return None

def issues(action, owner, repo, access_token, params):
    if action == 'create':
        data = json.dumps(params)
        url = 'https://api.github.com/repos/%s/%s/issues' % (owner, repo)
        s = 'ISSUES data: %s url: %s ' % (data, url)
        s += 'access_token: %s\nversion: %s' % (access_token,__version__)
        logging.info(s)
        result = urlfetch.fetch(
            url=url,
            payload=data,
            method=urlfetch.POST,
            headers={'Authorization': 'token %s' % access_token})
        if result.status_code == 201:
            logging.info('Issue created %s\nversion: %s' % (result.content,__version__))
            return result.content
        else:
            logging.info(result.status_code)
            # logging.info(result.content)
            return None


class GitHubHandler(webapp2.RequestHandler):
    def create_issue(self, user, owner, repo, title, body, record, link, data):
        if type(data) == str or type(data) == unicode:
            data = json.loads(data)
        contact = data.get('contact')
        email = data.get('email')

        gbifdatasetid  = data.get('gbifdatasetid')
        # logging.info('CREATE_ISSUE data: %s\nversion: %s' % (data,__version__))
        owner, repo = get_owner_repo(gbifdatasetid)

        html_body = body

        body += '\n\n.....................................................\n\nYou can [view the original detail page](%s) on VertNet. ' % link 
        body += 'Here are the original record contents:\n%s\n' % record

        html_body += '<p>.....................................................<p>You can <a href="%s">view the original detail page</a> on VertNet. ' % link 
        html_body += 'Here are the original record contents:<p>%s</p>' % record

        if user:
            auth_id = user.auth_ids[0]
            profile = ndb.Key('UserProfile', auth_id).get()
            access_token = json.loads(profile.credentials.to_json())['access_token']
            response = issues('create', owner, repo, access_token, 
                dict(title=title, body=body))
            html_url = json.loads(response)['html_url']
         
            # FOR TESTING
            email = "gtuco.btuco@gmail.com"

            # Email contact
            mail.send_mail("VertNet <vertnetinfo@vertnet.org>", 
                "%s <%s>" % (contact, email), title, body,
                html="You are receiving this email from VertNet because someone submitted an issue for a record for which you are the primary contact. Please view this issue on GitHub (and do not reply to this email): %s<p>%s" % (html_url, html_body))

            self.response.out.headers['Content-Type'] = 'application/json'
            self.response.headers['charset'] = 'utf-8'
            self.response.out.write(response)
        else:
            self.response.out.headers['Content-Type'] = 'application/json'
            self.response.headers['charset'] = 'utf-8'
            self.response.out.write(None)

    def issue_create(self):
        user = self.request.user if self.request.user else None
        request = self.request.get('q') if self.request.get('q') \
            else self.request.body
        logging.info('ISSUE_CREATE REQUEST: %s\nversion: %s' % (request,__version__))
        owner, repo, title, body, record, link, data = map(json.loads(request).get, 
            ['owner', 'repo', 'title', 'body', 'record', 'link', 'data'])
        self.create_issue(user, owner, repo, title, body, record, link, data)

handler = webapp2.WSGIApplication(routes, debug=IS_DEV)
         
def main():
    run_wsgi_app(handler)