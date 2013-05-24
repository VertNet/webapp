/*
 * Handle URL paths and changes.
 */

define([
  'jQuery',
  'Underscore',
  'Backbone',
  'backbonequeryparams',
  'rpc',
  'mps',
  'home/Home',
  'common/Header',
  'common/Footer',
  'explore/Explore',
  'explore/occ/OccDetail',
  'explore/occ/OccModel',
  'About',
  'Feedback'
], function ($, _, Backbone, bqp, rpc, mps, HomeView, HeaderView, 
  FooterView, ExploreView, OccDetail, OccModel, About, Feedback) {

  // Our application URL router.
  var Router = Backbone.Router.extend({

    initialize: function (app) {


      // Save app reference.
      this.app = app;
      
      // Page routes:
      this.route('', 'home', _.bind(this.home, this, 'home'));

      // this.route('explore/:type?:params', 'explore', _.bind(this.explore, this, 'explore'));
      this.route('explore/:type', 'explore', _.bind(this.explore, this, 'explore'));
      
      this.route('about', 'about', _.bind(this.about, this));

      this.route('feedback', 'feedback', _.bind(this.feedback, this));

      // Subscriptions
      mps.subscribe('navigate', _.bind(function (path) {

        // Fullfill navigation request from mps.
        this.navigate(path, {trigger: true});
      }, this))
    },

    routes: {
      // Catch all:
      //':publisher/:resource':  'occurrence',
     '*actions': 'default'
    },

    query: function(entity, args) {
      console.log('wow', entity, args);
    },

    /**
     * Initialize header and footer.
     */
    initHeaderFooter: function() {
      // Don't re-create the header.
      if (!this.header) {
          this.header = new HeaderView(this.app).render();
      } else {
        this.header.render();
      }

      // Don't re-render the footer.
      if (!this.footer) {
        this.footer = new FooterView(this.app).render();
      }
    },

    about: function() {
      console.log('router.about():');

      // Kill the page view if it exists.
      if (this.page)
        this.page.destroy();

      // Setup header/footer.
      this.initHeaderFooter();

      this.page = new About({}, this.app);
      $('#content').html(this.page.render().el);
    },
    
    feedback: function() {
      console.log('router.feedback():');

      // Kill the page view if it exists.
      if (this.page)
        this.page.destroy();

      // Setup header/footer.
      this.initHeaderFooter();

      this.page = new Feedback({}, this.app);
      $('#content').html(this.page.render().el);
    },
    
    occurrence: function(publisher, resource, params) {
      var model = this.app.occDetailModel;
      var request = {};
      var resource = resource.split('?')[0];
      var params = this.app.parseUrl();
      var occurrence = params['id'];
      var tab = params['view'];

      console.log('OCCURRENCE');
      // Kill page view if exists.
      if (this.page) {
        this.page.destroy();
      }

      // Setup header/footer.
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
    },

    explore: function(type, name, params) {
      var query = params || {};
      console.log('router.explore():', type, name, params);

      // Kill the page view if it exists.
      if (this.page)
        this.page.destroy();

      // Setup header/footer.
      this.initHeaderFooter();

      this.page = new ExploreView({show: name, query:query}, this.app);
      $('#content').html(this.page.render().el);
      this.page.setup();
    },

    home: function (name) {
      console.log('router.home()');

      // Kill the page view if it exists.
      if (this.page)
        this.page.destroy();

      // Setup header/footer.
      this.initHeaderFooter();

      this.page = new HomeView(this.app).render();
    },

    default: function (actions) {
      console.warn('No route:', actions);
    }
  
  });
  
  return Router;

});