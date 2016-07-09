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
    DWC_RECLEVEL: ['InstitutionCode', 'CollectionCode', 'DatasetName', 
      'OwnerInstitutionCode', 'References', 'BibliographicCitation', 
      'BasisOfRecord', 'VNType', 'DCType', 'InformationWithheld', 'DataGeneralizations', 
      'License', 'AccessRights', 'RightsHolder', 
      'InstitutionID', 'CollectionID', 'DatasetID', 'Modified', 'Language' 
      ],

    DWC_OCC: ['OccurrenceID', 'MaterialSampleID', 'CatalogNumber', 'OtherCatalogNumbers', 
      'RecordNumber', 'RecordedBy', 'IndividualCount', 'Sex', 'LifeStage', 
      'ReproductiveCondition', 'Behavior', 'EstablishmentMeans', 'OccurrenceStatus', 
      'Preparations', 'Disposition',
      'AssociatedMedia', 'AssociatedReferences', 'AssociatedSequences', 'AssociatedTaxa',
      'OccurrenceRemarks', 'DynamicProperties'],

    DWC_ORGANISM: ['OrganismID', 'OrganismName', 'OrganismScope', 'OrganismRemarks', 
      'AssociatedOccurrences', 'AssociatedOrganisms'],

    DWC_EVENT: ['EventID', 'FieldNumber', 'EventDate', 'EventTime', 'StartDayOfYear', 
      'EndDayOfYear', 'Year', 'Month', 'Day', 'VerbatimEventDate', 'Habitat', 
      'SamplingProtocol', 'SamplingEffort', 'FieldNotes', 'EventRemarks'],

    DWC_LOCATION: ['LocationID', 'HigherGeographyID', 'HigherGeography', 
      'Continent', 'WaterBody', 'IslandGroup', 'Island', 'Country', 'CountryCode', 
      'StateProvince', 'County', 'Municipality', 'Locality', 'VerbatimLocality', 
      'MinimumElevationInMeters', 'MaximumElevationInMeters', 'VerbatimElevation', 
      'MinimumDepthInMeters', 'MaximumDepthInMeters', 'VerbatimDepth', 
      'MinimumDistanceAboveSurfaceInMeters', 'MaximumDistanceAboveSurfaceInMeters', 
      'LocationAccordingTo', 'LocationRemarks', 'DecimalLatitude', 'DecimalLongitude', 
      'GeodeticDatum', 'CoordinateUncertaintyInMeters', 'CoordinatePrecision', 
      'PointRadiusSpatialFit', 'VerbatimCoordinates', 'VerbatimLatitude', 
      'VerbatimLongitude', 'VerbatimCoordinateSystem', 'VerbatimSRS', 'FootprintWKT', 
      'FootprintSRS', 'FootprintSpatialFit', 'GeoreferencedBy', 'GeoreferencedDate', 
      'GeoreferenceProtocol', 'GeoreferenceSources', 'GeoreferenceVerificationStatus', 
      'GeoreferenceRemarks'],

    DWC_GEO: ['GeologicalContextID', 'EarliestEonOrLowestEonothem', 
      'LatestEonOrHighestEonothem', 'EarliestEraOrLowestErathem', 
      'LatestEraOrHighestErathem', 'EarliestPeriodOrLowestSystem', 
      'LatestPeriodOrHighestSystem', 'EarliestEpochOrLowestSeries', 
      'LatestEpochOrHighestSeries', 'EarliestAgeOrLowestStage', 
      'LatestAgeOrHighestStage', 'LowestBiostratigraphicZone', 
      'HighestBiostratigraphicZone', 'LithostratigraphicTerms', 'Group', 'Formation', 
      'Member', 'Bed'],

    DWC_ID: ['IdentificationID', 'IdentificationQualifier', 'TypeStatus', 'IdentifiedBy', 
      'DateIdentified', 'IdentificationReferences', 'IdentificationVerificationStatus', 
      'IdentificationRemarks', 'PreviousIdentifications'],

    DWC_TAXON: ['ScientificNameID',  
      'NamePublishedInID', 'ScientificName', 'AcceptedNameUsage', 'OriginalNameUsage', 
      'NamePublishedIn', 'NamePublishedInYear', 'HigherClassification', 'Kingdom', 
      'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Subgenus', 'SpecificEpithet', 
      'InfraspecificEpithet', 'TaxonRank', 'VerbatimTaxonRank', 
      'ScientificNameAuthorship', 'VernacularName', 'NomenclaturalCode', 
      'TaxonomicStatus'],

    DWC_SUMMARY: ['InstitutionCode', 'CollectionCode', 'CatalogNumber',
      'Preparations', 'BasisOfRecord', 'Year', 'Country', 'State', 'County',
      'Locality', 'DecimalLatitude', 'DecimalLongitude'],

    VN_INDEX: ['Keyname', 'HasLicense', 'Rank', 'Mappable', 'HashID', 
      'HasTypeStatus', 'WasCaptive', 'HasTissue', 'HasMedia', 'IsFossil', 'HasLength', 
      'HasLifeStage', 'HasMass', 'HasSex', 'ICode', 'Networks'],

    VN_TRAIT: ['LengthInMM', 'LengthUnitsInferred', 'MassInG', 'MassUnitsInferred', 
      'LifeStage', 'UnderivedLifeStage', 'Sex', 'UnderivedSex'],

    DWC_ALL: function() {
      return _.union(this.DWC_RECLEVEL, this.DWC_OCC, this.DWC_ORGANISM, this.DWC_EVENT, 
        this.DWC_LOCATION, this.DWC_GEO, this.DWC_ID, this.DWC_TAXON, this.VN_TRAIT);
    },
    
    QUALITY: ['noCoords', 'noCountry', 'isZero', 'isOutOfWorld', 'isLowPrecision',
      'isOutOfCountry', 'isTransposed', 'isNegatedLatitude', 'isNegatedLongitude',
      'distanceToCountry', 'distanceToRangemap'],

    getIndexFields: function() {
      var indexfields = {};
//    For every indexfield defined here, there must be a corresponding reference in the 
//    index handler in webapp/www/js/app/views/detail.js
//    and a corresponding UI object in webapp/www/js/app/views/detail.html
      if (icode) indexfields['icode']=this.get('icode');
      if (gbifpublisherid) indexfields['gbifpublisherid']=this.get('gbifpublisherid');
      if (gbifdatasetid) indexfields['gbifdatasetid']=this.get('gbifdatasetid');
      if (keyname) indexfields['keyname']=this.get('keyname');
      if (occurrenceid) indexfields['occurrenceid']=this.get('occurrenceid');
      if (id) indexfields['id']=this.get('id');
      if (networks) indexfields['networks']=this.get('networks');
      if (rank) indexfields['rank']=this.get('rank');
      if (haslicense) indexfields['haslicense']=this.get('haslicense');
      if (hastypestatus) indexfields['hastypestatus']=this.get('hastypestatus');
      if (hastissue) indexfields['hastissue']=this.get('hastissue');
      if (hasmedia) indexfields['hasmedia']=this.get('hasmedia');
      if (haslength) indexfields['haslength']=this.get('haslength');
      if (hasmass) indexfields['hasmass']=this.get('hasmass');
      if (hassex) indexfields['hassex']=this.get('hassex');
      if (haslifestage) indexfields['haslifestage']=this.get('haslifestage');
      if (isfossil) indexfields['isfossil']=this.get('isfossil');
      if (wascaptive) indexfields['wascaptive']=this.get('wascaptive');
      if (mappable) indexfields['mappable']=this.get('mappable');
      if (hashid) indexfields['hashid']=this.get('hashid');
      return indexfields;
    },

    getQualityFlags: function() {

      var lat = this.get('decimallatitude');
      var lon = this.get('decimallongitude');
      var country = this.get('country');
      var datum = this.get('geodeticdatum');

      // default value: not assessed
      var issues_final = {
        "hasCoordinates": "Could not be assessed",
        "hasCountry": "Could not be assessed",
        "nonZeroCoordinates": "Could not be assessed",
        "highPrecisionCoordinates": "Could not be assessed",
        "hasDatum": "Could not be assessed",
        "coordinatesInsideCountry": "Could not be assessed",
        "distanceToCountryInKm": "Could not be assessed",
        "distanceToRangeMapInKm": "Could not be assessed",
        "isValidLatitude": "Could not be assessed",
        "isValidLongitude": "Could not be assessed",
        "transposedCoordinates": "Could not be assessed",
        "negatedLatitude": "Could not be assessed",
        "negatedLongitude": "Could not be assessed"
      }

      if (country == 'Not specified' || country == 'N/A') {
        country = null;    
      } else if (country == 'USA' || country == 'U.S.A.') {  // PATCH: Convert 'USA' and 'U.S.A.' into 'US' for the quality api
        country = 'US';
      };

      var binomial = this.get('scientificname');

      // Call the Quality API      
      url = 'http://api-geospatial.vertnet-portal.appspot.com/geospatial';
      
      if (lat) {
        lat = lat.trim();
      } else {
        lat = "";
      }

      if (lon) {
        lon = lon.trim();
      } else {
        lon = "";
      }

      url = url.concat('?decimalLatitude=',lat,'&decimalLongitude=',lon,'&countryCode=',country,'&scientificName=',binomial);
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

      // By default, turn off warning or error message

      issues_final['showMissing'] = false;
      issues_final['showWarning'] = false;
      issues_final['showError'] = false;

      if (issues) {
        if ('flags' in issues) {
          var fl = issues.flags;
          console.log(fl);

          if (fl.hasCoordinates === true) issues_final.hasCoordinates = "Yes";
          if (fl.hasCoordinates === false) {
            issues_final.hasCoordinates = "NO";
            issues_final.showError = true;
          }

          if (fl.hasCountry === true) issues_final.hasCountry = "Yes";
          if (fl.hasCountry === false) {
            issues_final.hasCountry = "NO";
            issues_final.showError = true;
          }

          if (fl.nonZeroCoordinates === true) issues_final.nonZeroCoordinates = "No";
          if (fl.nonZeroCoordinates === false) {
            issues_final.nonZeroCoordinates = "YES";
            issues_final.showWarning = true;
          }

          if (fl.highPrecisionCoordinates === true) issues_final.highPrecisionCoordinates = "Yes";
          if (fl.highPrecisionCoordinates === false) {
            issues_final.highPrecisionCoordinates = "NO";
            issues_final.showWarning = true;
          }

          if (datum) {
            issues_final.hasDatum = "Yes";
          } else {
            issues_final.hasDatum = "NO";
            issues_final.showWarning = true;
          }

          if (fl.coordinatesInsideCountry === true) {
            issues_final.coordinatesInsideCountry = "Yes";
            issues_final.transposedCoordinates = "No";
            issues_final.negatedLatitude = "Yes";
            issues_final.negatedLongitude = "Yes";
            issues_final.distanceToCountryInKm = "0";
          }
          if (fl.coordinatesInsideCountry === false) {
            issues_final.coordinatesInsideCountry = "NO";
            issues_final.transposedCoordinates = (fl.transposedCoordinates ? "YES" : "No");
            issues_final.negatedLatitude = (fl.negatedLatitude ? "NO" : "Yes");
            issues_final.negatedLongitude = (fl.negatedLongitude ? "NO" : "Yes");
            issues_final.distanceToCountryInKm = fl.distanceToCountryInKm;
            issues_final.showError = true;
          }

          if (fl.coordinatesInsideRangeMap === true) {
            issues_final.distanceToRangeMapInKm = "0";
          }
          if (fl.coordinatesInsideRangeMap === false) {
            issues_final.distanceToRangeMapInKm = fl.distanceToRangeMapInKm;
            issues_final.showWarning = true;
          }

          if (lat) {
            if (lat<=90 && lat>=-90) {
              issues_final.isValidLatitude = "Yes";
            } else {
              issues_final.isValidLatitude = "NO";
              issues_final.showError = true;
            }
          }
          
          if (lon) {
            if (lon<=180 && lon>=-180) {
              issues_final.isValidLongitude = "Yes";
            } else {
              issues_final.isValidLongitude = "NO";
              issues_final.showError = true;
            }       
          }
        } else {
          issues_final.showMissing = true;
        }
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
              newtext = parts[i].replace(exp,"<a target='_blank' href='$1'>$1</a>");
          } else {
              newtext = newtext + ", " + parts[i].replace(exp,"<a target='_blank' href='$1'>$1</a>");
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
      return this._terms(this.DWC_OCC);
    },

    organism: function() {
      return this._terms(this.DWC_ORGANISM);
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

    trait: function() {
      return this._terms(this.VN_TRAIT);
    },

    all: function() {
      return _.extend({}, this.loc(), this.reclevel(), this.occ(), this.organism(), 
        this.event(), this.geo(), this.iden(), this.taxon(), this.trait());
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
