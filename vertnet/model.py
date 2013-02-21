"""Datastore models and RPC payload messages."""

from google.appengine.ext import ndb

from protorpc import messages

class Organization(ndb.Model):
	"""Model for an organization."""
	description = ndb.StringProperty()
	link = ndb.StringProperty()
	name = ndb.StringProperty()
	address = ndb.StringProperty()
	email = ndb.StringProperty()
	phone = ndb.StringProperty()

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
	organization = ndb.KeyProperty(kind=Organization)
	organization_id = ndb.StringProperty()
	title = ndb.StringProperty()
	url = ndb.StringProperty()
	description = ndb.TextProperty()
	eml_url = ndb.StringProperty()
	publisher = ndb.StringProperty()
	dwca_url = ndb.StringProperty()
	pub_date = ndb.StringProperty()

	@property 
	def json(self):
		props = self.to_dict()
		props['organization'] = self.organization.urlsafe()
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

class Dataset(ndb.Model):
	"""Model for an organization resource dataset."""
	organization = ndb.KeyProperty(kind=Organization)
	organization_id = ndb.StringProperty()
	resource = ndb.KeyProperty(kind=Resource)
	resource_id = ndb.StringProperty()
	title = ndb.StringProperty()
	creator = ndb.StringProperty()
	pub_date = ndb.StringProperty()
	contact = ndb.StringProperty()
	additional_info = ndb.TextProperty()

	@property 
	def json(self):
		props = self.to_dict()
		props['organization'] = self.organization.urlsafe()
		props['resource'] = self.resource.urlsafe()
		return props

	@property 
	def message(self):
		return DatasetPayload(**self.json)

class Record(ndb.Model):
	"""Model for an organization resource dataset record."""
	dataset = ndb.KeyProperty(kind=Dataset)
	uuid = ndb.StringProperty()
	# TODO

class OrganizationPayload(messages.Message):
	"""JSON Organization payload for RPC."""
	description = messages.StringField(1)
	link = messages.StringField(2)
 	name = messages.StringField(3)
 	address = messages.StringField(4)
	email = messages.StringField(5)
 	phone = messages.StringField(6)

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
	pass

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
