/*
 * Occurrence result table row view.
 */
define([
  'jquery',
  'backbone',
  'underscore',
  'util',
  'mps',
  'text!views/detailrow.html'
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
        var keyname = this.model.get('keyname');
        var path = 'o/'+util.getOccPath(keyname);
        var sel = getSelection().toString();
        if (!sel) {
          this.trigger('onClick');
          this.app.occDetailModel = this.model;
          mps.publish('navigate', [{path: path, trigger: true}]);
        }
      }
    });
});
