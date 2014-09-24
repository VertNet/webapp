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

// Defines the publisher model collection.
define([
  'backbone', 
  'models/publisher'
  ], function (Backbone, PublisherModel) {
    return Backbone.Collection.extend({

      model: PublisherModel,

      initialize: function(options) {

      },

      publisherCount: function() {
        return this.size();
      },

      resourceCount: function() {
        return this.reduce(function(memo, model) {
          return model.get('resources') + memo;
        }, 0);
      },

      recordCount: function() {
        return this.reduce(function(memo, model) {
          if (model.get('records') > 0) {
            return model.get('records') + memo;
          } else {
            return memo;
          }
        }, 0);
      },
	  
      collectionCount: function() {
        return this.reduce(function(memo, model) {
          if (model.get('collections') > 0) {
            return model.get('collections') + memo;
          } else {
            return memo;
          }
        }, 0);
      }
    });
});