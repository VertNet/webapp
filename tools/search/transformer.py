"""This module contains transformation functions for the bulkloader."""

import json

from google.appengine.ext import db
from google.appengine.ext.bulkload import transform

import htmlentitydefs
import re

class Record(db.Model):
    json = db.TextProperty()
    is_indexed = db.BooleanProperty()

def slugify(s, length=None, separator="-"):
    """Return a slugged version of supplied string."""
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

def create_record_key():
    def wrapper(value, bulkload_state):
        """Returns a Record key built from value.
        
        Arguments:
            value - urlsafe key string created by model.Key.urlsafe()            
        """
        d = bulkload_state.current_dictionary
        organization_slug = slugify(d['orgname'])
        resource_slug = slugify(d['title'])
        d['keyname'] = '%s/%s/%s' % (organization_slug, resource_slug, d['id'])
        return transform.create_deep_key(
            ('Record', 'keyname'))(value, bulkload_state)
    return wrapper
    
def get_rec_json():
    """Returns a JSON object where all keys have values."""
    def wrapper(rec, bulkload_state):   
        rec = bulkload_state.current_dictionary
        val = {}
        for name, value in rec.iteritems():
            if value:
                val[name] = value
        return db.Text(json.dumps(val))
    return wrapper

def get_is_indexed():
    def wrapper(rec, bulkload_state):
        return False
    return wrapper