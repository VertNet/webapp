/*
 * VertNet app.
 */

define([
  'jQuery',
  'Underscore',
  'Backbone',
  'router'
  //'bus',
  //'rpc'
], function ($, _, Backbone, Router) {

  // For dev:
  // window._bus = bus;
  // window._rpc = rpc;

  var App = function () {
    // NOOP
  }

  App.prototype.update = function (profile) {

    // Set the app profile model.
    this.profile = new Backbone.Model(profile);

    // Open a channel on the bus.
    //if (!bus.channel() && this.profile.get('person')) bus.init();
  }

  return {

    // Creates the instance.
    init: function () {
      console.log('app.init()');
      var app = new App;
      app.router = new Router(app);
      Backbone.history.start({ pushState: true });
    }
    
  };
});