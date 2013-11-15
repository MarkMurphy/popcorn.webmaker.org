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

    var container, svg, path, viewBox,
        target = Popcorn.dom.find( options.target ),
        self = this;

    return {
      _setup: function( options ) {
        console.log("pencil setup");

        if ( !target ) {
          target = self.media.parentNode;
        }

        container = document.createElement( "div" );
        container.style.position = "absolute";
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

        // Set SVG viewBox Defaults
        options.viewBoxMinX = options.viewBoxMinX || 0;
        options.viewBoxMinY = options.viewBoxMinY || 0;
        options.viewBoxWidth = options.viewBoxWidth || target.offsetWidth;
        options.viewBoxHeight = options.viewBoxHeight || target.offsetHeight;

        viewBox = [
          options.viewBoxMinX,
          options.viewBoxMinY,
          options.viewBoxWidth,
          options.viewBoxHeight
        ];

        svg.setAttribute("viewBox", viewBox.join(" "));
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

      /**
       * The start function will be executed when the currentTime
       * of the video reaches the start time provided by the
       * options variable
       */
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

      /**
       * The end function will be executed when the currentTime
       * of the video reaches the end time provided by the
       * options variable
       */
      end: function( event, options ) {
        if ( options._container ) {
          options._container.classList.add( "off" );
          options._container.classList.remove( "on" );
        }
      },

      _update: function ( trackEvent, options ) {
        var svg = trackEvent._svg,
            container = trackEvent._container;

        console.log("update pencil", options, trackEvent);
        
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
          container.classList.remove( trackEvent.transition );
          trackEvent.transition = options.transition;
          container.classList.add( trackEvent.transition );
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
  });
}( Popcorn ));