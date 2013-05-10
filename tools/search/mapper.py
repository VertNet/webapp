import json
import logging

from google.appengine.api import search

# TODO: Pool search api puts?

# Words not included in full text search
STOP_WORDS = [
    'a', 'able', 'about', 'across', 'after', 'all', 'almost', 'also', 'am', 
    'among', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 
    'but', 'by', 'can', 'cannot', 'could', 'dear', 'did', 'do', 'does', 'either', 
    'else', 'ever', 'every', 'for', 'from', 'get', 'got', 'had', 'has', 'have', 
    'he', 'her', 'hers', 'him', 'his', 'how', 'however', 'i', 'if', 'in', 'into', 
    'is', 'it', 'its', 'just', 'least', 'let', 'like', 'likely', 'may', 'me', 
    'might', 'most', 'must', 'my', 'neither', 'no', 'nor', 'not', 'of', 'off', 
    'often', 'on', 'only', 'or', 'other', 'our', 'own', 'rather', 'said', 'say', 
    'says', 'she', 'should', 'since', 'so', 'some', 'than', 'that', 'the', 'their', 
    'them', 'then', 'there', 'these', 'they', 'this', 'tis', 'to', 'too', 'twas', 
    'us', 'wants', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 
    'who', 'whom', 'why', 'will', 'with', 'would', 'yet', 'you', 'your']

# Darwin Core names not indexed in full text
DO_NOT_FULL_TEXT = [
    'acceptednameusageid', 'accessrights', 'basisofrecord', 'collectionid', 
    'coordinateprecision', 'coordinateuncertaintyinmeters', 'datasetid', 
    'dateidentified', 'day', 'decimallatitude', 'decimallongitude', 'disposition', 
    'enddayofyear', 'eventdate', 'eventid', 'eventtime', 'fieldnotes', 
    'footprintspatialfit', 'footprintsrs', 'footprintwkt', 'geologicalcontextid', 
    'georeferenceremarks', 'georeferenceverificationstatus', 'highergeographyid', 
    'identificationid', 'individualcount', 'individualid', 'institutionid', 
    'language', 'locationid', 'maximumdepthinmeters', 
    'maximumdistanceabovesurfaceinmeters', 'maximumelevationinmeters', 
    'minimumdepthinmeters', 'minimumdistanceabovesurfaceinmeters', 
    'minimumelevationinmeters', 'modified', 'month', 'nameaccordingtoid', 
    'namepublishedinid', 'nomenclaturalcode', 'occurrencedetails', 'occurrenceid', 
    'originalnameusageid', 'parentnameusageid', 'pointradiusspatialfit', 'rights', 
    'rightsholder', 'scientificnameid', 'startdayofyear', 'taxonconceptid', 'taxonid', 
    'type', 'verbatimcoordinates', 'verbatimeventdate', 'verbatimlatitude', 
    'verbatimlongitude', 'year']

# Darwin Core names not indexed
DO_NOT_INDEX = [
    'acceptednameusageid', 'accessrights', 'associatedmedia', 
    'associatedoccurrences', 'associatedreferences', 
    'associatedsequences', 'associatedtaxa', 'bibliographiccitation', 
    'collectionid', 'datageneralizations', 'datasetid', 'dateidentified', 
    'disposition', 'eventdate', 'eventid', 'eventremarks', 'eventtime', 
    'fieldnotes', 'footprintspatialfit', 'footprintsrs', 'footprintwkt', 
    'geologicalcontextid', 'georeferenceremarks', 'georeferencesources', 
    'habitat', 'higherclassification', 'highergeography', 'highergeographyid', 
    'identificationid', 'identificationreferences', 'identificationremarks', 
    'individualcount', 'individualid', 'informationwithheld', 'institutionid', 
    'locationid', 'locationremarks', 'modified', 'nameaccordingtoid', 
    'namepublishedin', 'namepublishedinid', 'occurrencedetails', #'occurrenceid', 
    'occurrenceremarks', 'originalnameusageid', 'othercatalognumbers', 
    'parentnameusageid', 'pointradiusspatialfit', 'preparations', 
    'previousidentifications', 'rights', 'rightsholder', 'scientificnameid', 
    'taxonconceptid', 'taxonid', 'taxonremarks', 'verbatimcoordinates', 
    'verbatimlatitude', 'verbatimlongitude']
    
def build_search_index(entity):
	# Idempotent guard:
	if entity.is_indexed:
		return

	data = json.loads(entity.json)
	year, genus, collection_code, country, lat, lon = map(data.get, 
		['year', 'genus', 'collectioncode', 'country', 'decimallatitude', 
		'decimallongitude'])

	try:
		location = apply(search.GeoPoint, map(float, [lat, lon]))
	except:
		location = None
		
	doc = search.Document(
		fields=[search.TextField(name='year', value=year),
				search.TextField(name='genus', value=genus),
        		search.TextField(name='collection_code', value=collection_code),
        		search.TextField(name='country', value=country),        	
        		search.TextField(name='json', value=entity.json)])

	if location:
		doc.fields.append(search.GeoField(name='location', value=location))
	
	try:
	    search.Index(name='dwc_search').put(doc)
	    entity.is_indexed = True
	    entity.put()
	except search.Error:
	    logging.exception('Put failed')

def build_dwc_index(entity):
	if entity.is_indexed:
		return

	data = json.loads(entity.json)
	year, genus, collection_code, country, lat, lon = map(data.get, 
		['year', 'genus', 'collectioncode', 'country', 'decimallatitude', 
		'decimallongitude'])

		
