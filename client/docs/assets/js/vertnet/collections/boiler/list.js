/*
 * List collection
 */

define([
  'jQuery',
  'Underscore',
  'Backbone'
], function ($, _, Backbone) {

  return Backbone.Collection.extend({

    fetch: function (params, cb) {
      if ('function' === typeof params) {
        cb = params;
        params = {};
      }

      // options.success = function (res, status, xhr) {
      //   collection[options.add ? 'add' : 'reset']
      //       (collection.parse(res.items, xhr), options);
      //   collection.next_cursor = res.next_cursor;
      //   collection.more = res.more;
      //   if (cb) cb(collection, res.items);
      //   collection.trigger('fetched');
      //   console.log(res);
      // };

      rpc.execute(this.type + '/list', params, {
        success: _.bind(function (res) {

          console.log(res);
        }, this),

        error: function (x) {

          // TODO: render 404.
          console.warn(x);
        }
      });
    },

    // fetch: function (options, cb) {
    //   if ('function' === typeof(options)) {
    //     cb = options;
    //     options = {};
    //   }
    //   options = options ? _.clone(options) : {};
    //   if (options.parse === undefined) options.parse = true;
    //   var collection = this;
    //   options.success = function (res, status, xhr) {
    //     collection[options.add ? 'add' : 'reset']
    //         (collection.parse(res.items, xhr), options);
    //     collection.next_cursor = res.next_cursor;
    //     collection.more = res.more;
    //     if (cb) cb(collection, res.items);
    //     collection.trigger('fetched');
    //     console.log(res);
    //   };
    //   options.error = Backbone.wrapError(this.error,
    //                                     collection, options);
    //   return (this.sync || Backbone.sync)
    //           .call(this, 'read', this, options);
    // },

    error: function (col, res) {
      console.warn(res);
    }
  });

});
