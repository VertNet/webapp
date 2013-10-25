/**
 * This file is part of VertNet: https://github.com/VertNet/webapp
 * 
 * VertNet is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * VertNet is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Foobar.  If not, see: http://www.gnu.org/licenses
 */

// Defines the view for the home page.
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