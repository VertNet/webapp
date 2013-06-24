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
  'Spin',
  'store'
], function ($, _, Backbone, mps, map, rpc, template, DowloadTemp, Download, 
  OccList, OccRow, OccModel, ResultMap, SearchModel, Spin, store) {
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
      // $('').popover({
      //     trigger: 'manual',
      //     title: 'Pro tip',
      //     content: 'Click on a row to see the occurrence detail page.',
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
      this.$('#search-button').click(_.bind(function() {
        this._submitHandler(null, true);
      }, this));
      
      this.$('#advanced-search-button').click(_.bind(function() {
        this._submitHandler(null, true);
      }, this));

      this.$('#advanced-search-form').hide();
      
      this.$('#show-search-options').click(_.bind(function() {
        this.$('#advanced-search-form').show();
        this.$('#search-keywords-div').hide();
      }, this));

      this.$('#close-advanced-search').click(_.bind(function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.$('#advanced-search-form').hide();        
        this.$('#search-keywords-div').show();
      }, this));

      this.$('#show-search-options').tooltip({
          placement: 'bottom',
          title: 'Show advanced search',
          container: '#search-carat'
        });
      this.$('#search-carat').mouseover(_.bind(function(e) {
        this.$('#show-search-options').tooltip('show');
      }, this)).mouseout(_.bind(function(e) {
        this.$('#show-search-options').tooltip('hide');
      }, this));

      this.$('#click-row-tip').hide(); 
      if (store.get('protip-closed') === true) {
        this.$('#click-row-tip').hide();       
      } else {
        this.$('#click-row-tip').bind('closed', _.bind(function () {
          store.set('protip-closed', true);
        }, this));
      }
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
            this.count = x.count;
            this.spin.stop();
            this.$('#queue').show();
            this.$('#submit-download-btn').show();
            this.$('#myModalLabel').show();
            if (x.count <= 1000) {
              this.$('#instant-msg').show();
              this.$('#queue-msg').hide();
              this.$('#email').hide();
            } else {              
              this.$('#instant-msg').hide();
              this.$('#queue-msg').show();
              this.$('#email').show();
            }
            this.$('#confirmation').hide();
            this.$('#reccount').text(x.count);
            this.recCount = x.count;
            this.$('#myModal').modal();
            this.$('#name').focus();
            // if (x.count <= 1000) {
            //   request.count = x.count;
            //   window.location.href = '/service/download?' + $.param(request);
            // } else {
            //   this.$('#reccount').text(x.count);
            //   this.$('#myModal').modal();
            // }
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
        if (e.keyCode != 8 && !/[a-zA-Z0-9]/.test(String.fromCharCode(e.keyCode))) { // alphanumeric with space
          return;
        }
        this._prepTerms();
        this._explodeKeywords();
        if (this.timer) {
          clearTimeout(this.timer);
        }
        this.timer = setTimeout(_.bind(function() {
          if (this.$('#search-keywords-div').is(":visible")) {
            this._submitHandler(null, true);
          }
        }, this), 300);
      }, this));

      this.$('#occTable').popover('show');      


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

    _getQuery: function() {
      var query = '';
      var all = this.$('#allwords').val();
      var exact = this.$('#exactphrase').val();
      var any = this.$('#anywords').val();
      var none = this.$('#nonewords').val();
      query = [all, exact].join(' ');
      if (any) {
        query += [' (', any, ')'].join('');
      }
      if (none) {
        query += [' AND (', none, ')'].join('');
      }
      return query;
    },

    _getSearch: function() {
      var terms = {};
      var q = this.$('#search-keywords-box').val();
      var query = null;
      //this._prepTerms();
      //terms = this.terms;
      if (this.$('#search-keywords-div').is(":visible")) {
        if (q !== '') {
          terms['q'] = q;
        } 
      } else {
        terms['q'] = this._getQuery();
        this.$('#search-keywords-box').val(terms['q']);
      }
      console.log(terms);
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
          this.terms[input.id] = value.trim();
        }
      }, this));
    },

   // Handler for new results from server.
    _resultsHandler: function(response) {
      var items = _.map(response.items, function(item) {
        return JSON.parse(item.json);
      });
      var showResults = items.length > 0;
      var count = 0;
      var howMany = 0;
      if (!this.paging) {
        this._clearResults();
        this.count = response.count;
      }
      howMany = this.count >= 1000 ? 'many' : this.count;
      this.countLoaded = items.length + this.occList.length;
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
        if (!store.get('protip-closed')) {
          this.$('#click-row-tip').show();       
        } 
        table.show();
        this.$('#bottom-pager').show();
        // this.$('#no-results').hide();
        this.$('.counter').show();
        this.$('.dl-btn').removeClass('disabled');
      } else {
        this.$('#click-row-tip').hide(); 
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
        var count = this.count; //Number(this.$('#reccount').text());
        var request = {
          count: count,
          email: email, 
          name: name, 
          terms: JSON.stringify(this.model.get('terms')),
          keywords: JSON.stringify(this.model.get('keywords'))}
        e.preventDefault();
        if (count <= 1000) {
          window.location.href = '/service/download?' + $.param(request);
          this.$('#myModal').modal('hide');
        } else {
          $.get('/service/download', request);
          this.$('#myModalLabel').hide();
          this.$('#confirmation').show();
          this.$('#queue').hide();
          this.$('#submit-download-btn').hide();
          this.$('#dl-email').text(email);
        } 
      },

    // Explode search keywords value into an array of terms.
    _explodeKeywords: function() {
      // Split string on whitespace and commas:
      var q = this.$('#search-keywords-box').val();
      var keywords = q.trim().split(/,?\s+/);
      if (q && !_.isEmpty(keywords)) {
        this.keywords = _.map(keywords, function(x) {
          var x = x.trim();
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