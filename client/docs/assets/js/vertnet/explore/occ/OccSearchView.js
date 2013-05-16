/*
 * The Occurrence search tab composite view for the explore page.
 *
 * This is a composite list view intended to be initialized by the explore page view.
 * It contains a list of search results viewable in a table, on a map, or downloadable.
 */

define([
  'jQuery',
  'Underscore',
  'Backbone',
  'mps',
  'rpc',
  'text!explore/occ/occ-search-template.html',
  'explore/occ/OccList',
  'explore/occ/OccView',
  'explore/occ/occ-model'
], function ($, _, Backbone, mps, rpc, template, OccList, OccView, OccModel) {
  return Backbone.View.extend({
    
    // Top level div for tab content.
    el: '#explore-tabs-content',

    initialize: function (options, app) {
      this.occList = new OccList();
      this.viewList = [];
      $(document).on('keyup', _.bind(this.newSearch, this));
      this.$('#search-keywords-box').focus();
    },

    render: function() {
      this.$el.html(_.template(template));
      return this;
    },

    isNewSearch: function(x, y) {
      return (_.difference(x, y).length === 0);
    },

    newSearch: function(e) {
      // Split string on whitespace and commas:
      var new_keywords = this.$('#search-keywords-box').val().split(/,?\s+/);

      if (e.keyCode == 13 || e.keyCode == 9) { // 13 RETURN, 9 TAB.
        // Don't search if the keywords haven't changed:
        if (this.isNewSearch(new_keywords, this.keywords)) {
          console.log('No search needed...');
          return;
        } else {
          this.keywords = new_keywords;
          console.log("SEACH: ", this.keywords);
          _.each(this.viewList, _.bind(function(x) {
            x.remove();
          }));
          this.viewList.splice(0, this.viewList.length); // clear views.
          this.occList.reset(); // clear models.
          this.searchRpc();
        }
      }
    },

    searchRpc: function() {
      var rl = {limit:10, q:JSON.stringify({terms: {}, keywords: this.keywords})};
      
      rpc.execute('/service/rpc/record.search', rl, {
        success: _.bind(function(x) {
          var items = _.map(x.items, function(item) {
            return JSON.parse(item.json);
          });

          _.each(items, _.bind(function (i) {
            var model = new OccModel(i);
            var view = new OccView({parentView: this, model:model});
            this.occList.add(model);
            this.viewList.push(view);
            view.render();
          }, this));
        }, this), 
        error: _.bind(function(x) {
          console.log('ERROR: ', x);
        }, this)
      });
    }

  });
});