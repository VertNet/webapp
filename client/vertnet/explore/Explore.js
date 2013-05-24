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
  'text!explore/Explore.html'
  ], function ($, _, Backbone, mps, rpc, OccTab, template) {

    return Backbone.View.extend({
      initialize: function (options, app) {
        this.app = app;
        this.template = _.template(template);
      },

      render: function () {
        this.$el.html(this.template());
        this.occTab = new OccTab(this.options, this.app);
        this.$('#occurrences').html(this.occTab.render().el);
        this.occTab.setup();
      this.occSearch = window.location.search; // TODO: hack
      return this;
    },

    setTab: function(name) {
     var selector = '#exploreTabs a[href="#' + this.options.show + '"]';
     this.$(selector).tab('show');
   },

    // Misc. setup.
    setup: function () {
      this.setTab(this.options.show);
      this.$('#search-keywords-box').focus();
      this.$('#exploreTabs a').click(_.bind(function (e) {
        var tab = e.target.id;
        if (tab === 'occ') {
          if (this.occSearch && !window.location.search) {
            this.app.router.navigate('/explore/occurrences'+ this.occSearch);
          } else {
            this.occSearch = window.location.search;
            this.app.router.navigate('/explore/occurrences' + this.occSearch);
          }
          this.setTab('occurrences');
        } else if (tab === 'pub') {
          this.app.router.navigate('/explore/publishers');
          this.setTab('publishers');
        }
      }, this));
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
    }
  });
});