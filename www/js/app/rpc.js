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

// Defines an RPC module for executing async RPC requests to server.
define([
  'jquery',
  'mps'
], function ($, mps) {
  return {  

    /**
     * Executes an RPC asynchronously.
     * 
     * Args:
     *   url: The URL endpoint for the RPC
     *   data: Object with RPC parameters.
     *   callback: Object with a success and error function.
     */
    execute: function(url, data, callback) {
      var jqxhr = null;
      var key = null;
      var val = null;

      $.ajax({
        url: url,
        type: "POST",
        data: JSON.stringify(data),
        success: function(response) {
          if (callback) {
            callback.success(response);
          }
        },
        error: function(status, error) {
          if (callback) {
            callback.error(status, error);
          }
        },
        contentType: 'application/json', 
        dataType: 'json'
      });
      return jqxhr;
    }
  }
});
