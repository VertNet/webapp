define([
  'backbone', 
  'models/resource'
  ], function (Backbone, ResourceModel) {
    return Backbone.Collection.extend({

      model: ResourceModel,

      initialize: function(options) {

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