/**
 * This file is part of VertNet: https://github.com/VertNet/webapp
 * 
 * VertNet is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * VertNet is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Foobar.  If not, see: http://www.gnu.org/licenses
 */

// Defines the view for the publishers page.
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
            var query = "SELECT orgname,icode,concat(orgcountry, ' ', orgstateprovince, ' ', orgcity) AS location,sum(count) AS records,count(title) AS resources FROM resource WHERE ipt=True and networks LIKE '%VertNet%' GROUP BY orgname, icode, location ORDER BY orgname";
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
        this.$('#rescount').text(util.addCommas(this.pubList.resourceCount().toString()) + ' data resources');
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