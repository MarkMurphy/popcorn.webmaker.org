/*global EditorHelper*/

EditorHelper.addPlugin( "pencil", function( trackEvent ) {
 "use strict";

  var MOVEMENT_THRESHOLD = 5;

  var pathToString = /,?([achlmqrstvxz]),?/gi,
      pathCommand = /([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,
      pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/ig;
        
  /**
   * Get standarised clientX and clientY
   *
   * @return Array | Boolean
   */
  function getClientXY (event) {
    try {
      return {
        x: (event.clientX || event.originalEvent.clientX || event.originalEvent.touches[0].clientX),
        y: (event.clientY || event.originalEvent.clientY || event.originalEvent.touches[0].clientY)
      };
    } catch (e) {

    }

    return false;
  }

  /**
   * Clones an object, array, string, etc...
   */
  function clone(obj) {
    if (typeof obj == "function" || Object(obj) !== obj) {
      return obj;
    }
    var res = new obj.constructor();
    for (var key in obj) if (obj.hasOwnProperty(key)) {
      res[key] = clone(obj[key]);
    }
    return res;
  }

  /*
   * Raphael.parsePathString
   [ method ]
   **
   * Utility method
   **
   * Parses given path string into an array of arrays of path segments.
   > Parameters
   - pathString (string|array) path string or array of segments (in the last case it will be returned straight away)
   = (array) array of segments.
  */
  function parsePathString (pathString) {
    if (!pathString) {
      return null;
    }

    var paramCounts = { a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0 },
      data = [];

    if (typeof pathString === "array" && typeof pathString[0] === "array") { // rough assumption
      data = clone(pathString);
    }

    if (!data.length) {
      String(pathString).replace(pathCommand, function (a, b, c) {
        var params = [],
            name = b.toLowerCase();

        c.replace(pathValues, function (a, b) {
          if (b) params.push(+b);
        });

        if (name == "m" && params.length > 2) {
          data.push([b].concat(params.splice(0, 2)));
          name = "l";
          b = b == "m" ? "l" : "L";
        }

        if (name == "r") {
          data.push([b].concat(params));
        } else while (params.length >= paramCounts[name]) {
          data.push([b].concat(params.splice(0, paramCounts[name])));
          if (!paramCounts[name]) {
            break;
          }
        }
      });
    }

    return data;
  }

  function Path (element, data) {
    var _this = this,
        _element = element || document.createElementNS( "http://www.w3.org/2000/svg", "path" ),
        _data = parsePathString(data || element.getAttribute("d") || []);

    Array.call(this);

    _data.forEach(function (value) {
      _this.push(value);
    });

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        set: function (element) {
          _element = element;
          return _this.update();
        },
        get: function () {
          return _element;
        }
      }
    });

    this.update();
  }

  Path.prototype = Object.create(Array.prototype);
  Path.prototype.constructor = Path;

  Path.prototype.moveto = function (x, y) {
    this.push(["M", x, y]);
    return this.update();
  };

  Path.prototype.lineto = function (x, y) {
    this.push(["L", x, y]);
    return this.update();
  };

  Path.prototype.clear = function () {
    this.splice(0, this.length);
    return this.update();
  };

  Path.prototype.update = function () {
    var d = String(this);

    if ( d ) {
      this.element.setAttribute( "d", d );
    }
    else {
      this.element.removeAttribute( "d" );
    }

    return this;
  };

  Path.prototype.toString = function () {
    return this.join(",").replace(pathToString, "$1");
  };

  var svg = trackEvent.popcornTrackEvent._svg,
      target = trackEvent.popcornTrackEvent._target,
      container = trackEvent.popcornTrackEvent._container,
      path = new Path(trackEvent.popcornTrackEvent._path);

  function globalToLocal (coords) {
    // Check if coords is an event object
    if (coords.hasOwnProperty("target")) {
      coords = getClientXY(coords);
    }

    var point = svg.createSVGPoint();
    point.x = coords.x;
    point.y = coords.y;

    var local = point.matrixTransform(svg.getScreenCTM().inverse());
    local.x = Math.round(local.x);
    local.y = Math.round(local.y);

    return local;
  }

  // Attach Event Handlers
  svg.addEventListener( "mousedown", function (event) {
    // if the current mouse button is not left mouse then abort. 
    if (event.which !== 1) {
      return;
    }

    var mousemove = 0;

    function onMouseMove (event) {
      var coords = globalToLocal(event);

      if (path.length > 1) {
          var prev = path[path.length - 1].slice(1),
              prevX = prev[0],
              prevY = prev[1];

          if (Math.abs(coords.x - prevX) < MOVEMENT_THRESHOLD &&
              Math.abs(coords.y - prevY) < MOVEMENT_THRESHOLD) {
              // ignore any movement less than the threshold.
              return;
          }
      }

       path[mousemove++ ? "lineto" : "moveto"](coords.x, coords.y);
    }

    function onMouseUp () {
      svg.removeEventListener( "mousemove", onMouseMove );
      document.removeEventListener( "mouseup", onMouseUp );

      trackEvent.update({
        path: path.toString()
      });
    }

    document.addEventListener( "mouseup", onMouseUp, false );
    svg.addEventListener( "mousemove", onMouseMove, false );
  }, false );

/*
  if ( window.jQuery ) {
    EditorHelper.draggable( trackEvent, container, target );
    EditorHelper.resizable( trackEvent, container, target, {
      minWidth: 10,
      minHeight: 10,
      handlePositions: "e,s,se,n,w"
    });
  }
*/

});
