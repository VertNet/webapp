/*
 * Require.js bootstrapping.
 */


require.config({ // VertNet app configuration.
  
  paths: {
    jQuery: 'libs/jquery/jquery',
    Underscore: 'libs/underscore/underscore',
    Backbone: 'libs/backbone/backbone',
    mps: 'libs/minpubsub/minpubsub',
    Spin: 'libs/spin/spin',
    bootstrap: 'libs/bootstrap/bootstrap',
    backbonequeryparams: 'libs/backbone/backbone.queryparams'
    
  },
  
  // Dependency mappings:
  shim: {
    Underscore: {
      exports: '_'
    },
    Backbone: {
      deps: ['jQuery', 'Underscore'],
      exports: 'Backbone'
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