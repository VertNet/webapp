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
  'map',
  'rpc',
  'text!explore/occ/OccTab.html',
  'explore/occ/OccList',
  'explore/occ/OccRow',
  'explore/occ/OccModel',
  'explore/occ/ResultMap'
], function ($, _, Backbone, bootstrap, mps, map, rpc, template, OccList, OccRow, OccModel, 
    ResultMap) {
  return Backbone.View.extend({

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
      this.count = 0;
      this.countLoaded = 0;
      $(document).on('keyup', _.bind(this._submitHandler, this));
    },

    render: function() {
      this.$el.html(_.template(template));
      this.resultMap = new ResultMap({collection: this.occList}, this.app);
      map.init(_.bind(function() { 
        this.$('#resultmap').html(this.resultMap.render().el);
        this.resultMap.resize();
      }, this));
      this.$('#occTable').hide();
      this._disableTablePager(true);
      this._checkUrl();
      return this;
    },

   setup: function () {
      this.$('#resultTabs a').on('shown', _.bind(function (e) {
        var tab = e.target.id;
        if (tab === 'maptab') {
          this.resultMap._updateMarkers();
          this.resultMap.resize();
        } 
      }, this));
   
      this.$('#resultTabs a').click(_.bind(function (e) {
        var tab = e.target.id;
        if (tab === 'maptab') {
          this.resultMap.resize();
        } 
      }, this));
      return this;
    },

    _checkUrl: function() {
      var urlParams = this.app.parseUrl();
      var path = window.location.pathname + window.location.search;
      this.app.router.navigate(path);
      this.$('#search-keywords-box').val(urlParams.q);
      this.$('#genus').val(urlParams.genus);
      this.$('#specificepithet').val(urlParams.specificepithet);
      this.$('#year').val(urlParams.year);
      this.$('#country').val(urlParams.country);
      this.$('#institutioncode').val(urlParams.institutioncode);
      this._submitHandler(null, true);
    },

    // Load more results.
    _loadMore: function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.response && this.response.more) {
        this.paging = true;
        this._executeSearch(null, true);
      }
    },

    _getSearch: function() {
      var terms = null;
      var q = this.$('#search-keywords-box').val();
      this._prepTerms();
      terms = this.terms;
      if (q !== '') {
        terms['q'] = q;
      }
      return $.param(terms);
    },

    // Submit handler for search.
    _submitHandler: function(e, bypass) {
      if (bypass || e.keyCode == 13 || e.keyCode == 9) { // 13 RETURN, 9 TAB.
        var path = window.location.pathname;
        var search = this._getSearch();
        if (search) {
          path += '?' + search;
        } 
        this.paging = false;
        this.response = null;
        this._disableTablePager(true);
        this._executeSearch();
        if (!bypass) {
          this.app.router.navigate(path);
        }          
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
      _.each(this.$('input'), _.bind(function (input) {
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
      var howMany = response.count > 1000 ? '1000s' : response.count;
      if (!this.paging) {
        this._clearResults();
      }
      this.count = response.count;
      this.countLoaded += response.items.length;
      this.$('.counter').text('Showing 1 - ' + this.countLoaded + ' of ' + howMany);
      this.response = response;
      this._showResultsTable(showResults);
      if (showResults) {
        _.each(items, _.bind(function (i) {
          var model = new OccModel(i);
          var view = new OccRow({parentView: this, model:model}, this.app);
          this.occList.add(model);
          this.viewList.push(view);
          this.$('#occTable > tbody:last').append(view.render().el);
        }, this));
      } else {
        this.terms = {};
        this.keywords.splice(0, this.keywords.length);
      }
      this._disableTablePager(!this.response.more);
      // window.scrollTo(0,document.body.scrollHeight);
      //$('html, body, .content').animate({scrollTop: $(document).height()}, 300);
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
      var table = this.$('#occTable');
      var tab = this.$('#occ-search-tab');

      if (show) {
        table.show();
        this.$('#no-results').hide();
      } else {
        table.hide();
        this.$('#no-results').text('No results.');
        this.$('#no-results').show();
        this.$('.counter').hide();
      }
    },

    // Clear search results table.
    _clearResults: function() {
      _.each(this.viewList, _.bind(function(x) {
          x.remove();
      }));
      this.viewList.splice(0, this.viewList.length); // clear views.
      this.occList.reset(); // clear models.
      this.count = 0;
      this.countLoaded = 0;
    },

    // Explode search keywords value into an array of terms.
    _explodeKeywords: function() {
      // Split string on whitespace and commas:
      var q = this.$('#search-keywords-box').val();
      if (q) {
        this.keywords = q.split(/,?\s+/);
        this.keywords = _.filter(this.keywords, function(x) {
          var x = x.trim();
          if (x !== '') {
            return x;
          }
        });
      } else {
        this.keywords = [];
      }
    },
  });
});