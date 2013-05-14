/*
 * Comment model
 */

define([
  'Underscore',
  'Backbone',
  'util'
], function (_, Backbone, util) {
  return Backbone.Model.extend({

    blurb: function (str, len) {
      if (!len) len = 80;
      return util.blurb(str, len);
    },

    content: function () {
      return util.formatText(this.get('content'));
    },

    parentBlurb: function () {
      return util.blurb(this.get('parent').description, 20);
    },

    childShellType: function (child) {
      if (!child.class_)
        return 'campaign-type';
      else if (_.contains(child.class_, 'Question'))
        return 'question-type';
      else if (_.contains(child.class_, 'Offer'))
        return 'offer-type';
      else if (_.contains(child.class_, 'Request'))
        return 'request-type';
      else
        return 'idea-type';
    },

  });
});
