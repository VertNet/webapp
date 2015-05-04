import os
import json
import logging
import urllib
import urllib2

__author__ = '@jotegui'


# Get API key from file
def apikey(serv):
    """Return credentials file as a JSON object."""
    path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '{0}key.txt'.format(serv))
    key = open(path, "r").read().rstrip()
    logging.info("KEY %s" % key)
    return key
cdb_key=apikey('cdb')
gh_key=apikey('gh')

ghb_url = 'https://api.github.com'
cdb_url = "https://vertnet.cartodb.com/api/v2/sql"
testing = False
headers = {
    'User-Agent': 'VertNet',  # Authenticate as VertNet
    'Accept': 'application/vnd.github.v3+json',  # Require version 3 of the API (for stability)
    'Authorization': 'token {0}'.format(gh_key)  # Provide the API key
}

def get_all_repos():
    """Extract a list of all github_orgnames and github_reponames from CartoDB."""
    query = "select github_orgname, github_reponame from resource_staging where ipt is true and networks like '%VertNet%';"
    vals = {
        'api_key': cdb_key,
        'q': query
    }
    data = urllib.urlencode(vals)
    req = urllib2.Request(cdb_url, data)
    
    try:
        res = urllib2.urlopen(req)
    except:
        logging.error("Something went wrong querying CartoDB")
        return None

    all_repos = json.loads(res.read())['rows']
    logging.info("Got {0} repos currently in CartoDB".format(len(all_repos)))
    return all_repos



def list_org(org):
    """Get a list of the repositories associated with an organization in GitHub."""
    req_url = '/'.join([ghb_url, 'orgs', org, 'repos'])

    req = urllib2.Request(req_url)
    for key in headers:
        req.add_header(key, headers[key])

    try:
        res = urllib2.urlopen(req)
    except:
        logging.error("Something went wrong trying to list the repos of {0}".format(org))
        logging.error(req.get_full_url())
        return None

    content = json.loads(res.read())
    logging.info("Got repos for {0}".format(org))
    return [x['name'] for x in content]
    


def check_failed_repos():
    """Check repository name consistency between CartoDB and GitHub."""
    failed_repos = []
    all_repos = get_all_repos()
    
    for repo in all_repos:
        orgname = repo['github_orgname']
        reponame = repo['github_reponame']
        
        if orgname is None or reponame is None:
            failed_repos.append(repo)
            continue
        
        repo_list = list_org(orgname)

        if repo_list is not None:
            if reponame not in repo_list:
                failed_repos.append(repo)
        else:
            failed_repos.append(repo)
    
    return failed_repos


def main(environ, start_response):
    """Main process."""
    
    # Starting response
    status = 200
    headers = {}
    logging.info("Starting response")
    start_response(status, headers)
    logging.info("Response started")


    logging.info("Checking consistency of repository names between CartoDB and GitHub.")
    failed_repos = check_failed_repos()
    
    res = {
        'result': None,
        'failed_repos': []
    }

    if len(failed_repos) > 0:
        res['failed_repos'] = failed_repos
        res['result'] = "error"
        logging.error("there were issues in the repository name matching.")
    
    else:
        res['result'] = "success"
        logging.info("the consistency check could not find any issue.")
    
    return json.dumps(res)

if __name__ == "__main__":
    
    main()
