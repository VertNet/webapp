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
  'explore/occ/OccDetail',
  'explore/occ/OccModel',
  'About',
  'Feedback',
  'Publishers',
  'Spin'
], function ($, _, Backbone, bqp, rpc, mps, HomeView, HeaderView, FooterView, SearchView, OccDetail, OccModel, About, Feedback, Publishers, Spin) {
  var Router = Backbone.Router.extend({
    initialize: function (app) {
      this.spin = new Spin($('#main-spinner'));
      this.spin.start();
      this.app = app;
      this.route('', 'home', _.bind(this.home, this));
      this.route('search', 'search', _.bind(this.search, this));      
      this.route('about', 'about', _.bind(this.about, this));
      this.route('publishers', 'publishers', _.bind(this.publishers, this));
      
      mps.subscribe('navigate', _.bind(function (place) {
        this.navigate(place.path, {trigger: place.trigger});
      }, this));

      mps.subscribe('spin', _.bind(function(show) {
        if (show) {
          this.spin.start();
        } else {
          this.spin.stop();
        }
      }, this));
    },

    // Hack: mps in views/home.js isn't loading.
    stopSpin: function() {
      this.spin.stop();
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
        $('#content').append(this.searchView.render().el);
        this.searchView.setup();
      } else {
        $('#content').append(this.searchView.el);
        this.searchView.onShow({query:query});
      }
    },

    publishers: function() {
      this.initHeaderFooter();
      this.page = new Publishers({}, this.app);
      $('#content').html(this.page.render().el);
      this.page.setup();      
    },

    about: function() {
      this.initHeaderFooter();
      this.page = new About({}, this.app);
      $('#content').html(this.page.render().el);
    },
        
    occurrence: function(publisher, resource, params) {
      var model = this.app.occDetailModel;
      var request = {};
      var resource = resource.split('?')[0];
      var params = this.app.parseUrl();
      var occurrence = params['id'];
      var tab = params['view'];

      this.initHeaderFooter();

      if (!model) {
        request['id'] = [publisher, resource, occurrence].join('/');
        rpc.execute('/service/rpc/record.get', request, {
          success: _.bind(this._occurrenceHandler, this, tab), 
          error: _.bind(function(x) {
            console.log('ERROR: ', x);
          }, this)
        });
      } else {
        this.page = new OccDetail({model: model, show: tab}, this.app);
        $('#content').html(this.page.render().el);
        this.page.setup();
      }
    },

    _occurrenceHandler: function(tab, response) {
      var model = new OccModel(JSON.parse(response.json));
      this.app.occDetailModel = model;
      this.page = new OccDetail({model: model, show: tab}, this.app);
      $('#content').html(this.page.render().el);
      this.page.setup();
    }
  });
  
  return Router;
});

