define([
  'backbone', 
  'models/publisher'
  ], function (Backbone, PublisherModel) {
    return Backbone.Collection.extend({

      model: PublisherModel,

      initialize: function(options) {

      },

      publisherCount: function() {
        return this.size();
      },

      resourceCount: function() {
        return this.reduce(function(memo, model) {
          return model.get('resources') + memo;
        }, 0);
      },

      recordCount: function() {
        return this.reduce(function(memo, model) {
          if (model.get('records') > 0) {
            return model.get('records') + memo;
          } else {
            return memo;
          }
        }, 0);
      }
    });
});