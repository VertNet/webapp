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

// Defines the view for a row in the search result table. 
define([
  'jquery',
  'backbone',
  'underscore',
  'util',
  'mps',
  'text!views/detailrow.html'
  ], function ($, Backbone, _, util, mps, template) {
    return Backbone.View.extend({

      tagName: 'tr',

      events: {
        'click td': '_clickHandler'
      },

      attributes: function () {
        return {
          id: this.model.id,
          path: this.model.keyname
        };
      },

      initialize: function(options, app) {
        this.app = app;
        this.template = _.template(template);
        _.bindAll(this, 'render');
      }, 

      render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
      },

      // Open the occurrence detail page.
      _clickHandler: function(e) {
        e.preventDefault();
        var keyname = this.model.get('keyname');
        var path = 'o/'+util.getOccPath(keyname);
        var sel = getSelection().toString();
        if (!sel) {
          this.trigger('onClick');
          this.app.occDetailModel = this.model;
          mps.publish('navigate', [{path: path, trigger: true}]);
        }
      }
    });
});
