"""Datastore models and RPC payload messages."""

from google.appengine.ext import ndb
from google.appengine.ext.ndb import tasklets
from protorpc import messages

import json
import logging

# Dummpy stats for testing.
DUMMY_STATS = dict(
    record_count=1606374, 
    publisher_count=20,
    taxa_count=dict(Kingdom=5,Phylum=5,Class=20,Order=163,Family=1063,
        Genus=7778,Species=50552),
    country=dict(USA=605663,Mexico=114520,Ecuador=1975,Peru=35876,
        Philippines=30913),
    collection_count=dict(Fish=211844,
        Herps=178000,Mammals=164787,Birds=79223),
    class_count=dict(Mammalia=371296,Amphibia=281625,Reptilia=275613,
        Aves=271059,Actinopterygii=183898,Chondrichthyes=1636,Elasmobranchii=1460))

class Stats(ndb.Model):
    """Model for VertNet data statitstics."""
    stats = ndb.JsonProperty(default=DUMMY_STATS)

    @property
    def json(self):
        return self.to_dict()

    @property
    def message(self):
        return StatsPayload(stats=json.dumps(self.stats))

class StatsPayload(messages.Message):
    """JSON message for stats RPC."""
    stats = messages.StringField(1)

class Organization(ndb.Model):
    """Model for an organization."""
    name = ndb.StringProperty()
    name_slug = ndb.StringProperty()

    @property 
    def json(self):
        return self.to_dict()

    @property 
    def message(self):
        return OrganizationPayload(**self.json)

    @classmethod
    def page(cls, limit, cursor, format='model'):
        """Return page of organizations as models, json, or RPC messages."""
        models, next, more = cls.query().fetch_page(limit, start_cursor=cursor)
        if format == 'json':
            return [x.json for x in models], next, more
        elif format == 'message':
            if next:
                next = next.urlsafe()
            messages = [x.message for x in models]
            lp = ListPayload(organizations=messages, kind='o'), next, more
            return PagePayload(list=lp, cursor=next, more=more)
        return models, next, more

class Resource(ndb.Model):
    """Model for an organization resource."""
    organization_name = ndb.StringProperty()
    organization_slug = ndb.StringProperty()
    title = ndb.StringProperty()
    title_slug = ndb.StringProperty()
    description = ndb.StringProperty()
    rights = ndb.StringProperty()
    url = ndb.StringProperty()
    count = ndb.StringProperty()
    contact_name = ndb.StringProperty()
    contact_email = ndb.StringProperty()
    eml_url = ndb.StringProperty()
    dwca_url = ndb.StringProperty()
    pub_date = ndb.StringProperty()

    @property 
    def json(self):
        props = self.to_dict()
        return props

    @property 
    def message(self):
        return ResourcePayload(**self.json)

    @classmethod
    def page(cls, organization, format='model'):
        """List resources for supplied organization key as models, json, or RPC 
        messages.
        """
        return cls.query(cls.organization == organization).fetch()

class Record(ndb.Model):
    """Model for an organization resource dataset record."""
    organization_name = ndb.StringProperty()
    organization_slug = ndb.StringProperty()
    resource_title = ndb.StringProperty()
    resource_title_slug = ndb.StringProperty()
    record = ndb.TextProperty() # record as JSON string

    @property
    def json(self):
        rec = json.loads(self.record)
        rec['key_name'] = self.key.id()
        return rec

    @property
    def message(self):
        return RecordPayload(id=self.key.id(), json=self.record)

class RecordIndex(ndb.Model):
    year = ndb.StringProperty()
    genus = ndb.StringProperty()
    country = ndb.StringProperty()
    institutioncode = ndb.StringProperty()
    specificepithet = ndb.StringProperty()
    corpus = ndb.StringProperty(repeated=True)

    _use_memcache = False

    @classmethod
    def search(cls, params, limit, cursor=None, message=False):
        """Returns (records, cursor).

        Arguments
            args - Dictionary with Darwin Core concept keys
            keywords - list of keywords to search on
        """
        ctx = tasklets.get_context()
        ctx.set_memcache_policy(False)

        qry = RecordIndex.query()

        # Add darwin core name filters
        args = params['terms']
        if len(args) > 0:
            gql = 'SELECT * FROM RecordIndex WHERE'
            for k,v in args.iteritems():
                gql = "%s %s = '%s' AND " % (gql, k, v)
            gql = gql[:-5] # Removes trailing AND
            logging.info(gql)
            # qry = query.parse_gql(gql)[0]
            qry = ndb.gql(gql)
            
        # Add full text keyword filters
        keywords = params['keywords']
        for keyword in keywords:
            qry = qry.filter(RecordIndex.corpus == keyword)        

        logging.info('QUERY='+str(qry))

        # Setup query paging
        #limit = params['limit']
        #cursor = params['cursor']        
        if cursor:
            logging.info('Cursor')
            index_keys, next_cursor, more = qry.fetch_page(limit, 
                start_cursor=cursor, keys_only=True)
            record_keys = [x.parent() for x in index_keys]
        else:
            logging.info('No cursor')
            index_keys, next_cursor, more = qry.fetch_page(limit, 
                keys_only=True)
            record_keys = [x.parent() for x in index_keys]

        # Return results
        records = ndb.get_multi(record_keys)
        if message:
            records = [x.message for x in records]
        return (records, next_cursor, more)

class OrganizationPayload(messages.Message):
    """JSON Organization payload for RPC."""
    name = messages.StringField(1)
    name_slug = messages.StringField(2)

class ResourcePayload(messages.Message):
    """JSON Resource payload for RPC."""
    organization = messages.StringField(1)
    title = messages.StringField(2)
    url = messages.StringField(3)
    description = messages.StringField(4)
    eml_url = messages.StringField(5)
    publisher = messages.StringField(6)
    dwca_url = messages.StringField(7)
    pub_date = messages.StringField(8)
    organization_id = messages.StringField(9)

class DatasetPayload(messages.Message):
    """JSON Dataset payload for RPC."""
    resource = messages.StringField(1)
    title = messages.StringField(2)
    creator = messages.StringField(3)
    pub_date = messages.StringField(4)
    contact = messages.StringField(5)
    additional_info = messages.StringField(6)
    organization = messages.StringField(7)
    organization_id = messages.StringField(8)
    resource_id = messages.StringField(9)

class RecordPayload(messages.Message):
    json = messages.StringField(1)
    id = messages.StringField(2)

class RecordList(messages.Message):
    items = messages.MessageField(RecordPayload, 1, repeated=True)
    cursor = messages.StringField(2)    
    more = messages.BooleanField(3) 
    limit = messages.IntegerField(4)  
    parent = messages.StringField(5)  
    q = messages.StringField(6)   # {terms={}, keywords=[]}

class ListPayload(messages.Message):
    organizations = messages.MessageField(OrganizationPayload, 1, 
        repeated=True)
    resources = messages.MessageField(ResourcePayload, 2, repeated=True)
    datasets = messages.MessageField(DatasetPayload, 3, repeated=True)
    records = messages.MessageField(RecordPayload, 4, repeated=True)
    kind = messages.StringField(5) # o=organization, r=resource, d=dataset, r=record

class PagePayload(messages.Message):
    """Page of JSON payloads for RPC."""
    list = messages.MessageField(ListPayload, 1, repeated=True)
    cursor = messages.StringField(2)    
    more = messages.BooleanField(3) 
    limit = messages.IntegerField(4)  
