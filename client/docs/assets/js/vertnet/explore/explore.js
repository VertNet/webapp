/*
 * Explore page view.
 */

define([
  'jQuery',
  'Underscore',
  'Backbone',
  'mps',
  'rpc',
  'explore/occ/OccTab',
  'text!explore/explore.html'
  ], function ($, _, Backbone, mps, rpc, OccTab, template) {

  return Backbone.View.extend({
    initialize: function (options, app) {
      this.app = app;
      this.template = _.template(template);
      this.on('rendered', this.setup, this);

      $('#exploreTabs a').click(_.bind(function (e) {
        //e.preventDefault();
        this.app.router.navigate('/explore/' + e.target.id, {trigger: true});
        }, this));
    },

    render: function () {
      this.$el.html(this.template());
      this.occTab = new OccTab({parentView: this, listEl: '#occ-view'}, this.app);
      this.$('#occTab').html(this.occTab.render().el);
      this.trigger('rendered');
      return this;
    },

    setTab: function(name) {
       var selector = '#exploreTabs a[href="#' + this.options.show + '"]';
       this.$(selector).tab('show');
    },

    // Misc. setup.
    setup: function () {
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