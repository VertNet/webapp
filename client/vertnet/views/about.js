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
      }
  });
});