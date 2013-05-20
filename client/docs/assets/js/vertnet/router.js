/*
 * Handle URL paths and changes.
 */

define([
  'jQuery',
  'Underscore',
  'Backbone',
  'rpc',
  'mps',
  'home/Home',
  'common/Header',
  'common/Footer',
  'explore/Explore',
  'explore/occ/OccDetail',
  'explore/occ/OccModel'
], function ($, _, Backbone, rpc, mps, HomeView, HeaderView, 
  FooterView, ExploreView, OccDetail, OccModel) {

  // Our application URL router.
  var Router = Backbone.Router.extend({

    initialize: function (app) {

      // Save app reference.
      this.app = app;
      
      // Page routes:
      this.route('', 'home', _.bind(this.home, this, 'home'));
      this.route('explore/:type', 'explore', _.bind(this.explore, this, 'explore'));
      this.route(':publisher/:resource/:occurrence', 'occurrence', 
        _.bind(this.occurrence, this, 'occurrence'));

      // Subscriptions
      mps.subscribe('navigate', _.bind(function (path) {

        // Fullfill navigation request from mps.
        this.navigate(path, {trigger: true});
      }, this))
    },

    routes: {
      // Catch all:
      '*actions': 'default'
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
    
    occurrence: function(name, publisher, resource, occurrence) {
      var model = this.app.occDetailModel;
      var request = {};

      console.log('OCCURRENCE');
      // Kill page view if exists.
      if (this.page) {
        //this.page.destroy();
      }

      // Setup header/footer.
      this.initHeaderFooter();

      if (!model) {
        request['id'] = [publisher, resource, occurrence].join('/');
        rpc.execute('/service/rpc/record.get', request, {
          success: _.bind(this._occurrenceHandler, this), 
          error: _.bind(function(x) {
            console.log('ERROR: ', x);
          }, this)
        });
      } else {
        this.page = new OccDetail({model: model}, this.app);
        $('#content').html(this.page.render().el);
      }
    },

    _occurrenceHandler: function(response) {
      var model = new OccModel(JSON.parse(response.json));
      this.app.occDetailModel = model;
      this.page = new OccDetail({model: model}, this.app);
      $('#content').html(this.page.render().el);
    },

    explore: function(type, name) {
      console.log('router.explore():', type, name);

      // Kill the page view if it exists.
      //if (this.page)
        //this.page.destroy();

      // Setup header/footer.
      this.initHeaderFooter();

      this.page = new ExploreView({show: name}, this.app);
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