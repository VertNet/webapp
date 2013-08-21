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

// Defines the view for the search result map.
define([
  'jquery',
  'underscore',
  'util',
  'mps',
  'map',
  'backbone',
  'text!views/resultmap.html'
  ], function ($, _, util, mps, map, Backbone, template) {
    return Backbone.View.extend({

      options: null,

      map: null,

      events: {
        'click #detail-link': 'handleDetailClick'
      },

      handleDetailClick: function(e) {
        e.preventDefault();
        var parts = e.target.href.split('/');
        var path = [parts[3], parts[4] ,parts[5]].join('/');
        var check = path.replace('?id=', '/').replace('o/', '');
        var model = _.find(this.collection.models, _.bind(function(model) {
          return check === model.attributes.keyname;
        }, this));
        this.app.occDetailModel = model;
        mps.publish('navigate', [{path: path, trigger: true}]);
      },

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
            zoom: 2,
            minZoom: 2,
            scrollwheel: false,
            center: new google.maps.LatLng(58, -150),
            mapTypeId: google.maps.MapTypeId.TERRAIN,
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
          this.map = new google.maps.Map(this.$('#map')[0], this.options);
          this.collection.on('add', this._updateMarkers, this);
          this.collection.on('reset', this._updateMarkers, this);
          this._updateMarkers();
        }

        google.maps.event.addListener(this.map, 'click', function(e) {
          console.log(e);
        });

        return this;
      },

      _updateMarkers: function() {
        google.maps.InfoWindowZ = function(opts) {
          var GM = google.maps,
          GE = GM.event,
          iw = new GM.InfoWindow(),
          ce;

          if (!GM.InfoWindowZZ) {
            GM.InfoWindowZZ=Number(GM.Marker.MAX_ZINDEX);
          }

          GE.addListener(iw,'content_changed',function() {
            if (typeof this.getContent()=='string') {
              var n = document.createElement('div');
              n.innerHTML=this.getContent();
              this.setContent(n);
              return;
            }
            GE.addListener(this,'domready', function() {
              var _this=this;
              _this.setZIndex(++GM.InfoWindowZZ);
              if (ce) {
                GM.event.removeListener(ce);
              }
              ce = GE.addDomListener(this.getContent().parentNode
                .parentNode.parentNode,'click',
                function() {
                  _this.setZIndex(++GM.InfoWindowZZ);
                });
            });
          });

          if (opts) {
            iw.setOptions(opts);
          }
          return iw;
        }

        this.bounds = new google.maps.LatLngBounds();

        // Remove markers from map.
        _.each(this.markers, _.bind(function(marker) {
          marker.setMap(null);
        }, this));

        // Clear markers array.
        this.markers.splice(0, this.markers.length);

        _.each(this.collection.models, _.bind(function(model) {

          // Values for the infoWindow
          var identification = model.get('icode') + ' ' + model.get('collectioncode') + ' ' + model.get('catalognumber');
          var taxonomy = model.get('class') + ': ' + model.get('scientificname');
          var location =  model.getLocation();
          var year = model.getYear();
          var lat = model.get('decimallatitude') ? parseFloat(model.get('decimallatitude')) : null;
          var lon = model.get('decimallongitude') ? parseFloat(model.get('decimallongitude')) : null;
          var latlon = lat + ',' + lon;
          var contentString = null;
          var infowindow = null;
          var specificURL = model.get('keyname') ? model.get('keyname') : null;
          var specificURLright = specificURL.substr(0, specificURL.lastIndexOf('/'))+"?id="+specificURL.substr(specificURL.lastIndexOf('/')+1);
          var url = 'o/'+specificURLright;
          var latlon = null;
          var marker = null;
          
          if (lat && lon) { 
            latlon = new google.maps.LatLng(lat, lon);
            this.bounds.extend(latlon);
            contentString = '<table class="table table-striped table-condensed table-bordered">';
            contentString += '<tr><td><b>Identification</b></td><td>'+identification+'</td></tr>';
            contentString += '<tr><td><b>Taxonomy</b></td><td>'+taxonomy+'</td></tr>';
            contentString += '<tr><td><b>Location</b></td><td>'+location+'</td></tr>';
            contentString += '<tr><td><b>Year</b></td><td>'+year+'</td></tr>';
            contentString += '<tr><td><b>LatLon</b></td><td>'+latlon+'</td></tr>';
            contentString += '</table>';
            contentString += '<a id="detail-link" href="'+url+'">Occurrence details »</a>';

            // Create infoWindow
            infowindow = new google.maps.InfoWindowZ({
              //title: occid,
              content : contentString,
              maxWidth: 400
            });

            // Create marker
            marker = new google.maps.Marker({
              map: this.map,
              draggable: false,
              position: latlon,
              clickable: true,
            });

            // Listener to open the infowindow
            google.maps.event.addListener(marker, 'click', _.bind(function() {
              infowindow.open(this.map, marker);
            }, this));

            // Optional, when clicking on the map, all infoWindows disappear
            google.maps.event.addListener(this.map, 'click', function() {
              infowindow.close();
            });

            // Add marker to the array
            this.markers.push(marker);
          }
        }, this));
      this.resize();
    },

    resize: function() {
      google.maps.event.trigger(this.map, 'resize');
      this.map.setZoom(this.map.getZoom());
      this.map.setCenter(this.map.getCenter());
      if (!_.isEmpty(this.markers)) {
        this.map.fitBounds(this.bounds)
      }
    },
  });
});
