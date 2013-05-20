define([
  'jQuery',
  'Backbone',
  'Underscore',
  'map',
  'explore/occ/OccDetailMap',
  'text!explore/occ/DarwinCoreTab.html'
  ], function ($, Backbone, _, map, OccDetailMap, template) {
    return Backbone.View.extend({

      initialize: function(options, app) {
        this.app = app;
        this.template = _.template(template);
      }, 

      render: function() {
        this.$el.html(this.template(this.model.attributes));
        map.init(_.bind(function() {
          var lat = this.$('#DecimalLatitude').text();
          var lon = this.$('#DecimalLongitude').text();
          this.mapView = new OccDetailMap({lat: lat, lon: lon});
          this.$('#occ-detail-map').html(this.mapView.render().el);
        }, this));
        return this;
      },

      setup: function () {
        this.$('#darwinCoreTabs a').click(_.bind(function (e) {
          var tab = e.target.id;
          if (tab === 'loc') {
            this.mapView.resize();
          } 
        }, this));
        return this;
      }
  });
});
