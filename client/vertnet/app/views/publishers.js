/*
 * Publishers view.
 */
 define([
  'jquery',
  'underscore',
  'backbone',
  'store',
  'mps',
  'map',
  'util',
  'text!views/publishers.html',
  'models/publishers',
  'models/publisher',
  'views/publisherrow'
  ], function ($, _, Backbone, store, mps, map, util, template, PublisherList, PublisherModel, PublisherRow) {
    return Backbone.View.extend({
      events: {
        'click td': '_clickHandler'
      },

      initialize: function (options, app) {
        this.app = app;
        this.pubList = new PublisherList();
        this.viewList = [];
        mps.publish('spin', [true]);
      },

      render: function () {
        this.$el.html(_.template(template));
        return this;
      },

      setup: function (cb) {
        if (store.get('protip-pub-closed') === true) {
          this.$('#click-row-tip').hide();       
        } else {
          this.$('.close').click(_.bind(function () {
            store.set('protip-pub-closed', true);
          }, this));
        }

        if (this.pubList.isEmpty()) {
          map.init(_.bind(function() {
            var sql = new cartodb.SQL({ user: 'vertnet' });
            var query = "SELECT orgname,icode,sum(count) AS records,count(title) AS resources FROM resource GROUP BY orgname, icode ORDER BY orgname";
            sql.execute(query, {})
              .done(_.bind(function(data) {
                _.each(data.rows, _.bind(function (i) {
                  var model = new PublisherModel(i);
                  var view = new PublisherRow({parentView: this, model:model}, this.app);
                  this.pubList.add(model);
                  this.viewList.push(view);
                  this.$('#pubTable > tbody:last').append(view.render().el);
                }, this));
                cb(); 
                mps.publish('spin', [false]);
              }, this))
              .error(function(errors) {
                console.log("error:" + err);
              });
          }, this));
        }

        return this;
      },

      onShow: function() {
        this.$('#reccount').text(util.addCommas(this.pubList.recordCount().toString()) + ' records');
        this.$('#rescount').text(util.addCommas(this.pubList.resourceCount().toString()) + ' resources');
        this.$('#pubcount').text(util.addCommas(this.pubList.publisherCount().toString()) + ' publishers');
      },

      _clickHandler: function(e) {
        var sel = getSelection().toString();
        //var icode = e.target.parentNode.id;
        //var path = '/search?q=institutioncode:' + icode;
        //console.log(util.slugify(this.model.get('orgname')));
        if (!sel) {
          //mps.publish('navigate', [{path: path, trigger: true}]);
        }
      },
  });
});