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

  loc: function() {
    var results = {};
    _.map(this.attributes, _.bind(function(val, key) {
      _.filter(this.DWC_LOCATION, function(term) {
        if (term.toLowerCase() === key) {
          results[term] = val;
        }
      });
    }, this));
    return results;
  },

  reclevel: function() {
    return {};
  },

  occ: function() {
    return {};
  }, 

  event: function() {
    return {};
  },

  geo: function() {
    return {};
  },

  iden: function() {
    return {};
  },

  taxon: function() {
    return {};
  }
  });
});
