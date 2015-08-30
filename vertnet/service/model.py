# This file is part of VertNet: https://github.com/VertNet/webapp
#
# VertNet is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# VertNet is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with VertNet.  If not, see: http://www.gnu.org/licenses
"""Datastore models and RPC payload messages."""

from engineauth import models
from google.appengine.ext import ndb
from google.appengine.ext.ndb import tasklets
from protorpc import messages
from vertnet.service import util as vnutil

import json
import logging

MODEL_VERSION='model.py 2015-08-30T17:46:29+02:00'

class VertNetUser(models.User):
    @classmethod
    def _get_kind(cls):
        # Override the datastore entity name.
        # The string that is returned here will be used to name the entity
        # group in the datastore
        return 'VertNetUser'
        
# Model for MapReduce index jobs. Key is mapreduce id:
class IndexJob(ndb.Model):
    write_path = ndb.TextProperty(required=True)
    failed_logs = ndb.StringProperty(repeated=True)
    resource = ndb.StringProperty()
    done = ndb.BooleanProperty(default=False)
    failures = ndb.ComputedProperty(lambda self: len(self.failed_logs) > 1)

# Dummy stats for testing.
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

class Publisher(ndb.Model):
    """Model for a publisher."""
    name = ndb.StringProperty()
    name_slug = ndb.StringProperty()
    # record_count = ndb.IntegerProperty()
    # resource_count = ndb.ResourceProperty()
    # code = ndb.StringProperty()

    @property 
    def json(self):
        return self.to_dict()

    @property 
    def message(self):
        return PublisherPayload(**self.json)

    @classmethod
    def page(cls, limit, cursor, format='model'):
        """Return page of publishers as models, json, or RPC messages."""
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
    indexed = ndb.BooleanProperty(default=False)

    @property
    def json(self):
        rec = json.loads(self.record)
        rec['key_name'] = self.key.id()
        return rec

    @property
    def message(self):
        return RecordPayload(id=self.key.id(), json=self.record)

    @property
    def tsv(self):
        # Note similar functionality in download.py _tsv(json)
        json = self.json
#        json['datasource_and_rights'] = json.get('url')
#        download_fields = vnutil.DWC_HEADER_LIST
        download_fields = vnutil.download_field_list()
        values = []
        for x in download_fields:
            if json.has_key(x):
                if x=='dynamicproperties':
                    logging.info('dynamicproperties before: %s' % json[x] )
                    dp = vnutil.format_json(json[x])
                    logging.info('dynamicproperties after: %s' % dp)
                    values.append(unicode(dp.rstrip()))
                else:
                    values.append(unicode(json[x]).rstrip())        
            else:
                values.append(u'')
        return u'\t'.join(values).encode('utf-8')

class RecordIndex(ndb.Model):
    year = ndb.StringProperty()
    genus = ndb.StringProperty()
    country = ndb.StringProperty()
    institutioncode = ndb.StringProperty()
    specificepithet = ndb.StringProperty()
    corpus = ndb.StringProperty(repeated=True)

    _use_memcache = False

    @classmethod
    def search(cls, params, limit, offset=None, cursor=None, message=False, count=False):
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

        # Add sort orders:
        #qry = qry.order(RecordIndex.institutioncode)
        #qry = qry.order(RecordIndex.genus)
        #qry = qry.order(RecordIndex.specificepithet)
        #qry = qry.order(RecordIndex.country)
        #qry = qry.order(RecordIndex.year)

        logging.info('QUERY='+str(qry))

        # Setup query paging
        #limit = params['limit']
        #cursor = params['cursor']    

        if count:
            return qry.count();

        if cursor:
            index_keys, next_cursor, more = qry.fetch_page(limit, 
                start_cursor=cursor, keys_only=True)
            record_keys = [x.parent() for x in index_keys]
        else:
            index_keys, next_cursor, more = qry.fetch_page(limit, offset=offset,
                keys_only=True)
            record_keys = [x.parent() for x in index_keys]

        # Return results
        records = [x for x in ndb.get_multi(record_keys) if x]
        
        if message:
            records = [x.message for x in records if x]
        count = qry.count(limit=1000)
        return (records, next_cursor, more, count)

class PublisherPayload(messages.Message):
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
    keyname = messages.StringField(3)

class RecordPayload(messages.Message):
    json = messages.StringField(1)
    id = messages.StringField(2)
    keyname = messages.StringField(3)
    
class RecordList(messages.Message):
    items = messages.MessageField(RecordPayload, 1, repeated=True)
    cursor = messages.StringField(2)    
    more = messages.BooleanField(3) 
    limit = messages.IntegerField(4)  
    parent = messages.StringField(5)  
    q = messages.StringField(6)   # {terms={}, keywords=[]}
    count = messages.IntegerField(7)
    email = messages.StringField(8) # email to ping when download is done
    name = messages.StringField(9) # name of downloaded record set
    offset = messages.IntegerField(10) # integer offset
    sort = messages.StringField(11) # integer offset
    error = messages.StringField(12)

class ListPayload(messages.Message):
    organizations = messages.MessageField(PublisherPayload, 1, 
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
