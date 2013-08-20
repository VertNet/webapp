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

// Contains the RequireJS configuration and application entry point:
require.config({ 

  // urlArgs: "/vertnet=" + (new Date()).getTime(),

  baseUrl: '/js',

  paths: {
    jquery: ['lib/jquery'],
    underscore: ['lib/underscore'],
    backbone: ['lib/backbone'],
    mps: ['lib/minpubsub'],
    spin: ['lib/spin'],
    bootstrap: ['lib/bootstrap'],
    backbonequeryparams: ['lib/backbone.queryparams'],
    cartodb: ['lib/cartodb'],
    store: ['lib/store'],
    text: ['lib/text'],
    app: ['app/app'],
    router: ['app/router'],
    rpc: ['app/rpc'],
    map: ['app/map'],
    util: ['app/util'],
    views: ['app/views'],
    models: ['app/models']
  },
  
  shim: {
    underscore: {
      exports: '_'
    },
    backbone: {
      deps: ['jquery', 'underscore'],
      exports: 'Backbone',
    },
    backbonequeryparams: {
      deps: ['backbone', 'underscore'],
      exports: 'backbonequeryparams'
    },
    app: {
      deps: ['mps'],
      exports: 'app'
    },  
    views: {
      deps: ['bootstrap']
    },
    mps: {
      deps: ['jquery', 'underscore'],
      exports: 'mps',
      init: function(foo) {
        var mps = {
          subscribe: window.subscribe,
          unsubscribe: window.unsubscribe,
          publish: window.publish
        };
        return mps;
      }
    },
    spin: {
      exports: 'Spin'
    },
    bootstrap: {
      deps: ['jquery'],
      exports: 'bootstrap'
    }
  }
});

// Application entry point:
require(['app'], function (app) {
  app.init();
});