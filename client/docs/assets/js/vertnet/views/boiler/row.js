/*
 * List Row view
 */

define([
  'jQuery',
  'Underscore',
  'Backbone',
  'mps',
  'util'
], function ($, _, Backbone, mps, util) {
  return Backbone.View.extend({

    tagName: 'div',

    attributes: function () {
      return {
        id: this.model.id
      };
    },

    initialize: function (options) {
      this.parentView = options.parentView;
      this.on('rendered', this.setup, this);
      this.parentView.on('rendered', _.bind(function () {
        this.setElement(this.parentView.$('#' + this.model.id));
        this.render();
      }, this));
    },

    render: function (single, prepend) {
      this.$el.html(this.template.call(this));
      var d = this.model.collection.indexOf(this.model) * 30;
      _.delay(_.bind(function () {
        this.$el.show();
      }, this), single ? 0 : d);
      if (single)
        if (prepend)
          this.$el.prependTo(this.parentView.$el);
        else
          this.$el.appendTo(this.parentView.$el);
      this.trigger('rendered');
      return this;
    },

    setup: function () {
      if (!this.model.get('created'))
          this.model.created = Date.now();
      this.$('.currency').each(function () {
        var str = util.addCommas($(this).text());
        $(this).text('$' + str.trim());
      });
      this.timer = setInterval(_.bind(this.when, this), 5000);
      this.when();
      return this;
    },

    // Kill this view.
    destroy: function () {
      this.undelegateEvents();
      this.stopListening();
      this.remove();
    },

    toHTML: function () {
      return this.$el.clone().wrap('<div>').parent().html();
    },

    when: function () {
      var self = this;
      if (!self.model) return;
      this.$('.created').each(function () {
        $(this).text(util.getRelativeTime(
                    self.model.get('created') || self.model.created));
      });
    },

    _remove: function (e, topic, data) {
      if (!this.model) return;
      if (e || this.model.id === data.id)
        this.$el.slideUp('fast', _.bind(function () {
          this.parentView.views.splice(
              this.model.collection.indexOf(this.model), 1);
          this.model.collection.remove(this.model);
          delete this.model;
          clearInterval(this.timer);
          this.remove();
          mps.publish('notification/change', []);
          this.parentView.checkHeight();
        }, this));
    },

  });
});
