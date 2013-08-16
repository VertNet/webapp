/*
 * Header view.
 */
define([
  'jquery',
  'underscore',
  'backbone',
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
      
      $("#home,#search,#publishers,#about,#feedback-nav").each(_.bind(function(index, el) {
        var el = $(el);
        var id = el.attr('id') === 'home' ? '' : el.attr('id');
        el.click(_.bind(function(e) {
          e.preventDefault();
          if (id === 'feedback-nav') {
            window.open('http://form.jotform.us/form/31397097595166', '_blank');
          } else {
            // window.location.href = window.location.href.split('?')[0];
            mps.publish('navigate', [{path: id, trigger: true}]);
          }
        }, this));
      }, this));      

      return this;
    },
  });
});