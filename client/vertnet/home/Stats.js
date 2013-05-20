/*
 * Home view
 */

define([
  'jQuery',
  'Underscore',
  'Backbone',
  'mps',
  'text!/templates/home.html',
  'views/build',
  'views/lists/feed'
], function ($, _, Backbone, mps, template, Build, Feed) {
  return Backbone.View.extend({
    
    // The DOM target element for this page:
    el: '#wrap > .content',
    
    // Module entry point:
    initialize: function (app) {
      
      // Save app reference.
      this.app = app;
      
      // Shell events:
      this.on('rendered', this.setup, this);
    },

    // Draw our template from the profile JSON.
    render: function () {

      // UnderscoreJS templating:
      this.$el.html(_.template(template).call(this));

      // Done rendering ... trigger setup.
      this.trigger('rendered');

      return this;
    },

    // Misc. setup.
    setup: function () {

      // Render idea feed.
      this.feed = new Feed(this.app, { parentView: this });

      // Create the build idea/campaign view.
      if (this.app.profile.get('person'))
        new Build(this.app).render();

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
      this.feed.destroy();
      this.undelegateEvents();
      this.stopListening();
      this.empty();
    },

  });
});