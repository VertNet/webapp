/**
 * This file is part of VertNet: https://github.com/VertNet/webapp
 * 
 * VertNet is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * VertNet is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Foobar.  If not, see: http://www.gnu.org/licenses
 */

// Defines the occurrence detail model. 
define([
  'underscore',
  'backbone'
], function (_, Backbone) {
  return Backbone.Model.extend({
    DWC_RECLEVEL: ['Type', 'Modified', 'Language', 'Rights', 'RightsHolder', 
      'AccessRights', 'BibliographicCitation', 'References', 'InstitutionID', 
      'CollectionID', 'DatasetID', 'InstitutionCode', 'CollectionCode', 
      'DatasetName', 'OwnerInstitutionCode', 'BasisOfRecord', 'InformationWithheld', 
      'DataGeneralizations', 'DynamicProperties'],

    DWC_OCC: ['OccurrenceID', 'CatalogNumber', 'OccurrenceRemarks', 'RecordNumber', 
      'RecordedBy', 'IndividualID', 'IndividualCount', 'Sex', 'LifeStage', 
      'ReproductiveCondition', 'Behavior', 'EstablishmentMeans', 'OccurrenceStatus', 
      'Preparations', 'Disposition', 'OtherCatalogNumbers', 'PreviousIdentifications', 
      'AssociatedMedia', 'AssociatedReferences', 'AssociatedOccurrences', 
      'AssociatedSequences', 'AssociatedTaxa'],

    DWC_EVENT: ['EventID', 'SamplingProtocol', 'SamplingEffort', 'EventDate', 
      'EventTime', 'StartDayOfYear', 'EndDayOfYear', 'Year', 'Month', 'Day', 
      'VerbatimEventDate', 'Habitat', 'FieldNumber', 'FieldNotes', 'EventRemarks'],

    DWC_LOCATION: ['LocationID', 'HigherGeographyID', 'HigherGeography', 
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
      'GeoreferenceVerificationStatus', 'GeoreferenceRemarks'],

    DWC_GEO: ['GeologicalContextID', 'EarliestEonOrLowestEonothem', 
      'LatestEonOrHighestEonothem', 'EarliestEraOrLowestErathem', 
      'LatestEraOrHighestErathem', 'EarliestPeriodOrLowestSystem', 
      'LatestPeriodOrHighestSystem', 'EarliestEpochOrLowestSeries', 
      'LatestEpochOrHighestSeries', 'EarliestAgeOrLowestStage', 
      'LatestAgeOrHighestStage', 'LowestBiostratigraphicZone', 
      'HighestBiostratigraphicZone', 'LithostratigraphicTerms', 'Group', 'Formation', 
      'Member', 'Bed'],

    DWC_ID: ['IdentificationID', 'IdentifiedBy', 'DateIdentified', 
      'IdentificationReferences', 'IdentificationVerificationStatus', 
      'IdentificationRemarks', 'IdentificationQualifier', 'TypeStatus'],

    DWC_TAXON: ['TaxonID', 'ScientificNameID', 'AcceptedNameUsageID', 
      'ParentNameUsageID', 'OriginalNameUsageID', 'NameAccordingToID', 
      'NamePublishedInID', 'TaxonConceptID', 'ScientificName', 'AcceptedNameUsage', 
      'ParentNameUsage', 'OriginalNameUsage', 'NameAccordingTo', 'NamePublishedIn', 
      'NamePublishedInYear', 'HigherClassification', 'Kingdom', 'Phylum', 'Class', 
      'Order', 'Family', 'Genus', 'Subgenus', 'SpecificEpithet', 
      'InfraspecificEpithet', 'TaxonRank', 'VerbatimTaxonRank', 
      'ScientificNameAuthorship', 'VernacularName', 'NomenclaturalCode', 
      'TaxonomicStatus', 'NomenclaturalStatus', 'TaxonRemarks'],

    DWC_SUMMARY: ['InstitutionCode', 'CollectionCode', 'CatalogNumber',
      'Preparations', 'BasisOfRecord', 'Year', 'Country', 'State', 'County',
      'Locality', 'DecimalLatitude', 'DecimalLongitude'],

    DWC_ALL: function() {
      return _.union(this.DWC_RECLEVEL, this.DWC_OCC, this.DWC_EVENT, 
        this.DWC_LOCATION, this.DWC_GEO, this.DWC_ID, this.DWC_TAXON);
    },

    replaceURLWithHTMLLinks: function(text) {
      var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
      return text.replace(exp,"<a href='$1'>$1</a>"); 
    },

    getRights: function() {
      return this.replaceURLWithHTMLLinks(this.get('emlrights'));
    },
    
    getYear: function() {
      if (this.get('year')) {
        return this.get('year');
      } else {
        return '';
      }
    },

    getSciName: function() {
      var name = this.get('scientificname');
      if (name) {
        return name.toLowerCase().charAt(0).toUpperCase() + name.slice(1);
      }
      return 'detail';
    },
    
    getLocation: function() {
      var loc = '';
      var locality = this.get('locality');
      if (this.get('country')) {
        loc += this.get('country');
      }
      if (this.get('stateprovince')) {
        if (this.get('country')) {
          loc += ', ';
        }
        loc += this.get('stateprovince');
      }
      if (this.get('county')) {
        if (this.get('stateprovince')) {
          loc += ', ';
        }
        loc += this.get('county');
      }
      if (locality) {
        if (loc.length > 0) {
          loc += ': ';
        }
        loc += locality;
        if (loc.length > 70) {
          if (loc.slice(0, 70)[69] === ' ') {
            loc = loc.slice(0, 71) + '...';          
          } else {
            loc = loc.slice(0, 70) + '...';
          }
        }
      }
      return loc;
    },

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
      var results = this._terms(this.DWC_OCC);
      results['OccurrenceID'] = this.get('id');
      return results;
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

    all: function() {
      return _.extend({}, this.loc(), this.reclevel(), this.occ(), this.event(), this.geo(),
        this.iden(), this.taxon());
    },

    summary: function() {
      return this._terms(this.DWC_SUMMARY);      
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
