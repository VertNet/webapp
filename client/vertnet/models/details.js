define([
  'Backbone', 
  'models/detail'
  ], function (Backbone, OccModel) {
    return Backbone.Collection.extend({

      model: OccModel,

      initialize: function(options) {
      }
    });
});