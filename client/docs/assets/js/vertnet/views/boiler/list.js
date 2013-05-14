/*
 * List view
 */

define([
  'jQuery',
  'Underscore',
  'Backbone',
  'mps'
], function ($, _, Backbone, mps) {
  return Backbone.View.extend({

    initialize: function (app, options) {

      // Save app reference.
      this.app = app;

      // Grab options:
      options = options || {};

      // Save parent reference.
      this.parentView = options.parentView;

      // Default collection:
      if (!this.collection)
        this.collection = new Backbone.Collection({ model: Backbone.Model });
      this.collection.options = options;

      // List views:
      this.views = [];

      // List events.
      this.collection.on('reset', this.render, this);
      this.collection.on('add', this.renderLast, this);
      this.on('rendered', this.setup, this);
    },

    render: function (options) {
      options = options || {};
      this.$el.html(this.template(options));
      this.trigger('rendered');
      return this;
    },

    renderLast: function (pagination) {
      if (this.collection.models.length === 1)
        this.$el.empty();
      if (pagination !== true && this.collection.options &&
          this.collection.options.reverse) {
        this.row(this.collection.models[0]);
        this.views[0].render(true, true);
      } else {
        this.row(this.collection.models[this.collection.models.length - 1], pagination);
        this.views[this.views.length - 1].render(true);
      }
      return this;
    },

    setup: function () {
      return this;
    },

    // Kill this view.
    destroy: function () {
      _.each(this.subscriptions, function (s) {
        mps.unsubscribe(s);
      });
      _.each(this.views, function (v) {
        v.destroy();
      });
      this.undelegateEvents();
      this.stopListening();
      this.remove();
    },

    row: function (model, pagination) {
      if (_.contains(this.exclude, model.id))
        return '';
      var view = new this.Row({
        parentView: this,
        model: model
      }, this.app);
      if (pagination !== true
          && this.collection.options && this.collection.options.reverse)
        this.views.unshift(view);
      else
        this.views.push(view);
      return view.toHTML();
    },

    unselect: function () {
      this.$('.selected').removeClass('selected');
    },

  });
});
