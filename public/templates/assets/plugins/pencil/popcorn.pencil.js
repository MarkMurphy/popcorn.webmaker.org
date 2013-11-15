/* global Popcorn */
(function ( Popcorn ) {
  "use strict";

  var DEFAULT_STROKE_COLOR = "#668B8B",
      DEFAULT_STROKE_WIDTH = "4";

  Popcorn.plugin( "pencil", {
    _setup: function( options ) {
      var target = document.getElementById( options.target ),
          container = document.createElement( "div" ),
          svg = document.createElementNS( "http://www.w3.org/2000/svg", "svg" ),
          path = document.createElementNS( "http://www.w3.org/2000/svg", "path" ),
          width = options.width + "%",
          height = options.height + "%",
          top = options.top + "%",
          left = options.left + "%",
          viewBox = [],
          context = this;

      if ( !target ) {
        target = context.media.parentNode;
      }

      container.style.position = "absolute";
      container.style.top = top;
      container.style.left = left;
      container.style.width = width;
      container.style.height = height;
      container.style.zIndex = +options.zindex;

      container.classList.add( "popcorn-pencil" );

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

      // Path
      path.style.fill = "none";
      path.style.stroke = options.strokeColor ? options.strokeColor : DEFAULT_STROKE_COLOR;
      path.style.strokeWidth = options.strokeWidth ? options.strokeWidth : DEFAULT_STROKE_WIDTH + "px";
      path.style.strokeLinecap = "round";

      if ( options.path ) {
        path.setAttribute( "d", options.path );
      }

      // Add transition
      container.classList.add( options.transition );
      container.classList.add( "off" );

      svg.appendChild( path );
      container.appendChild( svg );
      target.appendChild( container );

      options._target = target;
      options._container = container;
      options._svg = svg;
      options._path = path;
      
      options.toString = function() {
        return "Pencil Drawing";
      };
    },

    start: function( event, options ) {
      var container = options._container,
          redrawBug;

      this.pause(options.start);

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
      options._container.parentNode.removeChild( options._container );
      delete options._container;
    },

    manifest: {
      about: {
        name: "Popcorn Pencil Plugin",
        version: "0.1",
        author: "Up My Game",
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
        path: {
          elem: "input",
          type: "text",
          label: "Path Data",
          "default": "", //"default": "M20,20 L40,25 L60,40 L80,120 L120,140 L200,180",
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