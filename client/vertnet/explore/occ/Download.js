define([
  'jQuery',
  'Backbone',
  'Underscore',
  'util',
  'rpc',
  'text!explore/occ/Download.html'
  ], function ($, Backbone, _, util, rpc, template) {
    return Backbone.View.extend({

      events: {
        'click button': '_submit'
      },

      initialize: function(options, app, model) {
        this.app = app;
        this.model = model;
        this.model.on('change', _.bind(this.calculateCount, this));
        this.template = _.template(template);
      }, 

      render: function() {
        this.$el.html(this.template());
        this.$('#tsv').tooltip({
          title: 'Tab Separated Values',
        });
        return this;
      },

     setup: function () {
        return this;
      },

      empty: function () {
        this.$el.empty();
        return this;
      },

      // Kill this view.
      destroy: function () {
        _.each(this.subscriptions, function (s) {
          mps.unsubscribe(s);
        });
        this.undelegateEvents();
        //this.stopListening();
        this.empty();
      },

      calculateCount: function() {
        var request = {q:JSON.stringify({terms: this.model.get('terms'), 
          keywords: this.model.get('keywords')})};
        this.$('#suback').text('');
        this.$('#email').text('');
        this.$('#email').text('');
        this.$('button').prop("disabled", false);
        rpc.execute('/service/rpc/record.count', request, {
          success: _.bind(this._setCount, this), 
          error: _.bind(function(x) {
            console.log('ERROR: ', x);
          }, this)
        });
      },

      _setCount: function(response) {
        console.log('count=', response.count);
        this.$('#reccount').text(response.count);
        if (response.count === 0) {
          this.$('button').prop("disabled", true);
        } else {
          this.$('button').prop("disabled", false);
        }
      },

      _submit: function(e) {
        var email = this.$('#email').val();
        var name = this.$('#name').val();
        var count = Number(this.$('#reccount').text());
        var request = {
          count: count,
          email: email, 
          name: name, 
          terms: JSON.stringify(this.model.get('terms')),
          keywords: JSON.stringify(this.model.get('keywords'))}
        e.preventDefault();
        this.$('button').prop("disabled", true);
        console.log('submit');
        console.log(request);
        if (count >= 250) {
          $.get('/service/download', request, 
            _.bind(this._submitAck, this));
        } else {
          window.location.href = '/service/download?' + $.param(request);
          this.$('button').prop("disabled", false);
          this._submitAck();
        }
      },

      _submitAck: function(e) {
        console.log(e);
        if (e) {
          this.$('#suback').text("Request submitted! You'll get an email confirmation in a moment.");
        }
      }
  });
});
