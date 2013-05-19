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
      console.log(publisher, resource, occurrence);

      // Kill page view if exists.
      if (this.page) {
        //this.page.destroy();
      }

      // Setup header/footer.
      this.initHeaderFooter();

      var data = {meta: {emlrights: 'rights', orgname: 'Foo', pubdate: 'today', 
      title: 'title', url: 'foo.com'}, loc: {dude: 'yes!'}};
      var model = new OccModel(data);
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