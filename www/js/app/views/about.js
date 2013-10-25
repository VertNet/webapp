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

// Defines the about page view.
define([
  'jquery',
  'underscore',
  'backbone',
  'mps',
  'rpc',
  'text!views/about.html'
  ], function ($, _, Backbone, mps, rpc, template) {

    return Backbone.View.extend({
      events: {
        'click #search-link': 'onSearchClick',
        'click #advanced-link': 'onAdvancedSearchClick',
        'click #publishers-link': 'onPublishersClick'
      },

      initialize: function (options, app) {
        this.app = app;
        mps.publish('spin', [true]);
      },

      render: function () {
        this.$el.html(_.template(template));
        return this;
      },

      setup: function() {
        mps.publish('spin', [false]);
      },

      onSearchClick: function(e) {
        e.preventDefault();
        mps.publish('navigate', [{path: 'search', trigger: true}]);        
      },

      onAdvancedSearchClick: function(e) {
        e.preventDefault();
        mps.publish('navigate', [{path: 'search?advanced=1', trigger: true, replace: false}]);        
      },

      onPublishersClick: function(e) {
        e.preventDefault();
        mps.publish('navigate', [{path: 'publishers', trigger: true}]);        
      },

  });
});