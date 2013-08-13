/*
 * Header view.
 */
define([
  'jQuery',
  'Underscore',
  'Backbone',
  'mps',
  'rpc',
  'text!views/header.html'
  ], function ($, _, Backbone, mps, rpc, template) {

  return Backbone.View.extend({
    events: {},

    initialize: function (app) {
      this.app = app;
    },

    render: function () {
      this.$el.html(_.template(template));
      return this;
    },

    setup: function () {
      this.$('#feedback-nav').mouseover(_.bind(function(e) {
        this.$('#feedback-nav-icon').addClass('icon-white');
      }, this)).mouseout(_.bind(function(e) {
        this.$('#feedback-nav-icon').removeClass('icon-white');        
      }, this));

      this.$('#project-nav').mouseover(_.bind(function(e) {
        this.$('#project-nav-icon').addClass('icon-white');
      }, this)).mouseout(_.bind(function(e) {
        this.$('#project-nav-icon').removeClass('icon-white');        
      }, this));
      
      $("#home,#search,#about,#feedback-nav").each(_.bind(function(index, el) {
        var el = $(el);
        var id = el.attr('id') === 'home' ? '' : el.attr('id');
        el.click(_.bind(function(e) {
          e.preventDefault();
          mps.publish('navigate', [{path: id, trigger: true}]);
        }, this));
      }, this));      

      return this;
    },
  });
});