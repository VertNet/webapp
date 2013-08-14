/*
 * About page view.
 */

 define([
  'jQuery',
  'Underscore',
  'Backbone',
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