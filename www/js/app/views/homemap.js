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

// Defines the view for the home page map.
define([
  // dependencies
  'jquery',
  'underscore',
  'mps',
  'backbone',
  'text!views/homemap.html',
], function ($, _, mps, Backbone, template) {
  return Backbone.View.extend({

    el: '#mapContainer',
    options: null,
    map: null,
    displays: [],

    initialize: function (options) {
      this.template = _.template(template);
      this.options = {
        zoom: 3,
        scrollwheel: false,
        center: new google.maps.LatLng(20,0),
        mapTypeId: google.maps.MapTypeId.TERRAIN
      };
    },

    render: function () {
      var map = null;
      if (!this.map) {
        this.$el.html(this.template());
        if (!window.google || !window.google.maps) return this;
        this.map = new google.maps.Map($('#homemap').get(0), this.options);
      }
      map = this.map;
      cartodb.createLayer(map, 'http://vertnet.cartodb.com/api/v1/viz/loc/viz.json', {
        query: 'select * from {{table_name}}',
        interactivity: null, 
        infowindows: false 
      }).on('done', function(layer) {
        map.overlayMapTypes.setAt(0, layer);
        layer.on('featureOver', function(e, pos, latlng, data) {
          cartodb.log.log(e, pos, latlng, data);
        });
        layer.on('error', function(err) {
          cartodb.log.log('error: ' + err);
        });
      }).on('error', function() {
        cartodb.log.log("some error occurred");
      });

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
      google.maps.event.trigger(this.map, 'resize');
      this.map.setZoom(this.map.getZoom());
      this.map.setCenter(this.map.getCenter());
    },
  });
});