/*
 * App utility functions
 */

define([
  'jQuery',
  'Underscore'
], function ($, _) {

  if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
      return this.slice(0, str.length) === str;
    };
    String.prototype.format = function() {
      var formatted = this;
      for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
      }
      return formatted;
    };
  }

  var dateFormat = function () {
    var  token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
      timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
      timezoneClip = /[^-+\dA-Z]/g,
      pad = function (val, len) {
        val = String(val);
        len = len || 2;
        while (val.length < len) val = "0" + val;
        return val;
      };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
      var dF = dateFormat;

      // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
      if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
        mask = date;
        date = undefined;
      }

      // Passing date through Date applies Date.parse, if necessary
      date = date ? new Date(date) : new Date;
      if (isNaN(date)) throw SyntaxError("invalid date");

      mask = String(dF.masks[mask] || mask || dF.masks["default"]);

      // Allow setting the utc argument via the mask
      if (mask.slice(0, 4) == "UTC:") {
        mask = mask.slice(4);
      }
      
      var  _ = utc ? "getUTC" : "get",
        d = date[_ + "Date"](),
        D = date[_ + "Day"](),
        m = date[_ + "Month"](),
        y = date[_ + "FullYear"](),
        H = date[_ + "Hours"](),
        M = date[_ + "Minutes"](),
        s = date[_ + "Seconds"](),
        L = date[_ + "Milliseconds"](),
        o = utc ? 0 : date.getTimezoneOffset(),
        flags = {
          d:    d,
          dd:   pad(d),
          ddd:  dF.i18n.dayNames[D],
          dddd: dF.i18n.dayNames[D + 7],
          m:    m + 1,
          mm:   pad(m + 1),
          mmm:  dF.i18n.monthNames[m],
          mmmm: dF.i18n.monthNames[m + 12],
          yy:   String(y).slice(2),
          yyyy: y,
          h:    H % 12 || 12,
          hh:   pad(H % 12 || 12),
          H:    H,
          HH:   pad(H),
          M:    M,
          MM:   pad(M),
          s:    s,
          ss:   pad(s),
          l:    pad(L, 3),
          L:    pad(L > 99 ? Math.round(L / 10) : L),
          t:    H < 12 ? "a"  : "p",
          tt:   H < 12 ? "am" : "pm",
          T:    H < 12 ? "A"  : "P",
          TT:   H < 12 ? "AM" : "PM",
          Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
          o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
          S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
        };

      return mask.replace(token, function ($0) {
        return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
      });
    };
  }();

  // Some common format strings
  dateFormat.masks = {
    "default":      "ddd mmm dd yyyy HH:MM:ss",
    shortDate:      "m/d/yy",
    mediumDate:     "mmm d, yyyy",
    longDate:       "mmmm d, yyyy",
    fullDate:       "dddd, mmmm d, yyyy",
    shortTime:      "h:MM TT",
    mediumTime:     "h:MM:ss TT",
    longTime:       "h:MM:ss TT Z",
    isoDate:        "yyyy-mm-dd",
    isoTime:        "HH:MM:ss",
    isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
  };

  // Internationalization strings
  dateFormat.i18n = {
    dayNames: [
      "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
      "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
  };

  // For convenience...
  Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
  };

  return {

    makeID: function (len) {
      if (!len) len = 5;
      var txt = '';
      var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                     + 'abcdefghijklmnopqrstuvwxyz0123456789';
      for (var i = 0; i < len; ++i)
        txt += possible.charAt(Math.floor(
              Math.random() * possible.length));
      return txt;
    },

    getRelativeTime: function (ts) {
      if ('number' === typeof ts)
        ts = Math.round(ts);
      var parsedDate = new Date(ts);
      var relativeDate = arguments.length > 1 ? arguments[1] : new Date();
      var delta;
      if ('string' === typeof ts && ts.indexOf('T') === -1)
        delta = (relativeDate.getTime() - (parsedDate.getTime()
                  + (this.getTimeZone() * 60 * 60 * 1000))) / 1e3;
      else
        delta = (relativeDate.getTime() - parsedDate.getTime()) / 1e3;
      if (delta < 5) return 'just now';
      else if (delta < 15) return 'just a moment ago';
      else if (delta < 30) return 'just a few moments ago';
      else if (delta < 60) return 'less than a minute ago';
      else if (delta < 120) return 'about a minute ago';
      else if (delta < (45 * 60))
        return (parseInt(delta / 60)).toString() + ' minutes ago';
      else if (delta < (90 * 60))
        return 'about an hour ago';
      else if (delta < (24 * 60 * 60)) {
        var h = (parseInt(delta / 3600)).toString();
        if (h != '1') return 'about ' + h + ' hours ago';
        else return 'about an hour ago';
      }
      else if (delta < (2 * 24 * 60 * 60))
        return 'about a day ago';
      else if (delta < (10 * 24 * 60 * 60))
        return (parseInt(delta / 86400)).toString() + ' days ago';
      else return this.toLocaleString(new Date(ts), 'm/d/yy h:MM TT Z');
    },

    getRelativeFutureTime: function (ts) {
      result = {};
      if ('number' === typeof ts)
        ts = Math.round(ts);
      var parsedDate = new Date(ts);
      var relativeDate = arguments.length > 1 ? arguments[1] : new Date();
      var delta;
      if ('string' === typeof ts && ts.indexOf('T') === -1)
        delta = (relativeDate.getTime() - (parsedDate.getTime()
                  + (this.getTimeZone() * 60 * 60 * 1000))) / 1e3;
      else
        delta = (relativeDate.getTime() - parsedDate.getTime()) / 1e3;
      delta *= -1;
      if (delta > (2 * 24 * 60 * 60)) {
        result.value = (parseInt(delta / 86400) + 1).toString();
        result.label = 'days';
        result.interval = 2 * 60 * 60 * 1e3;
      }
      else if (delta > (2 * 60 * 60)) {
        result.value = (parseInt(delta / 3600) + 1).toString();
        result.label = 'hours';
        result.interval = 2 * 60 * 1e3;
      }
      else if (delta > (2 * 60)) {
        result.value = (parseInt(delta / 60) + 1).toString();
        result.label = "minutes";
        result.interval = 1e3;
      }
      else if (delta > 0) {
        result.value = (parseInt(delta)).toString();
        result.label = "seconds";
        result.interval = 1e3;
      }
      else {
        result.value = 0;
        result.label = "seconds";
        result.interval = -1;
      }
      return result;
    },

    getDuration: function (delta) {
      delta = parseFloat(delta) / 1e6;
      if (delta === 0)
        return 'n / a';
      if (delta < 1)
        return (delta * 1e3).toFixed(1) + ' milliseconds';
      else if (delta < 60)
        return delta.toFixed(1) + ' seconds';
      else if (delta < (45 * 60)) 
        return (delta / 60).toFixed(1) + ' minutes';
      else if (delta < (24 * 60 * 60))
        return (delta / 3600).toFixed(1) + ' hours';
      else
        return (delta / 86400).toFixed(1) + ' days';
    },

    toLocaleString: function (utcDate, mask) {
      var time = utcDate.getTime();
      var localDate = new Date(time);
      return localDate.format(mask);
    },

    getTimeZone: function () {
      var rightNow = new Date();
      var jan1 = new Date(rightNow.getFullYear(),
                          0, 1, 0, 0, 0, 0);
      var june1 = new Date(rightNow.getFullYear(),
                          6, 1, 0, 0, 0, 0);
      var temp = jan1.toGMTString();
      var jan2 = new Date(temp.substring(0,
                          temp.lastIndexOf(" ")-1));
      temp = june1.toGMTString();
      var june2 = new Date(temp.substring(0,
                          temp.lastIndexOf(" ")-1));
      var std_time_offset = (jan1 - jan2) / (1000 * 60 * 60);
      var daylight_time_offset = (june1 - june2) /
                                (1000 * 60 * 60);
      var dst;
      if (std_time_offset == daylight_time_offset) {
        // daylight savings time is NOT observed
        dst = false;
      } else {
        // positive is southern, negative is northern hemisphere
        var hemisphere = std_time_offset - daylight_time_offset;
        if (hemisphere >= 0)
          std_time_offset = daylight_time_offset;
        // daylight savings time is observed
        dst = true;
      }
      return dst ? std_time_offset + 1 : std_time_offset;
    },

    age: function (str) {
      var day = Number(str.substr(3,2));
      var month = Number(str.substr(0,2)) - 1;
      var year = Number(str.substr(6,4));
      var today = new Date();
      var age = today.getFullYear() - year;
      if (today.getMonth() < month ||
          (today.getMonth() == month && today.getDate() < day))
        age--;
      return age;
    },

    blurb: function (str, max) {
      if (typeof str === 'number')
        str = String(str);
      if (!str || str.length < max)
        return str;
      var blurb = '';
      var words = str.split(' ');
      var end = '...';
      var i = 0;
      max -= end.length;
      do {
        blurb = blurb.concat(words[i], ' ');
        ++i;
      } while (blurb.concat(words[i]).length - 1 < max);
      return blurb.substr(0, blurb.length - 1) + end;
    },

    slugify: function (str) {
      str = this.blurb(str, 30);
      str = str
        .toLowerCase()
        .replace(/[^\w ]+/g,'')
        .replace(/ +/g,'-');
      if (str.substr(-1) === '-')
        return str.substr(0, str.length - 1);
      else return str;
    },

    formatText: function (str) {
      //var iFrameExp = /(<iframe.+?<\/iframe>)/ig;
      var imgExp = /((\b(https?|ftp|file):\/\/|www\.|ftp\.)[-A-Z0-9+&@#\/%=~_|$?!:,.]*[A-Z0-9+&@#\/%=~_|$]+.(jpg|png|gif|jpeg|bmp))(?!([^<]+)?>)/ig;
      var linkExp = /^(?!src=")(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
      str = str.replace(/\n/g, '<br/>');

      str = str.replace(linkExp, function(txt) {
        if (txt.match(imgExp)) {
          return ('<img class="comment-image" src="' + txt + '" />');
        } else {
          return ('<a href="' + txt + '" target="_blank">' + txt + '</a>');
        }
      }); 
      return str;
    },

    addCommas: function (str) {
      str += '';
      x = str.split('.');
      x1 = x[0];
      x2 = x.length > 1 ? '.' + x[1] : '';
      var rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1))
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      return x1 + x2;
    },

    validate: function (form) {
      var valid = true;
      // text fields
      $('input[type!="submit"], input[type!="hidden"], input[type!="radio"], textarea', form)
          .each(function (i, el) {
        el = $(el);
        var v = el.val().trim();
        if (el.hasClass('required') && v === '' && el.attr('disabled') !== 'disabled') {
          el.addClass('input-error');
          valid = false;
        }
      });
      // radios
      var radioGroups = {};
      $('input[type="radio"].required', form).each(function () {
        radioGroups[$(this).attr('name')] = true;
      });
      _.each(radioGroups, function (v, group) {
        if ($('input[type="radio"][name="' + group + '"]:checked').length === 0) {
          $('.' + group + '-label').addClass('label-error');
          valid = false;
        }
      });
      return valid;
    },

    clear: function (form) {
      $('input[type="text"], input[type="password"], input[type="search"]', form)
          .val('');
      $('textarea', form).val('');
      return form;
    },

    initForm: function (form) {
      function checkErrors(e) {
        var el = $(e.target);
        if (el.hasClass('input-error'))
          el.removeClass('input-error');
      }

      function activateLabel(e) {
        $('label[for*="'+ $(e.target).attr('name') + '"]').addClass('active');  
        return false;
      }

      function deactivateLabel(e) {
        $('label[for*="'+ $(e.target).attr('name') + '"]').removeClass('active');  
        return false;
      }

      $('input[type="text"], input[type="password"], textarea', form).bind('focus',
            function (e) {
        checkErrors(e);
        activateLabel(e);
      });
      $('input[type="text"], input[type="password"], textarea', form).bind('blur',
            function (e) {
        deactivateLabel(e);
      });
    },

    cleanObject: function (obj) {
      _.each(obj, function (p, k) {
        if (p.trim() === '' || p === null || p === undefined)
          delete obj[k];
      });
      return obj;
    },

  }
});
