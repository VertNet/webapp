"""This module contains transformation functions for the bulkloader."""

import htmlentitydefs
import json
import re

from google.appengine.ext import db
from google.appengine.ext.bulkload import transform

# Words not included in full text search
STOP_WORDS = [
    'a', 'able', 'about', 'across', 'after', 'all', 'almost', 'also', 'am', 
    'among', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 
    'but', 'by', 'can', 'cannot', 'could', 'dear', 'did', 'do', 'does', 'either', 
    'else', 'ever', 'every', 'for', 'from', 'get', 'got', 'had', 'has', 'have', 
    'he', 'her', 'hers', 'him', 'his', 'how', 'however', 'i', 'if', 'in', 'into', 
    'is', 'it', 'its', 'just', 'least', 'let', 'like', 'likely', 'may', 'me', 
    'might', 'most', 'must', 'my', 'neither', 'no', 'nor', 'not', 'of', 'off', 
    'often', 'on', 'only', 'or', 'other', 'our', 'own', 'rather', 'said', 'say', 
    'says', 'she', 'should', 'since', 'so', 'some', 'than', 'that', 'the', 'their', 
    'them', 'then', 'there', 'these', 'they', 'this', 'tis', 'to', 'too', 'twas', 
    'us', 'wants', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 
    'who', 'whom', 'why', 'will', 'with', 'would', 'yet', 'you', 'your']

# Darwin Core names not indexed in full text
DO_NOT_FULL_TEXT = [
    'acceptednameusageid', 'accessrights', 'collectionid', 
    'coordinateprecision', 'coordinateuncertaintyinmeters', 'datasetid', 
    'dateidentified', 'day', 'decimallatitude', 'decimallongitude', 'disposition', 
    'enddayofyear', 'eventdate', 'eventid', 'eventtime', 'fieldnotes', 
    'footprintspatialfit', 'footprintsrs', 'footprintwkt', 'geologicalcontextid', 
    'georeferenceremarks', 'georeferenceverificationstatus', 'highergeographyid', 
    'identificationid', 'individualcount', 'individualid', 'institutionid', 
    'language', 'locationid', 'maximumdepthinmeters', 
    'maximumdistanceabovesurfaceinmeters', 'maximumelevationinmeters', 
    'minimumdepthinmeters', 'minimumdistanceabovesurfaceinmeters', 
    'minimumelevationinmeters', 'modified', 'month', 'nameaccordingtoid', 
    'namepublishedinid', 'nomenclaturalcode', 'occurrencedetails', 'occurrenceid', 
    'originalnameusageid', 'parentnameusageid', 'pointradiusspatialfit', 'rights', 
    'rightsholder', 'scientificnameid', 'startdayofyear', 'taxonconceptid', 'taxonid', 
    'type', 'verbatimcoordinates', 'verbatimeventdate', 'verbatimlatitude', 
    'verbatimlongitude', 'description']

# Darwin Core names not indexed
DO_NOT_INDEX = [
    'acceptednameusageid', 'accessrights', 'associatedmedia', 
    'associatedoccurrences', 'associatedreferences', 
    'associatedsequences', 'associatedtaxa', 'bibliographiccitation', 
    'collectionid', 'datageneralizations', 'datasetid', 'dateidentified', 
    'disposition', 'eventdate', 'eventid', 'eventremarks', 'eventtime', 
    'fieldnotes', 'footprintspatialfit', 'footprintsrs', 'footprintwkt', 
    'geologicalcontextid', 'georeferenceremarks', 'georeferencesources', 
    'habitat', 'higherclassification', 'highergeography', 'highergeographyid', 
    'identificationid', 'identificationreferences', 'identificationremarks', 
    'individualcount', 'individualid', 'informationwithheld', 'institutionid', 
    'locationid', 'locationremarks', 'modified', 'nameaccordingtoid', 
    'namepublishedin', 'namepublishedinid', 'occurrencedetails', #'occurrenceid', 
    'occurrenceremarks', 'originalnameusageid', 'othercatalognumbers', 
    'parentnameusageid', 'pointradiusspatialfit', 'preparations', 
    'previousidentifications', 'rights', 'rightsholder', 'scientificnameid', 
    'taxonconceptid', 'taxonid', 'taxonremarks', 'verbatimcoordinates', 
    'verbatimlatitude', 'verbatimlongitude']

class Record(db.Model):
    """Datastore model for records."""
    json = db.TextProperty()
    is_indexed = db.BooleanProperty()

def slugify(s, length=None, separator="-"):
    """Return a slugged version of supplied string."""
    s = re.sub('[^a-zA-Z\d\s:]', ' ', s)
    if length:
        words = s.split()[:length]
    else:
        words = s.split()
    s = ' '.join(words)
    ret = ''
    for c in s.lower():
        try:
            ret += htmlentitydefs.codepoint2name[ord(c)]
        except:
            ret += c
    ret = re.sub('([a-zA-Z])(uml|acute|grave|circ|tilde|cedil)', r'\1', ret)
    ret = ret.strip()
    ret = re.sub(' ', '_', ret)
    ret = re.sub('\W', '', ret)
    ret = re.sub('[ _]+', separator, ret)
    return ret.strip()

def create_org_key():
    def wrapper(value, bulkload_state):
        d = bulkload_state.current_dictionary
        organization_slug = slugify(d['orgname'])
        d['keyname'] = organization_slug
        return transform.create_deep_key(
            ('Organization', 'keyname'))(value, bulkload_state)
    return wrapper

def create_resource_key():
    def wrapper(value, bulkload_state):
        d = bulkload_state.current_dictionary
        resource_slug = slugify(d['title'])
        d['keyname'] = resource_slug
        return transform.create_deep_key(
            ('Resource', 'keyname'))(value, bulkload_state)
    return wrapper

def create_record_key():
    def wrapper(value, bulkload_state):
        """Returns a Record key built from value.
        
        Arguments:
            value - urlsafe key string created by model.Key.urlsafe()            
        """
        d = bulkload_state.current_dictionary
        organization_slug = slugify(d['orgname'])
        resource_slug = slugify(d['title'])
        d['keyname'] = '%s/%s/%s' % (organization_slug, resource_slug, d['harvestid'])
        return transform.create_deep_key(
            ('Record', 'keyname'))(value, bulkload_state)
    return wrapper

def create_record_index_key():
    def wrapper(value, bulkload_state):
        """Returns a Record key built from value.
        
        Arguments:
            value - urlsafe key string created by model.Key.urlsafe()            
        """
        d = bulkload_state.current_dictionary
        organization_slug = slugify(d['orgname'])
        resource_slug = slugify(d['title'])
        d['keyname'] = '%s/%s/%s' % (organization_slug, resource_slug, d['harvestid'])
        return transform.create_deep_key(
            ('Record', 'keyname'),
            ('RecordIndex', 'keyname'))(value, bulkload_state)
    return wrapper    
    
def get_rec_dict(rec):
    val = {}
    for name, value in rec.iteritems():
        if value:
            val[name] = value
    return val

def get_corpus_list():
    def wrapper(value, bulkload_state):
        """Returns list of unique words in the entire record.
        
        Arguments:
            value - the JSON encoded record
        """
        recjson = get_rec_dict(bulkload_state.current_dictionary)
        corpus = set(
            [x.strip().lower()[:500] for key,x in recjson.iteritems() \
                 if key.strip().lower() not in DO_NOT_FULL_TEXT and \
                 isinstance(x, unicode) and x.strip().lower() not in STOP_WORDS]) 
        corpus.update(
            reduce(lambda x,y: x+y, 
                   map(lambda x: [s.strip().lower() for s in x.split() if s], 
                       [val[:500] for key,val in recjson.iteritems() \
                            if key.strip().lower() not in DO_NOT_FULL_TEXT and \
                            isinstance(val, unicode) and val.strip().lower() not in STOP_WORDS]), [])) # adds tokenized values      
        if len(corpus) == 0:
            return None
        return list(corpus)
    return wrapper

def get_rec_json():
    """Returns a JSON object where all keys have values."""
    def wrapper(rec, bulkload_state):   
        rec = bulkload_state.current_dictionary
        return db.Text(json.dumps(get_rec_dict(rec)))
    return wrapper

def lower_case():
    def wrapper(value, bulkload_state):
        return value.lower().strip()
    return wrapper

def get_is_indexed():
    def wrapper(rec, bulkload_state):
        return False
    return wrapper