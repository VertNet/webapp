/*
 * Occurrence detail map.
 */

define([
  'jQuery',
  'Underscore',
  'mps',
  'Backbone',
  'text!explore/occ/OccDetailMap.html'
], function ($, _, mps, Backbone, template) {
  return Backbone.View.extend({

    options: null,

    map: null,

    initialize: function (options) {
      var lat = options.lat ? parseFloat(options.lat) : 0;
      var lon = options.lon ? parseFloat(options.lon) : 0;
      this.latlon = new google.maps.LatLng(lat, lon);
      this.options = {
        zoom: 14,
        center: new google.maps.LatLng(lat, lon),
        mapTypeId: google.maps.MapTypeId.TERRAIN
      };
    },

    render: function () {
      var map = null;
      var marker = null;
      var latlon = new google.maps.LatLng(59.327383, 18.06747);

      this.$el.html(_.template(template));

      if (!this.map) {
        if (!window.google || !window.google.maps) {
          return this;
        }
        this.map = new google.maps.Map(this.$('#map')[0], this.options);
        marker = new google.maps.Marker({
          map: this.map,
          draggable: false,
          animation: google.maps.Animation.DROP,
          position: this.latlon
        });
      }
      map = this.map;
      return this;
    }
  });
});