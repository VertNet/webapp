/**
 * This file is part of VertNet: https://github.com/VertNet/webapp
 * 
 * VertNet is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * VertNet is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Foobar.  If not, see: http://www.gnu.org/licenses
 */

// Defines the publisher model. 
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
