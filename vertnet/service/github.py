"""This module provides GitHub interop services."""

from google.appengine.api import urlfetch
import json
import logging
import os
import webapp2

from google.appengine.ext import ndb
from google.appengine.ext.webapp.util import run_wsgi_app

IS_DEV = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')

routes = [
    webapp2.Route(r'/api/github/issue/create', 
        handler='vertnet.service.github.GitHubHandler:issue_create', name='issue_create'),
]

PUBLISHER_ORGS = {
    'museum-of-vertebrate-zoology-uc-berkeley': 'museum-of-vertebrate-zoology'    
}

def markdown(text):
    """Return markdown from supplied text."""
    data = json.dumps(dict(text=text,mode='markdown'))
    result = urlfetch.fetch(
            url='https://api.github.com/markdown',
            payload=data,
            method=urlfetch.POST)
    return result.content
    
def repos(action, user, access_token, params):
    """Execute repo reqeust based on action."""
    if action == 'create':
        data = json.dumps(params)
        result = urlfetch.fetch(
            url='https://api.github.com/user/repos',
            payload=data,
            method=urlfetch.POST,
            headers={'Authorization': 'token %s' % access_token})
        if result.status_code == 201:
            logging.info('Repo created %s' % result.content)
            return result.content
        else:
            logging.info(result.status_code)
            return None

def issues(action, owner, repo, access_token, params):
    if action == 'create':
        owner = PUBLISHER_ORGS[owner]
        data = json.dumps(params)
        url = 'https://api.github.com/repos/%s/%s/issues' % (owner, repo)
        logging.info('DATA:%s URL:%s TOKEN:%s' % (data, url, access_token))
        result = urlfetch.fetch(
            url=url,
            payload=data,
            method=urlfetch.POST,
            headers={'Authorization': 'token %s' % access_token})
        if result.status_code == 201:
            logging.info('Repo created %s' % result.content)
            return result.content
        else:
            logging.info(result.status_code)
            # logging.info(result.content)
            return None

class GitHubHandler(webapp2.RequestHandler):
    def issue_create(self):
        user = self.request.user if self.request.user else None
        owner, repo, title, body, record, link, data = map(json.loads(self.request.body).get, 
            ['owner', 'repo', 'title', 'body', 'record', 'link', 'data'])

        data = json.loads(data)
        body += '\n\n.....................................................\n\nYou can [view the original detail page](%s) on VertNet. ' % link 
        body += 'Here are the original record contents:\n%s\n' % record

        if user:
            auth_id = user.auth_ids[0]
            profile = ndb.Key('UserProfile', auth_id).get()
            access_token = json.loads(profile.credentials.to_json())['access_token']
            response = issues('create', owner, repo, access_token, 
                dict(title=title, body=body))
            self.response.out.headers['Content-Type'] = 'application/json'
            self.response.headers['charset'] = 'utf-8'
            self.response.out.write(response)
        else:
            self.response.out.headers['Content-Type'] = 'application/json'
            self.response.headers['charset'] = 'utf-8'
            self.response.out.write(None)

handler = webapp2.WSGIApplication(routes, debug=IS_DEV)
         
def main():
    run_wsgi_app(handler)