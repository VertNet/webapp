terms = dict(
	rec="""dcterms:type | dcterms:modified | dcterms:language | dcterms:rights | dcterms:rightsHolder | dcterms:accessRights | dcterms:bibliographicCitation | dcterms:references | institutionID | collectionID | datasetID | institutionCode | collectionCode | datasetName | ownerInstitutionCode | basisOfRecord | informationWithheld | dataGeneralizations | dynamicProperties""",
	occ="""occurrenceID | catalogNumber | occurrenceRemarks | recordNumber | recordedBy | individualID | individualCount | sex | lifeStage | reproductiveCondition | behavior | establishmentMeans | occurrenceStatus | preparations | disposition | otherCatalogNumbers | previousIdentifications | associatedMedia | associatedReferences | associatedOccurrences | associatedSequences | associatedTaxa""",
	event="""eventID | samplingProtocol | samplingEffort | eventDate | eventTime | startDayOfYear | endDayOfYear | year | month | day | verbatimEventDate | habitat | fieldNumber | fieldNotes | eventRemarks""",
	loc="""locationID | higherGeographyID | higherGeography | continent | waterBody | islandGroup | island | country | countryCode | stateProvince | county | municipality | locality | verbatimLocality | verbatimElevation | minimumElevationInMeters | maximumElevationInMeters | verbatimDepth | minimumDepthInMeters | maximumDepthInMeters | minimumDistanceAboveSurfaceInMeters | maximumDistanceAboveSurfaceInMeters | locationAccordingTo | locationRemarks | verbatimCoordinates | verbatimLatitude | verbatimLongitude | verbatimCoordinateSystem | verbatimSRS | decimalLatitude | decimalLongitude | geodeticDatum | coordinateUncertaintyInMeters | coordinatePrecision | pointRadiusSpatialFit | footprintWKT | footprintSRS | footprintSpatialFit | georeferencedBy | georeferencedDate | georeferenceProtocol | georeferenceSources | georeferenceVerificationStatus | georeferenceRemarks""",
	geo="""geologicalContextID | earliestEonOrLowestEonothem | latestEonOrHighestEonothem | earliestEraOrLowestErathem | latestEraOrHighestErathem | earliestPeriodOrLowestSystem | latestPeriodOrHighestSystem | earliestEpochOrLowestSeries | latestEpochOrHighestSeries | earliestAgeOrLowestStage | latestAgeOrHighestStage | lowestBiostratigraphicZone | highestBiostratigraphicZone | lithostratigraphicTerms | group | formation | member | bed""",
	iden="""identificationID | identifiedBy | dateIdentified | identificationReferences | identificationVerificationStatus | identificationRemarks | identificationQualifier | typeStatus""",
	tax="""taxonID | scientificNameID | acceptedNameUsageID | parentNameUsageID | originalNameUsageID | nameAccordingToID | namePublishedInID | taxonConceptID | scientificName | acceptedNameUsage | parentNameUsage | originalNameUsage | nameAccordingTo | namePublishedIn | namePublishedInYear | higherClassification | kingdom | phylum | class | order | family | genus | subgenus | specificEpithet | infraspecificEpithet | taxonRank | verbatimTaxonRank | scientificNameAuthorship | vernacularName | nomenclaturalCode | taxonomicStatus | nomenclaturalStatus | taxonRemarks""")

def camel(s):
	return '%s%s' % (s[0].upper(), s[1:])

def prep(s):
	return [x.replace('dcterms:', '').strip() for x in s.split('|')]

if __name__ == '__main__':
	for name in ['rec', 'occ', 'event', 'loc', 'geo', 'iden', 'tax']:
		print 'DWC_%s = %s' % (name.upper(), map(camel, prep(terms[name])))