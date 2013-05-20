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
        map.init(_.bind(function() {
          var lat = this.$('#DecimalLatitude').text();
          var lon = this.$('#DecimalLongitude').text();
          var map = new OccDetailMap({lat: lat, lon: lon});
          this.$('#occ-detail-map').html(map.render().el);
        }, this));
        return this;
      },

      _click: function() {
        console.log('hi');
      }
    });
});
