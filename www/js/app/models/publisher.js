/*
 * Publisher model. 
 */
define([
  'underscore',
  'backbone',
  'util'
], function (_, Backbone, util) {
  return Backbone.Model.extend({
    records: function() {
      return util.addCommas(this.get('records').toString());
    },

    resources: function() {
      var count = this.get('resources');
      if (count == 1) {
        return count + ' resource';
      } else {
        return count + ' resources'
      }
    },

    nameSlug: function() {
      return util.slugify(this.get('orgname'));
    }
  });
});
