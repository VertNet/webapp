/*
 * Handle URL paths and changes.
 */

define([
  'jQuery',
  'Underscore',
  'Backbone',
  'map',
  'rpc',
  'mps',
  'views/mapView',
], function ($, _, Backbone, map, rpc, mps, MapView) {

  // Our application URL router.
  var Router = Backbone.Router.extend({

    initialize: function (app) {

      // Save app reference.
      this.app = app;
      
      // Page routes:
      this.route('', 'home', _.bind(this.home, this, 'home'));

      // Subscriptions
      mps.subscribe('navigate', _.bind(function (path) {

        // Fullfill navigation request from mps.
        this.navigate(path, {trigger: true});
      }, this))
    },

    routes: {
      // Catch all:
      '*actions': 'default'
    },
    
    home: function (name) {
      console.log('router.home()');

      map.init(function() {
        console.log('BOOM');
        var map = new MapView().render();
      });

      // Kill the page view if it exists.
      if (this.page)
        this.page.destroy();

      // Get the idea profile JSON:
      // rpc.execute('/api/stats.get', {}, {
      //   success: _.bind(function (payload) {
      //     // Parse payload stats since it comes up as a string.
      //     // This allows us to store stats in datastore as a JsonProperty.
      //     console.log(JSON.parse(payload.stats));
      //   }, this),

      //   error: function (x) {

      //     // TODO: render 404.
      //     console.warn(x);
      //   }
      // });
    },

    default: function (actions) {
      console.warn('No route:', actions);
    }
  
  });
  
  return Router;

});