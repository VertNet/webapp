/*
 * The Occurrence search tab on the explore page.
 *
 * This is a list view since it contains a list of search results.
 */

define([
  'jQuery',
  'Underscore',
  'views/boiler/list',
  'mps',
  'text!../../templates/lists/occ-search-rows.html',
  'collections/occ-search-rows',
  'views/rows/occ-search-row'
], function ($, _, List, mps, template, Collection, Row) {
  return List.extend({
    
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
        }
      }
    }

  });
});