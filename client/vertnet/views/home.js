/*
 * Home view.
 */
define([
  'jQuery',
  'Underscore',
  'Backbone',
  'text!views/home.html',
  'home/Map',
  'mps',
  'rpc',
  'map'
  ], function ($, _, Backbone, template, MapView, mps, rpc, map) {
  return Backbone.View.extend({
    events: {
      'click #homesearch-button': 'onSearchClick',
      'keyup #homesearch': 'onSearchKeyup',
      'click #advanced-search': 'onAdvancedSearchClick'
    },

    initialize: function (app) {
      this.app = app;
    },

    render: function () {
      this.$el.html(_.template(template));
      return this;
    },

    setup: function () {
      this.$('#myCarousel').carousel();
      map.init(_.bind(function() {
        this.mapView = new MapView().render();
        // FIXME: mps is undefined.
        // this.mps.publish('spin/home/stop');
        this.app.router.stopSpin(); // hack
        this.$('#homesearch-keywords-box').focus();
      }, this));
      return this;
    },

    onShow: function() {
      this.$('#homesearch-keywords-box').focus();
      this.$('#homesearch-keywords-box').val('');
      this.mapView.resize();
    },

    getSearchPath: function() {
      var q = this.$('#homesearch-keywords-box').val();
      var path = '';
      q = q ? q.trim() : '';
      if (q !== '') {
        path = 'search?q=' + q;
      }
      return path;
    },

    navigateToSearch: function(path) {
      var searchPath = path ? path : this.getSearchPath();
      if (searchPath) {
        mps.publish('navigate', [{path: searchPath, trigger: true}]);        
      }
    },

    onSearchClick: function(e) {
      e.preventDefault();
      this.navigateToSearch();
    },

    onAdvancedSearchClick: function(e) {
      e.preventDefault();
      this.navigateToSearch('search?advanced=1');
    },

    onSearchKeyup: function(e) {
      var path = this.getSearchPath();
      e.preventDefault();
      if (e.keyCode == 13 && path !== '') {
        this.navigateToSearch(path);
      }
    }
  });
});