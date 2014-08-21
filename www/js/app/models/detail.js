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

    VN_INDEX: ['Rank', 'Harvestid', 'Networks', 'Keyname', 'ICode', 'Fossil', 'Tissue', 
      'Media', 'HasTypeStatus', 'Mappable', 'Resource', 'Type'],

    DWC_ALL: function() {
      return _.union(this.DWC_RECLEVEL, this.DWC_OCC, this.DWC_EVENT, 
        this.DWC_LOCATION, this.DWC_GEO, this.DWC_ID, this.DWC_TAXON);
    },
    
    QUALITY: ['noCoords', 'noCountry', 'isZero', 'isOutOfWorld', 'isLowPrecision',
      'isOutOfCountry', 'isTransposed', 'isNegatedLatitude', 'isNegatedLongitude',
      'distanceToCountry', 'distanceToRangemap'],

    getIndexFields: function() {
      var indexfields = {};
//      var indexkeys = this.vnindex();
//      for (var key in indexkeys) {
//        if (this.key){
//          indexfields[key]=this.get(key);
//        }
//      }  
      if (rank) indexfields['rank']=this.get('rank');
      if (harvestid) indexfields['harvestid']=this.get('harvestid');
      if (networks) indexfields['networks']=this.get('networks');
      if (keyname) indexfields['keyname']=this.get('keyname');
      if (icode) indexfields['icode']=this.get('icode');
//      if (fossil) indexfields['fossil']=this.get('fossil');
//      if (tissue) indexfields['tissue']=this.get('tissue');
//      if (media) indexfields['media']=this.get('media');
//      if (hastypestatus) indexfields['hastypestatus']=this.get('hastypestatus');
//      if (mappable) indexfields['mappable']=this.get('mappable');
//      if (resource) indexfields['resource']=this.get('resource');
//      if (type) indexfields['type']=this.get('type');
      return indexfields;
    },


    getQualityFlags: function() {
      var lat = this.get('decimallatitude');
      var lon = this.get('decimallongitude');
      var country = this.get('country');
      var datum = this.get('geodeticdatum');
      if (country == 'Not specified') {
        country = null;
      }
      var binomial = this.get('scientificname');
      
      // default value: not assessed
      var issues_final = {
        'hasCoordinates': 'Could not be assessed',
        'hasCountry': 'Could not be assessed',
        'isZero': 'Could not be assessed',
        'isGoodPrecision': 'Could not be assessed',
        'hasDatum': 'Could not be assessed',
        'isInsideCountry': 'Could not be assessed',
        'distanceToCountry': 'Could not be assessed',
        'distanceToRangemap': 'Could not be assessed',
        'isValidLatitude': 'Could not be assessed',
        'isValidLongitude': 'Could not be assessed',
        'isTransposed': 'Could not be assessed',
        'isGoodSignLatitude': 'Could not be assessed',
        'isGoodSignLongitude': 'Could not be assessed'
      };
      
      // If coordinates are present...
      if (lat && lon) {
          // ... run the quality api query
          url = 'https://jot-mol-qualityapi.appspot.com/_ah/api/qualityapi/v1/geospatial/'
          lat = lat.trim()
          lon = lon.trim()
          url = url.concat(lat,'/',lon,'/',country,'/',binomial)
          console.log(url);
          var issues = null;
          $.ajax({
              url: url,
              type: 'get',
              dataType: 'json',
              async: false,
              success: function(data) {
                  issues = data;
              }
          });
      }
      
      // By default, turn off warning or error message
      
      issues_final['showMissing'] = false;
      issues_final['showWarning'] = false;
      issues_final['showError'] = false;
      
      // Completeness
      
      if (lat && lon) {
        issues_final['hasCoordinates'] = 'Yes';
      } else {
        issues_final['hasCoordinates'] = 'NO';
        issues_final['showError'] = true;
      }

      if (country) {
        issues_final['hasCountry'] = 'Yes';
      } else {
        issues_final['hasCountry'] = 'NO';
        issues_final['showError'] = true;
      }
      
      if (lat && lon) {
          if (lat == 0 && lon == 0) {
            issues_final['isZero'] = 'YES';
            issues_final['showWarning'] = true;
          } else {
            issues_final['isZero'] = 'No';
          }
      } else {
          issues_final['isZero'] = 'Could not be assessed';
          issues_final['showMissing'] = true;
      }
      
      if (issues && 'isLowPrecision' in issues) {
        if (issues['isLowPrecision'].toString() == "false") {
           issues_final['isGoodPrecision'] = 'Yes';
        } else {
          issues_final['isGoodPrecision'] = 'NO';
          issues_final['showWarning'] = true;
        }
      } else {
          issues_final['isGoodPrecision'] = 'Could not be assessed';
          issues_final['showMissing'] = true;
      }
      
      if (datum) {
        issues_final['hasDatum'] = 'Yes';
      } else {
        issues_final['hasDatum'] = 'NO';
        issues_final['showWarning'] = true;
      }
      
      
      // Inconsistencies
      
      if (issues && 'isOutOfCountry' in issues) {
        if (issues['isOutOfCountry'].toString() == "false") {
           issues_final['isInsideCountry'] = 'Yes';
        } else {
          issues_final['isInsideCountry'] = 'NO';
          issues_final['showError'] = true;
        }
      } else {
          issues_final['isInsideCountry'] = 'Could not be assessed';
          issues_final['showMissing'] = true;
      }
      
      issues_final['distanceToCountry'] = (issues && 'distanceToCountry' in issues) ? issues['distanceToCountry'].toString() : "Could not be assessed";
      if (issues_final['distanceToCountry'] == "Could not be assessed") {
        issues_final['showWarning'] = true;
      } else if (issues_final['distanceToCountry'] != '0') {
        issues_final['showError'] = true;
      }
      
      issues_final['distanceToRangemap'] = (issues && 'distanceToRangemap' in issues) ? issues['distanceToRangemap'].toString() : "Could not be assessed";
      if (issues_final['distanceToRangemap'] == "Could not be assessed") {
        issues_final['showMissing'] = true;
      } else if (issues_final['distanceToRangemap'] != '0') {
        issues_final['showError'] = true;
      }
      
      
      // Errors
      
      if (lat && lon ) {
          if (lat <= 90 && lat >=-90) {
            issues_final['isValidLatitude'] = 'Yes';
          } else {
            issues_final['isValidLatitude'] = 'NO';
            issues_final['showError'] = true;
          }
      } else {
          issues_final['isValidLatitude'] = 'Could not be assessed';
          issues_final['showMissing'] = true;
      }
      
      if (lat && lon) {
          if (lon <= 180 && lon >=-180) {
            issues_final['isValidLongitude'] = 'Yes';
          } else {
            issues_final['isValidLongitude'] = 'NO';
            issues_final['showError'] = true;
          }
      } else {
          issues_final['isValidLongitude'] = 'Could not be assessed';
          issues_final['showMissing'] = true;
      }
      
      if (issues && 'isTransposed' in issues) {
        if (issues['isTransposed'].toString() == "false") {
           issues_final['isTransposed'] = 'No';
        } else {
          issues_final['isTransposed'] = 'YES';
          issues_final['showError'] = true;
        }
      } else {
          issues_final['isTransposed'] = 'Could not be assessed';
          issues_final['showMissing'] = true;
      }

      if (issues && 'isNegatedLatitude' in issues) {
        if (issues['isNegatedLatitude'].toString() == "false") {
           issues_final['isGoodSignLatitude'] = 'Yes';
        } else {
          issues_final['isGoodSignLatitude'] = 'NO';
          issues_final['showError'] = true;
        }
      } else {
          issues_final['isGoodSignLatitude'] = 'Could not be assessed';
          issues_final['showMissing'] = true;
      }
      
      if (issues && 'isNegatedLongitude' in issues) {
        if (issues['isNegatedLongitude'].toString() == "false") {
           issues_final['isGoodSignLongitude'] = 'Yes';
        } else {
          issues_final['isGoodSignLongitude'] = 'NO';
          issues_final['showError'] = true;
        }
      } else {
          issues_final['isGoodSignLongitude'] = 'Could not be assessed';
          issues_final['showMissing'] = true;
      }

      return issues_final;
    },

    
    getOccIdentifier: function() {
      var occid = this.get('institutioncode');
      if (this.get('collectioncode')) {
        var ccode = this.get('collectioncode');
        var newccode = ccode.replace(occid+' ','');
        occid += ' ' + newccode;
      } 
      if (this.get('catalognumber')) {
        occid += ' ' + this.get('catalognumber');
      } 
      return occid;
    },

    replaceURLWithHTMLLinks: function(text) {
      var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
      var parts = text.split(/[;,|]/);
      var newtext = "";
      for (var i = 0; i < parts.length; i++)
      {
          if (newtext.length == 0)
          {
              newtext = parts[i].replace(exp,"<a href='$1'>$1</a>");
          } else {
              newtext = newtext + ", " + parts[i].replace(exp,"<a href='$1'>$1</a>");
          }
      }
      return newtext;
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
      return this._terms(this.DWC_ALL);      
    },

    vnindex: function() {
      return this._terms(this.VN_INDEX);
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
