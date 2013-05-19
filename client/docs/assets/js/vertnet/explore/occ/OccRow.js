define([
  'jQuery',
  'Backbone',
  'Underscore',
  'text!explore/occ/OccRow.html'
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
        //e.preventDefault();
        //e.stopPropagation();
        this.app.router.navigate(this.model.get('keyname'), {trigger: true}); //, {trigger: true});
        //document.location.replace('../../' + this.model.get('keyname'));
      }
    });
});
