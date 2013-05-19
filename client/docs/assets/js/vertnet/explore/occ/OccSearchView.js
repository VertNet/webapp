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
  'bootstrap',
  'mps',
  'rpc',
  'text!explore/occ/occ-search-template.html',
  'explore/occ/OccList',
  'explore/occ/OccView',
  'explore/occ/occ-model'
], function ($, _, Backbone, bootstrap, mps, rpc, template, OccList, OccView, OccModel) {
  return Backbone.View.extend({
    
    // Top level div for tab content.
    el: '#occurrence-search',

    events: {
      'click .pager': '_loadMore'
    },

    initialize: function (options, app) {
      this.app = app;
      this.keywords = []; // Search query keywords
      this.terms = {}; // Search query terms
      this.occList = new OccList();
      this.viewList = []; // Array of result table row views.
      this.paging = false;
      $(document).on('keyup', _.bind(this._submitHandler, this));
    },

    render: function() {
      this.$el.html(_.template(template));
      this.$('#search-keywords-box').focus();
      this.$('#occ-search-results-table').hide();
      this._disableTablePager(true);
      return this;
    },

    // Load more results.
    _loadMore: function() {
      if (this.response && this.response.more) {
        this.paging = true;
        this._executeSearch();
      }
    },

    // Submit handler for search.
    _submitHandler: function(e) {
      if (e.keyCode == 13 || e.keyCode == 9) { // 13 RETURN, 9 TAB.
        this.paging = false;
        this.response = null;
        this._disableTablePager(true);
        this._executeSearch();
      }
    },

    // Executes search request to server.
    _executeSearch: function() {
      var request = null;
      this._prepTerms();
      this._explodeKeywords();
      if ((_.size(this.terms) > 0) || (_.size(this.keywords) > 0)) { 
        request = {limit:10, q:JSON.stringify({terms: this.terms, 
          keywords: this.keywords})};
        if (this.response && this.response.more) {
          request['cursor'] = this.response.cursor;
        }
        rpc.execute('/service/rpc/record.search', request, {
          success: _.bind(this._resultsHandler, this), 
          error: _.bind(function(x) {
            console.log('ERROR: ', x);
          }, this)
        });
      } else {
        this._clearResults();
        this._showResultsTable(false);
      }
    },

    // Prepare the dictionary of search terms.
    _prepTerms: function() {
      this.terms = {};
      _.each($('input'), _.bind(function (input) {
        var value = $(input).val();
        if (input.id !== 'search-keywords-box' && value.trim() !== '') {
          this.terms[input.id] = value;
        }
      }, this));
    },

    // Handler for new results from server.
    _resultsHandler: function(response) {
      var items = _.map(response.items, function(item) {
        return JSON.parse(item.json);
      });
      var showResults = items.length !== 0;
      this.response = response;
      if (!this.paging) {
        this._clearResults();
      }
      this._showResultsTable(showResults);
      if (showResults) {
        _.each(items, _.bind(function (i) {
          var model = new OccModel(i);
          var view = new OccView({parentView: this, model:model}, this.app);
          this.occList.add(model);
          this.viewList.unshift(view);
          view.render();
        }, this));
      } else {
        this.terms = {};
        this.keywords.splice(0, this.keywords.length);
      }
      this._disableTablePager(!this.response.more);
    },

    // Disable table pager.
    _disableTablePager: function(disable) {
      if (disable) {
        this.$('#table-pager').addClass('disabled');
      } else {
        this.$('#table-pager').removeClass('disabled');
      }
    },

    // Show results in table.
    _showResultsTable: function(show) {
      var table = this.$('#occ-search-results-table');
      var tab = this.$('#occ-search-tab');

      if (show) {
        table.show();
        this.$('#no-results').hide();
      } else {
        table.hide();
        this.$('#no-results').text('No results.');
        this.$('#no-results').show();
      }
    },

    // Clear search results table.
    _clearResults: function() {
      _.each(this.viewList, _.bind(function(x) {
          x.remove();
      }));
      this.viewList.splice(0, this.viewList.length); // clear views.
      this.occList.reset(); // clear models.
    },

    // Explode search keywords value into an array of terms.
    _explodeKeywords: function() {
      // Split string on whitespace and commas:
      this.keywords = this.$('#search-keywords-box').val().split(/,?\s+/);
      this.keywords = _.filter(this.keywords, function(x) {
        var x = x.trim();
        if (x !== '') {
          return x;
        }
      });
    },


  });
});