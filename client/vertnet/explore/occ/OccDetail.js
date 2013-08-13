define([
  'jQuery',
  'Backbone',
  'Underscore',
  'util',
  'explore/occ/DarwinCoreTab',
  'text!explore/occ/OccDetail.html',
  'explore/occ/OccDetailMap',
  'map',
  'mps'
  ], function ($, Backbone, _, util, DarwinCoreTab, template, OccDetailMap, map, mps) {
    return Backbone.View.extend({

      initialize: function(options, app) {
        this.app = app;
        this.template = _.template(template);
        mps.publish('spin', [true]);
      }, 

      render: function() {
        this.$el.html(this.template(this.model.attributes));
        //this.darwinCoreTab = new DarwinCoreTab({model: this.model}, this.app);
        //this.$('#darwincore').html(this.darwinCoreTab.render().el);
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
          //this.mapView = new OccDetailMap({lat: lat, lon: lon});
          //this.mapView.render();
          //this.$('#map').css('height', '400px');
          //this.$('#occ-detail-map').html(this.mapView.render().el);
          //this.mapView.resize();
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
              //$('#occ-detail-map.occ-detail-map').css('height', '400px');
              //this.$('#map').css('height', '400px');
            } else {
              // this.$('#map')[0].innerHTML = "<p>No coordinates found</p>";
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
        //this.darwinCoreTab.setup();
        // this.setTab(this.options.show);
        // if (this.options.show === 'datasource') {
        //   this.$('#rights').hide();
        // } else {
        //   this.$('#rights').show();          
        // }
        // this.$('#detailTabs a').click(_.bind(function (e) {
        //   var tab = e.target.id === 'dwc' ? 'darwincore' : 'datasource';
        //   var path = util.getOccPath(this.model.get('keyname'), tab); 
        //   if (tab === 'datasource') {
        //     this.$('#rights').hide();
        //   } else {
        //     this.$('#rights').show();          
        //   }
        //    this.app.router.navigate(path);
        //   this.setTab(tab);
        //   this.darwinCoreTab.setup();
        // }, this));
        // window.scrollTo(0, 0);
        mps.publish('spin', [false]);
        return this;
      },

      empty: function () {
        this.$el.empty();
        return this;
      },

      // Kill this view.
      destroy: function () {
        _.each(this.subscriptions, function (s) {
          mps.unsubscribe(s);
        });
        this.undelegateEvents();
        //this.stopListening();
        this.empty();
    }
  });
});
