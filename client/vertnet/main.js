/*
 * Require.js bootstrapping.
 */
require.config({ 
  
  //urlArgs: "busta=" + (new Date()).getTime(),

  baseUrl: 'vertnet',

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
    app: ['app/app'],
    router: ['app/router'],
    rpc: ['app/rpc'],
    map: ['app/map'],
    text: ['app/text'],
    util: ['app/util'],
    views: ['app/views/'],
    models: ['app/models/']
  },
  
  // Dependency mappings:
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