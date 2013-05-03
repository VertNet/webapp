import json
import logging

from google.appengine.api import search

# TODO: Pool search api puts?

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
	
