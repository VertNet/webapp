define([
  'jQuery',
  'Backbone',
  'Underscore',
  'explore/occ/DarwinCoreTab',
  'text!explore/occ/OccDetail.html'
  ], function ($, Backbone, _, DarwinCoreTab, template) {
    return Backbone.View.extend({

      initialize: function(options, app) {
        this.app = app;
        this.template = _.template(template);
      }, 

      render: function() {
        this.$el.html(this.template(this.model.attributes));
        this.darwinCoreTab = new DarwinCoreTab({model: this.model}, this.app);
        this.$('#darwincore').html(this.darwinCoreTab.render().el);
        this.darwinCoreTab.setup();
        return this;
      },

     setTab: function(name) {
       var selector = '#detailTabs a[href="#' + name + '"]';
       this.$(selector).tab('show');
     },

     setup: function () {
        this.setTab(this.options.show);
        this.$('#detailTabs a').click(_.bind(function (e) {
          var tab = e.target.id;
          if (tab === 'dwc') {
            this.app.router.navigate(this.model.get('keyname') + '/darwincore');
            this.setTab('darwincore');
          } else if (tab === 'source') {
            this.app.router.navigate(this.model.get('keyname') + '/datasource');
            this.setTab('datasource');
          }
        }, this));
        return this;
      },

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
