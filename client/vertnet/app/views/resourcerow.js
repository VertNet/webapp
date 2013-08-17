/*
 * Resource table row view.
 */
define([
  'jquery',
  'backbone',
  'underscore',
  'util',
  'mps',
  'text!views/resourcerow.html'
  ], function ($, Backbone, _, util, mps, template) {
    return Backbone.View.extend({

      tagName: 'tr',

      events: {
        'click td': '_clickHandler'
      },

      attributes: function () {
        return {
          id: this.model.id,
          path: this.model.keyname
        };
      },

      initialize: function(options, app) {
        this.app = app;
        this.template = _.template(template);
        _.bindAll(this, 'render');
      }, 

      render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
      },

      // Open the occurrence detail page.
      _clickHandler: function(e) {
        e.preventDefault();
        var sel = getSelection().toString();
        if (!sel) {
          window.open(this.model.get('url'), '_self');
        }
      }
    });
});
