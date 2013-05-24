/*
 * Model for an occurrence.
 */

define([
  'Underscore',
  'Backbone'
], function (_, Backbone) {
  return Backbone.Model.extend({
    DWC_LOCATION: [
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
      'VerbatimLongitude', 'VerbatimSRS', 'WaterBody'],

    DWC_RECLEVEL: [
      'InstitutionID', 'CollectionID', 'DatasetID', 
      'InstitutionCode', 'CollectionCode', 'DatasetName', 'OwnerInstitutionCode', 
      'BasisOfRecord', 'InformationWithheld', 'DataGeneralizations', 
      'DynamicProperties'],

    DWC_OCC: [
      'AssociatedMedia', 'AssociatedOccurrences', 'AssociatedReferences', 
      'AssociatedSequences', 'AssociatedTaxa', 'Behavior', 'CatalogNumber', 
      'Disposition', 'EstablishmentMeans', 'IndividualCount', 'IndividualID', 
      'LifeStage', 'OccurrenceID', 'OccurrenceRemarks', 'OccurrenceStatus', 
      'OtherCatalogNumbers', 'Preparations', 'PreviousIdentifications', 
      'RecordNumber', 'RecordedBy', 'ReproductiveCondition', 'Sex'],

    DWC_EVENT: [
      'Day', 'EndDayOfYear', 'EventDate', 'EventID', 'EventRemarks', 'EventTime', 
      'FieldNotes', 'FieldNumber', 'Habitat', 'Month', 'SamplingEffort', 
      'SamplingProtocol', 'StartDayOfYear', 'VerbatimEventDate', 'Year'],

    DWC_GEO: [
      'Bed', 'EarliestAgeOrLowestStage', 'EarliestEonOrLowestEonothem', 
      'EarliestEpochOrLowestSeries', 'EarliestEraOrLowestErathem', 
      'EarliestPeriodOrLowestSystem', 'Formation', 'GeologicalContextID', 'Group', 
      'HighestBiostratigraphicZone', 'LatestAgeOrHighestStage', 
      'LatestEonOrHighestEonothem', 'LatestEpochOrHighestSeries', 
      'LatestEraOrHighestErathem', 'LatestPeriodOrHighestSystem', 
      'LithostratigraphicTerms', 'LowestBiostratigraphicZone', 'Member'],

    DWC_ID: [
      'DateIdentified', 'IdentificationID', 'IdentificationQualifier', 
      'IdentificationReferences', 'IdentificationRemarks', 
      'IdentificationVerificationStatus', 'IdentifiedBy', 'TypeStatus'],

    DWC_TAXON: [
      'AcceptedNameUsage', 'AcceptedNameUsageID', 'Class', 'Family', 'Genus', 
      'HigherClassification', 'InfraspecificEpithet', 'Kingdom', 'NameAccordingTo', 
      'NameAccordingToID', 'NamePublishedIn', 'NamePublishedInID', 
      'NamePublishedInYear', 'NomenclaturalCode', 'NomenclaturalStatus', 'Order', 
      'OriginalNameUsage', 'OriginalNameUsageID', 'ParentNameUsage', 
      'ParentNameUsageID', 'Phylum', 'ScientificName', 'ScientificNameAuthorship', 
      'ScientificNameID', 'SpecificEpithet', 'Subgenus', 'TaxonConceptID', 'TaxonID', 
      'TaxonRank', 'TaxonRemarks', 'TaxonomicStatus', 'VerbatimTaxonRank', 
      'VernacularName'],

    isMappable: function() {
      var lat = this.get('decimallatitude');
      var lon = this.get('decimallongitude');
      lat = lat ? parseFloat(lat) : null;
      lon = lon ? parseFloat(lon) : null;
      if (lat && lon) {
        return (lat <= 90 && lat >= -90) && (lon <= 180 && lon >= -180);
      } else {
        return false;
      }
    },

    loc: function() {
      return this._terms(this.DWC_LOCATION);
    },

    reclevel: function() {
      return this._terms(this.DWC_RECLEVEL);
    },

    occ: function() {
      return this._terms(this.DWC_OCC);
    }, 

    event: function() {
      return this._terms(this.DWC_EVENT);
    },

    geo: function() {
      return this._terms(this.DWC_GEO);
    },

    iden: function() {
      return this._terms(this.DWC_ID);
    },

    taxon: function() {
      return this._terms(this.DWC_TAXON);
    },

    _terms: function(terms) {
      var results = {};
      _.map(this.attributes, _.bind(function(val, key) {
        _.filter(terms, function(term) {
          if (term.toLowerCase() === key) {
            results[term] = val;
          }
        });
      }, this));
      return results;
    }    
  });
});
