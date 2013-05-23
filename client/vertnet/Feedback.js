/*
 * Feedback page view.
 */

 define([
  'jQuery',
  'Underscore',
  'Backbone',
  'mps',
  'rpc',
  'text!Feedback.html'
  ], function ($, _, Backbone, mps, rpc, template) {

    return Backbone.View.extend({
      initialize: function (options, app) {
        this.app = app;
        this.template = _.template(template);
      },

      render: function () {
        this.$el.html(this.template());
        return this;
      },


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