"""Unit test coverage for the organizations."""

import os
import unittest

from google.appengine.ext import testbed

from vertnet.model import Organization, OrganizationPayload

class OrganizationTestCase(unittest.TestCase):

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

    def testCreateOrganization(self):
        id = 'organization/museum-of-vertebrate-zoology'
        props = dict(description='about', name='MVZ')
        organization = Organization(id=id, **props)
        self.assertIsNotNone(organization)
        self.assertEqual(id, organization.key.id())
        self.assertIsNotNone(organization.json)
        self.assertIsInstance(organization.json, dict)
        self.assertIsNotNone(organization.message)
        self.assertIsInstance(organization.message, OrganizationPayload)

