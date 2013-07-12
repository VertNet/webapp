/*
 * Require.js bootstrapping.
 */


require.config({ // VertNet app configuration.
  
  urlArgs: "bust=" + (new Date()).getTime(),

  paths: {
    jQuery: 'libs/jquery/jquery',
    Underscore: 'libs/underscore/underscore',
    Backbone: 'libs/backbone/backbone',
    mps: 'libs/minpubsub/minpubsub',
    Spin: 'libs/spin/spin',
    bootstrap: 'libs/bootstrap/bootstrap',
    backbonequeryparams: 'libs/backbone/backbonequeryparams',
    store: 'libs/store/store.min'
  },
  
  // Dependency mappings:
  shim: {
    Underscore: {
      exports: '_'
    },
    Backbone: {
      deps: ['jQuery', 'Underscore'],
      exports: 'Backbone',
    },
    backbonequeryparams: {
      deps: ['Backbone', 'Underscore'],
      exports: 'backbonequeryparams'
    },
    mps: {
      deps: ['jQuery', 'Underscore'],
      exports: 'mps'
    },
    Spin: {
      exports: 'Spin'
    },
    bootstrap: {
      deps: ['jQuery'],
      exports: 'bootstrap'
    }
  }
});

// Application entry point:
require(['app'], function (app) {
  console.log('main.entry()');
  app.init();
});