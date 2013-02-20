"""Unit test coverage for the resources."""

import os
import unittest

from google.appengine.ext import testbed

from vertnet.model import Organization, Resource, ResourcePayload

class ResourceTestCase(unittest.TestCase):

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

    def testCreateResource(self):
        oid = 'organization/museum-of-vertebrate-zoology'
        props = dict(description='about', name='MVZ')
        organization = Organization(id=oid, **props)
        organization.put()
    
        rid = 'birds'
        props = dict(organization=organization.key, 
            organization_id=organization.key.id(), title='birds')
        resource = Resource(id=rid, **props)
        resource.put()

        self.assertIsNotNone(resource)
        self.assertEqual(rid, resource.key.id())
        self.assertIsNotNone(resource.json)
        self.assertIsInstance(resource.json, dict)
        self.assertIsNotNone(resource.message)
        self.assertIsInstance(resource.message, ResourcePayload)
        self.assertEqual(resource.organization, organization.key)
        self.assertEqual(organization.key.id(), oid)
        

