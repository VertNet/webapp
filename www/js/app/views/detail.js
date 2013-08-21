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

// Defines the occurrence detail page view.
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
