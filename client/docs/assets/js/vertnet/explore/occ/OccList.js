define([
  'Backbone', 
  'explore/occ/occ-model'
  ], function (Backbone, OccModel) {
    return Backbone.Collection.extend({

      model: OccModel,

      initialize: function(options) {
      }
    });
});
