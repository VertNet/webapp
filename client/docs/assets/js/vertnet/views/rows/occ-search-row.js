/*
 * Comment Row view
 */

define([
  'jQuery',
  'Underscore',
  'views/boiler/row',
  'text!../../templates/rows/occ-search-row.html'
], function ($, _, Row, template) {
  return Row.extend({

    tagName: 'tr',

    attributes: function () {
      return _.defaults({}, Row.prototype.attributes.call(this));
    },

    initialize: function (options) {
      this.template = _.template(template);
      Row.prototype.initialize.call(this, options);
    },

    events: {
    }
  });
});
