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

    tagName: 'tbody',

    attributes: function () {
      var branchClass = this.model.get('is_root') ? 'is-root' : '';
      return _.defaults({ class: 'comment ' + branchClass },
                        Row.prototype.attributes.call(this));
    },

    initialize: function (options) {
      this.template = _.template(template);
      Row.prototype.initialize.call(this, options);
    },

    events: {
      // 'click .branch-icon': 'branch'
    },

    // branch: function (e) {
    //   e.preventDefault();
    //   this.build = new Build({
    //     isModal: true,
    //     from: {
    //       about: 'Re: ' + this.parentView.parentView.model.get('about'),
    //       model: this.model,
    //     }
    //   }).render();
    // },

  });
});
