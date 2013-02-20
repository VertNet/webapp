"""Unit test coverage for the datasets."""

import os
import unittest

from google.appengine.ext import testbed

from vertnet.model import Organization, Resource, Dataset, DatasetPayload

class DatasetTestCase(unittest.TestCase):

    def setUp(self):
        self.testbed = testbed.Testbed()
        self.testbed.activate()
        self.testbed.init_memcache_stub()    
        self.testbed.init_app_identity_stub()        
        # Root path where queue.yaml is:
        self.testbed.init_taskqueue_stub(root_path=os.path.abspath('.'))
        self.testbed.init_datastore_v3_stub()    
        self.testbed.init_channel_stub()
        self.testbed.init_mail_stub()

    def tearDown(self):
        self.testbed.deactivate()

    def testCreateDataset(self):
        oid = 'museum-of-vertebrate-zoology'
        props = dict(description='about', name='MVZ')
        organization = Organization(id=oid, **props)
        organization.put()
    
        rid = 'museum-of-vertebrate-zoology/birds-resource'
        props = dict(organization=organization.key, 
            organization_id=organization.key.id(), title='birds')
        resource = Resource(id=rid, **props)
        resource.put()

        did = 'museum-of-vertebrate-zoology/bird-resource/aves'
        props = dict(organization=organization.key, 
             organization_id=organization.key.id(), resource=resource.key,
             resource_id=resource.key.id(), title='aves')
        dataset = Dataset(id=did, **props)
        dataset.put()

        self.assertIsNotNone(dataset)
        self.assertEqual(did, dataset.key.id())
        self.assertIsNotNone(dataset.json)
        self.assertIsInstance(dataset.json, dict)
        self.assertIsNotNone(dataset.message)
        self.assertIsInstance(dataset.message, DatasetPayload)
        self.assertEqual(dataset.organization, organization.key)
        self.assertEqual(dataset.resource, resource.key)
        

