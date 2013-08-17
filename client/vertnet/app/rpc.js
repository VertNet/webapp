/*
 * Async execution of RPCs to the server.
 */

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

      // Execute the RPC for reals:
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
            console.error(status, error);
          }
        },
        contentType: 'application/json', 
        dataType: 'json'
      });
      return jqxhr;
    }
  }
});
