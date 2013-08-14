/*
 * VertNet app.
 */
define([
  'jQuery',
  'Underscore',
  'Backbone',
  'router',
  'rpc',
  'bootstrap',
  'Spin',
  'mps'
], function ($, _, Backbone, Router, rpc, bootstrap, Spin, mps) {
  // For dev console:
  window._rpc = rpc;
  window._ = _;
  window._bootstrap = bootstrap;

  var App = function () {
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

  App.prototype.update = function (profile) {
    this.profile = new Backbone.Model(profile);
  }

  return {
   init: function () {
      var app = new App;
      app.spin = new Spin($('#main-spinner'));
      mps.subscribe('spin', _.bind(function(show) {
        if (show) {
          this.spin.start();
        } else {
          this.spin.stop();
        }
      }, app));
      app.router = new Router(app);
      Backbone.history.start({pushState: true});
    },  
  };
});