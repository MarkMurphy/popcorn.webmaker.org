// PLUGIN: Line Drawing
/* global Popcorn */
(function ( Popcorn ) {
  "use strict";
  //var _pluginRoot = "/templates/assets/plugins/line/";


  var DEFAULT_STROKE_COLOR = "#668B8B",
      DEFAULT_STROKE_WIDTH = "4";

      
  Popcorn.plugin( "line", {
    _setup: function( options ) {
      var target = document.getElementById( options.target ),
          svg = document.createElementNS( "http://www.w3.org/2000/svg", "svg" ),
          polyline = document.createElementNS( "http://www.w3.org/2000/svg", "polyline" ),
          top = options.top + "%",
          left = options.left + "%",
          context = this;

      if ( !target ) {
        target = context.media.parentNode;
      }

      options._target = target;
      options._svg = svg;

      svg.classList.add( "popcorn-line-shape" );

      svg.setAttribute( "width", "100%" );
      svg.setAttribute( "height", "100%" );
      svg.setAttribute( "version", "1.1" );
      svg.setAttribute( "xmlns", "http://www.w3.org/2000/svg" );

      svg.style.position = "absolute";
      svg.style.overflow = "hidden";
      svg.style.top = top;
      svg.style.left = left;
      svg.style.width = 100 + "%";
      svg.style.height = 100 + "%";
      svg.style.zIndex = +options.zindex;

      // Polyline
      polyline.style.fill = "none";
      polyline.style.stroke = options.strokeColor ? options.strokeColor : DEFAULT_STROKE_COLOR;
      polyline.style.strokeWidth = options.strokeWidth ? options.strokeWidth : DEFAULT_STROKE_WIDTH + "px";
      polyline.style.strokeLinecap = "round";
      polyline.setAttribute( "points", options.points );
      svg.appendChild( polyline );

      // Add transition
      svg.classList.add( options.transition );
      svg.classList.add( "off" );
      target.appendChild( svg );

      options.toString = function() {
        return "Line Shape";
      };
    },

    start: function( event, options ) {
      var svg = options._svg,
          redrawBug;

      if ( svg ) {
        svg.classList.add( "on" );
        svg.classList.remove( "off" );

        // Safari Redraw hack - #3066
        svg.style.display = "none";
        redrawBug = svg.offsetHeight;
        svg.style.display = "";
      }
    },

    end: function( event, options ) {
      if ( options._svg ) {
        options._svg.classList.add( "off" );
        options._svg.classList.remove( "on" );
      }
    },

    _teardown: function( options ) {
      if ( options._svg && options._target ) {
        options._target.removeChild( options._svg );
      }
    },

    manifest: {
      about: {
        name: "Popcorn Maker Line Shape Plugin",
        version: "0.1",
        author: "Up My Game @upmygame",
        website: "http://upmygame.com/"
      },
      options: {
        start: {
          elem: "input",
          type: "text",
          label: "In",
          units: "seconds"
        },
        end: {
          elem: "input",
          type: "text",
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
        points: {
          elem: "input",
          type: "text",
          label: "Points",
          "default": "20,20 40,25 60,40 80,120 120,140 200,180",
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
        zindex: {
          hidden: true
        }
      }
    }

  });
}( Popcorn ));