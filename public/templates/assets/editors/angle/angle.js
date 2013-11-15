/*global EditorHelper*/

EditorHelper.addPlugin( "angle", function( trackEvent ) {
 "use strict";

  var MOVEMENT_THRESHOLD = 1;

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

  var svg = trackEvent.popcornTrackEvent._svg,
      angle = trackEvent.popcornTrackEvent._angle,
      target = trackEvent.popcornTrackEvent._target,
      controls = trackEvent.popcornTrackEvent._controls,
      container = trackEvent.popcornTrackEvent._container;

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
  angle.addEventListener( "mousedown", function (event) {
    // if the current mouse button is not left mouse then abort. 
    if (event.which !== 1) {
      return;
    }

    var target;
    
    if (event.target === controls[0]) {
        target = "xyA";
    }
    else if (event.target === controls[1]) {
        target = "xyC";
    }
    else if (event.target === controls[2]) {
        target = "xyB";
    }
    else {
        // target is not a control point so we exit
        return;
    }

    event.preventDefault();
    event.stopPropagation();


    function onMouseMove (event) {
      var position = globalToLocal(event);
  
      // ignore movement less than the threshold
      if (Math.abs(position.x - trackEvent.popcornTrackEvent[target]().x) < MOVEMENT_THRESHOLD &&
          Math.abs(position.y - trackEvent.popcornTrackEvent[target]().y) < MOVEMENT_THRESHOLD) {
          return;
      }
      
      trackEvent.popcornTrackEvent[target](position);
    }

    function onMouseUp () {
      svg.removeEventListener( "mousemove", onMouseMove );
      document.removeEventListener( "mouseup", onMouseUp );
    }

    document.addEventListener( "mouseup", onMouseUp, false );
    svg.addEventListener( "mousemove", onMouseMove, false );
  }, false );


  if ( window.jQuery ) {
    EditorHelper.draggable( trackEvent, container, target );
    EditorHelper.resizable( trackEvent, container, target, {
      minWidth: 10,
      minHeight: 10,
      handlePositions: "e,s,se,n,w"
    });
  }

});
