#!/usr/bin/python

"""CLI for running all unit tests."""

import optparse
import os
import sys
import unittest2

USAGE = """%prog 
Run unit tests for Hylo App Engine code.
"""


def main():
    print 'Beasting Hylo unit tests...'
    sys.path.insert(0, os.environ['GAE_SDK'])
    sys.path.append(os.path.abspath('../'))
    sys.path.append(os.path.join(os.path.dirname(__file__), '../lib'))
    import dev_appserver
    dev_appserver.fix_sys_path()
    suite = unittest2.loader.TestLoader().discover(os.path.abspath('.'))
    unittest2.TextTestRunner(verbosity=2).run(suite)

if __name__ == '__main__':
    parser = optparse.OptionParser(USAGE)
    options, args = parser.parse_args()
    main()