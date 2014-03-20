#!/usr/bin/python
"""
Tests a set of queries against the VertNet search Web API by recording
the number of rows returned in the result.  Accepts a CSV file containing
test queries and the number of rows previously observed for each query.
The results are written to a CSV file.  The input file should be a CSV
file with at least 2 columns:
  'query' -- contains the search queries to run; and
  'observed' -- indicates how many rows were returned for the previous test.

Results are written to an output CSV file with 5 columns:
  'query' -- the search queries that were run;
  'prev_rowcnt' -- corresponds with 'observed' in the input CSV file;
  'time' -- the date and time at which the query was started;
  'expcnt' -- the number of results according to the "count" result property;
  'obscnt' -- the actual number of records returned.

The names of the input and output CSV files should be specified as
command-line arguments.  An example follows.

>./test_api.py -i test_queries.csv -o test_results.csv

"""
import urllib, urllib2
from BaseHTTPServer import BaseHTTPRequestHandler
import json
import csv
import sys
import time
from optparse import OptionParser


# The location of the search API.
#searchurl = 'http://api.vertnet-portal.appspot.com/api/search'
searchurl = 'http://localhost:8080/api/search'

# Cutoff for the maximum response size to test, as estimated by the "observed"
# column of the input CSV file.  Set this to -1 to test all queries regardless
# of the number of rows returned.
maxrows = -1

# If the value of the "count" property is less than get_rowcnts_maxrows, then
# the actual number of records returned by the query will be counted.  Note that
# if this is set to a large value, row counting will require many requests to the
# search API and can take a long time.  Set this to -1 to count the records in all
# queries regardless of expected size.  Set to 0 to disable record counting entirely.
get_rowcnts_maxrows = 10000

# If "limit_rowcnts" == True, then record counting will stop if the total number of
# records counted exceeds get_rowcnts_maxrows * 1.1.  If get_rowcnts_maxrows == -1
# and limimt_rowcnts == True, then record counting is capped at 2,000.
limit_rowcnts = True

# Indicates whether the modified search API implemented in feature/apicnttest is
# being used.  If this is false, the limit and count accuracy variables are ignored.
using_test_API = True

# Define the values of the app engine "limit" and "number_found_accuracy" query
# options.  These are for the modified version of the search API implemented in the
# feature/apicnttest branch.  They allow easy testing of various combinations of
# these query parameters.
ae_limit = 100
ae_cnt_accuracy = 10


# Get the HTTP response code messages.
HTTPresponses = BaseHTTPRequestHandler.responses


def queryVN(querystr, cursor=''):
    """
    Runs a query against the VertNet search Web API.  The results are
    returned as a Python JSON object.  Any exceptions thrown during
    the HTTP conversation are passed on so that they can be used by
    client testing code.

    Arguments:
      querystr -- The Google query string to use.
      cursor (optional) -- A cursor for retrieving additional records.

    Returns:  A Python object that represents the JSON query result.
    """
    datastr = '{"q":"' + querystr + '"'
    if cursor != '':
        datastr += ', "c":"' + cursor + '"'
    if using_test_API:
        datastr += ', "l":"' + str(ae_limit) + '", "a":"' + str(ae_cnt_accuracy) + '"'
    datastr += '}'
    print datastr
    data = {'q': datastr}
    geturl = searchurl + '?' + urllib.urlencode(data)
    #print geturl

    res = urllib2.urlopen(geturl)

    return json.load(res)

def getRowCount(resobj, querystr):
    """
    Gets the total number of rows in a result set.  If the JSON object
    resobj does not contain the full result set, then the search API is
    repeatedly queried until all results have been obtained or the count
    limits are exceeded (see the settings variables above).

    Arguments:
      resobj -- The Python-formatted JSON result object from the initial query.
      querystr -- The query string used for the initial query.

    Returns:  The total number of records retrieved.  If the record count
        limit is exceeded, ">" is appended to the front of the final count.
    """
    obs_rowcnt = len(resobj['recs'])
    cursor = resobj['cursor']

    if get_rowcnts_maxrows != -1:
        cnt_cutoff = get_rowcnts_maxrows * 1.1
    else:
        cnt_cutoff = 2000

    if cursor != None:
        sys.stdout.write('Counting records: ')
        while cursor != None and (not(limit_rowcnts) or obs_rowcnt < cnt_cutoff):
            sys.stdout.write(str(obs_rowcnt) + '...')
            sys.stdout.flush()
            newrobj = queryVN(querystr, cursor)
            obs_rowcnt += len(newrobj['recs'])
            #print newrobj['recs'][0]['scientificname']
            #print len(newrobj['recs'])
            cursor = newrobj['cursor']

        print str(obs_rowcnt) + '...done.'

    # Check if we actually reached the end of the result set.
    if cursor != None:
        obs_rowcnt = '>' + str(obs_rowcnt)

    return obs_rowcnt



# Set up command-line argument parsing.
argp = OptionParser(
        usage='''usage:  %prog -i filename -o filename
\n    Runs a series of test queries agains the VertNet search API.
The test queries are specified in an input CSV file and the results
of running the queries are written to an output CSV file.''')
argp.add_option('-i', '--inputfile', dest='filein', help='name of the input CSV file',
        default='')
argp.add_option('-o', '--outputfile', dest='fileout', help='file name for CSV output',
        default='')

# Get the command-line arguments.
(options, args) = argp.parse_args()

# Make sure the program was called with the required arguments.
if len(args) != 0:
    argp.error('Unrecognized command-line arguments.')
elif options.fileout == '' or options.filein == '':
    argp.error('Missing input or output file name.')

# Open the output file for writing, create a CSV writer for it,
# and write out the column headers.
fout = open(options.fileout, 'wb')
columns = ('query', 'prev_rowcnt', 'time', 'expcnt', 'obscnt')
csvwriter = csv.DictWriter(fout, columns)
csvwriter.writeheader()

# Open the input CSV file.
fin = open(options.filein)
csvf = csv.DictReader(fin)

# A dictionary for passing the query results to the CSV writer.
csvrow = {}

for testcase in csvf:
    try:
        # Get the number of rows that were previously observed.
        rowcnt = int(testcase['observed'])
        csvrow['prev_rowcnt'] = rowcnt
    except:
        # We don't know how many rows were obtained previously.
        rowcnt = 0
        csvrow['prev_rowcnt'] = '?'

    #print rowcnt
    if rowcnt < maxrows or maxrows == -1:
        csvrow['query'] = testcase['query']
        csvrow['time'] = time.strftime('%d%b%y %H:%M:%S')
        csvrow['obscnt'] = ''

        try:
            # Attempt to query the VertNet search API with the test query.
            robj = queryVN(testcase['query'])
            if robj['count'] < get_rowcnts_maxrows or get_rowcnts_maxrows == -1:
                # Count the actual number of records in the result set.
                obscnt = getRowCount(robj, testcase['query'])
                csvrow['obscnt'] = obscnt

            csvrow['expcnt'] = robj['count']
            print 'previous rowcount:', csvrow['prev_rowcnt'], '; new rowcount:', robj['count']
        except urllib2.HTTPError as err:
            csvrow['expcnt'] = 'HTTP error ' + str(err.code) + ': ' + HTTPresponses[err.code][0]
            print 'Uh oh.  Got', csvrow['expcnt'] + '.'

        csvwriter.writerow(csvrow)

