/*
 * Occurrence search page view.
 */

define([
  'jQuery',
  'Underscore',
  'Backbone',
  'mps',
  'rpc',
  'service/search'
  ], function ($, _, Backbone, mps, rpc, search) {

  return Backbone.View.extend({

    // The DOM target element for this page:
    el: '#search-form',

    // Module entry point:
    initialize: function (app, options) {

      // Save app reference.
      this.app = app;

      // Initialize search keywords:
      this.keywords = [];

      // TODO: Better way to handle keyup event in View?
      _.bindAll(this);
      $(document).on('keyup', this.search);

      // Set focus in keyword text box.
      this.$('#search-keywords-box').focus();
      this.on('rendered', this.setup, this);
    },

    // Draw our template from the profile JSON.
    render: function () {

      // Done rendering ... trigger setup.
      this.trigger('rendered');

      return this;
    },

    // Misc. setup.
    setup: function () {

      // Render posts.
      console.log('Setting up search occurrence view...');
      return this;
    },

    // Similar to Backbone's remove method, but empties
    // instead of removes the view's DOM element.
    empty: function () {
      this.$el.empty();
      return this;
    },

    // Kill this view.
    destroy: function () {
      _.each(this.subscriptions, function (s) {
        mps.unsubscribe(s);
      });

      // TODO: Better way to handle keyup event in View?
      $(document).unbind('keyup');
      
      this.undelegateEvents();
      this.stopListening();
      this.empty();
    },

    // Bind mouse events.
    events: {
      //'keydown input#search-keywords-box': 'test'
    },

    isNewSearch: function(x, y) {
      return (_.difference(x, y).length === 0);
    },

    search: function(e) {
      // Split string on whitespace and commas:
      var new_keywords = this.$('#search-keywords-box').val().split(/,?\s+/);

      if (e.keyCode == 13 || e.keyCode == 9) { // 13 RETURN, 9 TAB.
        // Don't search if the keywords haven't changed:
        // if (_.difference(new_keywords, this.keywords).length === 0) {
        if (this.isNewSearch(new_keywords, this.keywords)) {
          console.log('No search needed...');
          return;
        } else {
          this.keywords = new_keywords;
          console.log("SEACH: ", this.keywords);
        }
      }
    },

  });
});