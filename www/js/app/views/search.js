/**
 * This file is part of VertNet: https://github.com/VertNet/webapp
 * 
 * VertNet is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * VertNet is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Foobar.  If not, see: http://www.gnu.org/licenses
 */

// Defines the view for the search page.
define([
  'jquery',
  'underscore',
  'backbone',
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
  'store',
  'util'
], function ($, _, Backbone, mps, map, rpc, template, OccList, OccRow, 
    OccModel, ResultMap, SearchMap, SearchModel, store, util) {
  return Backbone.View.extend({
    events: {
      'click .pager': '_loadMore',
    },

    initialize: function (options, app) {
      this.app = app;
      this.NUMBER_FOUND_ACCURACY = 10000;
      this.DOWNLOAD_THRES = 1000;
      this.PAGE_SIZE = 100; // For optimal browser performance
//      this.PAGE_SIZE = 400; // For optimal query performance
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


        this.$('#nameval').on('keyup', _.bind(function(e) {
          if (e.keyCode == 13) { // ENTER key
            this._submitDownload(e);
          } 
        }, this));   
        this.$('#emailval').on('keyup', _.bind(function(e) {
          if (e.keyCode == 13) { // ENTER key
            this._submitDownload(e);
          } 
        }, this));      
           
        this.$('#myModal').on('shown.bs.modal', _.bind(function () {
          this.$('#nameval').focus();
          this.$('#nameval').val('MyResults');
          this.$('#email').removeClass('has-error');
          this.$('#name').removeClass('has-error');
          this.$('#nameval').select();
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

          mps.publish('spin', [true]);
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

      mps.publish('spin', [true]);
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
      this.$('#whoops').hide();
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
          this.$('#maptab').click(_.bind(function() {
            store.set('try-spatial-closed', true);
          }, this));
        }
      }, this), 3000);

      this.$('#spatial-search-control').hide();
      this.$('#spatial-search-control').click(_.bind(function(e) {
        var check = this.$('#spatial-label');
        this.spatialSearch = check.is(':checked');
        if (!this.spatialSearch) {
          if (this.marker) {
            this.marker.setMap(null);
          }
          if (this.circle) {
            this.circle.setMap(null);
          }
          this._explodeKeywords();
          this._submitHandler(null, true);
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
        this.$('#inst-dropdown').focus();
        this.$('#search-keywords-div').hide();
        this.$('#search-carat').popover('destroy');
        if (this.spatialMap) {
          this.spatialMap.resize();
        }
        store.set('search-carat-closed', true);
      }, this));
	  
		//Tooltips
		  this.$('#show-thesefilters-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'Use filters to find records that are or contain fossils, types, tissues, media, mappable or located within a custom area on a map.<br><br>Read more...',
			  container: '#thesefilters-tip'
			});
		  this.$('#thesefilters-tip').mouseover(_.bind(function(e) {
			this.$('#show-thesefilters-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-thesefilters-tip').tooltip('hide');
		  }, this));
		  
		  this.$('#show-hasTissues-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'This filter searches the preparations field in each record.  <br><br>There is no standardized vocabulary for this field, so the VertNet team has identified 24 terms that are very likely to be, or contain, a tissue sample. <br><br>For more information about the tissues, click to see &quot;Why can’t I find tissue information using the tissue filter?&quot;',
			  container: '#hasTissues-tip'
			});
		  this.$('#hasTissues-tip').mouseover(_.bind(function(e) {
			this.$('#show-hasTissues-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-hasTissues-tip').tooltip('hide');
		  }, this));
		  		  	
		  this.$('#show-allTheseWords-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'Search will identify all records containing ALL of the terms submitted.<br><br>Read more...',
			  container: '#allTheseWords-tip'
			});
		  this.$('#allTheseWords-tip').mouseover(_.bind(function(e) {
			this.$('#show-allTheseWords-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-allTheseWords-tip').tooltip('hide');
		  }, this));	
		  
		  this.$('#show-exactPhrase-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'Search will identify all records that contain the exact phrase submitted.<br><br>Quotation marks (&quot;&quot;) are required to identify the extent of the phrase.<br><br>Read more...',
			  container: '#exactPhrase-tip'
			});
		  this.$('#exactPhrase-tip').mouseover(_.bind(function(e) {
			this.$('#show-exactPhrase-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-exactPhrase-tip').tooltip('hide');
		  }, this));			  

		  this.$('#show-anyWords-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'Search will identify all records that contain at least one of the terms submitted. Operators OR and AND can help to focus queries.<br><br>Read more...',
			  container: '#anyWords-tip'
			});
		  this.$('#anyWords-tip').mouseover(_.bind(function(e) {
			this.$('#show-anyWords-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-anyWords-tip').tooltip('hide');
		  }, this));
		  
		  this.$('#show-noneWords-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'Search will identify all records that do NOT contain the terms submitted.<br><br>Read more...',
			  container: '#noneWords-tip'
			});
		  this.$('#noneWords-tip').mouseover(_.bind(function(e) {
			this.$('#show-noneWords-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-noneWords-tip').tooltip('hide');
		  }, this));		  		  

		  this.$('#show-recordType-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'Search will identify all records of the selected type: specimen, observation, or both specimen and observation.<br><br>Read more...',
			  container: '#recordType-tip'
			});
		  this.$('#recordType-tip').mouseover(_.bind(function(e) {
			this.$('#show-recordType-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-recordType-tip').tooltip('hide');
		  }, this));		  		  

		  this.$('#show-instCode-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'Search will identify all records with the exact terms contained within the specified Darwin Core field(s).<br><br>Read more...',
			  container: '#instCode-tip'
			});
		  this.$('#instCode-tip').mouseover(_.bind(function(e) {
			this.$('#show-instCode-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-instCode-tip').tooltip('hide');
		  }, this));

		  this.$('#show-dcTerms-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'Search will identify all records with the exact terms contained within the specified Darwin Core field(s).<br><br>Read more...',
			  container: '#dcTerms-tip'
			});
		  this.$('#dcTerms-tip').mouseover(_.bind(function(e) {
			this.$('#show-dcTerms-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-dcTerms-tip').tooltip('hide');
		  }, this));		  		  

		  this.$('#show-years-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'Search will identify all records contained within the range of years submitted. Use four-digit format.',
			  container: '#years-tip'
			});
		  this.$('#years-tip').mouseover(_.bind(function(e) {
			this.$('#show-years-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-years-tip').tooltip('hide');
		  }, this));
		  
		  this.$('#show-months-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'Search will identify all records contained within the range of months submitted. Use numerical values 1 through 12.',
			  container: '#months-tip'
			});
		  this.$('#months-tip').mouseover(_.bind(function(e) {
			this.$('#show-months-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-months-tip').tooltip('hide');
		  }, this));	
		  
// ===== Scroll to Top ==== 
$(window).scroll(function() {
    if ($(this).scrollTop() >= 50) {        // If page is scrolled more than 50px
        $('#return-to-top').fadeIn(200);    // Fade in the arrow
    } else {
        $('#return-to-top').fadeOut(200);   // Else fade out the arrow
    }
});
$('#return-to-top').click(function() {      // When arrow is clicked
    $('body,html').animate({
        scrollTop : 0                       // Scroll to top of body
    }, 500);
});		  	  
		  
	//Get List of institutions and institutionCodes for institutionCode select
	$.getJSON("https://vertnet.carto.com/api/v2/sql?q=SELECT icode, orgname, concat(icode,' - ',orgname) AS instcombo FROM resource where ipt=TRUE AND networks LIKE %27%25VertNet%25%27 GROUP BY icode, orgname ORDER BY icode, orgname",function(institutions) {
         var listItems = '<option value="">Select institution code</option>';

		$.each(institutions.rows, function(key, val) {
 
             listItems += "<option value='" + val.icode + "'>" + val.instcombo + "</option>";
 
         $("#inst-dropdown").html(listItems);
     });
	 });	
	  	
	//end institution list	  		  		  
 		  		  
      this.$('#close-advanced-search').click(_.bind(function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.$('#advanced-search-form').hide();        
        this.$('#search-keywords-div').show();
      }, this));

      this.$('#show-search-options').tooltip({
          placement: 'bottom',
          title: 'Click to expand search options',
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
      this.$('#bottom-pager').hide();
      this.$('#resultTabs a').on('shown.bs.tab', _.bind(function (e) {
        var tab = e.target.id;
        if (tab === 'maptab') {
          this.resultMap._updateMarkers();
          this.resultMap.resize();
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
          name: name.replace(/ /g,'_'), 
          terms: JSON.stringify(this.model.get('terms')),
          keywords: this.keywords
        };
        if (!this.show) {
          return;
        } 
        this.$('#queue').show();
        this.$('#submit-download-btn').show();
        if (this.count <= this.NUMBER_FOUND_ACCURACY) {
          this.$('#bigModalLabel').hide();
          this.$('#smallModalLabel').show();
        } else {
          this.$('#bigModalLabel').show();
          this.$('#smallModalLabel').hide();
        }
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
        this.$('#reccount').text(util.addCommas(this.count));
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

    onShow: function(options, init) {
      var queryVal = this.$('#search-keywords-box').val();

      if (search == null) {
        load = false;
      } else {
        load =  queryVal !== decodeURIComponent(this._getSearch().replace('+',' ').replace('q=',''));
      }

      if (options) {
        this.options.query = options.query;
      }

      this.resultMap.resize();
      if (this.options.query.q) {
        this.$('#search-keywords-box').val(this.app.parseUrl().q);
      }
      this.$('#sort').val(this.options.query.sort ? this.options.query.sort : "");
      setTimeout(_.bind(function() {
        if (!store.get('search-carat-closed') && !this.options.query.advanced) {
          this.$('#search-carat').popover({placement: 'top', content: ''});
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
        if (init) {
           mps.publish('navigate', [{path: 'search', trigger: false}]);
           this.$('#search-keywords-box').val('');
           this._clearResults();
           this._showResultsTable(false);
         } else if (!load && (this.countLoaded === 0 || queryVal !== options.query.q || queryVal === '')) {
          this._submitHandler(null, true);
        }
      }
    },

    // Load more results.
    _loadMore: function(e) {
      e.preventDefault();
      e.stopPropagation();
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
      var mstart = this.$('#monthstart').val();
      var mend = this.$('#monthend').val();
      var dstart = this.$('#daystart').val();
      var dend = this.$('#dayend').val();
      var startdyst = this.$('#startdayyearstart').val();
      var startdye = this.$('#startdayyearend').val();
      var enddyst = this.$('#enddayyearstart').val();
      var enddye = this.$('#enddayyearend').val();	  	  
	  var massingstart = this.$('#massstart').val();
	  var massingend = this.$('#massend').val();
	  var lengthinmmstart = this.$('#lengthstart').val();
	  var lengthinmmend = this.$('#lengthend').val();
	  var inst = this.$('#inst-dropdown :selected').val();
	  var bofr = this.$('#bofr-dropdown :selected').val();
	  var ltype = this.$('#ltype-dropdown :selected').val();
      var type = this.$('#recordtype :selected').val();

      if (type === 'Specimen or Observation') {
        type = 'both';
      } 
      if (type === 'specimen') {
        type = 'specimen';
      }
      if (type === 'observation') {
        type = 'observation';
      }
      if (type === 'Any type') {
        type = '';
      }

      query = [all, exact].join(' ');
      if (type !== '') {
        query += [' vntype:', type].join('');
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
        start = Number(start);
        query += [ ' year >= ', start].join('');      
      }
      if (!start && end) {
        end = Number(end);
        query += [' year <= ', end].join('');
      }
      if (start && end) {
        start = Number(start);
        end = Number(end);
        query += [ ' year >= ', start, ' year <= ', end].join('');      
      }

      if (mstart && !mend) {
        mstart = Number(mstart);
        query += [ ' month >= ', mstart].join('');      
      }
      if (!mstart && mend) {
        mend = Number(mend);
        query += [' month <= ', mend].join('');
      }
      if (mstart && mend) {
        mstart = Number(mstart);
        mend = Number(mend);
        query += [ ' month >= ', mstart, ' month <= ', mend].join('');      
      }

      if (dstart && !dend) {
        dstart = Number(dstart);
        query += [ ' day >= ', dstart].join('');      
      }
      if (!dstart && dend) {
        dend = Number(dend);
        query += [' day <= ', dend].join('');
      }
      if (dstart && dend) {
        dstart = Number(dstart);
        dend = Number(dend);
        query += [ ' day >= ', dstart, ' day <= ', dend].join('');      
      }
	  
      if (startdyst && !startdye) {
        startdyst = Number(startdyst);
        query += [ ' startdayofyear >= ', startdyst].join('');      
      }
      if (!startdyst && startdye) {
        startdye = Number(startdye);
        query += [' startdayofyear <= ', startdye].join('');
      }
      if (startdyst && startdye) {
        startdyst = Number(startdyst);
        startdye = Number(startdye);
        query += [ ' startdayofyear >= ', startdyst, ' startdayofyear <= ', startdye].join('');      
      }	  

      if (enddyst && !enddye) {
        enddyst = Number(enddyst);
        query += [ ' enddayofyear >= ', enddyst].join('');      
      }
      if (!enddyst && enddye) {
        enddye = Number(enddye);
        query += [' enddayofyear <= ', enddye].join('');
      }
      if (enddyst && enddye) {
        enddyst = Number(enddyst);
        enddye = Number(enddye);
        query += [ ' enddayofyear >= ', enddyst, ' enddayofyear <= ', enddye].join('');      
      }	 
	  
      if (massingstart && !massingend) {
        massingstart = Number(massingstart);
        query += [ ' massing >= ', massingstart].join('');      
      }
      if (!massingstart && massingend) {
        massingend = Number(massingend);
        query += [' massing <= ', massingend].join('');
      }
      if (massingstart && massingend) {
        massingstart = Number(massingstart);
        massingend = Number(massingend);
        query += [ ' massing >= ', massingstart, ' massing <= ', massingend].join('');      
      }

      if (lengthinmmstart && !lengthinmmend) {
        lengthinmmstart = Number(lengthinmmstart);
        query += [ ' lengthinmm >= ', lengthinmmstart].join('');      
      }
      if (!lengthinmmstart && lengthinmmend) {
        lengthinmmend = Number(lengthinmmend);
        query += [' lengthinmm <= ', lengthinmmend].join('');
      }
      if (lengthinmmstart && lengthinmmend) {
        lengthinmmstart = Number(lengthinmmstart);
        lengthinmmend = Number(lengthinmmend);
        query += [ ' lengthinmm >= ', lengthinmmstart, ' lengthinmm <= ', lengthinmmend].join('');      
      }	  
	  	  
	  if (inst !== '') {
		  query += [' institutioncode:', inst].join('');
	  }
	  
	  if (bofr !== '') {
		  query += [' basisofrecord:', bofr].join('');
	  }
	  
	  if (ltype !== '') {
		  query += [' lengthtype:', ltype].join('');
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

      if (this.$('#search-keywords-div').is(":visible")) {
        if (q !== '') {
          terms['q'] = q;
        } 
      } else {
        terms['q'] = this._getQuery();
        if (terms['q']) {
          this.$('#search-keywords-box').val(decodeURIComponent(terms['q']));
        }
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
        mps.publish('spin', [false]);
        mps.publish('navigate', [{path: 'search', trigger: false}]);
        return;
      }
      var path = window.location.pathname;
      var search = this._getSearch();
      var q = this.$('#search-keywords-box').val();
      var radius = null;
      if (search !== 'q=') {
        path += '?' + search;
        mps.publish('navigate', [{path: path, trigger: false}]);
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
        mps.publish('spin', [true]);
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
              mps.publish('spin', [false]);
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
        mps.publish('spin', [false]);
      }
    },

    _handleError: function(error) {
      console.log(error);
      if (error === 'QueryError' || error === 'InvalidRequest') {
        this.$('#whoops').html('<button type="button" class="close" data-dismiss="alert">×</button><strong>Whoops!</strong> Invalid query! Check the syntax and try again.');              
        this.$('#whoops').show();
        this.waitingForResponse = false;
        mps.publish('spin', [false]);
        return;
      }
      if (this.cancelSearch) {
        this.cancelSearch = false;
        this.waitingForResponse = false;
        this._clearResults();
        this._showResultsTable(false);
        this.$('#whoops').hide();
        mps.publish('spin', [false]);
        return;
      }
      mps.publish('spin', [false]);
      this.waitingForResponse = false;
      this.retrying = false;
      if (this.retryCount < this.maxRetries) {
        this.$('#whoops').html('<button type="button" class="close" data-dismiss="alert">×</button><strong>Hmmmm.</strong> Search is a little slow right now! Automatic retry ' + (this.retryCount+1) + ' of ' + this.maxRetries + '... (<a id="whoops-cancel" href="#">cancel</a>)');              
        this.$('#whoops-cancel').click(_.bind(function() {
          this.cancelSearch = true;
          this.$('#whoops').html('<button type="button" class="close" data-dismiss="alert">×</button><strong>OK!</strong> Cancelling search request now. Please try adding additional keywords and searching again. Almost done cancelling...');              
          this._clearResults();
          this._showResultsTable(false);
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
      _.each(this.$('#dwcterm input'), _.bind(function (input) {
        var value = $(input).val();
        this.terms[input.id] = value.trim();
      }, this));
      this.termsStr = _.reduce(this.terms, function(memo, val, key) {
        if (val) { 
          // Enclose country, stateprovince and county search terms in double quotes to
          // support, for example, a search on "Virginia" that does not return records for
          // "West Virginia". Also include iptrecordid/occurrenceID and license in double quotes as these two terms often have punctuation in the values.
          if (key == 'country' || key == 'stateprovince' || key == 'county' || key == 'iptrecordid' || key == 'license'){
            return key + ':"' + val + '" ' + memo;
          }
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
      if (response.count > 10000) {
        // JRW modified 2020-06-28
        displayCount = '>10k, estimated: ' + response.count;
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
          }, this);
        }, this));
      } else {
        this.terms = {};
        this.keywords.splice(0, this.keywords.length);
      }
      this._disableTablePager((items.length < this.PAGE_SIZE) || !response.cursor);      
      mps.publish('spin', [false]);
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
        
		this.$('#advanced-search-form').hide(); 
		this.$('#search-keywords-div').show();
		table.show();
               

//		$('html, body').animate({
//    		scrollTop: $('#resultTabs').offset().top
//	}, 1000);
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
        this._explodeKeywords();
        var email = this.$('#emailval').val();
        var name = this.$('#nameval').val();
        var count = this.count; 
        var error = false;
        var request = {
          count: count,
          email: email, 
          name: name.replace(/[\ \`\~\!\@\#\$\%\^\&\*\(\)\+\=\{\[\}\]\:\;\"\'\<\,\>\?\/\|\\]/g,'_'), 
          keywords: JSON.stringify(this.keywords)}

        e.preventDefault();
        if (this.$('#email').is(':visible') && !email) {
          this.$('#email').addClass('has-error');
          error = true;
        } else {
          this.$('#email').removeClass('has-error');
        }
        if (!name) {
          this.$('#name').addClass('has-error');
          error = true;
        } else {
          this.$('#name').removeClass('has-error');
        }
        if (error) {
          return;
        }
        
        if (count <= this.DOWNLOAD_THRES) {
          window.location.href = '/service/download?' + $.param(request);
          this.$('#myModal').modal('hide');
        } else {
          $.get('/service/download', request);
          this.$('#bigModalLabel').hide();
          this.$('#smallModalLabel').hide();
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
