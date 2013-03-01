/*
 * Map view
 */

define([
  // dependencies
  'jQuery',
  'Underscore',
  'mps',
  'Backbone',
  'text!/templates/map.html',
], function ($, _, mps, Backbone, template) {
  return Backbone.View.extend({

    el: '#map',
    options: null,
    map: null,
    displays: [],

    initialize: function (options) {
      this.template = _.template(template);
      this.options = {
        zoom: 3,
        center: new google.maps.LatLng(37.3689, -122.0353),
        maxZoom: 10,
        minZoom: 2,
        minLat: -85,
        maxLat: 85,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "administrative",
            stylers: [
            { visibility: "on" }
            ]
          },
          {
            featureType: "administrative.locality",
            stylers: [
            { visibility: "off" }
            ]
          },
          {
            featureType: "landscape",
            stylers: [
            { visibility: "off" }
            ]
          },
          {
            featureType: "road",
            stylers: [
            { visibility: "off" }
            ]
          },
          {
            featureType: "poi",
            stylers: [
            { visibility: "off" }
            ]
          },{
            featureType: "water",
            stylers: [
            { visibility: "on" },
            { saturation: -65 },
            { lightness: -15 },
            { gamma: 0.83 }
            ]
          },
          {
            featureType: "transit",
            stylers: [
            { visibility: "off" }
            ]
          },{
            featureType: "administrative",
            stylers: [
            { visibility: "on" }
            ]
          },{
            featureType: "administrative.country",
            stylers: [
            { visibility: "on" }
            ]
          },{
            featureType: "administrative.province",
            stylers: [
            { visibility: "on" }
            ]
          }
        ]
      };
    },

    render: function () {
      if (!this.map) {
        this.$el.html(this.template());
        if (!window.google || !window.google.maps) return this;
        this.map = new google.maps.Map($('#map', this.el).get(0), this.options);
        //this.addEvents();
      }
      return this;
    },

    addDisplays: function () {
      // top-left widgets
      this.displays.push(new ControlDisplay({
        widgets: [
          { name: 'Search', position: { y: 'top' }},
          { name: 'Results', position: { y: 'bottom' }}
        ],
        position: { x: 'left', y: 'top' }
      }, this).render());
      // top-right widgets
      this.displays.push(new ControlDisplay({
        widgets: [
          { name: 'Query', position: { y: 'top' }}
        ],
        position: { x: 'right', y: 'top' }
      }, this).render());

    },

    addEvents: function () {
      var myMap = this.map;
      google.maps.event.addListener(this.map, 'click', function(event) {
        mps.publish('species-list-query-click', [{map: myMap, gmaps_event : event}]);
      });
    },

    getDisplay: function(position) {
      return _.find(this.displays, function (display) {
        return _.isEqual(position, display.model.get('position'));
      });
    },

    resize: function() {
      if (window.google && window.google.maps)
        google.maps.event.trigger(this.map, 'resize');
      Backbone.View.prototype.resize.call(this);
    },

  });
});
