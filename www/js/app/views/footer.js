/*
 * Footer view.
 */
define([
  'jquery',
  'underscore',
  'backbone',
  'mps',
  'rpc',
  'text!views/footer.html'
  ], function ($, _, Backbone, mps, rpc, template) {
  return Backbone.View.extend({
    events: {},

    initialize: function (app) {
      this.app = app;
      this.on('rendered', this.setup, this);
    },

    render: function () {
      this.$el.html(_.template(template));
      this.trigger('rendered');
      return this;
    },

    setup: function () {
      return this;
    },
  });
});