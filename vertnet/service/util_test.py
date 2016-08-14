from util import download_header
from util import download_field_list
from util import DWC_HEADER_LIST

def main():
    dfl = download_field_list()
    dh = download_header()
    print 'DWC_HEADER_LIST: %s %s' % (len(DWC_HEADER_LIST),DWC_HEADER_LIST)
    print 'DOWNLOAD_FIELD_LIST: %s %s' % (len(dfl),dfl)
    print 'DOWNLOAD_HEADER: %s' % dh

if __name__ == '__main__':
    """ Test util.py"""
    main()
