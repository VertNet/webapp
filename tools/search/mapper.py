import json
import logging

#from mapreduce import operation as op

from google.appengine.api import search

def build_search_index(entity):
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
	except search.Error:
	    logging.exception('Put failed')
