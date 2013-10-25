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

// Defines the user model.
define([
  'jquery',
  'underscore',
  'mps',
  'rpc',
  'oop'
], function ($, _, mps, rpc, oop) {
  var Service = oop.Class.extend({
    init: function() {
      this.user = null;

      // Subscribe to user login event:
      mps.subscribe('user/login', _.bind(function(next) {
        var next = next ? next : window.location.pathname + window.location.search;
        var path = '/auth/github?next=' + next;
        window.location = path;
      }, this));

      // Publish user authentication event if user is logged in:
      rpc.execute('/api/user/get', {}, {
        success: _.bind(function(user) {
          mps.publish('user/authenticated', [user]);
          this.user = user;
        }, this),
        error: function(response) {
          console.log(response);
        }
      });
    },
  });

  var service = new Service();

  return {
    getUser: function(cb) {
      if (service.user) {
        cb(service.user);
      } else {
        rpc.execute('/api/user/get', {}, {
          success: _.bind(function(user) {
            mps.publish('user/authenticated', [user]);
            service.user = user;
            cb(service.user);
          }, this),
          error: function(response) {
            console.log(response);
          }
        });
      }
    },

    logout: function() {
      var path = window.location.pathname + window.location.search;
      rpc.execute('/api/user/logout', {}, {
        success: _.bind(function() {
          this.user = null;
          window.location = path;
        }, this),
        error: _.bind(function(response) {
          console.error(response);
          this.user = null;
          window.location = path;          
        }, this)
      });
    }
  }
});
