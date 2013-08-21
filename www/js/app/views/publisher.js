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

// Defines the view for a publisher page.
define([
  'jquery',
  'backbone',
  'underscore',
  'util',
  'text!views/publisher.html',
  'models/resource',
  'models/resources',
  'views/resourcerow',
  'mps'
  ], function ($, Backbone, _, util, template, ResourceModel, ResourceList, ResourceRow, mps) {
    return Backbone.View.extend({

      initialize: function(options, app) {
        this.app = app;
        this.viewList = [];
        this.template = _.template(template);
        mps.publish('spin', [true]);
      }, 

      render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
      },

      setup: function () {
        this.options.resourceList.forEach(_.bind(function (model) {
          var view = new ResourceRow({parentView: this, model:model}, this.app);
          this.viewList.push(view);
          this.$('#resTable > tbody:last').append(view.render().el);
        }, this));
        this.$('#pubsearch').click(_.bind(function(e) {
          e.preventDefault();
          mps.publish('navigate', 
            [{path: 'search?q=institutioncode:' + this.model.get('icode').toLowerCase(), trigger:true}]);
        }, this));
        mps.publish('spin', [false]);
        return this;
      }
  });
});
