/*
 * Home view.
 */
define([
  'jquery',
  'underscore',
  'backbone',
  'bootstrap',
  'views/homemap',
  'mps',
  'rpc',
  'map',
  'text!views/home.html',
  ], function ($, _, Backbone, bs, MapView, mps, rpc, map, template) {
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
      var thisMps = mps; // FIXME: mps undefined in map.init callback.
      this.$('#myCarousel').carousel();
      map.init(_.bind(function() {
        this.mapView = new MapView().render();
        thisMps.publish('spin', [false]);
        this.$('#homesearch-keywords-box').focus();
      }, this));
      return this;
    },

    onShow: function() {
      this.$('#homesearch-keywords-box').focus();
      this.$('#homesearch-keywords-box').val('');
      this.mapView.resize();
      mps.publish('spin', [false]);
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
        mps.publish('navigate', [{path: searchPath, trigger: true, replace: false}]);        
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