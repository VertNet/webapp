"""Command-line sample application for listing all objects
in a bucket using the Cloud Storage API.

Before running, authenticate with the Google Cloud SDK by running:
    $ gcloud auth login

Usage:
    $ python list_objects.py <your-bucket>
Example:
    $ python listobjects.py vn-dltest

You can also get help on all the command-line flags the program understands
by running:
    $ python list_objects.py --help

"""

#import cloudstorage as gcs
import requests
import argparse
import json
import sys

from apiclient import discovery
from oauth2client.client import GoogleCredentials


# Parser for command-line arguments.
parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument('bucket')


def main(argv):
    # Parse the command-line flags.
    args = parser.parse_args(argv[1:])
    bucket_name=args.bucket
    
    # Get the application default credentials. When running locally, these are
    # available after running `gcloud auth login`. When running on compute
    # engine, these are available from the environment.
    credentials = GoogleCredentials.get_application_default()

    # Construct the service object for interacting with the Cloud Storage API.
    service = discovery.build('storage', 'v1', credentials=credentials)

    # Get a list of buckets in the given project
#     fields_to_return = 'nextPageToken,items(name,location,timeCreated)'
#     req = service.buckets().list(
#             project='556208198221',
#             fields=fields_to_return,  # optional
#             maxResults=42)            # optional
#     resp = req.execute()
#     print json.dumps(resp, indent=2)
    
# Make a request to buckets.get to retrieve information about the given bucket_name
#     req = service.buckets().get(bucket=args.bucket)
#     resp = req.execute()
#     print json.dumps(resp, indent=2)
# 
# Create a request to objects.list to retrieve a list of objects.
    fields_to_return = \
        'nextPageToken,items(name,size,contentType,metadata(my-key))'
    req = service.objects().list(bucket=args.bucket, fields=fields_to_return)
# 
# If you have too many items to list in one request, list_next() will
# automatically handle paging with the pageToken.
#     i=0
#     while req is not None:
#         i=i+1
#         resp = req.execute()
# #        print json.dumps(resp, indent=2)
#         req = service.objects().list_next(req, resp)
#     print '%s files in %s' % (i,args.bucket)
    # Composing objects in GCS
    # See https://cloud.google.com/storage/docs/json_api/v1/objects/compose#examples
#     composite_object_resource = {
#         'contentType': 'text/tab-separated-values',  # required
#         'contentLanguage': 'en',
#         'metadata': {'my-key': 'my-value'},
#     }
#     compose_req_body = {
#         'sourceObjects': [
#                 {'name': 'JRWComposeTestCtenomys-f779b658db77447ea5cd2bcefa2652eb-0.tsv'},
#                 {'name': 'JRWComposeTestCtenomys-f779b658db77447ea5cd2bcefa2652eb-1.tsv'},
#                 {'name': 'JRWComposeTestCtenomys-f779b658db77447ea5cd2bcefa2652eb-2'}],
#         'destination': composite_object_resource
#     }
#     composite_object_name='JRWCtenomysGCSTest.tsv'
#     with gcs.open(composite_object_name, 'w', content_type='text/plain', options={'x-goog-acl': 'public-read'}) as f:
#         f.write('Testing write\n')
#     req = service.objects().compose(
#         destinationBucket=bucket_name,
#         destinationObject=composite_object_name,
#         body=compose_req_body)
#     resp = req.execute()
#     print 'Compose response: %s\n' %json.dumps(resp, indent=2)

    # Code snippet for using requests library
    # See http://docs.python-requests.org/en/latest/index.html
    # and http://isbullsh.it/2012/06/Rest-api-in-python/#the-github-api
#     github_url = "https://api.github.com/user/repos"
#     data = json.dumps({'name':'test', 'description':'some test repo'}) 
#     r = requests.post(github_url, data, auth=('user', '*****'))
#     print r.json

#    print 'Example compose request:\n %s' % compose_request('bucket','filepattern',0,4)
    
def compose_request(bucketname, filepattern, begin, end):
    """Construct a API Compose dictionary from a bucketname and filepattern.
    bucketname - the GCS bucket in which the files will be composed. Ex. 'vn-downloads2'
    filepattern - the naming pattern for the composed files. Ex. 'MyResult-UUID'
    begin - the index of the first file in the composition used to grab a range of files.
    end - begin plus the number of files to put in the composition (i.e., end index + 1)
    """
    
    objectlist=[]
    for i in range(begin,end):
        objectdict={}
        filename='%s-%s.tsv' % (filepattern,i)
        objectdict['name']=filename
        objectlist.append(objectdict)

    composedict={}
    composedict['sourceObjects']=objectlist
    dest={}
    dest['contentType']='text/tab-separated-values'
    dest['bucket']=bucketname
    composedict['destination']=dest
    composedict['kind']='storage#composeRequest'
    return composedict

if __name__ == '__main__':
    main(sys.argv)