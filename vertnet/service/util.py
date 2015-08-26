import json

DWC_RECLEVEL = ['Type', 'Modified', 'Language', 'Rights', 'RightsHolder', 
'AccessRights', 'BibliographicCitation', 'References', 'InstitutionID', 
'CollectionID', 'DatasetID', 'InstitutionCode', 'CollectionCode', 
'DatasetName', 'OwnerInstitutionCode', 'BasisOfRecord', 'InformationWithheld', 
'DataGeneralizations', 'DynamicProperties']

DWC_OCC = ['OccurrenceID', 'CatalogNumber', 'OccurrenceRemarks', 'RecordNumber', 
'RecordedBy', 'IndividualID', 'IndividualCount', 'Sex', 'LifeStage', 
'ReproductiveCondition', 'Behavior', 'EstablishmentMeans', 'OccurrenceStatus', 
'Preparations', 'Disposition', 'OtherCatalogNumbers', 'PreviousIdentifications', 
'AssociatedMedia', 'AssociatedReferences', 'AssociatedOccurrences', 
'AssociatedSequences', 'AssociatedTaxa']

DWC_EVENT = ['EventID', 'SamplingProtocol', 'SamplingEffort', 'EventDate', 
'EventTime', 'StartDayOfYear', 'EndDayOfYear', 'Year', 'Month', 'Day', 
'VerbatimEventDate', 'Habitat', 'FieldNumber', 'FieldNotes', 'EventRemarks']

DWC_LOCATION = ['LocationID', 'HigherGeographyID', 'HigherGeography', 
'Continent', 'WaterBody', 'IslandGroup', 'Island', 'Country', 'CountryCode', 
'StateProvince', 'County', 'Municipality', 'Locality', 'VerbatimLocality', 
'VerbatimElevation', 'MinimumElevationInMeters', 'MaximumElevationInMeters', 
'VerbatimDepth', 'MinimumDepthInMeters', 'MaximumDepthInMeters', 
'MinimumDistanceAboveSurfaceInMeters', 'MaximumDistanceAboveSurfaceInMeters', 
'LocationAccordingTo', 'LocationRemarks', 'VerbatimCoordinates', 
'VerbatimLatitude', 'VerbatimLongitude', 'VerbatimCoordinateSystem', 
'VerbatimSRS', 'DecimalLatitude', 'DecimalLongitude', 'GeodeticDatum', 
'CoordinateUncertaintyInMeters', 'CoordinatePrecision', 
'PointRadiusSpatialFit', 'FootprintWKT', 'FootprintSRS', 
'FootprintSpatialFit', 'GeoreferencedBy', 'GeoreferencedDate', 
'GeoreferenceProtocol', 'GeoreferenceSources', 
'GeoreferenceVerificationStatus', 'GeoreferenceRemarks']

DWC_GEO = ['GeologicalContextID', 'EarliestEonOrLowestEonothem', 
'LatestEonOrHighestEonothem', 'EarliestEraOrLowestErathem', 
'LatestEraOrHighestErathem', 'EarliestPeriodOrLowestSystem', 
'LatestPeriodOrHighestSystem', 'EarliestEpochOrLowestSeries', 
'LatestEpochOrHighestSeries', 'EarliestAgeOrLowestStage', 
'LatestAgeOrHighestStage', 'LowestBiostratigraphicZone', 
'HighestBiostratigraphicZone', 'LithostratigraphicTerms', 'Group', 'Formation', 
'Member', 'Bed']

DWC_ID = ['IdentificationID', 'IdentifiedBy', 'DateIdentified', 
'IdentificationReferences', 'IdentificationVerificationStatus', 
'IdentificationRemarks', 'IdentificationQualifier', 'TypeStatus']

DWC_TAXON = ['TaxonID', 'ScientificNameID', 'AcceptedNameUsageID', 
'ParentNameUsageID', 'OriginalNameUsageID', 'NameAccordingToID', 
'NamePublishedInID', 'TaxonConceptID', 'ScientificName', 'AcceptedNameUsage', 
'ParentNameUsage', 'OriginalNameUsage', 'NameAccordingTo', 'NamePublishedIn', 
'NamePublishedInYear', 'HigherClassification', 'Kingdom', 'Phylum', 'Class', 
'Order', 'Family', 'Genus', 'Subgenus', 'SpecificEpithet', 
'InfraspecificEpithet', 'TaxonRank', 'VerbatimTaxonRank', 
'ScientificNameAuthorship', 'VernacularName', 'NomenclaturalCode', 
'TaxonomicStatus', 'NomenclaturalStatus', 'TaxonRemarks']

DWC_ALL = DWC_RECLEVEL + DWC_OCC + DWC_EVENT + DWC_LOCATION + DWC_GEO + DWC_ID + DWC_TAXON
DWC_ALL_LOWER = [x.lower() for x in DWC_ALL]
DWC_HEADER_LIST = ['datasource_and_rights'] + DWC_ALL_LOWER
DWC_HEADER = '\t'.join(DWC_HEADER_LIST)

def classify(record):
	result = dict(meta=record, loc={}, reclevel={}, occ={}, event={}, geo={}, 
		id={}, taxon={})

	for term in DWC_LOCATION:
		if record.has_key(term.lower()):
			result['loc'][term] = record[term.lower()]

	for term in DWC_RECLEVEL:
		if record.has_key(term.lower()):
			result['reclevel'][term] = record[term.lower()]

	for term in DWC_OCC:
		if record.has_key(term.lower()):
			result['occ'][term] = record[term.lower()]

	for term in DWC_EVENT:
		if record.has_key(term.lower()):
			result['event'][term] = record[term.lower()]

	for term in DWC_GEO:
		if record.has_key(term.lower()):
			result['geo'][term] = record[term.lower()]

	for term in DWC_ID:
		if record.has_key(term.lower()):
			result['id'][term] = record[term.lower()]

	for term in DWC_TAXON:
		if record.has_key(term.lower()):
			result['taxon'][term] = record[term.lower()]

	return result

def search_resource_counts(recs):	
    # Build json for search counts
    res_counts = {}
    for rec in recs:
        dwca = rec['url']
        if dwca not in res_counts:
            res_counts[dwca] = 1
        else:
            res_counts[dwca] += 1
    return json.dumps(res_counts)