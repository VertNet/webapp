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

// Defines the occurrence detail page view.
define([
  'jquery',
  'backbone',
  'underscore',
  'util',
  'text!views/detail.html',
  'views/detailmap',
  'store',
  'map',
  'mps',
  'rpc',
  'user'
  ], function ($, Backbone, _, util, template, OccDetailMap, store, map, mps, rpc, user) {
    return Backbone.View.extend({

      initialize: function(options, app) {
        this.app = app;
        this.params = options.params;
        this.template = _.template(template);
        mps.publish('spin', [true]);
        this.githubbers = ['MVZ', 'MLZ', 'DMNS', 'WFVZ', 'DMNH', 'ROM', 'TTRS',
          'UBCBBM', 'CUML', 'PMNS'];

        // testers
        // MVZ (Arctos) - Birds, Herps, Mammals, Observations (Carla, Dusty) 
        // MLZ (Arctos) - Birds and Mammals (John McCormick, Dusty)
        // DMNS (Arctos) - Birds and Mammals (John Demboski, Dusty)
        // WFVZ - Birds (Rene Corado and Linnea Hall)
        // DMNH - Birds (Jean Woods)
        // ROM - Birds, Herps, Mammals, Fish (Brad Millen)
        // TTRS - Birds and Mammals (Gil Nelson)
        // UBCBBM - Birds, Mammals, Herps (Grant Hurley and Ildiko Szabo)
        // CUML - Audio/Video (Brian Maltzan)
        // PSMN - Birds and Herps (Teresa Mayfield and Karen Morton)
      }, 

      render: function() {
        var data = _.extend(this.model.attributes, this.model.replaceURLWithHTMLLinks);
        this.$el.html(this.template(data));
        map.init(_.bind(function() {
          var lat = this.$('#DecimalLatitude').text();
          var lon = this.$('#DecimalLongitude').text();
          if (lat && lon) {
            this.latlon = new google.maps.LatLng(lat, lon);
            this.options = {
              zoom: 6,
              scrollwheel: false,
              center: new google.maps.LatLng(lat, lon),
              mapTypeId: google.maps.MapTypeId.TERRAIN
            };
          }
          if (!this.map) {
            if (!window.google || !window.google.maps) {
              return this;
            }
            this.map = new google.maps.Map(this.$('#detailmap')[0], this.options);
            if (this.latlon) {
              marker = new google.maps.Marker({
                map: this.map,
                draggable: false,
                animation: google.maps.Animation.DROP,
                position: this.latlon
              });
            } else {
              $('#occ-detail-map.occ-detail-map').hide();
            }          
          }
        }, this));
        return this;
      },

     setup: function () {
        var orgSlug = this.model.get('keyname').split('/')[0];
        var icode = this.model.get('icode');

        console.log(icode, this.githubbers);

/*
        if (!_.contains(this.githubbers, icode)) {
          this.$('#subissue').hide();
          mps.publish('spin', [false]);
          return this;
        }
*/
    
        this.$('#subissue').popover({placement: 'top', content: 'Submit data issue'});
        this.$('#subissue').popover('show');
        
        this.$('#login button').click(_.bind(function(e) {
          var next = window.location.pathname + window.location.search.split('&')[0] + '-issue';
          e.preventDefault();
          mps.publish('user/login', [next]);
        }, this));

        this.$('#confirmation').hide();
        
        // Handler for index tab
        this.$('#index-tab').click(_.bind(function(e) {
          var issues = this.model.getIndexFields();
          console.log(issues);
          if (issues.rank) { this.$('#rank').text(issues.rank.toString()); }
          if (issues.harvestid) { this.$('#harvestid').text(issues.harvestid.toString()); }
          if (issues.networks) { this.$('#networks').text(issues.networks.toString()); }
          if (issues.keyname) { this.$('#keyname').text(issues.keyname.toString()); }
          if (issues.icode) { this.$('#icode').text(issues.icode.toString()); }
          // if (issues.fossil) { this.$('#fossil').text(issues.fossil.toString()); }
          // if (issues.tissue) { this.$('#tissue').text(issues.tissue.toString()); }
          // if (issues.media) { this.$('#media').text(issues.media.toString()); }
          // if (issues.hastypestatus) { this.$('#hastypestatus').text(issues.hastypestatus.toString()); }
          // if (issues.mappable) { this.$('#mappable').text(issues.mappable.toString()); }
          // if (issues.resource) { this.$('#resource').text(issues.resource.toString()); }
          // if (issues.type) { this.$('#type').text(issues.type.toString()); }
        }, this));

        // Handler for quality tab
        this.$('#quality-tab').click(_.bind(function(e) {
          var issues = this.model.getQualityFlags();
          console.log(issues);
          
          // Completeness
          if (issues.hasCoordinates) { this.$('#hasCoordinates').text(issues.hasCoordinates.toString()); }
          if (issues.hasCountry) { this.$('#hasCountry').text(issues.hasCountry.toString()); }
          if (issues.isZero) { this.$('#isZero').text(issues.isZero.toString()); }
          if (issues.isGoodPrecision) { this.$('#isGoodPrecision').text(issues.isGoodPrecision.toString()); }
          if (issues.hasDatum) { this.$('#hasDatum').text(issues.hasDatum.toString()); }
          
          // Inconsistencies
          if (issues.isInsideCountry) { this.$('#isInsideCountry').text(issues.isInsideCountry.toString()); }
          if (issues.distanceToCountry) { this.$('#distanceToCountry').text(issues.distanceToCountry.toString()); }
          if (issues.distanceToRangemap) { this.$('#distanceToRangemap').text(issues.distanceToRangemap.toString()); }
          
          // Errors
          if (issues.isValidLatitude) { this.$('#isValidLatitude').text(issues.isValidLatitude.toString()); }          
          if (issues.isValidLongitude) { this.$('#isValidLongitude').text(issues.isValidLongitude.toString()); }          
          if (issues.isTransposed) { this.$('#isTransposed').text(issues.isTransposed.toString()); }
          if (issues.isGoodSignLatitude) { this.$('#isGoodSignLatitude').text(issues.isGoodSignLatitude.toString()); }
          if (issues.isGoodSignLongitude) { this.$('#isGoodSignLongitude').text(issues.isGoodSignLongitude.toString()); }


          // Display warning
          this.$('#quality-warning').hide();
          
          if (issues["showError"] == true) {
            this.$('#quality-warning').html('<p class="text-danger">Warning: There is potentially something wrong with this record. Check below.</p>');
          } else if (issues["showWarning"] == true) {
            this.$('#quality-warning').html('<p class="text-warning">Warning: This record might not be as good as it appears. Check below.</p>');
          } else if (issues["showMissing"] == true) {
            this.$('#quality-warning').html('<p class="text-warning">Warning: Some validations could not be performed. Check below.</p>');
          } else {
            this.$('#quality-warning').html('<p class="text-success">Everything looks good here.</p>');
          }
          this.$('#quality-warning').show();
          
          // Highlight success, errors and warnings
          $('.issueRow').each(function(i, obj){
            var value = $(this).children('td').eq(2).text();
            if (value != '0' && value != 0) {
              if (value == 'Could not be assessed') {
                $(this).addClass('warning');
                $(this).children('td').eq(1).children('span').addClass('glyphicon-ban-circle')
              } else if (value == 'Yes' || value == 'No') {
                $(this).addClass('success');
                $(this).children('td').eq(1).children('span').addClass('glyphicon-ok')
              } else {
                $(this).addClass('danger');
                $(this).children('td').eq(1).children('span').addClass('glyphicon-remove')
              }
            } else {
              $(this).addClass('success');
              $(this).children('td').eq(1).children('span').addClass('glyphicon-ok')
            }
          });
          
        }, this));
		
		//Tooltips
		  this.$('#show-completeness-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'Data completeness assesses the presence and absence of certain fields within a record. The assessments simply reveal if a given field is present or not, or, in some cases, if the field contains a potentially correct value or not. Read more...',
			  container: '#completeness-tip'
			});
		  this.$('#completeness-tip').mouseover(_.bind(function(e) {
			this.$('#show-completeness-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-completeness-tip').tooltip('hide');
		  }, this));
		  
		  this.$('#show-inconsistencies-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'The tests in this section seek to identify mismatches between different sources of data. All of the assessments are performed with the Map Of Life quality validation tool.  It is important to note that an inconsistency does not necessarily equate with a mistake.  The tool is only designed to flag potential issues for the user of the data to review. Read more...',
			  container: '#inconsistencies-tip'
			});
		  this.$('#inconsistencies-tip').mouseover(_.bind(function(e) {
			this.$('#show-inconsistencies-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-inconsistencies-tip').tooltip('hide');
		  }, this));		

		  this.$('#show-error-tip').tooltip({
			  placement: 'top',
			  html: 'true',
			  title: 'The tests in this section seek to identify data errors within specific fields of a record.  Three of these assessments are performed with the Map Of Life quality validation tool. Read more...',
			  container: '#error-tip'
			});
		  this.$('#error-tip').mouseover(_.bind(function(e) {
			this.$('#show-error-tip').tooltip('show');
		  }, this)).mouseout(_.bind(function(e) {
			this.$('#show-error-tip').tooltip('hide');
		  }, this));		
		  	
		//Show-hide detail map
		
		//this.$("#occ-detail-map-toggle").click(_.bind(function(e) {
       // if (this.$('#occ-detail-map-toggle').is(':checked')) {
       //   $("#collapseOne").collapse('show');
       // } else {
       //   $("#collapseOne").collapse('hide');
       // }
      //}, this));

        // Handler for click.
        this.$('#submit-issue-btn').click(_.bind(function(e) {
          var title = '[' + this.model.get('icode') + ' ' + this.model.get('collectioncode') + ' ' + this.model.get('catalognumber') + ']' + ' ' + this.model.getSciName() + ' - ' + this.$('#nameval').val();
          var body = this.$('#bodyval').val();
          var owner = this.model.get('keyname').split('/')[0];
          var repo = this.model.get('keyname').split('/')[1];
          var record = '<table>' + this.$('#alltable').html() + '</table>'; 
          var data = JSON.stringify(this.model.attributes, null, 4);
          var link = window.location.href.split('&')[0];
          var q = {owner:owner, title:title, body:body, repo:repo, 
              record:record, link:link, data:data};

          rpc.execute('/api/github/issue/create', 
            q, {
            success: _.bind(function(issue) {
              var conf = this.$('#confirmation');
              var link = this.$('#issuelink');

              this.$('#queue-msg').hide();
              this.$('.modal-footer').hide();
              link.attr('href', issue.html_url);
              link.text(issue.title);
              this.$('#myModalLabel').text('Thanks!');
              conf.show();
            }, this),
            error: _.bind(function(error) {
              console.error(error);
            }, this)
          });
        }, this));

        // Subscribe to user authenticated event:
        mps.subscribe('user/authenticated', _.bind(function(user) {
          this.user = user;
        }, this));

        this.$('#myModal').modal({show: false});

        this.$('#subissue').click(_.bind(function(e) {
          user.getUser(_.bind(function(user) {
            if (user) {
              this.showIssueModal(true);            
            } else {
              this.showIssueModal(false);
            }
          }, this));
        }, this));
        
        if (this.params.issue) {
          this.$('#subissue').click();
        }

        mps.publish('spin', [false]);
        return this;
      },

      showIssueModal: function(show) {
        if (show) {
          this.$('#myModalLabel').text('Submit data issue');
          this.$('#confirmation').hide();
          this.$('#queue-msg').show();
          this.$('.modal-footer').show();
          this.$('#login').hide();
          this.$('#issueform').show();
          this.$('#submit-download-btn').show();
          this.$('#myModal').modal({show: true});
        } else {
          this.$('#confirmation').hide();
          this.$('#submit-issue-btn').hide();
          this.$('#login').show();
          this.$('#issueform').hide();
          this.$('#submit-download-btn').hide();
          this.$('#myModal').modal({show: true});          
        }
      }
  });
});
