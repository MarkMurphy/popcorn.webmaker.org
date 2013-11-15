/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function(Butter) {
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
  function getClientXY(event) {
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
    for (var key in obj)
      if (obj.hasOwnProperty(key)) {
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
  function parsePathString(pathString) {
    if (!pathString) {
      return null;
    }

    var paramCounts = { a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0 },
        data = [];

    if (typeof pathString === "array" && typeof pathString[0] === "array") { // rough assumption
      data = clone(pathString);
    }

    if (!data.length) {
      String(pathString).replace(pathCommand, function(a, b, c) {
        var params = [],
            name = b.toLowerCase();

        c.replace(pathValues, function(a, b) {
          if (b) params.push(+b);
        });

        if (name == "m" && params.length > 2) {
          data.push([b].concat(params.splice(0, 2)));
          name = "l";
          b = b == "m" ? "l" : "L";
        }

        if (name == "r") {
          data.push([b].concat(params));
        } else
          while (params.length >= paramCounts[name]) {
            data.push([b].concat(params.splice(0, paramCounts[name])));
            if (!paramCounts[name]) {
              break;
            }
          }
      });
    }

    return data;
  }

  function Path(element, data) {
    var _this = this,
      _element = element || document.createElementNS("http://www.w3.org/2000/svg", "path"),
      _data = parsePathString(data || element.getAttribute("d") || []);

    Array.call(this);

    _data.forEach(function(value) {
      _this.push(value);
    });

    Object.defineProperties(this, {
      element: {
        enumerable: true,
        set: function(element) {
          _element = element;
          return _this.update();
        },
        get: function() {
          return _element;
        }
      }
    });

    this.update();
  }

  Path.prototype = Object.create(Array.prototype);
  Path.prototype.constructor = Path;

  /**
   * The "moveto" commands (M or m) establish a new current point. The effect is as if the "pen" were lifted and moved to a new location.
   * @return {Path} - The path object instance
   */
  Path.prototype.moveto = function(x, y) {
    this.push(["M", x, y]);
    return this.update();
  };

  /**
   * Draw a line from the current point to the given (x,y) coordinate which becomes the new current point.
   * @return {Path} - The path object instance
   */
  Path.prototype.lineto = function(x, y) {
    this.push(["L", x, y]);
    return this.update();
  };

  /**
   * Removes all points from the path
   * @return {Path} - The path object instance
   */
  Path.prototype.clear = function() {
    this.splice(0, this.length);
    return this.update();
  };

  /**
   * Updates the path-data attribute "d" on the dom node associated with the current path.
   * @return {Path} - The path object instance
   */
  Path.prototype.update = function() {
    var d = String(this);

    if (d) {
      this.element.setAttribute("d", d);
    } else {
      this.element.removeAttribute("d");
    }

    return this;
  };

  /**
   * Converts the path from an array of point commands and coordinates to a string suitable for 
   * setting the path-data attribute "d" on a DOM node within an SVG element.
   *
   * @return {String}
   */
  Path.prototype.toString = function() {
    return this.join(",").replace(pathToString, "$1");
  };

  Butter.Editor.register("pencil", "load!{{baseDir}}templates/assets/editors/pencil/pencil-editor.html",
    function(rootElement, butter) {

      var _this = this;

      var _rootElement = rootElement,
        _trackEvent,
        _manifestOptions,
        _butter,
        _popcornOptions;

      /**
       * Member: setup
       *
       * Sets up the content of this editor
       *
       * @param {TrackEvent} trackEvent: The TrackEvent being edited
       */

      function setup(trackEvent) {
        _trackEvent = trackEvent;
        _manifestOptions = _trackEvent.manifest.options;
        _popcornOptions = _trackEvent.popcornOptions;

        var basicContainer = _rootElement.querySelector(".editor-options"),
          advancedContainer = _rootElement.querySelector(".advanced-options"),
          pluginOptions = {};

        function callback(elementType, element, trackEvent, name) {
          pluginOptions[name] = {
            element: element,
            trackEvent: trackEvent,
            elementType: elementType
          };
        }

        function attachHandlers() {
          var key,
            option;

          function strokeColorCallback(te, prop, message) {
            if (message) {
              _this.setErrorState(message);
              return;
            } else {
              te.update({
                strokeColor: prop.strokeColor
              });
            }
          }

          function strokeWidthCallback(te, prop, message) {
            if (message) {
              _this.setErrorState(message);
              return;
            } else {
              te.update({
                strokeWidth: prop.strokeWidth
              });
            }
          }

          for (key in pluginOptions) {
            if (pluginOptions[key]) {
              option = pluginOptions[key];

              if (option.elementType === "input") {
                if (key === "strokeColor") {
                  _this.attachColorChangeHandler(option.element, option.trackEvent, key, strokeColorCallback);
                } else if (key === "strokeWidth") {
                  _this.attachInputChangeHandler(option.element, option.trackEvent, key, strokeWidthCallback);
                } else {
                  _this.attachInputChangeHandler(option.element, option.trackEvent, key, _this.updateTrackEventSafe);
                }
              } else if (option.elementType === "select" && key !== "type") {
                _this.attachSelectChangeHandler(option.element, option.trackEvent, key, _this.updateTrackEventSafe);
              }
            }
          }

          basicContainer.insertBefore(_this.createStartEndInputs(trackEvent, _this.updateTrackEventSafe), basicContainer.firstChild);
        }

        _this.createPropertiesFromManifest({
          trackEvent: trackEvent,
          callback: callback,
          basicContainer: basicContainer,
          advancedContainer: advancedContainer,
          ignoreManifestKeys: ["start", "end"]
        });

        attachHandlers();
        _this.updatePropertiesFromManifest(trackEvent);
        _this.setTrackEventUpdateErrorCallback(_this.setErrorState);
      }

      function onTrackEventUpdated(e) {
        _trackEvent = e.target;
        _this.updatePropertiesFromManifest(_trackEvent);
        _this.setErrorState(false);
      }

      // Extend this object to become a TrackEventEditor
      Butter.Editor.TrackEventEditor.extend(_this, butter, rootElement, {
        open: function(parentElement, trackEvent) {
          _butter = butter;

          // Update properties when TrackEvent is updated
          trackEvent.listen("trackeventupdated", onTrackEventUpdated);
          setup(trackEvent);
        },
        close: function() {
          _trackEvent.unlisten("trackeventupdated", onTrackEventUpdated);
        }
      });
    }, false, function( trackEvent/*, popcorn */ ) {

      var self = this,
          svg = trackEvent.popcornTrackEvent._svg,
          target = trackEvent.popcornTrackEvent._target,
          container = trackEvent.popcornTrackEvent._container;

      // prevent duplicate listeners
      if ( !trackEvent.popcornTrackEvent.listenersSetup ) {
        trackEvent.popcornTrackEvent.listenersSetup = true;

        var path = new Path(trackEvent.popcornTrackEvent._path);

        // setup drawing listeners
        svg.addEventListener("mousedown", function(event) {
          // if the current mouse button is not left mouse then abort. 
          if (event.which !== 1) {
            return;
          }

          var mousemove = 0;

          function onMouseMove(event) {
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

          function onMouseUp() {
            svg.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);

            trackEvent.update({
              path: path.toString()
            });
          }

          document.addEventListener("mouseup", onMouseUp, false);
          svg.addEventListener("mousemove", onMouseMove, false);
        }, false);

        /*
        if ( trackEvent.popcornOptions.fullscreen ) {
          return;
        }

        self.draggable( trackEvent, container, target, {
          tooltip: "Double click to edit"
        });

        self.resizable( trackEvent, container, target, {
          handlePositions: "e, se, s, sw, w, n, ne, nw",
          minHeight: 20,
          minWidth: 20
        });
        */
      }

      function globalToLocal(coords) {
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
  });
}(window.Butter));
