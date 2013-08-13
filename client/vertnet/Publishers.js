/*
 * Explore page view.
 */

 define([
  'jQuery',
  'Underscore',
  'Backbone',
  'store',
  'text!Publishers.html'
  ], function ($, _, Backbone, store, template) {

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
        if (store.get('protip-pub-closed') === true) {
          this.$('#click-row-tip').hide();       
        } else {
          this.$('.close').click(_.bind(function () {
            store.set('protip-pub-closed', true);
          }, this));
        }
        return this;
      },

      _clickHandler: function(e) {
        var sel = getSelection().toString();
        var icode = e.target.parentNode.id;
        var path = '/search/occurrence?q=institutioncode:' + icode;
        if (!sel) {
          this.app.router.navigate(path, {trigger: true});
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