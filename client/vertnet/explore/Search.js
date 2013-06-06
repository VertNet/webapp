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
  'map',
  'rpc',
  'text!explore/Search.html',
  'text!explore/occ/Download.html',
  'explore/occ/Download',
  'explore/occ/OccList',
  'explore/occ/OccRow',
  'explore/occ/OccModel',
  'explore/occ/ResultMap',
  'explore/occ/SearchModel',
  'Spin'
], function ($, _, Backbone, mps, map, rpc, template, DowloadTemp, Download, 
  OccList, OccRow, OccModel, ResultMap, SearchModel, Spin) {
  return Backbone.View.extend({

    //tagName: 'explore-page-content',

    events: {
      'click .pager': '_loadMore',
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
      this.model = new SearchModel();
      // $(document).on('keyup', _.bind(this._submitHandler, this));
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
      if (!this.spin) {
        this.spin = new Spin(this.$('.search-spinner'));
      }
      // this._checkUrl();
      this.$('#search-form').on('keyup', _.bind(this._submitHandler, this));
      this.$("#search-keywords-box").focus();
      // this.$('#idcol').popover({
      //     trigger: 'hover',
      //     title: 'Identification',
      //     content: 'InstitutionCode CollectionCode CatalogNumber',
      //     container: '#occTable',
      //     placement: 'top'
      // });
      // this.$('#taxcol').popover({
      //     trigger: 'hover',
      //     title: 'Taxonomy',
      //     content: 'Class: ScientificName',
      //     container: '#occTable',
      //     placement: 'top',
      //     html: 'true'
      // });
      return this;
    },

   setup: function () {
      this.$("#search-keywords-box").focus();
      this.spin = new Spin(this.$('.search-spinner'));
      //this.downloadTab = new Download(this.options, this.app, this.model);
      //this.$('#downloadform').html(this.downloadTab.render().el);
      this.$('#bottom-pager').hide();
      this.$('#resultTabs a').on('shown', _.bind(function (e) {
        var tab = e.target.id;
        if (tab === 'maptab') {
          this.resultMap._updateMarkers();
          this.resultMap.resize();
        } else if (tab === 'download-tab') {
          //this.downloadTab.calculateCount();
        }
      }, this));
   
      this.$('#submit-download-btn').click(_.bind(function(e) {
        this._submitDownload(e);
      }, this));

      this.$('.dl-btn').addClass('disabled');
      this.$('.dl-btn').click(_.bind(function(e) {
        var countRequest = {q:JSON.stringify({terms: this.model.get('terms'), 
          keywords: this.model.get('keywords')})};
        var name = 'vertnet-download';
        var request = {
          count: -1,
          name: name, 
          terms: JSON.stringify(this.model.get('terms')),
          keywords: JSON.stringify(this.model.get('keywords'))
        }
        if (!this.show) {
          return;
        }
        this.spin.start();
        rpc.execute('/service/rpc/record.count', countRequest, {
          success: _.bind(function(x) {
            this.spin.stop();
            if (x.count <= 1000) {
              request.count = x.count;
              window.location.href = '/service/download?' + $.param(request);
            } else {
              this.$('#reccount').text(x.count);
              this.$('#myModal').modal();
            }
          }, this), 
          error: _.bind(function(x) {
            console.log('ERROR: ', x);
          }, this)
        });
      }, this));

      this.$('#resultTabs a').click(_.bind(function (e) {
        var tab = e.target.id;
        if (tab === 'maptab') {
          this.resultMap.resize();
        } 
      }, this));

      this.$('#search-keywords-box').val(this.options.query.q);
      this.$('#genus').val(this.options.query.genus);
      this.$('#specificepithet').val(this.options.query.specificepithet);
      this.$('#year').val(this.options.query.year);
      this.$('#country').val(this.options.query.country);
      this.$('#institutioncode').val(this.options.query.institutioncode);
      if (!_.isEmpty(this.options.query)) {
        this._submitHandler(null, true);
      } 

      this.timer = null;
      // $(document).on('keyup', _.bind(function(e) {
      this.$('#search-form').on('keyup', _.bind(function(e) {
        this._prepTerms();
        this._explodeKeywords();
        if (this.timer) {
          clearTimeout(this.timer);
        }
        this.timer = setTimeout(_.bind(function() {
          this._submitHandler(null, true);
        }, this), 250);
      }, this));


      return this;
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
      if (bypass || e.keyCode == 13) { // 13 RETURN, 9 TAB.
        var path = window.location.pathname;
        var search = this._getSearch();
        if (search) {
          path += '?' + search;
        } 
        this.paging = false;
        this.response = null;
        this._disableTablePager(true);
        this._executeSearch();
        if (!bypass && (e.keyCode == 13 || e.keyCode == 9)) {
          this.app.router.navigate(window.location.pathname + '?' + this._getSearch());
        }
      }
    },

    // Executes search request to server.
    _executeSearch: function() {
      var request = null;
      this._prepTerms();
      this._explodeKeywords();
      this.model.set({terms: this.terms, keywords:this.keywords});
      if ((_.size(this.terms) > 0) || (_.size(this.keywords) > 0)) {
        this.spin.start(); 
        request = {limit:50, q:JSON.stringify({terms: this.terms, 
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
        this.spin.stop();
      }
    },

    // Prepare the dictionary of search terms.
    _prepTerms: function() {
      this.terms = {};
      _.each(this.$('#search-form input'), _.bind(function (input) {
        var value = $(input).val();
        if (input.id !== 'search-keywords-box' && value.trim() !== '') {
          this.terms[input.id] = value.trim().toLowerCase();
        }
      }, this));
    },

    // Handler for new results from server.
    _resultsHandler: function(response) {
      var items = _.map(response.items, function(item) {
        return JSON.parse(item.json);
      });
      var showResults = items.length !== 0;
      var howMany = response.count >= 1000 ? 'many' : response.count;
      if (!this.paging) {
        this._clearResults();
      }
      this.count = response.count;
      this.countLoaded += items.length;
      this.$('.counter').text('1-' + this.countLoaded + ' of ' + howMany);
      this.response = response;
      this._showResultsTable(showResults);
      if (showResults) {
        _.each(items, _.bind(function (i) {
          var model = new OccModel(i);
          var view = new OccRow({parentView: this, model:model}, this.app);
          this.occList.add(model);
          this.viewList.push(view);
          this.$('#occTable > tbody:last').append(view.render().el);
          view.on('onClick', function() {
            this.app.router.navigate(window.location.pathname + '?' + this._getSearch());
          }, this);
        }, this));
      } else {
        this.terms = {};
        this.keywords.splice(0, this.keywords.length);
      }
      this._disableTablePager(!this.response.more);
      this.spin.stop();
    },

    // Disable table pager.
    _disableTablePager: function(disable) {
      if (disable) {
        this.$('.table-pager').addClass('disabled');
      } else {
        this.$('.table-pager').removeClass('disabled');
      }
    },

    // Show results in table.
    _showResultsTable: function(show) {
      var table = this.$('#occTable');
      var tab = this.$('#occ-search-tab');

      this.show = show;
      if (show) {
        table.show();
        this.$('#bottom-pager').show();
        // this.$('#no-results').hide();
        this.$('.counter').show();
        this.$('.dl-btn').removeClass('disabled');
      } else {
        this.$('.dl-btn').addClass('disabled');
        table.hide();
        this.$('.counter').text('0 results');
        this.$('.counter').show();
        this.$('#bottom-pager').hide();
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

    _submitDownload: function(e) {
        var email = this.$('#email').val();
        var name = this.$('#name').val();
        var count = Number(this.$('#reccount').text());
        var request = {
          count: count,
          email: email, 
          name: name, 
          terms: JSON.stringify(this.model.get('terms')),
          keywords: JSON.stringify(this.model.get('keywords'))}
        e.preventDefault();
        $.get('/service/download', request);
        this.$('#myModal').modal('hide')
      },

    // Explode search keywords value into an array of terms.
    _explodeKeywords: function() {
      // Split string on whitespace and commas:
      var q = this.$('#search-keywords-box').val();
      var keywords = q.trim().split(/,?\s+/);
      if (q && !_.isEmpty(keywords)) {
        this.keywords = _.map(keywords, function(x) {
          var x = x.trim().toLowerCase();
          if (x) {
            return x;
          }
        });
      } else {
        this.keywords = [];
      }
    },
  });
});