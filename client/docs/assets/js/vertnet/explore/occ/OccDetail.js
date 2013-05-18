define([
  'jQuery',
  'Backbone',
  'Underscore',
  'map',
  'explore/occ/OccDetailMap',
  ], function ($, Backbone, _, map, OccDetailMap) {
    return Backbone.View.extend({

      el: '#occ-detail-content',

      initialize: function(options, app) {
        this.app = app;
      }, 

      setup: function () {
        console.log('Setting up OccDetail');

        map.init(_.bind(function() {
          var lat = this.$('#DecimalLatitude').text();
          var lon = this.$('#DecimalLongitude').text();
          var map = new OccDetailMap({lat: lat, lon: lon}).render();
        }, this));
        
        return this;
      },
    });
});
