/*
 * Require.js bootstrapping.
 */


require.config({ // VertNet app configuration.
  
  paths: {
    jQuery: 'libs/jquery/jquery',
    Underscore: 'libs/underscore/underscore',
    Backbone: 'libs/backbone/backbone',
    mps: 'libs/minpubsub/minpubsub',
    balanced: 'libs/balanced/balanced',
    Spin: 'libs/spin/spin',
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
    balanced: {
      exports: 'balanced'
    },
    Spin: {
      exports: 'Spin'
    },
  }
});

// Application entry point:
require(['app'], function (app) {
  console.log('main.entry()');
  app.init();
});