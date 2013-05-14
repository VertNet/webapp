define([
	'Underscore',
	], function(_) {

  return {
  	diff: function(x, y) {
  		return (_.difference(x, y).length === 0);
  	}
  };

});
