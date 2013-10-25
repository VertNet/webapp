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

// Defines the view for the global page footer. 
define([
  'jquery',
  'underscore',
  'backbone',
  'mps',
  'rpc',
  'text!views/footer.html'
  ], function ($, _, Backbone, mps, rpc, template) {
  return Backbone.View.extend({
    events: {},

    initialize: function (app) {
      this.app = app;
      this.on('rendered', this.setup, this);
    },

    render: function () {
      this.$el.html(_.template(template));
      this.trigger('rendered');
      return this;
    },

    setup: function () {
      return this;
    },
  });
});