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

// Defines the view for the spatial search map in advanced search.
define([
  'jquery',
  'underscore',
  'util',
  'mps',
  'map',
  'backbone',
  'text!views/searchmap.html'
  ], function ($, _, util, mps, map, Backbone, template) {
    return Backbone.View.extend({

      options: null,

      map: null,

      initialize: function (options, app) {
        var lat = options.lat ? parseFloat(options.lat) : 0;
        var lon = options.lon ? parseFloat(options.lon) : 0;
        this.app = app;
        this.markers = [];

      },

      toggleSpatialSearchStyle: function(show) {
        var styles = [
          {
            "stylers": [
              { "visibility": "simplified" },
            ]
          }
        ];
        if (show) {
          this.map.setOptions({styles: styles});
        } else {
          this.map.setOptions({styles:[]});
          this.map.setZoom(3);
        }
      },

      render: function () {
        var marker = null;

        this.$el.html(_.template(template));

        if (!this.map) {
          if (!window.google || !window.google.maps) {
            return this;
          }
        this.options = {
          zoom: 3,
          minZoom: 2,
          scrollwheel: false,
          center: new google.maps.LatLng(58, -150),
          mapTypeId: google.maps.MapTypeId.TERRAIN,
          // Controlling the control
          disableDefaultUI: true,
          panControl: true,
          zoomControl: true,
          zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
          },
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
          },
          scaleControl: true,
          streetViewControl: false,
          overviewMapControl: false
        };
        this.map = new google.maps.Map(this.$('#searchmap')[0], this.options);
        this.collection.on('add', this._updateMarkers, this);
        this.collection.on('reset', this._updateMarkers, this);
        this._updateMarkers();
      }
      //map = this.map;
      this.resize();

      google.maps.event.addListener(this.map, 'click', function(e) {
        console.log(e);
      });

      return this;
    },

    _updateMarkers: function() {
      this.bounds = new google.maps.LatLngBounds();

      // Remove markers from map.
      _.each(this.markers, _.bind(function(marker) {
        marker.setMap(null);
      }, this));

      // Clear markers array.
      this.markers.splice(0, this.markers.length);

      _.each(this.collection.models, _.bind(function(model) {
        var lat = model.get('decimallatitude') ? parseFloat(model.get('decimallatitude')) : null;
        var lon = model.get('decimallongitude') ? parseFloat(model.get('decimallongitude')) : null;
        var latlon = null;
        var marker = null;
        
        if (lat && lon) { 
          latlon = new google.maps.LatLng(lat, lon);
          this.bounds.extend(latlon);
          marker = new google.maps.Marker({
            map: this.map,
            draggable: false,
            position: latlon,
            clickable: false,
          });
          this.markers.push(marker);
        }
      }, this));
      
      this.resize();
    },

    resize: function() {
      google.maps.event.trigger(this.map, 'resize');
      this.map.setZoom(this.map.getZoom());
      this.map.setCenter(this.map.getCenter());
    },
  });
});
