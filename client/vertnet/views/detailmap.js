/*
 * Occurrence detail map.
 */
define([
  'jQuery',
  'Underscore',
  'mps',
  'Backbone',
  'text!views/detailmap.html'
], function ($, _, mps, Backbone, template) {
  return Backbone.View.extend({

    options: null,

    map: null,

    initialize: function (options) {
      var lat = options.lat ? parseFloat(options.lat) : null;
      var lon = options.lon ? parseFloat(options.lon) : null;
      if (lat && lon) {
        this.latlon = new google.maps.LatLng(lat, lon);
        console.log(options.lat);
        this.options = {
          zoom: 6,
          scrollwheel: false,
          center: new google.maps.LatLng(lat, lon),
          mapTypeId: google.maps.MapTypeId.TERRAIN
        };
      }
    },

    render: function () {
      var marker = null;
      var latlon = new google.maps.LatLng(59.327383, 18.06747);

      this.$el.html(_.template(template));

      if (!this.map) {
        if (!window.google || !window.google.maps) {
          return this;
        }
        this.map = new google.maps.Map(this.$('#detailmap')[0], this.options);
        if (this.latlon) {
          marker = new google.maps.Marker({
            map: this.map,
            draggable: false,
            animation: google.maps.Animation.DROP,
            position: this.latlon
          });
        } else {
          $('#occ-detail-map.occ-detail-map').hide();
        }
      }
      return this;
    },

    resize: function() {
      google.maps.event.trigger(this.map, 'resize');
      this.map.setZoom(this.map.getZoom());
      this.map.setCenter(this.latlon);
    }
  });
});
