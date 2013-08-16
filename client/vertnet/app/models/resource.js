/*
 * Resource model. 
 */
define([
  'underscore',
  'backbone',
  'util'
], function (_, Backbone, util) {
  return Backbone.Model.extend({
    records: function() {
      return util.addCommas(this.get('count').toString());
    },

    nameSlug: function() {
      return util.slugify(this.get('title'));
    },

    descriptionSnip: function() {
      var des = this.get('description');
      if (des.length > 70) {
          if (des.slice(0, 70)[69] === ' ') {
            des = des.slice(0, 71) + '...';          
          } else {
            des = des.slice(0, 70) + '...';
          }
        }
      return des;
    },

    getDate: function() {
      var splits = this.get('pubdate').split(' ');
      return splits[1] + ' ' + splits[2] + ', ' + splits[5];
    }
  });
});
