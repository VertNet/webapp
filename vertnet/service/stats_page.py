import os
import webapp2
import jinja2
from urllib2 import urlopen
from datetime import datetime
import json
import logging

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class MainPage(webapp2.RequestHandler):
    
    threshold_date = datetime(2014, 02, 10)
    
    query_date_limit = '%20where%20created_at%3E=date%20%27{0}%27'.format(format(threshold_date, '%Y-%m-%d'))
    
    query_date_limit = format(threshold_date, '%Y-%m-%d')
    
    def getMaxDate(self):
        url = 'https://vertnet.cartodb.com/api/v2/sql?q=select%20max%28created_at%29%20from%20query_log'
        logging.info('QUERY URL: %s' % url)
        d = json.loads(urlopen(url).read())['rows'][0]['max']
        
        formatin = '%Y-%m-%dT%H:%M:%SZ'
        formatout = '%b %d, %Y'
        
        d2 = datetime.strptime(d,formatin).strftime(formatout)
        return d2

    def get(self):
        self.mindate = format(self.threshold_date, '%b %d, %Y')
        self.maxdate = self.getMaxDate()
        self.response.headers['Content-Type'] = 'text/html'
        self.downloadsdata, self.recordsdata = self.getDownloadsData()
        self.metadata = self.getMetadata()
        self.anonDownloads = self.getAnonDownloads()
        self.explicitInstitutionsAll, self.explicitInstitutionsGood = self.getExplicitStuff('institutioncode')
        self.explicitClassAll, self.explicitClassGood = self.getExplicitStuff('class')
        #self.explicitCountryAll, self.explicitCountryGood = self.getExplicitStuff('country')
        
        template_values = {
            'mindate': self.mindate,
            'maxdate': self.maxdate,
            'queries': self.metadata['query']['searches'],
            'qrecords': self.metadata['query']['records'],
            'downloads': self.metadata['download']['searches'],
            'drecords': self.metadata['download']['records'],
            'explicitInstitutionsGood': self.explicitInstitutionsGood,
            'explicitClassGood': self.explicitClassGood,
            'downloadsdata': self.downloadsdata
        }
        
        #template = JINJA_ENVIRONMENT.get_template('PortalUsageStats.html')
        self.response.write(template.render(template_values))
        
    def getMetadata(self):
        url = 'https://vertnet.cartodb.com/api/v2/sql?q=select%20type,%20count%28*%29%20as%20searches,%20sum%28count%29%20as%20records%20from%20query_log%20where%20created_at%3E=date%20%27{0}%27%20group%20by%20type'.format(self.query_date_limit)
        logging.info('QUERY URL: %s' % url)
        d = json.loads(urlopen(url).read())['rows']
        metadata = {}
        for i in d:
            t = i['type']
            searches = i['searches']
            records = i['records']
            metadata[t] = {'searches':searches, 'records':records}
        return metadata
    
    def getAnonDownloads(self):
        url='https://vertnet.cartodb.com/api/v2/sql?q=select%20count%28*%29%20from%20query_log%20where%20type=%27download%27%20and%20downloader=%27%27%20and%20created_at%3E=date%20%27{0}%27'.format(self.query_date_limit)
        d = json.loads(urlopen(url).read())['rows'][0]['count']
        return d
    
    def getDownloadsData(self):
        # Monthly
        url = 'https://vertnet.cartodb.com/api/v2/sql?q=select%20concat%28year,%27-%27,month%29%20as%20date,%20queries,%20records%20from%20%28%20select%20extract%28month%20from%20date%28created_at%29%29%20as%20month,%20extract%28year%20from%20date%28created_at%29%29%20as%20year,%20count%28*%29%20as%20queries,%20sum%28count%29%20as%20records%20from%20query_log%20where%20type=%27download%27%20and%20created_at%3E=date%20%27{0}%27%20group%20by%20extract%28month%20from%20date%28created_at%29%29,%20extract%28year%20from%20date%28created_at%29%29%20order%20by%20extract%28year%20from%20date%28created_at%29%29,%20extract%28month%20from%20date%28created_at%29%29%29%20as%20foo'.format(self.query_date_limit)
        # Daily
        #url = 'https://vertnet.cartodb.com/api/v2/sql?q=select%20date%28created_at%29,%20count%28*%29%20as%20queries,%20sum%28count%29%20as%20records%20from%20query_log%20where%20type=%27download%27%20and%20created_at%3E=date%20%27{0}%27%20group%20by%20date%28created_at%29%20order%20by%20date%28created_at%29'.format(self.query_date_limit)
        logging.info('QUERY URL: %s' % url)
        d = json.loads(urlopen(url).read())['rows']
        downloadsdata = []
        recordsdata = []
        for i in d:
            date = str(i['date'])
            queries = i['queries']
            records = i['records']
            downloadsdata.append([date, queries])
            recordsdata.append([date, records])
        return downloadsdata, recordsdata

    def getExplicitStuff(self, tag):
        url = 'https://vertnet.cartodb.com/api/v2/sql?q=select+query,%20sum%28count%29+from+query_log+where+query+like+%27%25{0}%3A%25%27%20and%20created_at%3E=date%20%27{1}%27%20group%20by%20query'.format(tag, self.query_date_limit)
        logging.info('QUERY URL: %s' % url)
        d = json.loads(urlopen(url).read())['rows']
        stuffQ = {}
        stuffR = {}
        stuffSall = []
        stuffSgood = []
        for i in d:
            records = i['sum']
            l = i['query'].split()
            indexes = [i for i,term in enumerate(l) if term.startswith('{0}:'.format(tag))]
            for j in indexes:
                if j>0 and l[j-1] == "(NOT":
                    continue
                stuff0 = str(l[j].split(':')[1]).upper()
                if stuff0 not in stuffQ.keys():
                    stuffQ[stuff0] = 1
                    stuffR[stuff0] = records
                else:
                    stuffQ[stuff0] += 1
                    stuffR[stuff0] += records
        stuffLQ = sorted(stuffQ, key=stuffQ.__getitem__, reverse=True)
        stuffLR = sorted(stuffR, key=stuffR.__getitem__, reverse=True)
        
        for i in stuffLQ:
            stuffSall.append([i, stuffQ[i], stuffR[i]])
            if stuffR[i] > 0:
                stuffSgood.append([i, stuffQ[i]])
        
        return stuffSall, stuffSgood

handler = webapp2.WSGIApplication([
    ('/',MainPage),
    ],debug=True)
