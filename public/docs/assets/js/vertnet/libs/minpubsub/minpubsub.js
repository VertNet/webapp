define([
  'libs/minpubsub/minpubsub.src'
], function () {
  var mps = {
    subscribe: window.subscribe,
    unsubscribe: window.unsubscribe,
    publish: window.publish
  };
  mps.hook = mps; // OMG hack
  delete window.subscribe;
  delete window.unsubscribe;
  delete window.publish;
  return mps;

});
