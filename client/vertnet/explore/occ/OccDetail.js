define([
  'jQuery',
  'Backbone',
  'Underscore',
  'util',
  'explore/occ/DarwinCoreTab',
  'text!explore/occ/OccDetail.html'
  ], function ($, Backbone, _, util, DarwinCoreTab, template) {
    return Backbone.View.extend({

      initialize: function(options, app) {
        this.app = app;
        this.template = _.template(template);
      }, 

      render: function() {
        this.$el.html(this.template(this.model.attributes));
        this.darwinCoreTab = new DarwinCoreTab({model: this.model}, this.app);
        this.$('#darwincore').html(this.darwinCoreTab.render().el);
        return this;
      },

     setTab: function(name) {
       var selector = '#detailTabs a[href="#' + name + '"]';
       this.$(selector).tab('show');
     },

     setup: function () {
        this.setTab(this.options.show);
        this.$('#detailTabs a').click(_.bind(function (e) {
          var tab = e.target.id === 'dwc' ? 'darwincore' : 'datasource';
          var path = util.getOccPath(this.model.get('keyname'), tab); 
          this.app.router.navigate(path);
          this.setTab(tab);
          this.darwinCoreTab.setup();
        }, this));
        window.scrollTo(0, 0);
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
