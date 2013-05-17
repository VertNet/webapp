define([
  'jQuery',
  'Backbone',
  'Underscore',
  'text!explore/occ/occ-view-template.html'
  ], function ($, Backbone, _, template) {
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

      initialize: function(options) {
        this.template = _.template(template);
        _.bindAll(this, 'render');
      }, 

      render: function() {
        this.$el.html(this.template(this.model.attributes));
        this.$el.prependTo(this.options.parentView.options.listEl);
        return this;
      },

      // Open the occurrence detail page.
      _clickHandler: function() {
        console.log(this.model);
        window.location = this.model.get('keyname');
      }
    });
});
