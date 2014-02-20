define([
  'underscore',
  'backbone'
], function (_, Backbone) {
  return Backbone.Model.extend({
    
    QUERIES: 10;
    QRECORDS: 100;
    DOWNLOADS: 5;
    DRECORDS: 50;
    
    getQueries: function() {
      return this.get('queries');
    },
    
  });
});
