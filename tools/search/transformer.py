"""This module contains transformation functions for the bulkloader."""

import json

from google.appengine.ext import db

class Record(db.Model):
    json = db.TextProperty()
    is_indexed = db.BooleanProperty()

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