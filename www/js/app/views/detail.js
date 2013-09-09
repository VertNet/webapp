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
      }, 

      render: function() {
        this.$el.html(this.template(this.model.attributes));
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

        if (orgSlug !== 'museum-of-vertebrate-zoology-uc-berkeley') {
          this.$('#subissue').hide();
          mps.publish('spin', [false]);
          return this;
        }
    
        this.$('#subissue').popover({placement: 'top', content: 'Submit data issue'});
        this.$('#subissue').popover('show');
        
        this.$('#login a').click(_.bind(function(e) {
          var next = window.location.pathname + window.location.search.split('&')[0] + '-issue';
          e.preventDefault();
          mps.publish('user/login', [next]);
        }, this));

        this.$('#confirmation').hide();

        // Handler for click.
        this.$('#submit-issue-btn').click(_.bind(function(e) {
          var title = '[' + this.model.get('icode') + ' ' + this.model.get('collectioncode') + ' ' + this.model.get('catalognumber') + ']' + ' ' + this.model.getSciName() + ' - ' + this.$('#nameval').val();
          var body = this.$('#bodyval').val();
          var owner = this.model.get('keyname').split('/')[0];
          var repo = this.model.get('keyname').split('/')[1];
          var record = '<table>' + this.$('#alltable').html() + '</table>'; 
          var data = JSON.stringify(this.model.attributes, null, 4);
          var link = window.location.href.split('&')[0];


          rpc.execute('/api/github/issue/create', 
            {owner:owner, title:title, body:body, repo:repo, record:record, link:link, data:data}, {
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
