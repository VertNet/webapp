define([
  'jQuery',
  'Backbone',
  'Underscore',
  'text!explore/occ/occ-view-template.html'
  ], function ($, Backbone, _, template) {
    return Backbone.View.extend({

      tagName: 'tr',

      attributes: function () {
        return {
          id: this.model.id
        };
      },

      initialize: function(options) {
        this.template = _.template(template);
        _.bindAll(this, 'render');
      }, 

      render: function() {
        this.$el.html(this.template(this.model.attributes));
        this.$el.prependTo(this.options.parentView.options.listEl);
        return this;
      }
    });
});
