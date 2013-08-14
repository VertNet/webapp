/*
 * Search view.
 */
define([
  'jQuery',
  'Underscore',
  'Backbone',
  'mps',
  'map',
  'rpc',
  'text!views/search.html',
  'models/details',
  'views/detailrow',
  'models/detail',
  'views/resultmap',
  'views/searchmap',
  'models/search',
  'Spin',
  'store'
], function ($, _, Backbone, mps, map, rpc, template, OccList, OccRow, 
    OccModel, ResultMap, SearchMap, SearchModel, Spin, store) {
  return Backbone.View.extend({
    events: {
      'click .pager': '_loadMore',
    },

    initialize: function (options, app) {
      this.app = app;
      this.DOWNLOAD_THRES = 1000;
      this.PAGE_SIZE = 20;
      this.keywords = []; // Search query keywords
      this.terms = {}; // Search query terms
      this.occList = new OccList();
      this.viewList = []; // Array of result table row views.
      this.paging = false;
      this.count = 0;
      this.countLoaded = 0;
      this.model = new SearchModel();
      this.spatialSearch = false;
      mps.publish('spin', [true]);
    },

    // The cb is needed since rendering is async due to maps.
    render: function(cb) {
      map.init(_.bind(function() { 
        this.$el.html(_.template(template));
        this.resultMap = new ResultMap({collection: this.occList}, this.app);
        this.searchMap = new SearchMap({collection: this.occList}, this.app);
        var spatialSearchControl = this.$('#spatial-search-control');
        var loadMoreControl = this.$('#load-more-control');

        this.$('#occTable').hide();
        this._disableTablePager(true);
        this.$('#search-form').on('keyup', _.bind(function(e) {
          if (e.keyCode == 13) { // ENTER key
            this._submitHandler(null, true);
          } else if (e.keyCode == 27) { // ESC key
            this.$('#advanced-search-form').hide();
            this.$('#search-keywords-div').show();
            this.$('#search-keywords-box').focus();
          }
        }, this));
           
        this.$("#search-keywords-box").focus();

        this.$(document).on('keyup', _.bind(function(e) {
          if (e.keyCode == 27) { // ESC key
            this.$('#advanced-search-form').hide();
            this.$('#search-keywords-div').show();
          }
        }, this));


        this.$('#resultmap').html(this.resultMap.render().el);
        this.$('#searchmap').html(this.searchMap.render().el);
        this.resultMap.resize();
        this.searchMap.resize();
        loadMoreControl[0].index = 1;
        this.resultMap.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(loadMoreControl[0]);
        this.$('#load-more-control').show();
        this.$('#loadmore').click(_.bind(function(e) {
          this._loadMore(e);
        }, this));

        google.maps.event.addListener(this.searchMap.map, 'click', _.bind(function(e) {
          var lat = e.latLng.lat();
          var lng = e.latLng.lng();
          var keywords = this.$('#search-keywords-box').val();
          var query = 'distance(location,geopoint({0},{1}))<100000';
          var map = this.searchMap.map;

          if (!this.spatialSearch) {
            return;
          }

          this.spin.start();
          query = query.replace("{0}",lat);
          query = query.replace("{1}",lng);
          console.log(query);
          this.spatialQuery = query;

          if (this.circle) {
            google.maps.event.clearInstanceListeners(this.circle);
            this.circle.setMap(null);
          }
          if (this.marker) {
            this.marker.setMap(null);
          }

          this.marker = new google.maps.Marker({
            map: map,
            position: e.latLng,
            title: 'Search',
            draggable: true,
            visible: false
          });

          // Add circle overlay and bind to marker
          this.circle = new google.maps.Circle({
            map: map,
            radius: 200000,    // 10 miles in metres
            fillColor: '#111111',
            fillOpacity: .2,
            editable:true
          });
          this.circle.bindTo('center', this.marker, 'position');

          // Radius changed
          google.maps.event.addListener(this.circle, "radius_changed", _.bind(function(e) {
            var lat = this.circle.getCenter().lat();
            var lng = this.circle.getCenter().lng();
            var radius = Math.round(this.circle.getRadius() / 2.0);
            this.circleHandler(lat, lng, radius, true);
          }, this));

          // Center changed
          google.maps.event.addListener(this.circle, "center_changed", _.bind(function(e) {
            var lat = this.circle.getCenter().lat();
            var lng = this.circle.getCenter().lng();
            var radius = this.circle.getRadius() / 2.0;
            this.circleHandler(lat, lng, radius, true);
          }, this));          

          map.fitBounds(this.circle.getBounds());
          map.setZoom(map.getZoom() - 1);

          this._submitHandler(null, true);

        }, this));
        
        // Hack https://github.com/VertNet/webapp/issues/316
        setTimeout(_.bind(function() {
          cb(this);
        }, this), 500);

      }, this));
    },

    circleHandler: function(lat, lng, radius, submit) {
      var keywords = this.$('#search-keywords-box').val();
      var query = 'distance(location,geopoint({0},{1}))<{2}';
      var listener = null;

      this.spin.start();
      query = query.replace("{0}", lat);
      query = query.replace("{1}", lng);
      query = query.replace("{2}", radius);
      this.spatialQuery = query;
      console.log(query);

      if (submit) {
        this._submitHandler(null, true);
      }
     },

    setup: function () {
      $("#tissue,#media,#mappable").each(_.bind(function(index, el) {
          $(el).click(_.bind(function() {
            this._submitHandler(null, true);
        }, this))
      }, this));

      this.$('#whoops').hide();
      // this.$('#resultmap').hide();
      $("#spatialfilter").click(_.bind(function() {
        if (this.$('#spatialfilter').is(':checked')) {
          $("#collapseOne").collapse('show');
          this.spatialSearch = true;
          this.searchMap.resize();
        } else {
          $("#collapseOne").collapse('hide');
          this.spatialSearch = false;
          if (this.marker) {
            this.marker.setMap(null);
          }
          if (this.circle) {
            this.circle.setMap(null);
          }
          //this.resultMap.toggleSpatialSearchStyle(false);
          this._explodeKeywords();
          this._submitHandler(null, true);
        }
      }, this));
      $("#collapseOne").collapse({toggle: false});
      $("#collapseOne").on('shown', _.bind(function() {
        this.searchMap.resize();
        this.spatialSearch = true;
      }, this));
      $("#collapseOne").on('hidden', _.bind(function() {
        this.spatialSearch = false;
      }, this));

      setTimeout(_.bind(function() {
        if (store.get('try-spatial-closed') !== true) {
          // this.$('#maptab').popover({container: '#maptab', content:'Try spatial search!', html: true, placement: 'bottom'});
          //this.$('#maptab').popover('show');
          this.$('#maptab').click(_.bind(function() {
            store.set('try-spatial-closed', true);
            //this.$('#maptab').popover('destroy');
          }, this));
        }
      }, this), 3000);

      // this.$('#search-button').popover({content:'<strong>Spatial search is on.</strong>', html: true, placement: 'top'});
      this.$('#spatial-search-control').hide();
      this.$('#spatial-search-control').click(_.bind(function(e) {
        var check = this.$('#spatial-label');
        this.spatialSearch = check.is(':checked');
        if (!this.spatialSearch) {
          //this.$('#search-button').popover('hide');      
          if (this.marker) {
            this.marker.setMap(null);
          }
          if (this.circle) {
            this.circle.setMap(null);
          }
          //this.resultMap.toggleSpatialSearchStyle(false);
          this._explodeKeywords();
          this._submitHandler(null, true);
        } else {
          //this.$('#search-button').popover('show');      
          //this.resultMap.toggleSpatialSearchStyle(true);
        }
      }, this));
    
      this.$('#search-button').click(_.bind(function() {
        this._submitHandler(null, true);
      }, this));
      
      this.$('#search-button-advanced').click(_.bind(function() {
        this._submitHandler(null, true);
      }, this));

      this.$('#show-search-options').click(_.bind(function(e) {
        e.preventDefault();
        this.$('#advanced-search-form').show();
        this.$('#sort').val(this.options.query.sort ? this.options.query.sort : "No sort");
        this.$('#allwords').focus();
        //this.$('#maptab').popover('hide');
        this.$('#search-keywords-div').hide();
        this.$('#search-carat').popover('destroy');
        if (this.spatialMap) {
          this.spatialMap.resize();
        }
        store.set('search-carat-closed', true);
      }, this));

      this.$('#close-advanced-search').click(_.bind(function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.$('#advanced-search-form').hide();        
        this.$('#search-keywords-div').show();
        //this.$('#maptab').popover('show'); 
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
        this.$('#click-row-tip').bind('closed.bs.alert', _.bind(function () {
          store.set('protip-closed', true);
        }, this));
      }

      this.$("#search-keywords-box").focus();
      this.spin = new Spin(this.$('.search-spinner'));
      //this.downloadTab = new Download(this.options, this.app, this.model);
      //this.$('#downloadform').html(this.downloadTab.render().el);
      this.$('#bottom-pager').hide();
      this.$('#resultTabs a').on('shown.bs.tab', _.bind(function (e) {
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
        var name = 'vertnet-download';
        var request = {
          count: -1,
          name: name, 
          terms: JSON.stringify(this.model.get('terms')),
          keywords: this.keywords
        };
        if (!this.show) {
          return;
        } 
        this.$('#queue').show();
        this.$('#submit-download-btn').show();
        this.$('#myModalLabel').show();
        if (this.count <= this.DOWNLOAD_THRES) {
          this.$('#instant-msg').show();
          this.$('#queue-msg').hide();
          this.$('#email').hide();
        } else {              
          this.$('#instant-msg').hide();
          this.$('#queue-msg').show();
          this.$('#email').show();
        }
        this.$('#confirmation').hide();
        this.$('#reccount').text(this.count);
        this.recCount = this.count;
        this.$('#myModal').modal();
        this.$('#name').focus();
      }, this));

      this.$('#resultTabs a').click(_.bind(function (e) {
        var tab = e.target.id;
        if (tab === 'maptab') {
          this.resultMap.resize();
        } 
      }, this));
      mps.publish('spin', [false]);
      this.onShow(this.options);
      return this;
    },

    onShow: function(options) {
      var queryVal = this.$('#search-keywords-box').val();

      if (options) {
        this.options.query = options.query;
      }

      this.resultMap.resize();
      this.$('#search-keywords-box').val(this.options.query.q);
      this.$('#sort').val(this.options.query.sort ? this.options.query.sort : "");
      setTimeout(_.bind(function() {
        if (!store.get('search-carat-closed') && !this.options.query.advanced) {
          this.$('#search-carat').popover({placement: 'top', content: 'Advanced search'});
          this.$('#search-carat').popover('show');
        } 
      }, this), 2000);

      if (this.options.query.advanced) {
        this.$('#advanced-search-form').show();
        this.$('#sort').val(this.options.query.sort ? this.options.query.sort : "No sort");
        this.$('#allwords').focus();
        this.$('#search-keywords-div').hide();
        this.$("#search-keywords-box").val('');
        delete this.options.query['advanced'];
      } else {
        this.$('#advanced-search-form').hide();
        this.$('#search-keywords-div').show();
        this.$("#search-keywords-box").focus();
        if (this.countLoaded === 0 || queryVal !== options.query.q || queryVal === '') {
          this._submitHandler(null, true);
        }
      }
    },

    // Load more results.
    _loadMore: function(e) {
      e.preventDefault();
      e.stopPropagation();
      // if (this.countLoaded < this.count) {
      if (this.response.items.length >= this.PAGE_SIZE) {
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
      var start = this.$('#datestart').val();
      var end = this.$('#dateend').val();
      var type = this.$('#recordtype :selected').val();


      if (type === 'Specimen or Observation') {
        type = 'both';
      } 
      if (type === 'Specimen') {
        type = 'specimen';
      }
      if (type === 'Observation') {
        type = 'observation';
      }
      if (type === 'Any type') {
        type = '';
      }

      query = [all, exact].join(' ');
      if (type !== '') {
        query += [' type:', type].join('');
      }
      
      this._prepTerms();
      query += [' ', this.termsStr].join('');
      if (any) {
        query += [' (', any, ')'].join('');
      }
      if (none) {
        query += [' AND (', none, ')'].join('');
      }

      if (start && !end) {
        start = Number(start) - 1;
        query += [ ' eventdate > ', start + '-1-1 '].join('');      
      }
      if (!start && end) {
        end = Number(end) + 1;
        query += [' eventdate < ', end + '-1-1 '].join('');
      }
      if (start && end) {
        start = Number(start) - 1;
        end = Number(end) + 1;
        query += [ ' eventdate > ', start + '-1-1 ', 'eventdate < ', end + '-1-1 '].join('');      
      }

      query += _.reduce(this.$('#filters input'), function(memo, input) {
        var input = $(input);
        if (input.attr('id') === 'spatialfilter') {
          return memo;
        }
        if (input.is(':checked')) {
          return [' ', input.attr('id'), ':', '1 '].join('') + memo
        } else {
          return memo;
        }
      }, '');

      return query.trim().split(/\s+/).join(' ');
    },

    _getSearch: function() {
      var terms = {};
      var q = this.$('#search-keywords-box').val();
      var query = null;
      var sort = this.$('#sort :selected').val();

      if (sort) {
        sort = sort.toLowerCase();
      } else {
        sort = 'no sort';
      }

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
      if (sort !== 'no sort') {
        terms['sort'] = sort;      
      }
      return decodeURIComponent($.param(terms));
    },

    // Submit handler for search.
    _submitHandler: function(e, bypass) {
      if (!this.spatialSearch && this.$('#search-keywords-div').is(":visible") && 
            this.$('#search-keywords-box').val().trim() === '') {
        this._clearResults();
        this._showResultsTable(false);
        this.spin.stop();
        return;
      }
      var path = window.location.pathname;
      var search = this._getSearch();
      var q = this.$('#search-keywords-box').val();
      var radius = null;
      if (search !== 'q=') {
        path += '?' + search;
        mps.publish('navigate', [{path: path, trigger: true}]);
      } 
      this.paging = false;
      this.response = null;
      this._disableTablePager(true);
      this._executeSearch();
    },

    // Executes search request to server.
    _executeSearch: function() {
      var request = null;
      var sort = this.$('#sort :selected').val();

      if (sort) {
        sort = sort.toLowerCase();
      } else {
        sort = 'no sort';
      }
      
      if (!this.retrying) {
        this.retryCount = 0;
        this.maxRetries = 3;
        this.$('#whoops').hide();
        this.$('#whoops').removeClass('alert-danger');
      } 

      if (this.waitingForResponse || this.cancel) {
        console.log('No execute search... Waiting for response or a cancelled request.');
        return;
      }

      this._explodeKeywords();
      this.model.set({terms: this.terms, keywords:this.keywords});
      if (_.size(this.keywords) > 0) {
        this.spin.start(); 
        request = {limit:this.PAGE_SIZE, q:JSON.stringify({keywords: this.keywords})};
        if (sort !== 'no sort') {
          request.sort = sort;
        }
         if (this.response && this.response.cursor) {
          request['cursor'] = this.response.cursor;
        }
      
        this.waitingForResponse = true;        
        rpc.execute('/service/rpc/record.search', request, {
          success: _.bind(function(response) {
            if (response.error) {
              this._handleError(response.error);
              return;
            }
            if (this.cancelSearch) {
              this.cancelSearch = false;
              this.waitingForResponse = false;
              this.$('#whoops').hide();
              this._clearResults();
              this._showResultsTable(false);
              this.spin.stop();
              return;
            }
            this.waitingForResponse = false;
            this.retrying = false;
            this.$('#whoops').hide();
            this._resultsHandler(response);
          }, this), 
          error: _.bind(function(x) {
            this._handleError(x)  
          }, this)
        });
      } else {
        this._clearResults();
        this._showResultsTable(false);
        this.spin.stop();
      }
    },

    _handleError: function(error) {
      console.log(error);
      if (error === 'QueryError' || error === 'InvalidRequest') {
        this.$('#whoops').html('<button type="button" class="close" data-dismiss="alert">×</button><strong>Whoops!</strong> Invalid query! Check the syntax and try again.');              
        this.$('#whoops').show();
        this.waitingForResponse = false;
        this.spin.stop();
        return;
      }
      if (this.cancelSearch) {
        this.cancelSearch = false;
        this.waitingForResponse = false;
        this._clearResults();
        this._showResultsTable(false);
        this.$('#whoops').hide();
        this.spin.stop();
        return;
      }
      this.spin.stop();
      this.waitingForResponse = false;
      this.retrying = false;
      if (this.retryCount < this.maxRetries) {
        this.$('#whoops').html('<button type="button" class="close" data-dismiss="alert">×</button><strong>Hmmmm.</strong> Search is a little slow right now! Automatic retry ' + (this.retryCount+1) + ' of ' + this.maxRetries + '... (<a id="whoops-cancel" href="#">cancel</a>)');              
        this.$('#whoops-cancel').click(_.bind(function() {
          this.cancelSearch = true;
          this.$('#whoops').html('<button type="button" class="close" data-dismiss="alert">×</button><strong>OK!</strong> Cancelling search request now. Please try adding additional keywords and searching again. Almost done cancelling...');              
          this._clearResults();
          this._showResultsTable(false);
          // this.spin.stop();
        }, this));
        this.$('#whoops').show();
        this.retrying = true;
        this.retryCount += 1;
        this._executeSearch();
      } else {
        this.$('#whoops').addClass('alert-danger');
        this.$('#whoops').html('<button type="button" class="close" data-dismiss="alert">×</button><strong>Whoops!</strong> Search failed. We notified the team. Please try adding additional keywords and searching again.');              
      }
    },

    // Prepare the dictionary of search terms.
    _prepTerms: function() {
      this.terms = {};
      _.each(this.$('#dwcterms input'), _.bind(function (input) {
        var value = $(input).val();
        this.terms[input.id] = value.trim();
      }, this));
      this.termsStr = _.reduce(this.terms, function(memo, val, key) {
        if (val) {
          return key + ':' + val + ' ' + memo;
        } else {
          return memo;
        }
      }, ' ');
    },

   // Handler for new results from server.
    _resultsHandler: function(response) {
      var items = _.map(response.items, function(item) {
        return JSON.parse(item.json);
      });
      var showResults = items.length > 0;
      var count = 0;
      var howMany = 0;
      var displayCount = 0;
      console.log(response);
      if (!this.paging) {
        this._clearResults();
        this.count = response.count;
      }
      displayCount = this.count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      displayCount = null;
      if (response.count < 100) {
        displayCount = 'dozens';
      } else if (response.count < 1000) {
        displayCount = 'hundreds';
      } else if (response.count < 1000000) {
        displayCount = 'thousands';
      } else {
        displayCount = 'millions';
      }
      this.countLoaded = items.length + this.occList.length;

      if (items.length < this.PAGE_SIZE || items.legth === 0) {
        this.$('.counter').text('1-' + this.countLoaded + ' of ' + this.countLoaded);
      } else {
        this.$('.counter').text('1-' + this.countLoaded + ' of ' + displayCount);
      }

      this.response = response;
      this._showResultsTable(showResults || this.paging);
      if (showResults) {
        _.each(items, _.bind(function (i) {
          var model = new OccModel(i);
          var view = new OccRow({parentView: this, model:model}, this.app);
          this.occList.add(model);
          this.viewList.push(view);
          this.$('#occTable > tbody:last').append(view.render().el);
          view.on('onClick', function() {
            //this.app.router.navigate(window.location.pathname + '?' + this._getSearch());
          }, this);
        }, this));
      } else {
        this.terms = {};
        this.keywords.splice(0, this.keywords.length);
      }
      // this._disableTablePager(this.count === this.countLoaded);
      this._disableTablePager((items.length < this.PAGE_SIZE) || !response.cursor);      
      this.spin.stop();
    },

    // Disable table pager.
    _disableTablePager: function(disable) {
      if (disable) {
        this.$('.table-pager').addClass('disabled');
        this.$('#loadmore').addClass('disabled');
      } else {
        this.$('.table-pager').removeClass('disabled');
        this.$('#loadmore').removeClass('disabled');
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
      // this.$('#spatial-label').prop("checked", false);
      // this.resultMap.toggleSpatialSearchStyle(false);
      // if (this.cirlce) {
      //   this.circle.setMap(null);
      // }
      // if (this.marker) {
      //   this.marker.setMap(null);
      // }
      // this.spatialSearch = false;
    },

    _submitDownload: function(e) {
        this._explodeKeywords();
        var email = this.$('#email').val();
        var name = this.$('#name').val();
        var count = this.count; //Number(this.$('#reccount').text());
        var request = {
          count: count,
          email: email, 
          name: name, 
          keywords: JSON.stringify(this.keywords)}
        e.preventDefault();
        if (count <= this.DOWNLOAD_THRES) {
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
      var keywords = q ? q.trim().split(/\s+/) : [];
      if (this.spatialSearch) {
        keywords.push(this.spatialQuery);
      }
      if (q || !_.isEmpty(keywords)) {
        this.keywords = _.map(keywords, function(x) {
          var x = x ? x.trim() : '';
          if (x || x !== '') {
            return x;
          }
        });
      } else {
        this.keywords = [];
      }
    },
  });
});
