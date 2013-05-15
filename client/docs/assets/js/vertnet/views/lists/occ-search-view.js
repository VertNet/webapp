/*
 * The Occurrence search tab composite view for the explore page.
 *
 * This is a composite list view intended to be initialized by the explore page view.
 * It contains a list of search results viewable in a table, on a map, or downloadable.
 */

define([
  'jQuery',
  'Underscore',
  'views/boiler/list',
  'mps',
  'rpc',
  'text!../../templates/lists/occ-search-rows.html',
  'collections/occ-search-rows',
  'views/rows/occ-search-row'
], function ($, _, List, mps, rpc, template, Collection, Row) {
  return List.extend({
    
    // Top level div for tab content.
    el: '#explore-tabs-content',

    initialize: function (app, options) {
      this.template = _.template(template);
      this.collection = new Collection;
      this.Row = Row;

       _.bindAll(this);
      $(document).on('keyup', this.search);

      // Set focus in keyword text box.
      this.$('#search-keywords-box').focus();
      this.on('rendered', this.setup, this);

      // Call super init.
      List.prototype.initialize.call(this, app, options);

      // // Reset the collection with the appropriate list.
      // var items = this.app.profile.get('page').comments ?
      //             this.app.profile.get('page').comments.items : [];
      // this.collection.reset(items);
    },

    isNewSearch: function(x, y) {
      return (_.difference(x, y).length === 0);
    },

    search: function(e) {
      // Split string on whitespace and commas:
      var new_keywords = this.$('#search-keywords-box').val().split(/,?\s+/);

      if (e.keyCode == 13 || e.keyCode == 9) { // 13 RETURN, 9 TAB.
        // Don't search if the keywords haven't changed:
        // if (_.difference(new_keywords, this.keywords).length === 0) {
        if (this.isNewSearch(new_keywords, this.keywords)) {
          console.log('No search needed...');
          return;
        } else {
          this.keywords = new_keywords;
          console.log("SEACH: ", this.keywords);
          this.searchRpc();
        }
      }
    },

    searchRpc: function() {
      var rl = {limit:10, q:JSON.stringify({terms: {}, keywords: this.keywords})};
      
      rpc.execute('/service/rpc/record.search', rl, {
        success: _.bind(function(x) {
          console.log('SUCCESS: ', x);
          var items = _.map(x.items, function(item) {
            return JSON.parse(item.json);
          });
          _.each(items, _.bind(function (i) {
           this.collection.push(i, {silent: true});
           this.renderLast(false);
          }, this));
        }, this), 
        error: _.bind(function(x) {
          console.log('ERROR: ', x);
        }, this)
      });
    }

  });
});