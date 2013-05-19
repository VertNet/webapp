define([
  'jQuery',
  'Backbone',
  'Underscore',
  'map',
  'explore/occ/OccDetailMap',
  'text!explore/occ/OccDetail.html'
  ], function ($, Backbone, _, map, OccDetailMap, template) {
    return Backbone.View.extend({

      initialize: function(options, app) {
        this.app = app;
        this.template = _.template(template);
      }, 

      events: {
        'click #explore-publisher-tab': '_click'
      },

      render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
      },

      setup: function () {
        console.log('Setting up OccDetail');

        map.init(_.bind(function() {
          var lat = this.$('#DecimalLatitude').text();
          var lon = this.$('#DecimalLongitude').text();
          var map = new OccDetailMap({lat: lat, lon: lon}).render();
        }, this));
        
        return this;
      },

      _click: function() {
        console.log('hi');
      }
    });
});
