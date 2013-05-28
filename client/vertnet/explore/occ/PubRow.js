define([
  'jQuery',
  'Backbone',
  'Underscore',
  'util',
  'text!explore/occ/PubRow.html'
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
        var code = this.model.get('code');
        var path = '/search/occurrences?institutioncode=' + code;
        this.app.router.navigate(path, {trigger: true});
      }
    });
});
