/*
 * Publishers view.
 */
 define([
  'jQuery',
  'Underscore',
  'Backbone',
  'store',
  'mps',
  'text!views/publishers.html'
  ], function ($, _, Backbone, store, mps, template) {
    return Backbone.View.extend({
      events: {
        'click td': '_clickHandler'
      },

      initialize: function (options, app) {
        this.app = app;
        mps.publish('spin', [true]);
      },

      render: function () {
        this.$el.html(_.template(template));
        return this;
      },

      setup: function () {
        if (store.get('protip-pub-closed') === true) {
          this.$('#click-row-tip').hide();       
        } else {
          this.$('.close').click(_.bind(function () {
            store.set('protip-pub-closed', true);
          }, this));
        }
        mps.publish('spin', [false]);
        return this;
      },

      _clickHandler: function(e) {
        var sel = getSelection().toString();
        var icode = e.target.parentNode.id;
        var path = '/search?q=institutioncode:' + icode;
        if (!sel) {
          mps.publish('navigate', [{path: path, trigger: true}]);
        }
      },
  });
});