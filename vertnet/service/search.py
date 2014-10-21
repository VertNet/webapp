from google.appengine.api import namespace_manager
import json
import logging
from datetime import datetime
from google.appengine.api import search
from google.appengine.api.search import SortOptions, SortExpression
from mapreduce import operation as op
import re
import htmlentitydefs
from vertnet.service.model import IndexJob
import os
from google.appengine.api import files
from mapreduce import context


IS_DEV = 'Development' in os.environ['SERVER_SOFTWARE']

DO_NOT_FULL_TEXT = ['eventremarks', 'geologicalcontextid', 'scientificnameid', 
'nameaccordingtoid', 'month', 'decimallongitude', 'fieldnotes', 'georeferenceddate', 
'references', 'startdayofyear', 'minimumelevationinmeters', 'taxonrank', 
'identificationreferences', 'footprintspatialfit', 'highergeographyid', 'accessrights', 
'locationid', 'maximumelevationinmeters', 'maximumdistanceabovesurfaceinmeters', 'type', 
'taxonconceptid', 'eventid', 'eventtime', 'identificationid', 'verbatimeventdate', 
'verbatimdepth', 'footprintwkt', 'verbatimcoordinatesystem', 'verbatimsrs', 
'parentnameusageid', 'scientificnameauthorship', 'minimumdepthinmeters', 
'georeferenceremarks', 'nameaccordingto', 'day', 'identificationverificationstatus', 
'occurrenceid', 'rights', 'footprintsrs', 'georeferenceverificationstatus', 'modified', 
'verbatimlatitude', 'associatedmedia', 'originalnameusageid', 'datageneralizations', 
'taxonomicstatus', 'taxonremarks', 'coordinateuncertaintyinmeters', 'eventdate', 
'namepublishedinyear', 'individualcount', 'verbatimelevation', 'bibliographiccitation', 
'namepublishedinid', 'namepublishedin', 'dateidentified', 'verbatimtaxonrank', 
'locationaccordingto', 'acceptednameusage', 'minimumdistanceabovesurfaceinmeters', 
'informationwithheld', 'parentnameusage', 'occurrencedetails', 'description', 
'collectionid', 'acceptednameusageid', 'verbatimlongitude', 'individualid', 
'coordinateprecision', 'taxonid', 'maximumdepthinmeters', 'disposition', 
'vernacularname', 'decimallatitude', 'pointradiusspatialfit', 'language', 
'institutionid', 'rightsholder', 'verbatimcoordinates', 'originalnameusage', 
'nomenclaturalcode', 'associatedtaxa', 'nomenclaturalstatus', 'datasetid', 
'enddayofyear', 'url', 'emlrights', 'keyname', 'datasource_and_rights', 'citation',
'url']

HEADER = ['pubdate', 'url', 'eml', 'dwca', 'title', 'icode', 'description', 'contact', 
          'orgname', 'email', 'emlrights', 'count', 'citation', 'networks', 'harvestid', 
          'id', 'associatedmedia', 'associatedoccurrences', 'associatedreferences', 
          'associatedsequences', 'associatedtaxa', 'basisofrecord', 'bed', 'behavior', 
          'catalognumber', 'collectioncode', 'collectionid', 'continent', 
          'coordinateprecision', 'coordinateuncertaintyinmeters', 'country', 
          'countrycode', 'county', 'datageneralizations', 'dateidentified', 'day', 
          'decimallatitude', 'decimallongitude', 'disposition', 
          'earliestageorloweststage', 'earliesteonorlowesteonothem', 
          'earliestepochorlowestseries', 'earliesteraorlowesterathem', 
          'earliestperiodorlowestsystem', 'enddayofyear', 'establishmentmeans', 
          'eventattributes', 'eventdate', 'eventid', 'eventremarks', 'eventtime', 
          'fieldnotes', 'fieldnumber', 'footprintspatialfit', 'footprintwkt', 
          'formation', 'geodeticdatum', 'geologicalcontextid', 'georeferenceprotocol', 
          'georeferenceremarks', 'georeferencesources', 
          'georeferenceverificationstatus', 'georeferencedby', 'group', 'habitat', 
          'highergeography', 'highergeographyid', 'highestbiostratigraphiczone', 
          'identificationattributes', 'identificationid', 'identificationqualifier', 
          'identificationreferences', 'identificationremarks', 'identifiedby', 
          'individualcount', 'individualid', 'informationwithheld', 'institutioncode', 
          'island', 'islandgroup', 'latestageorhigheststage', 
          'latesteonorhighesteonothem', 'latestepochorhighestseries', 
          'latesteraorhighesterathem', 'latestperiodorhighestsystem', 'lifestage', 
          'lithostratigraphicterms', 'locality', 'locationattributes', 'locationid', 
          'locationremarks', 'lowestbiostratigraphiczone', 'maximumdepthinmeters', 
          'maximumdistanceabovesurfaceinmeters', 'maximumelevationinmeters', 
          'measurementaccuracy', 'measurementdeterminedby', 'measurementdetermineddate', 
          'measurementid', 'measurementmethod', 'measurementremarks', 'measurementtype', 
          'measurementunit', 'measurementvalue', 'member', 'minimumdepthinmeters', 
          'minimumdistanceabovesurfaceinmeters', 'minimumelevationinmeters', 'month', 
          'occurrenceattributes', 'occurrencedetails', 'occurrenceid', 
          'occurrenceremarks', 'othercatalognumbers', 'pointradiusspatialfit', 
          'preparations', 'previousidentifications', 'recordnumber', 'recordedby', 
          'relatedresourceid', 'relationshipaccordingto', 'relationshipestablisheddate', 
          'relationshipofresource', 'relationshipremarks', 'reproductivecondition', 
          'resourceid', 'resourcerelationshipid', 'samplingprotocol', 'sex', 
          'startdayofyear', 'stateprovince', 'taxonattributes', 'typestatus', 
          'verbatimcoordinatesystem', 'verbatimcoordinates', 'verbatimdepth', 
          'verbatimelevation', 'verbatimeventdate', 'verbatimlatitude', 
          'verbatimlocality', 'verbatimlongitude', 'waterbody', 'year', 'footprintsrs', 
          'georeferenceddate', 'identificationverificationstatus', 'institutionid', 
          'locationaccordingto', 'municipality', 'occurrencestatus', 
          'ownerinstitutioncode', 'samplingeffort', 'verbatimsrs', 
          'locationaccordingto7', 'taxonid', 'taxonconceptid', 'datasetid', 
          'datasetname', 'source', 'modified', 'accessrights', 'rights', 'rightsholder', 
          'language', 'higherclassification', 'kingdom', 'phylum', 'classs', 'order', 
          'family', 'genus', 'subgenus', 'specificepithet', 'infraspecificepithet', 
          'scientificname', 'scientificnameid', 'vernacularname', 'taxonrank', 
          'verbatimtaxonrank', 'infraspecificmarker', 'scientificnameauthorship', 
          'nomenclaturalcode', 'namepublishedin', 'namepublishedinid', 
          'taxonomicstatus', 'nomenclaturalstatus', 'nameaccordingto', 
          'nameaccordingtoid', 'parentnameusageid', 'parentnameusage', 
          'originalnameusageid', 'originalnameusage', 'acceptednameusageid', 
          'acceptednameusage', 'taxonremarks', 'dynamicproperties', 
          'namepublishedinyear', 'season', 'dummy']

OMIT_FROM_API_RESULTS = ['location', 'record', 'verbatim_record', 'count', 'icode',
                         'keyname', 'harvestid']

TRANSLATE_HEADER = {'pubdate':'dataset_pubdate', 'url':'dataset_url', 
                    'eml':'dataset_eml', 'dwca':'dataset_dwca', 'title':'dataset_title',
                    'description':'dataset_description', 'contact':'dataset_contact',
                    'orgname':'dataset_orgname', 'email':'dataset_contact_email',
                    'emlrights':'dataset_rights', 'citation':'dataset_citation', 
                    'networks':'dataset_networks'}

def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False    
 
def valid_latlng(lat,lng):
    # accepts lat and lng as strings.
    if not is_number(lat):
        return False
    if not is_number(lng):
        return False
    flat = float(lat)
    if flat < -90 or flat > 90:
        return False
    flng = float(lng)
    if flng < -180 or flng > 180:
        return False
    return True
 
def valid_georef(rec):
    if rec.has_key('decimallatitude'):
        if rec.has_key('decimallongitude'):
            return valid_latlng(rec['decimallatitude'],rec['decimallongitude'])
    return False
 
def valid_binomial(rec):
    if rec.has_key('genus'):
      if rec.has_key('specificepithet'):
        # Sufficient condition for now to have these DwC terms populated.
        # Later may want to test them against a name authority to determine validity.
        return True
    return False
 
def rank(rec):
    rank = 0
    if valid_georef(rec) is True and valid_binomial(rec) is True:
        rank = 5
        if rec.has_key('year'):
            rank = 6
            if rec.has_key('month'):
                rank = 7
                if rec.has_key('day'):
                    rank = 8
    elif valid_binomial(rec) is True:
        rank = 1
        if rec.has_key('year'):
            rank = 2
            if rec.has_key('month'):
                rank = 3
                if rec.has_key('day'):
                    rank = 4
    return rank

def has_media(rec):
    if rec.has_key('associatedmedia'):
        return 1
    if rec.has_key('type'):
        if rec['type'].lower()=='sound':
            return 1
        if 'image' in rec['type'].lower():
            return 1
        return 0
    if rec.has_key('basisofrecord'):
        if rec['basisofrecord'].lower()=='machineobservation':
            return 1
    return 0

tissuetokens = ["+t", "tiss", "blood", "dmso", "dna", "extract", "froze", 
                "forzen", "freez", "heart", "muscle", "higado", "kidney",
                "liver", "lung", "nitrogen", "pectoral", "rinon",
                "kidney", "rnalater", "sample", "sangre", "toe", "spleen"]

def has_tissue(rec):
    if rec.has_key('preparations'):
        for token in tissuetokens:
            if token in rec['preparations'].lower():
                return 1
    return 0

def network(rec, network):
    if rec.has_key('networks'):
        networks = [x.lower() for x in rec['networks'].split(',')]
        if network in networks:
            return 1
    return 0

def _corpus(recjson):
    vals = [val for key, val in recjson.iteritems() if key not in DO_NOT_FULL_TEXT]
    return reduce(lambda x,y: '%s %s' % (x, y), vals)

def _location(lat, lon):
    try:
        location = apply(search.GeoPoint, map(float, [lat, lon]))
    except:
        location = None
    return location

def _type(rec):
    if rec.has_key('type'):
        if rec['type'].lower() == 'physicalobject':
            return 'specimen'
        return 'observation'
    if rec.has_key('basisofrecord'):
        if 'spec' in rec['basisofrecord'].lower():
            return 'specimen'
        return 'observation'
    return 'both'

def _rec(rec):
    for x in ['pubdate','url','eml','dwca','title','icode','description',
        'contact','orgname','email','emlrights','count','citation','networks','harvestid']:
        rec.pop(x)
    return json.dumps(rec)

def _eventdate(year):
    try:
        eventdate = datetime.strptime(year, '%Y').date()
    except:
        eventdate = None
    return eventdate

def slugify(s, length=None, separator="-"):
    """Return a slugged version of supplied string."""
    s = re.sub('[^a-zA-Z\d\s:]', ' ', s)
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

def get_rec_dict(rec):
    val = {}
    for name, value in rec.iteritems():
        if value:
            val[name] = value
    return val

    @classmethod
    def initalize(cls, resource):
        namespace = namespace_manager.get_namespace()
        filename = '/gs/vn-indexer/failures-%s-%s.csv' % (namespace, resource)
        log = cls.get_or_insert(key_name=filename, namespace=namespace)
        return log

def handle_failed_index_put(data, resource, did, write_path, mrid):
    logging.info('Handling failed index.put() - mrid:%s did:%s write_path:%s' % (mrid, did, write_path))
    max_retries = 5
    retry_count = 0

    line = '\t'.join([data[x] for x in HEADER])

    # Write line to file:
    while retry_count < max_retries:
        try:
            with files.open(write_path, 'a') as f:
                f.write('%s\n' % line)
                f.close(finalize=False)
                logging.info('Successfully logged failure to GCS for %s' % did)
                return
        except:
            logging.error('Failure %s of %s to write line to failure log: %s' % (retry_count, max_retries, line))
            retry_count += 1

    logging.critical('Failed to index and failed to log %s' % did)
    namespace = namespace_manager.get_namespace()
    job = IndexJob.get_by_id(mrid, namespace=namespace)
    job.failed_logs.append(did)
    job.put()

def index_record(data, issue=None):
    county, stateprov, year, genus, icode, country, specep, lat, lon, catnum, collname, season, classs, url = map(data.get, 
        ['county', 'stateprovince', 'year', 'genus', 'icode', 'country', 'specificepithet', 
        'decimallatitude', 'decimallongitude', 'catalognumber', 'collectorname', 'season', 'classs', 'url'])

    if data.has_key('classs'):        
        data.pop('classs')

    data['class'] = classs
    organization_slug = slugify(data['orgname'])
    resource_slug = slugify(data['title'])
    data['keyname'] = '%s/%s/%s' % (organization_slug, resource_slug, data['harvestid'])
    
    doc = search.Document(
        doc_id=data['keyname'],
        rank=rank(data),
		fields=[search.TextField(name='year', value=year),
				search.TextField(name='genus', value=genus),
        		search.TextField(name='institutioncode', value=icode),
                search.TextField(name='country', value=country),            
                search.TextField(name='stateprovince', value=stateprov),  
                search.TextField(name='county', value=county),            
                search.TextField(name='specificepithet', value=specep),
                search.TextField(name='catalognumber', value=catnum),
                search.TextField(name='collectorname', value=collname),
                search.TextField(name='class', value=classs),                
                search.TextField(name='type', value=_type(data)),
                search.TextField(name='url', value=url),
                search.NumberField(name='media', value=has_media(data)),            
                search.NumberField(name='tissue', value=has_tissue(data)),            
                search.NumberField(name='rank', value=rank(data)),            
        		search.TextField(name='record', value=json.dumps(data))])

    location = _location(lat, lon)
    eventdate = _eventdate(year)

    if location:
        doc.fields.append(search.GeoField(name='location', value=location))
        doc.fields.append(search.NumberField(name='mappable', value=1))
    else:
        doc.fields.append(search.NumberField(name='mappable', value=0))

    if eventdate:
        doc.fields.append(search.DateField(name='eventdate', value=eventdate))

    max_retries = 2
    retry_count = 0
    while retry_count < max_retries:
        try:
            namespace = namespace_manager.get_namespace()
            search.Index('dwc', namespace=namespace).put(doc)
            return # Successfully indexed record.
        except Exception, e:
            logging.error('Put #%s failed for doc %s (%s)' % (retry_count, doc.doc_id, e))
            retry_count += 1

    # Failed to index record, so handle it:
    resource = '%s-%s' % (resource_slug, data['harvestid'])
    did = data['keyname']
    ctx = context.get()
    mrid = ctx.mapreduce_id
    params = ctx.mapreduce_spec.mapper.params
    write_path = params['write_path']
    handle_failed_index_put(data, resource, did, write_path, mrid)

def build_search_index(entity):
    data = get_rec_dict(dict(zip(HEADER, entity.split('\t'))))
    index_record(data)

def _get_rec(doc):
#    logging.info('Doc.fields: %s' % (doc.fields))
    # Look through all the fields in the doc
    for field in doc.fields:
      # Ignore all fields except verbatim_record for now
      if field.name == 'verbatim_record':
        # Load the verbatim_record as the basis for the response for this rec
        rec = json.loads(field.value)
#    logging.info('Rec from verbatim_record: %s' % (rec))
    # Look through all the fields in the doc again
    for field in doc.fields:
      # If the field name isn't already in the response for this rec
      if rec.get(field.name) is None:
        # Add the field.name:field.value pair to the response for this rec
        rec[field.name] = field.value
#    rec['rec_version'] = '2014-10-21T10:15'
#    rec['doc_rank'] = doc._rank
#    rec['doc_id'] = doc.doc_id
#    rec['doc_language'] = doc.language

    # Remove unwanted fields from the api results    
    for popme in OMIT_FROM_API_RESULTS:
      if rec.get(popme) is not None:
#        logging.info('Omitting field: %s from rec' % (popme))
        rec.pop(popme)
    
    # Translate field names to be explicit in the api results    
    for changeme in TRANSLATE_HEADER:
      if rec.get(changeme) is not None:
        value = rec.get(changeme)
        rec.pop(changeme)
        rec[TRANSLATE_HEADER.get(changeme)]=value  
    return rec

def delete_entity(entity):
    yield op.db.Delete(entity)

def query(q, limit, index_name='dwc', log=0, sort=None, curs=search.Cursor()):
    VERSION='search.query:2014-10-21T20:26'
    if not curs:
        curs = search.Cursor()
    
    if q.startswith('id:'):
        did = q.split(':')[1].strip()
        namespace = namespace_manager.get_namespace()
        results = search.Index(name=index_name, namespace=namespace).get_range(start_id=did, limit=1)
        if results:
            recs = map(_get_rec, results)
            logging.info('One result from search.Index() for namespace=%s index_name=%s query=%s' % (namespace, index_name, q))
            if log==1:
              logging.info('Results:\n%s' % (results))          
            return recs, None, 1, VERSION
        else:
            logging.info('No results from search.Index() for namespace=%s index_name=%s query=%s' % (namespace, index_name, q))
            return [], None, 0, VERSION

    expressions = []
    # [SortExpression(expression='rank', default_value=0,
    #     direction=SortExpression.DESCENDING)]    

    if sort:
        expressions.append(SortExpression(expression=sort, default_value='z', 
            direction=SortExpression.ASCENDING))
        sort_options = SortOptions(expressions=expressions, limit=limit)
        logging.info(sort_options)
    
        options = search.QueryOptions(
            limit=limit,
            # See Stucky research, Mar 2014.
            number_found_accuracy=10000,
            cursor=curs,
            sort_options=sort_options)
            #returned_fields=['record', 'location'])        
    else:
        # Always use 10,000 as the value for number_found_accuracy.  Based on
        # extensive testing, using this maximum allowed value results in the best
        # count accuracy and incurs only a minor performance penalty.
        options = search.QueryOptions(
            limit=limit,
            # See Stucky research, Mar 2014.
            number_found_accuracy=10000,
            cursor=curs) #,
            #returned_fields=['record', 'location'])        

    max_retries = 2
    retry_count = 0
    error = None
    while retry_count < max_retries:
        try:
            query = search.Query(query_string=q, options=options)
            namespace = namespace_manager.get_namespace()
            results = search.Index(name=index_name, namespace=namespace).search(query)
            if results:
                recs = map(_get_rec, results)
                logging.info('%s results from search.Index() for namespace=%s index_name=%s query=%s' % (results.number_found, namespace, index_name, q))
                if log==1:
                  logging.info('Results:\n%s' % (results))          
                return recs, results.cursor, results.number_found, VERSION
            else:
                logging.info('No results from search.Index() for namespace=%s index_name=%s query=%s' % (namespace, index_name, q))
                return [], None, 0, VERSION
        except Exception, e:
            logging.exception('Search failed.\nQUERY:\n %s\nERROR:\n%s' % (q,e) )
            error = e
            retry_count += 1

    return [error]