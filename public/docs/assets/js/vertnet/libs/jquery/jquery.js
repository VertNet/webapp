define([
  'libs/jquery/jquery.min'
], function () {

  jQuery.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    jQuery.each(a, function () {
      if (o[this.name] !== undefined) {
        if (!o[this.name].push)
          o[this.name] = [o[this.name]];
        o[this.name].push(this.value || '');
      } else o[this.name] = this.value || '';
    });
    return o;
  };

  require(['libs/jquery/jquery.autogrow',
           'libs/jquery/jquery.easing.min',
           'libs/jquery/jquery.simplemodal.min',
           'libs/jquery/jquery.hotkeys',
           'libs/jquery/jquery.scrollTo-min'
          ]);

  return jQuery;
});
