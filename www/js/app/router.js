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

// Defines the app router.
define([
  'jquery',
  'underscore',
  'backbone',
  'backbonequeryparams',
  'rpc',
  'mps',
  'views/home',
  'views/header',
  'views/footer',
  'views/search',
  'views/detail',
  'models/detail',
  'views/about',
  'views/publishers',
  'views/publisher',
  'models/publisher',
  'models/resource',
  'models/resources',
  'views/stats',
  'spin',
  'util',
  'map'
], function ($, _, Backbone, bqp, rpc, mps, HomeView, HeaderView, FooterView, 
      SearchView, OccDetail, OccModel, AboutView, PublishersView, PubView, PubModel, 
      ResourceModel, ResourceList, StatsView, Spin, util, map) {
  
  var Router = Backbone.Router.extend({

    initialize: function (app) {
      this.app = app;
      this.route('', 'home', _.bind(this.home, this));
      this.route('search', 'search', _.bind(this.search, this));      
      this.route('about', 'about', _.bind(this.about, this));
      this.route('publishers', 'publishers', _.bind(this.publishers, this));
      this.route('o/:publisher/:resource', 'occurrece', _.bind(this.occurrence, this));
      this.route('p/:publisher', 'publisher', _.bind(this.publisher, this));
      this.route('stats', 'stats', _.bind(this.stats, this));
      mps.subscribe('navigate', _.bind(function (place) {
        var path = place.path;
        delete place['path'];
        this.navigate(path, place);
      }, this));
    },

    initHeaderFooter: function() {
      if (!this.headerView) {
        this.headerView = new HeaderView(this.app);
        $('#header').html(this.headerView.render().el); 
        this.headerView.setup();
      }
      if (!this.footerView) {
        this.footerView = new FooterView(this.app);
        $('#footer').html(this.footerView.render().el); 
      }
    },

    detachCurrentView: function() {
      var currentView = $('#content').children();
      if (!_.isEmpty(currentView)) {
        $(currentView).detach();
      }
    },

    home: function () {
      mps.publish('spin', [true]);
      this.detachCurrentView();
      this.initHeaderFooter();
      if (!this.homeView) {
        this.homeView = new HomeView(this.app);
        $('#content').append(this.homeView.render().el);
        this.homeView.setup();
      } else {
        $('#content').append(this.homeView.el); 
        this.homeView.onShow();
      }
    },    

    search: function(params) {
      var query = params || {};
      var init = _.isEmpty(params);
      this.detachCurrentView();
      this.initHeaderFooter();
      if (!this.searchView) {
        this.searchView = new SearchView({query:query}, this.app);
        this.searchView.render(_.bind(function() {
          $('#content').append(this.searchView.el);
          this.searchView.setup();
        }, this));
      } else {
        $('#content').append(this.searchView.el);
        this.searchView.onShow({query:query}, init);
      }
    },

    publishers: function() {
      this.detachCurrentView();
      this.initHeaderFooter();
      if (!this.publishersView) {
        this.publishersView = new PublishersView({}, this.app);
        $('#content').append(this.publishersView.render().el);
        this.publishersView.setup(_.bind(function() {
          this.publishersView.onShow();
        }, this));
      } else {
        $('#content').append(this.publishersView.el); 
        this.publishersView.onShow();
      }    
    },

    about: function() {
      this.detachCurrentView();
      this.initHeaderFooter();
      if (!this.aboutView) {
        this.aboutView = new AboutView({}, this.app);
        $('#content').append(this.aboutView.render().el);
        this.aboutView.setup();
      } else {
        $('#content').append(this.aboutView.el); 
        this.aboutView.setup();
      }    
    },
    
    stats: function() {
      this.detachCurrentView();
      this.initHeaderFooter();
      if (!this.statsView) {
        this.statsView = new StatsView({}, this.app);
        $('#content').append(this.statsView.render().el);
        this.statsView.setup();
      } else {
        $('#content').append(this.statsView.el);
        this.statsView.setup();
      }
    },
    
    occurrence: function(publisher, resource, params) {
      var model = this.app.occDetailModel;
      var request = {};
      var resource = resource.split('?')[0];
      var occurrence = params['id'];

      if (occurrence.indexOf('-issue') !== -1) {
        occurrence = occurrence.split('-issue')[0];
        params['issue'] = true;
        this.navigate('/o/' + publisher + '/' + resource + '?id=' + occurrence + '&issue=1',
          {trigger: true, replace: true});   
        return;
      } 

      this.detachCurrentView();
      this.initHeaderFooter();
      
      // If no model cached in app, get it via RPC:
      if (!model) {
        request['id'] = [publisher, resource, occurrence].join('/');
        rpc.execute('/service/rpc/record.get', request, {
          success: _.bind(function(response) {
            model = new OccModel(JSON.parse(response.json));
            this.showOccurrence(model, params);
          }, this), 
          error: _.bind(function(x) {
            console.log('ERROR: ', x);
          }, this)
        });
      } else {
        this.showOccurrence(model, params);
      }
    },

    showOccurrence: function(model, params) {
      this.app.occDetailModel = model;
      this.occurrenceView = new OccDetail({model: model, params: params}, this.app);
      $('#content').append(this.occurrenceView.render().el);
      this.occurrenceView.setup();
    },

    publisher: function(publisher) {
      var model = null;
      var resCount = 0;
      var recCount = 0;
      var resource = [];
      this.detachCurrentView();
      this.initHeaderFooter();

      if (!this.publisherCache) {
        map.init(_.bind(function() {
          var sql = new cartodb.SQL({ user: 'vertnet' });
          var query = "SELECT orgname,icode,sum(count) AS records,count(title) AS resources,citation,contact,count,description,dwca,email,eml,emlrights,pubdate,title,url FROM resource GROUP BY orgname,icode,citation,contact,count,description,dwca,email,eml,emlrights,pubdate,title,url ORDER BY title";
          sql.execute(query, {})
            .done(_.bind(function(data) {
              this.publisherCache = _.groupBy(data.rows, _.bind(function(row) {
                return util.slugify(row['orgname']);
              }, this));
              this.showPublisher(publisher);
            }, this))
            .error(function(errors) {
              console.log("error:" + err);
            });
        }, this));
      } else {
        this.showPublisher(publisher);
      }
    },

    showPublisher: function(publisher) {
      var resources = this.publisherCache[publisher];
      var resource = resources[0];
      var resCount = _.size(resources);
      var recCount = _.reduce(resources, function(memo, resource) {
        return resource.count + memo;
      }, 0);
      var model = new PubModel({orgname: resource.orgname, resources: resCount, 
        records: recCount, icode: resource.icode}); 
      var resourceList = _.map(resources, function(x) {
        return new ResourceModel(x);
      });
      this.publisherView = new PubView({model: model, resourceList: resourceList}, 
        this.app);
      $('#content').append(this.publisherView.render().el);
      this.publisherView.setup();
    }    
  });
  
  return Router;
});

