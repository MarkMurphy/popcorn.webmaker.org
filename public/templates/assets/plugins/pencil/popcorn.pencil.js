/* global Popcorn */
(function ( Popcorn ) {
  "use strict";

  var DEFAULT_STROKE_COLOR = "#668B8B",
      DEFAULT_STROKE_WIDTH = "4";

  Popcorn.plugin( "pencil", function ( options ) {
     // if this is defined, this is an update and we can return early.
    if ( options._svg ) {
      return;
    }

    var container, svg, path,
        target = Popcorn.dom.find( options.target ),
        self = this;

    return {
      _setup: function( options ) {
        if ( !target ) {
          target = self.media.parentNode;
        }

        container = document.createElement( "div" );
        container.style.position = "absolute";
        container.style.overflow = "hidden";
        container.style.top = options.top + "%";
        container.style.left = options.left + "%";
        container.style.width = options.width + "%";
        container.style.height = options.height + "%";
        container.style.zIndex = +options.zindex;

        container.classList.add( "popcorn-pencil" );

        svg = document.createElementNS( "http://www.w3.org/2000/svg", "svg" );
        svg.setAttribute( "width", "100%" );
        svg.setAttribute( "height", "100%" );
        svg.setAttribute( "version", "1.1" );
        svg.setAttribute( "xmlns", "http://www.w3.org/2000/svg" );

        svg.style.position = "absolute";
        svg.style.overflow = "hidden";
        svg.style.width = 100 + "%";
        svg.style.height = 100 + "%";
        
        // Set the viewBox once, only on cretation.
        options.viewBoxMinX = options.viewBoxMinX || 0;
        options.viewBoxMinY = options.viewBoxMinY || 0;
        options.viewBoxWidth = options.viewBoxWidth || target.offsetWidth;
        options.viewBoxHeight = options.viewBoxHeight || target.offsetHeight;

        svg.setAttribute("viewBox", [
          options.viewBoxMinX,
          options.viewBoxMinY,
          options.viewBoxWidth,
          options.viewBoxHeight
        ].join(" "));

        svg.setAttribute("preserveAspectRatio", "xMinYMin");

        // Path
        path = document.createElementNS( "http://www.w3.org/2000/svg", "path" );
        path.style.fill = "none";
        path.style.stroke = options.strokeColor ? options.strokeColor : DEFAULT_STROKE_COLOR;
        path.style.strokeWidth = options.strokeWidth ? options.strokeWidth : DEFAULT_STROKE_WIDTH + "px";
        path.style.strokeLinecap = "round";

        if ( options.path ) {
          path.setAttribute( "d", options.path );
        }

        // Add transition
        svg.classList.add( options.transition );
        svg.classList.add( "off" );

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

      /**
       * The start function will be executed when the currentTime
       * of the video reaches the start time provided by the
       * options variable
       */
      start: function( event, options ) {
        var svg = options._svg,
            redrawBug;

        this.pause(options.start);

        if ( svg ) {
          svg.classList.add( "on" );
          svg.classList.remove( "off" );

          // Safari Redraw hack - #3066
          svg.style.display = "none";
          redrawBug = svg.offsetHeight;
          svg.style.display = "";
        }
      },

      /**
       * The end function will be executed when the currentTime
       * of the video reaches the end time provided by the
       * options variable
       */
      end: function( event, options ) {
        if ( options._svg ) {
          options._svg.classList.add( "off" );
          options._svg.classList.remove( "on" );
        }
      },

      _update: function ( trackEvent, options ) {
        var svg = trackEvent._svg,
            path = trackEvent._path,
            container = trackEvent._container,
            updateViewBox = false;
        
        if ( ( options.left || options.left === 0 ) && options.left !== trackEvent.left ) {
          trackEvent.left = options.left;
          container.style.left = trackEvent.left + "%";
        }

        if ( ( options.top || options.top === 0 ) && options.top !== trackEvent.top ) {
          trackEvent.top = options.top;
          container.style.top = trackEvent.top + "%";
        }

        if ( ( options.height || options.height === 0 ) && options.height !== trackEvent.height ) {
          trackEvent.height = options.height;
          container.style.height = trackEvent.height + "%";
        }

        if ( ( options.width || options.width === 0 ) && options.width !== trackEvent.width ) {
          trackEvent.width = options.width;
          container.style.width = trackEvent.width + "%";
        }

        if ( options.transition && options.transition !== trackEvent.transition ) {
          svg.classList.remove( trackEvent.transition );
          trackEvent.transition = options.transition;
          svg.classList.add( trackEvent.transition );
        }

        if ( (options.viewBoxWidth || options.viewBoxWidth === 0) && options.viewBoxWidth !== trackEvent.viewBoxWidth ) {
          trackEvent.viewBoxWidth = options.viewBoxWidth;
          updateViewBox = true;
        }

        if ( (options.viewBoxHeight || options.viewBoxHeight === 0) && options.viewBoxHeight !== trackEvent.viewBoxHeight ) {
          trackEvent.viewBoxHeight = options.viewBoxHeight;
          updateViewBox = true;
        }

        if ( (options.viewBoxMinX || options.viewBoxMinX === 0) && options.viewBoxMinX !== trackEvent.viewBoxMinX ) {
          trackEvent.viewBoxMinX = options.viewBoxMinX;
          updateViewBox = true;
        }

        if ( (options.viewBoxMinY || options.viewBoxMinY === 0) && options.viewBoxMinY !== trackEvent.viewBoxMinY ) {
          trackEvent.viewBoxMinY = options.viewBoxMinY;
          updateViewBox = true;
        }

        if ( updateViewBox ) {
          svg.setAttribute("viewBox", [trackEvent.viewBoxMinX, trackEvent.viewBoxMinY, trackEvent.viewBoxWidth, trackEvent.viewBoxHeight].join(" "));
        }

        if ( options.path && options.path !== trackEvent.path ) {
          trackEvent.path = options.path;
          path.setAttribute("d", trackEvent.path);
        }

        if ( options.strokeWidth && options.strokeWidth !== trackEvent.strokeWidth ) {
          trackEvent.strokeWidth = options.strokeWidth;
          path.style.strokeWidth = options.strokeWidth + "px";
        }

        if ( options.strokeColor && options.strokeColor !== trackEvent.strokeColor ) {
          trackEvent.strokeColor = options.strokeColor;
          path.style.stroke = options.strokeColor;
        }
      },

      _teardown: function( options ) {
        options._container.parentNode.removeChild( options._container );
        delete options._container;
      }
    };
  }, {
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
        units: "px",
        "default": 0,
        hidden: true
      },
      viewBoxHeight: {
        elem: "input",
        type: "number",
        units: "px",
        "default": 0,
        hidden: true
      },
      viewBoxMinX: {
        elem: "input",
        type: "number",
        units: "px",
        "default": 0,
        hidden: true
      },
      viewBoxMinY: {
        elem: "input",
        type: "number",
        units: "px",
        "default": 0,
        hidden: true
      },
      zindex: {
        hidden: true
      }
    }
  });
}( Popcorn ));