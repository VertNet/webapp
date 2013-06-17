import json
import logging
import re
from datetime import datetime
from google.appengine.api import search

# TODO: Pool search api puts?

DO_NOT_FULL_TEXT = ['eventremarks', 'geologicalcontextid', 'scientificnameid', 
'nameaccordingtoid', 'month', 'decimallongitude', 'fieldnotes', 
'georeferenceddate', 'references', 'startdayofyear', 'minimumelevationinmeters', 
'taxonrank', 'identificationreferences', 'footprintspatialfit', 
'highergeographyid', 'accessrights', 'locationid', 'maximumelevationinmeters', 
'maximumdistanceabovesurfaceinmeters', 'type', 'taxonconceptid', 'eventid', 
'eventtime', 'identificationid', 'verbatimeventdate', 'verbatimdepth', 
'footprintwkt', 'verbatimcoordinatesystem', 'verbatimsrs', 'parentnameusageid', 
'scientificnameauthorship', 'minimumdepthinmeters', 'georeferenceremarks', 
'nameaccordingto', 'day', 'identificationverificationstatus', 'occurrenceid', 
'rights', 'footprintsrs', 'georeferenceverificationstatus', 'modified', 
'verbatimlatitude', 'associatedmedia', 'originalnameusageid', 
'datageneralizations', 'taxonomicstatus', 'taxonremarks', 
'coordinateuncertaintyinmeters', 'eventdate', 'namepublishedinyear', 
'individualcount', 'verbatimelevation', 'bibliographiccitation', 
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

# def _corpus(recjson):
#     corpus = set()
#     corpus.update(
#         reduce(lambda x,y: x+y, 
#                map(lambda x: [re.sub(r'\W+', '', s.strip().lower()) \
#                 for s in x.split() \
#                 if s and not s.startswith('http')], 
#                 [val for key, val in recjson.iteritems() \
#                         if key.strip().lower() not in DO_NOT_FULL_TEXT and \
#                         isinstance(val, unicode)]), []))
#     if len(corpus) == 0:
#         return ''
#     return reduce(lambda x,y: '%s %s' % (x, y), corpus)

def _corpus(recjson):
    vals = [val for key, val in recjson.iteritems() if key not in DO_NOT_FULL_TEXT]
    return reduce(lambda x,y: '%s %s' % (x, y), vals)

def _location(lat, lon):
    try:
        location = apply(search.GeoPoint, map(float, [lat, lon]))
    except:
        location = None
    return location

def _eventdate(year):
    try:
        eventdate = datetime.strptime(year, '%Y')
    except:
        eventdate = None
    return eventdate

def build_search_index(entity):
    data = json.loads(entity.record)
    year, genus, icode, country, specep, lat, lon = map(data.get, 
        ['year', 'genus', 'institutioncode', 'country', 'specificepithet', 'decimallatitude', 'decimallongitude'])

    doc = search.Document(
        doc_id=data['keyname'],
		fields=[search.TextField(name='year', value=year),
				search.TextField(name='genus', value=genus),
        		search.TextField(name='institutioncode', value=icode),
                search.TextField(name='country', value=country),            
                search.TextField(name='specificepithet', value=specep),            
        		search.TextField(name='record', value=_corpus(data))])

    location = _location(lat, lon)
    eventdate = _eventdate(year)

    if location:
        doc.fields.append(search.GeoField(name='location', value=location))
        doc.fields.append(search.NumberField(name='mappable', value=1))
    else:
        doc.fields.append(search.NumberField(name='mappable', value=0))

    if eventdate:
        doc.fields.append(search.DateField(name='eventdate', value=eventdate))
	
	try:
	    search.Index(name='dwc_search').put(doc)
	    entity.indexed = True
	    entity.put()
	except search.Error:
	    logging.exception('Put failed for doc %s' % doc.doc_id)
