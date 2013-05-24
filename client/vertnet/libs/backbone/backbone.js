define([
	'libs/backbone/backbone.min',
	'libs/backbone/backbone.queryparams'], 
	function () {
  		_.noConflict();
  		$.noConflict();
  		return Backbone.noConflict();
});