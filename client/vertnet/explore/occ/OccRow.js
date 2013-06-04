define([
  'jQuery',
  'Backbone',
  'Underscore',
  'util',
  'text!explore/occ/OccRow.html'
  ], function ($, Backbone, _, util, template) {
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
        var keyname = this.model.get('keyname');
        var path = util.getOccPath(keyname, 'darwincore');
        var sel = getSelection().toString();
        if (!sel){
          this.app.occDetailModel = this.model;
          this.app.router.navigate(path, {trigger: true});
        }
      }
    });
});
