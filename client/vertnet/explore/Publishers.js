/*
 * Explore page view.
 */

 define([
  'jQuery',
  'Underscore',
  'Backbone',
  'text!Publishers.html'
  ], function ($, _, Backbone, template) {

    return Backbone.View.extend({
      events: {
        'click td': '_clickHandler'
      },

      initialize: function (options, app) {
        this.app = app;
      },

      render: function () {
        this.$el.html(_.template(template));
        return this;
      },

      // Misc. setup.
      setup: function () {

        return this;
      },

      _clickHandler: function(e):
        var sel = getSelection().toString();
        if (!sel) {
          console.log(e);
          // this.trigger('onClick');
          // this.app.occDetailModel = this.model;
          // this.app.router.navigate(path, {trigger: true});
        }
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
        this.undelegateEvents();
        //this.stopListening();
        this.empty();
      }
  });
});