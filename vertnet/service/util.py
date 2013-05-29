DWC_LOCATION = [
	'Continent', 'CoordinatePrecision', 'CoordinateUncertaintyInMeters', 
	'Country', 'CountryCode', 'County', 'DecimalLatitude', 'DecimalLongitude', 
	'FootprintSRS', 'FootprintSpatialFit', 'FootprintWKT', 'GeodeticDatum', 
	'GeoreferenceProtocol', 'GeoreferenceRemarks', 'GeoreferenceSources', 
	'GeoreferenceVerificationStatus', 'GeoreferencedBy', 'GeoreferencedDate', 
	'HigherGeography', 'HigherGeographyID', 'Island', 'IslandGroup', 
	'Locality', 'LocationAccordingTo', 'LocationID', 'LocationRemarks', 
	'MaximumDepthInMeters', 'MaximumDistanceAboveSurfaceInMeters', 
	'MaximumElevationInMeters', 'MinimumDepthInMeters', 
	'MinimumDistanceAboveSurfaceInMeters', 'MinimumElevationInMeters', 
	'Municipality', 'PointRadiusSpatialFit', 'StateProvince', 
	'VerbatimCoordinateSystem', 'VerbatimCoordinates', 'VerbatimDepth', 
	'VerbatimElevation', 'VerbatimLatitude', 'VerbatimLocality', 
	'VerbatimLongitude', 'VerbatimSRS', 'WaterBody']

DWC_RECLEVEL = [
	'InstitutionID', 'CollectionID', 'DatasetID', 
	'InstitutionCode', 'CollectionCode', 'DatasetName', 'OwnerInstitutionCode', 
	'BasisOfRecord', 'InformationWithheld', 'DataGeneralizations', 
	'DynamicProperties']

DWC_OCC = [
	'AssociatedMedia', 'AssociatedOccurrences', 'AssociatedReferences', 
	'AssociatedSequences', 'AssociatedTaxa', 'Behavior', 'CatalogNumber', 
	'Disposition', 'EstablishmentMeans', 'IndividualCount', 'IndividualID', 
	'LifeStage', 'OccurrenceID', 'OccurrenceRemarks', 'OccurrenceStatus', 
	'OtherCatalogNumbers', 'Preparations', 'PreviousIdentifications', 
	'RecordNumber', 'RecordedBy', 'ReproductiveCondition', 'Sex']

DWC_EVENT = [
	'Day', 'EndDayOfYear', 'EventDate', 'EventID', 'EventRemarks', 'EventTime', 
	'FieldNotes', 'FieldNumber', 'Habitat', 'Month', 'SamplingEffort', 
	'SamplingProtocol', 'StartDayOfYear', 'VerbatimEventDate', 'Year']

DWC_GEO = [
	'Bed', 'EarliestAgeOrLowestStage', 'EarliestEonOrLowestEonothem', 
	'EarliestEpochOrLowestSeries', 'EarliestEraOrLowestErathem', 
	'EarliestPeriodOrLowestSystem', 'Formation', 'GeologicalContextID', 'Group', 
	'HighestBiostratigraphicZone', 'LatestAgeOrHighestStage', 
	'LatestEonOrHighestEonothem', 'LatestEpochOrHighestSeries', 
	'LatestEraOrHighestErathem', 'LatestPeriodOrHighestSystem', 
	'LithostratigraphicTerms', 'LowestBiostratigraphicZone', 'Member']

DWC_ID = [
	'DateIdentified', 'IdentificationID', 'IdentificationQualifier', 
	'IdentificationReferences', 'IdentificationRemarks', 
	'IdentificationVerificationStatus', 'IdentifiedBy', 'TypeStatus']

DWC_TAXON = [
	'AcceptedNameUsage', 'AcceptedNameUsageID', 'Class', 'Family', 'Genus', 
	'HigherClassification', 'InfraspecificEpithet', 'Kingdom', 'NameAccordingTo', 
	'NameAccordingToID', 'NamePublishedIn', 'NamePublishedInID', 
	'NamePublishedInYear', 'NomenclaturalCode', 'NomenclaturalStatus', 'Order', 
	'OriginalNameUsage', 'OriginalNameUsageID', 'ParentNameUsage', 
	'ParentNameUsageID', 'Phylum', 'ScientificName', 'ScientificNameAuthorship', 
	'ScientificNameID', 'SpecificEpithet', 'Subgenus', 'TaxonConceptID', 'TaxonID', 
	'TaxonRank', 'TaxonRemarks', 'TaxonomicStatus', 'VerbatimTaxonRank', 
	'VernacularName']

DWC_ALL = DWC_LOCATION + DWC_RECLEVEL + DWC_OCC + DWC_EVENT + DWC_GEO + DWC_ID + DWC_TAXON
DWC_ALL_LOWER = [x.lower() for x in DWC_ALL]

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