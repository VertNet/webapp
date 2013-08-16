define([
  'jquery',
  'backbone',
  'underscore',
  'util',
  'text!views/publisher.html',
  'models/resource',
  'models/resources',
  'views/resourcerow',
  'mps'
  ], function ($, Backbone, _, util, template, ResourceModel, ResourceList, ResourceRow, mps) {
    return Backbone.View.extend({

      initialize: function(options, app) {
        this.app = app;
        this.viewList = [];
        this.template = _.template(template);
        mps.publish('spin', [true]);
      }, 

      render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
      },

      setup: function () {
        this.options.resourceList.forEach(_.bind(function (model) {
          var view = new ResourceRow({parentView: this, model:model}, this.app);
          this.viewList.push(view);
          this.$('#resTable > tbody:last').append(view.render().el);
        }, this));
        this.$('#pubsearch').click(_.bind(function(e) {
          e.preventDefault();
          mps.publish('navigate', 
            [{path: 'search?q=institutioncode:' + this.model.get('icode').toLowerCase(), trigger:true}]);
        }, this));
        mps.publish('spin', [false]);
        return this;
      }
  });
});
