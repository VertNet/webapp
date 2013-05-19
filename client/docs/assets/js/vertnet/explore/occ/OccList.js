define([
  'Backbone', 
  'explore/occ/OccModel'
  ], function (Backbone, OccModel) {
    return Backbone.Collection.extend({

      model: OccModel,

      initialize: function(options) {
      }
    });
});
