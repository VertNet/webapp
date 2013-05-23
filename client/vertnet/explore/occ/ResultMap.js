/*
 * Occurrence search result map.
 */

define([
  'jQuery',
  'Underscore',
  'mps',
  'map',
  'Backbone',
  'text!explore/occ/ResultMap.html'
], function ($, _, mps, map, Backbone, template) {
  return Backbone.View.extend({

    options: null,

    map: null,

    initialize: function (options, app) {
      var lat = options.lat ? parseFloat(options.lat) : 0;
      var lon = options.lon ? parseFloat(options.lon) : 0;
      this.app = app;
      this.markers = [];

    },

    render: function () {
      var marker = null;

      this.$el.html(_.template(template));

      if (!this.map) {
        if (!window.google || !window.google.maps) {
          return this;
        }
        //this.latlon = new google.maps.LatLng(lat, lon);
        this.options = {
          zoom: 2,
          center: new google.maps.LatLng(0, 0),
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
        this.map = new google.maps.Map(this.$('#map')[0], this.options);
        this.collection.on('add', this._updateMarkers, this);
        this.collection.on('reset', this._updateMarkers, this);
        this._updateMarkers();
      }
      //map = this.map;
      this.resize();

      return this;
    },

    _updateMarkers: function() {
      // wrapper for infoWindow
      google.maps.InfoWindowZ=function(opts){
          var GM = google.maps,
              GE = GM.event,
              iw = new GM.InfoWindow(),
              ce;

             if(!GM.InfoWindowZZ){
                GM.InfoWindowZZ=Number(GM.Marker.MAX_ZINDEX);
             }

             GE.addListener(iw,'content_changed',function(){
               if(typeof this.getContent()=='string'){
                  var n=document.createElement('div');
                      n.innerHTML=this.getContent();
                      this.setContent(n);
                      return;
               }
               GE.addListener(this,'domready',
                               function(){
                                var _this=this;
                                _this.setZIndex(++GM.InfoWindowZZ);
                                if(ce){
                                  GM.event.removeListener(ce);
                                }
                                ce=GE.addDomListener(this.getContent().parentNode
                                                  .parentNode.parentNode,'click',
                                                  function(){
                                                  _this.setZIndex(++GM.InfoWindowZZ);
                                });
                              })
             });

             if(opts)iw.setOptions(opts);
             return iw;
        }
        // end of wrapper

      this.bounds = new google.maps.LatLngBounds();

      // Remove markers from map.
      _.each(this.markers, _.bind(function(marker) {
        marker.setMap(null);
      }, this));

      // Clear markers array.
      this.markers.splice(0, this.markers.length);

      _.each(this.collection.models, _.bind(function(model) {
        
        // values for the infoWindow
        var lat = model.get('decimallatitude') ? parseFloat(model.get('decimallatitude')) : null;
        var lon = model.get('decimallongitude') ? parseFloat(model.get('decimallongitude')) : null;
        var sciname = model.get('scientificname') ? model.get('scientificname') : null;
        var year = model.get('year') ? parseInt(model.get('year')) : null;
        var country = model.get('country') ? model.get('country') : null;
        var stateprov = model.get('stateprovince') ? model.get('stateprovince') : null;
        var county = model.get('county') ? model.get('county') : null;
        var instcode= model.get('institutioncode') ? model.get('institutioncode') : null;
        var catalogno = model.get('catalognumber') ? model.get('catalognumber') : null;
        var occid = model.get('id') ? model.get('id') : null;
        //var datum = model.get('geodeticdatum') ? model.get('geodeticdatum') : null;
        //var uncert = model.get('coordinateuncertaintyinmeters') ? model.get('coordinateuncertaintyinmeters') : null;
        var contentString = null;
        var infowindow = null;
        var specificURL = model.get('keyname') ? model.get('keyname') : null;
        var specificURLright = specificURL.substr(0, specificURL.lastIndexOf('/'))+"?id="+specificURL.substr(specificURL.lastIndexOf('/')+1);
        var url = '../'+specificURLright+'&view=darwincore';

        var latlon = null;
        var marker = null;
        
        if (lat && lon) { 
          latlon = new google.maps.LatLng(lat, lon);
          this.bounds.extend(latlon);
          
          // Create content for the infoWindow
          contentString = '<h3>Occurrence Record</h3><font size="2"><table border="0">';
          contentString += '<tr><td><b>DwC Term</b></td><td><b>Value</b></td></tr>';
          contentString += '<tr><td><i>Occurrence ID</i></td><td>'+occid+'</td></tr>';
          contentString += '<tr><td><i>Scientific Name</i></td><td>'+sciname+'</td></tr>';
          contentString += '<tr><td><i>Institution code</i></td><td>'+instcode+'</td></tr>';
          contentString += '<tr><td><i>Catalog number</i></td><td>'+catalogno+'</td></tr>';
          contentString += '<tr><td><i>Year</i></td><td>'+year+'</td></tr>';
          contentString += '<tr><td><i>Country</i></td><td>'+country+'</td></tr>';
          contentString += '<tr><td><i>State or Province</i></td><td>'+stateprov+'</td></tr>';
          contentString += '<tr><td><i>County</i></td><td>'+county+'</td></tr>';
          contentString += '<tr><td><i>Latitude</i></td><td>'+lat+'</td></tr>';
          contentString += '<tr><td><i>Longitude</i></td><td>'+lon+'</td></tr>';
          //contentString += '<tr><td><i>Datum</i></td><td>'+datum+'</td></tr>';
          //contentString += '<tr><td><i>Uncertainty</i></td><td>'+uncert+'</td></tr>';
          contentString += '</table>';
          contentString += '<a href="'+url+'">Link to the detail page</a></font>';
         
          // Create infoWindow
          infowindow = new google.maps.InfoWindowZ({
            title: occid,
            content : contentString
          });

          // Create marker
          marker = new google.maps.Marker({
            map: this.map,
            draggable: false,
            position: latlon,
            clickable: true,
          });

          // Listener to open the infowindow
          google.maps.event.addListener(marker, 'click', function() {
            infowindow.open(this.map, marker);
          });
          // Optional, when clicking on the map, all infoWindows disappear
          google.maps.event.addListener(this.map, 'click', function() {
            infowindow.close();
          });

          // Add marker to the array
          console.log("adding marker");
          this.markers.push(marker);
        }
      }, this));
      this.resize();
    },

    resize: function() {
      google.maps.event.trigger(this.map, 'resize');
      this.map.setZoom(this.map.getZoom());
      this.map.setCenter(this.map.getCenter());
      this.map.setZoom(2);
      centerZero = new google.maps.LatLng(0, 0);
      this.map.setCenter(centerZero);
      if (this.markers.length != 0) {
        this.map.fitBounds(this.bounds);
      }
    },

  });
});