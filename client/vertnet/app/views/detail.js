define([
  'jquery',
  'backbone',
  'underscore',
  'util',
  'text!views/detail.html',
  'views/detailmap',
  'map',
  'mps'
  ], function ($, Backbone, _, util, template, OccDetailMap, map, mps) {
    return Backbone.View.extend({

      initialize: function(options, app) {
        this.app = app;
        this.template = _.template(template);
        mps.publish('spin', [true]);
      }, 

      render: function() {
        this.$el.html(this.template(this.model.attributes));
        map.init(_.bind(function() {
          var lat = this.$('#DecimalLatitude').text();
          var lon = this.$('#DecimalLongitude').text();
          if (lat && lon) {
            this.latlon = new google.maps.LatLng(lat, lon);
            this.options = {
              zoom: 6,
              scrollwheel: false,
              center: new google.maps.LatLng(lat, lon),
              mapTypeId: google.maps.MapTypeId.TERRAIN
            };
          }
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
        }, this));
        return this;
      },

     setTab: function(name) {
       var selector = '#detailTabs a[href="#' + name + '"]';
       this.$(selector).tab('show');
     },

     setup: function () {
        mps.publish('spin', [false]);
        return this;
      }
  });
});
