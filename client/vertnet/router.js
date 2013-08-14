/*
 * App router.
 */
define([
  'jQuery',
  'Underscore',
  'Backbone',
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
  'Spin'
], function ($, _, Backbone, bqp, rpc, mps, HomeView, HeaderView, FooterView, SearchView, OccDetail, OccModel, AboutView, PublishersView, Spin) {
  var Router = Backbone.Router.extend({
    initialize: function (app) {
      this.app = app;
      this.route('', 'home', _.bind(this.home, this));
      this.route('search', 'search', _.bind(this.search, this));      
      this.route('about', 'about', _.bind(this.about, this));
      this.route('publishers', 'publishers', _.bind(this.publishers, this));
      
      mps.subscribe('navigate', _.bind(function (place) {
        var path = place.path;
        delete place['path'];
        this.navigate(path, place);
      }, this));
    },

    routes: {
      ':publisher/:resource':  'occurrence'
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
        this.searchView.onShow({query:query});
      }
    },

    publishers: function() {
      this.detachCurrentView();
      this.initHeaderFooter();
      if (!this.publishersView) {
        this.publishersView = new PublishersView({}, this.app);
        $('#content').append(this.publishersView.render().el);
        this.publishersView.setup();
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
        
    occurrence: function(publisher, resource, params) {
      var model = this.app.occDetailModel;
      var request = {};
      var resource = resource.split('?')[0];
      var params = this.app.parseUrl();
      var occurrence = params['id'];

      this.detachCurrentView();
      this.initHeaderFooter();
      
      // If no model cached in app, get it via RPC:
      if (!model) {
        request['id'] = [publisher, resource, occurrence].join('/');
        rpc.execute('/service/rpc/record.get', request, {
          success: _.bind(function(response) {
            model = new OccModel(JSON.parse(response.json));
            this.showOccurrence(model);
          }, this), 
          error: _.bind(function(x) {
            console.log('ERROR: ', x);
          }, this)
        });
      } else {
        this.showOccurrence(model);
      }
    },

    showOccurrence: function(model) {
      this.app.occDetailModel = model;
      this.occurrenceView = new OccDetail({model: model}, this.app);
      $('#content').append(this.occurrenceView.render().el);
      this.occurrenceView.setup();
    }
  });
  
  return Router;
});

