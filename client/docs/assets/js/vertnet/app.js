/*
 * VertNet app.
 */

define([
  'jQuery',
  'Underscore',
  'Backbone',
  'router',
  //'bus',
  'rpc',
  'bootstrap'
], function ($, _, Backbone, Router, rpc, bootstrap) {

  // For dev:
  // window._bus = bus;
  window._rpc = rpc;
  window._ = _;
  window._bootstrap = bootstrap;

  var App = function () {
    // NOOP
  }

  App.prototype.update = function (profile) {

    // Set the app profile model.
    this.profile = new Backbone.Model(profile);

    // Open a channel on the bus.
    //if (!bus.channel() && this.profile.get('person')) bus.init();
  }

  App.prototype.parseUrl = function() {
    var a = /\+/g;  // Regex for replacing addition symbol with a space
    var r = /([^&=]+)=?([^&]*)/g;
    var d = function (s) { return decodeURIComponent(s.replace(a, " ")); };
    var q = window.location.search.substring(1);
    var urlParams = {};
    
    // Parses URL parameters:
    while ((e = r.exec(q))) {
      urlParams[d(e[1])] = d(e[2]);
    }

    return urlParams;
  }


  return {

    // Creates the instance.
    init: function () {
      console.log('app.init()');
      var app = new App;
      app.router = new Router(app);
      Backbone.history.start({ pushState: true });
    },

    
  };
});