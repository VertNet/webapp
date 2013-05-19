/*
 * Explore page view.
 */

define([
  'jQuery',
  'Underscore',
  'Backbone',
  'mps',
  'rpc',
  'explore/occ/OccSearchView',
  ], function ($, _, Backbone, mps, rpc, OccSearchView) {

  return Backbone.View.extend({

    // The DOM target element for this page:
    el: '#content',

    // Module entry point:
    initialize: function (options, app) {

      // Save app reference.
      this.app = app;

      // Shell events:
      this.on('rendered', this.setup, this);

      $('#exploreTabs a').click(_.bind(function (e) {
        //e.preventDefault();
        this.app.router.navigate('/explore/' + e.target.id, {trigger: true});
        }, this));
    },

    // Draw our template from the profile JSON.
    render: function () {

      // Done rendering ... trigger setup.
      this.trigger('rendered');

      return this;
    },

    setTab: function(name) {
       var selector = '#exploreTabs a[href="#' + this.options.show + '"]';
       this.$(selector).tab('show');

    },

    // Misc. setup.
    setup: function () {

      // Render posts.
      console.log('Setting up explore view...');

      this.occSearchView = new OccSearchView({parentView: this, 
        listEl: '#occ-view'}, this.app).render();

       var selector = '#exploreTabs a[href="#' + this.options.show + '"]';
       this.$(selector).tab('show');
       //$('#exploreTabs a[href="#publishers"]').tab('show')

      return this;
    },

    // Similar to Backbone's remove method, but empties
    // instead of removes the view's DOM element.
    empty: function () {
      this.$el.empty();
      return this;
    },

    // Kill this view.
    destroy: function () {
      _.each(this.subscriptions, function (s) {
        mps.unsubscribe(s);
      });
      this.undelegateEvents();
      //this.stopListening();
      this.empty();
    },

  // Bind mouse events.
    events: {
      //'click #explore-tabs a': 'onOccSearchTabClick',
    },

    onOccSearchTabClick: function(x) {
      console.log('CLIKY', x);

    }

  });
});