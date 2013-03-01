// Wrapper for SpinJS.

define([
  'Underscore',
  'libs/spin/spin.min',
  ], function (_, spin) {

  var defaults = {
    lines: 5, // The number of lines to draw
    length: 3, // The length of each line
    width: 2, // The line thickness
    radius: 5, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    color: '#000', // #rgb or #rrggbb
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: 'auto', // Top position relative to parent in px
    left: 'auto' // Left position relative to parent in px
  };

  var Spin = function (target, options) {
    this.target = target;
    this.options = _.defaults(options || {}, defaults);
  }

  Spin.prototype.start = function () {
    if (!this.spinner)
      this.spinner = new spin(this.options).spin(this.target.get(0));
    else this.spinner.spin(this.target.get(0))
  }

  Spin.prototype.stop = function () {
    if (this.spinner)
      this.spinner.stop();
  }

  return Spin;
  
});
