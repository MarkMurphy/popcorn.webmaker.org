/**
 * Angle
 *
 * xyA      xyB
 *  .       .
 *   \     /
 *    \   /
 *     \ /
 *      .
 *     xyC
 */

/* global Popcorn */
(function ( Popcorn ) {
  "use strict";

  var ANGLE_CONTROL_POINT_RADIUS = 12,
      ANGLE_CONTROL_POINT_VERTEX_RADIUS = 8;

  var UNICODE_DEGREE_SIGN = "\u00B0",
      DEFAULT_STROKE_COLOR = "#668B8B",
      DEFAULT_STROKE_WIDTH = "4";

  var SVG = {
    /**
     * Shortvut to creating svg elements
     */
    create: function (type) {
      return document.createElementNS( "http://www.w3.org/2000/svg", type );
    }
  };

  var MathUtils = {
    /**
     * Find the angle that two (x,y) coordinates in 2D space form. Returns the angle in Degrees.
     * @return {number} - Angle in Degrees
     */
    findAngleBetweenTwoPoints: function (a, b) {
        return Math.atan2((a.y - b.y), (a.x - b.x)) * 180 / Math.PI;
    },

    /**
     * Find the distance bwtween two (x,y) coordinates in 2D space.
     * @return {number}
     */
    findDistanceBetweenTwoPoints: function (a, b) {
        var xDist = a.x - b.x,
            yDist = a.y - b.y;
        
        return Math.sqrt((xDist * xDist) + (yDist * yDist));
    },

    /**
     * Find the (x,y) coordinate on the circomference of a circle or arc that an angle points to.
     * 
     * @param {number} cx - The x coordinate of the circles center point.
     * @param {number} cy - The y coordinate of the circles center point.
     * @param {number} radius - The radius of the circle.
     * @param {number} angleInDegrees
     *
     * @return {{x: number, y: number}}
     */
    polarToCartesian: function (cx, cy, radius, angleInDegrees) {
      var angleInRadians = angleInDegrees * Math.PI / 180.0;

      return {
        x: cx + (radius * Math.cos(angleInRadians)),
        y: cy + (radius * Math.sin(angleInRadians))
      };
    }
  };

  /**
   * Helper function to set multiple attributes at once
   */
  function setAttributes (el, attrs) {
    for (var key in attrs) {
      el.setAttribute(key, attrs[key]);
    }
  }

  Popcorn.plugin( "angle", {
    _setup: function( options ) {
      var target = document.getElementById( options.target ),
          container = document.createElement( "div" ),
          svg = SVG.create( "svg" ),
          angle = SVG.create( "g" ),
          arc = SVG.create( "path" ),
          ray1 = SVG.create( "line" ),
          ray2 = SVG.create( "line" ),
          label = SVG.create( "text" ),
          width = options.width + "%",
          height = options.height + "%",
          top = options.top + "%",
          left = options.left + "%",
          viewBox = [],
          context = this;

      var controls = [
            SVG.create( "circle" ),   // ray1 control point
            SVG.create( "circle" ),   // vertex control point
            SVG.create( "circle" )    // ray2 control point
          ];

      var _xyA = { x: options.ax, y: options.ay },
          _xyB = { x: options.bx, y: options.by } || _xyA,
          _xyC = { x: options.cx, y: options.cy } || _xyB;

      if ( !target ) {
        target = context.media.parentNode;
      }

      container.style.position = "absolute";
      container.style.top = top;
      container.style.left = left;
      container.style.width = width;
      container.style.height = height;
      container.style.zIndex = +options.zindex;

      container.classList.add( "popcorn-angle" );

      svg.setAttribute( "width", "100%" );
      svg.setAttribute( "height", "100%" );
      svg.setAttribute( "version", "1.1" );
      svg.setAttribute( "xmlns", "http://www.w3.org/2000/svg" );

      svg.style.position = "absolute";
      svg.style.overflow = "hidden";
      svg.style.width = 100 + "%";
      svg.style.height = 100 + "%";

      // Set SVG viewBox
      viewBox.push(options.viewBoxMinX || 0);
      viewBox.push(options.viewBoxMinY || 0);
      viewBox.push(options.viewBoxWidth || target.offsetWidth);
      viewBox.push(options.viewBoxHeight || target.offsetHeight);
      svg.setAttribute("viewBox", viewBox.join(" "));
      svg.setAttribute("preserveAspectRatio", "xMinYMin");

      // Controls
      controls.forEach(function (element) {
        element.setAttribute( "r", ANGLE_CONTROL_POINT_RADIUS );
        element.style.fill = "rgba(0, 0, 0, 0.01)";
        element.classList.add( "control-point" );
      });

      controls[1].setAttribute( "r", ANGLE_CONTROL_POINT_VERTEX_RADIUS );

      // Label
      label.style.fill = "#FFFFFF";
      label.style.strokeWidth = "0";
      label.style.textAnchor = "middle";
      label.style.textShadow = "0 0 4px rgba(0, 0, 0, 0.5)";
      
      // Angle
      angle.style.fill = "none";
      angle.style.stroke = options.strokeColor ? options.strokeColor : DEFAULT_STROKE_COLOR;
      angle.style.strokeWidth = options.strokeWidth ? options.strokeWidth : DEFAULT_STROKE_WIDTH + "px";
      angle.style.strokeLinecap = "round";

      angle.appendChild( ray1 );
      angle.appendChild( ray2 );
      angle.appendChild( arc );
      angle.appendChild( controls[0] );
      angle.appendChild( controls[1] );
      angle.appendChild( controls[2] );
      angle.appendChild( label );
      angle.classList.add( "angle" );

      // Add transition
      container.classList.add( options.transition );
      container.classList.add( "off" );

      svg.appendChild( angle );
      container.appendChild( svg );
      target.appendChild( container );

      refresh();

      options._target = target;
      options._container = container;
      options._svg = svg;
      options._angle = angle;
      options._label = label;
      options._ray1 = ray1;
      options._ray2 = ray2;
      options._arc = arc;
      options._controls = controls;

      options.xyA = function (xyA) {
        // if not specified, treat this as a call to fetch the current value
        if (!xyA) {
            return _xyA;
        }

        _xyA = xyA;
        
        refresh();
      };

      options.xyB = function (xyB) {
        // if not specified, treat this as a call to fetch the current value
        if (!xyB) {
            return _xyB;
        }
        
        _xyB = xyB;

        refresh();
      };

      options.xyC = function (xyC) {
        // if not specified, treat this as a call to fetch the current value
        if (!xyC) {
            return _xyC;
        }

        _xyC = xyC;

        refresh();
      };

      function refresh () {
        var xyA = _xyA,
            xyB = _xyB || xyA,
            xyC = _xyC || xyB;

        var angleVertexToPointA = Math.atan2(xyC.y - xyA.y, xyC.x - xyA.x),
            angleVertexToPointB = Math.atan2(xyC.y - xyB.y, xyC.x - xyB.x),
            __xyA = MathUtils.polarToCartesian(xyA.x, xyA.y, ANGLE_CONTROL_POINT_RADIUS, angleVertexToPointA * 180 / Math.PI),
            __xyB = MathUtils.polarToCartesian(xyB.x, xyB.y, ANGLE_CONTROL_POINT_RADIUS, angleVertexToPointB * 180 / Math.PI),
            __xyC = {
                x1: xyC.x - ANGLE_CONTROL_POINT_VERTEX_RADIUS * Math.cos(angleVertexToPointA),
                y1: xyC.y - ANGLE_CONTROL_POINT_VERTEX_RADIUS * Math.sin(angleVertexToPointA),
                x2: xyC.x - ANGLE_CONTROL_POINT_VERTEX_RADIUS * Math.cos(angleVertexToPointB),
                y2: xyC.y - ANGLE_CONTROL_POINT_VERTEX_RADIUS * Math.sin(angleVertexToPointB)
            };

        setAttributes(ray1, {
            x1: __xyA.x,
            y1: __xyA.y,
            x2: __xyC.x1,
            y2: __xyC.y1,
        });

        setAttributes(ray2, {
            x1: __xyB.x,
            y1: __xyB.y,
            x2: __xyC.x2,
            y2: __xyC.y2
        });

        // update the controls
        setAttributes(controls[2], { cx: xyB.x, cy: xyB.y });
        setAttributes(controls[1], { cx: xyC.x, cy: xyC.y });
        setAttributes(controls[0], { cx: xyA.x, cy: xyA.y });
        
        update();
      }

      function update () {
        var deltaDegrees = getAngleRay1() - getAngleRay2();

        var radius = (ANGLE_CONTROL_POINT_RADIUS * 2) * 1.45;
        var distanceVertexToXY2 = MathUtils.findDistanceBetweenTwoPoints(_xyC, _xyB) - (ANGLE_CONTROL_POINT_RADIUS * 2) / 2;
        var distanceVertexToXY1 = MathUtils.findDistanceBetweenTwoPoints(_xyC, _xyA) - (ANGLE_CONTROL_POINT_RADIUS * 2) / 2;

        if (distanceVertexToXY2 < distanceVertexToXY1) {
          if (radius > distanceVertexToXY2) {
            radius = distanceVertexToXY2;
          }
        } else {
          if (radius > distanceVertexToXY1) {
            radius = distanceVertexToXY1;
          }
        }

        if ((deltaDegrees <= 180.15 && deltaDegrees >= 0) || deltaDegrees == -180.0 || deltaDegrees < -179.95) {
          deltaDegrees = Math.abs(deltaDegrees);

          if (deltaDegrees > 180.00) {
            deltaDegrees = 360 - deltaDegrees;
          }
          
          //_angleThetaPath = [UIBezierPath bezierPathWithArcCenter:_xyC radius:radius startAngle:_startAngle endAngle:_endAngle clockwise:NO];
          
          setAttributes(arc, {
            d: describeArc(_xyC.x, _xyC.y, radius, getAngleRay1(), getAngleRay2())
          });

        } else {
          deltaDegrees = Math.abs(deltaDegrees);

          if (deltaDegrees > 180.00) {
            deltaDegrees = 360 - deltaDegrees;
          }

          //_angleThetaPath = [UIBezierPath bezierPathWithArcCenter:_xyC radius:radius startAngle:_endAngle endAngle:_startAngle clockwise:NO];

          setAttributes(arc, {
            d: describeArc(_xyC.x, _xyC.y, radius, getAngleRay2(), getAngleRay1())
          });
        }

        var mid = {
          x: (_xyA.x + _xyB.x)/2 - _xyC.x,
          y: (_xyA.y + _xyB.y)/2 - _xyC.y
        };

        var midAngle = Math.atan2(mid.y, mid.x);

        label.textContent = deltaDegrees.toFixed(2) + UNICODE_DEGREE_SIGN;

        setAttributes(label, {
          x: _xyC.x - (Math.cos(midAngle) * (ANGLE_CONTROL_POINT_VERTEX_RADIUS * 2 + label.offsetWidth / 2)),
          y: _xyC.y - (Math.sin(midAngle) * (ANGLE_CONTROL_POINT_VERTEX_RADIUS * 2 + label.offsetWidth / 2))
        });
      }

      /**
       * Calculates the angle of ray1
       * @return {number} - The angle in degrees.
       */
      function getAngleRay1 () {
        return getLineAngle(ray1);
      }

      /**
       * Calculates the angle of ray2
       * @return {number} - The angle in degrees.
       */
      function getAngleRay2 () {
        return getLineAngle(ray2);
      }

      /**
       * Calculates the angle of a line in degrees.
       * @return {number} - The angle in degrees.
       */
      function getLineAngle (line) {
        var angle = Math.atan2(
            line.getAttribute("y1") - line.getAttribute("y2"),
            line.getAttribute("x1") - line.getAttribute("x2"));

        return angle * 180 / Math.PI;
      }

      function describeArc (x, y, radius, startAngle, endAngle) {
        var start = MathUtils.polarToCartesian(x, y, radius, endAngle),
            end = MathUtils.polarToCartesian(x, y, radius, startAngle),
            angle = endAngle - startAngle;

        if (angle < 0) {
            angle += 360;
        }

        var xAxisRotation = "0",
            largeArcFlag = "0",
            sweepFlag = angle.toFixed(2) <= 180.00 ? "0" : 1;

        //M {{startX}} {{startY}} A {{rx}} {{ry}} {{x-axis-rotation}} {{large-arc-flag}} {{sweep-flag}} {{endX}} {{endY}}
        return [
            "M", start.x, start.y,
            "A", radius, radius, xAxisRotation, largeArcFlag, sweepFlag, end.x, end.y
        ].join(" ");
      }
      
      options.toString = function() {
        return "Angle (" + label.textContent + ")";
      };
    },

    start: function( event, options ) {
      var container = options._container,
          redrawBug;

      if ( container ) {
        container.classList.add( "on" );
        container.classList.remove( "off" );

        // Safari Redraw hack - #3066
        container.style.display = "none";
        redrawBug = container.offsetHeight;
        container.style.display = "";
      }
    },

    end: function( event, options ) {
      if ( options._container ) {
        options._container.classList.add( "off" );
        options._container.classList.remove( "on" );
      }
    },

    _teardown: function( options ) {
      if ( options._container && options._target ) {
        options._target.removeChild( options._container );
      }
    },

    manifest: {
      about: {
        name: "Popcorn Maker Angle Plugin",
        version: "0.1",
        author: "Up My Game @upmygame",
        website: "http://upmygame.com/"
      },
      options: {
        start: {
          elem: "input",
          type: "number",
          label: "In",
          units: "seconds"
        },
        end: {
          elem: "input",
          type: "number",
          label: "Out",
          units: "seconds"
        },
        transition: {
          elem: "select",
          options: [ "None", "Pop", "Fade", "Slide Up", "Slide Down" ],
          values: [ "popcorn-none", "popcorn-pop", "popcorn-fade", "popcorn-slide-up", "popcorn-slide-down" ],
          label: "Transition",
          "default": "popcorn-none"
        },
        strokeWidth: {
          elem: "input",
          type: "number",
          label: "Stoke Width",
          "default": DEFAULT_STROKE_WIDTH,
          units: "px",
          group: "advanced"
        },
        strokeColor: {
          elem: "input",
          type: "color",
          label: "Stoke Colour",
          "default": DEFAULT_STROKE_COLOR,
          group: "advanced"
        },
        ax: {
          elem: "input",
          type: "number",
          label: "Point Ax",
          units: "px",
          "default": 100,
          hidden: true
        },
        ay: {
          elem: "input",
          type: "number",
          label: "Point Ay",
          units: "px",
          "default": 100,
          hidden: true
        },
        bx: {
          elem: "input",
          type: "number",
          label: "Point Bx",
          units: "px",
          "default": 300,
          hidden: true
        },
        by: {
          elem: "input",
          type: "number",
          label: "Point By",
          units: "px",
          "default": 300,
          hidden: true
        },
        cx: {
          elem: "input",
          type: "number",
          label: "Vertex X",
          units: "px",
          "default": 100,
          hidden: true
        },
        cy: {
          elem: "input",
          type: "number",
          label: "Vertex Y",
          units: "px",
          "default": 300,
          hidden: true
        },
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          units: "%",
          "default": 0,
          hidden: true
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          units: "%",
          "default": 0,
          hidden: true
        },
        width: {
          elem: "input",
          type: "number",
          units: "%",
          label: "Width",
          "default": 100,
          hidden: true
        },
        height: {
          elem: "input",
          type: "number",
          units: "%",
          label: "Height",
          "default": 100,
          hidden: true
        },
        viewBoxWidth: {
          elem: "input",
          type: "number",
          label: "View Box Width",
          hidden: true
        },
        viewBoxHeight: {
          elem: "input",
          type: "number",
          label: "View Box Height",
          hidden: true
        },
        viewBoxMinX: {
          elem: "input",
          type: "number",
          label: "View Box Min-X",
          hidden: true
        },
        viewBoxMinY: {
          elem: "input",
          type: "number",
          label: "View Box Min-Y",
          hidden: true
        },
        zindex: {
          hidden: true
        }
      }
    }

  });
}( Popcorn ));