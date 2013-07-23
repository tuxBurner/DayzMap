/**
 * which markers from the markers.js to display
 */
var validMarkers = new Object();
validMarkers['deerstand'] = true;
validMarkers['supermarket'] = true;
validMarkers['hospital'] = true;
validMarkers['pump'] = true;
validMarkers['fuel'] = false;
validMarkers['bicycle'] = false;
validMarkers['atv'] = false;
validMarkers['car'] = false;
validMarkers['uaz'] = false;
validMarkers['motorcycle'] = false;
validMarkers['bigtruck'] = false;
validMarkers['bus'] = false;
validMarkers['tractor'] = false;
validMarkers['truck'] = false;
validMarkers['boat'] = false;
validMarkers['helicopter'] = false;

// here are the functions added for talking to the backend      
$(function() {

  getMarkersFromBackend();

  $('#addMarkerBtn').click(function() {
    $('#addMarkerModal').modal('hide');

    var langX = $('#addMarkerX').val();
    var langY = $('#addMarkerY').val();
    var typ = $('#addMarkerTyp').val();
    var name = $('#addMarkerName').val();
    var description = $('#addMarkerDescription').val();
    var typ = $('#addMarkerTyp').val();
    $.post('backend.php', {
      "langX": langX,
      "langY": langY,
      "name": name,
      "description": description,
      "typ": typ
    }, function(data) {
      displayMarkers(data);
    }, "json");
  });

  $('#editMarkerBtn').click(function() {
    $('#editMarkerModal').modal('hide');

    var typ = $('#editMarkerTyp').val();
    var name = $('#editMarkerName').val();
    var description = $('#editMarkerDescription').val();
    var id = $('#editMarkerId').val();
    $.post('backend.php', {
      "id": id,
      "name": name,
      "description": description,
      "typ": typ
    }, function(data) {
      displayMarkers(data);
    }, "json");
  });

  $('#refreshMarkers').click(function() {
    getMarkersFromBackend();
  });

  $('#delMarkerBtn').click(function() {
    $('#delMarkerModal').modal('hide');
    var markerId = $('#delMarkerId').val();
    $.getJSON('backend.php', {
      'action': 'delMarker',
      'id': markerId
    }, function(data) {
      displayMarkers(data);
    });
  });

  // pan the map to the position
  $('.markerLink').live('click', function() {
    var marker = map.getMarker($(this).data('markerid'));
    map.setZoom(8);
    map.setCenter(marker.getPosition());
    marker.setAnimation(google.maps.Animation.BOUNCE);
    window.setTimeout(function() {
      marker.setAnimation(null);
    }, 1500);

  });

  $('.delMarker').live('click', function() {
    var marker = map.getMarker($(this).data('markerid'));
    $('#delMarkerQuestion').html('Delete marker: ' + marker.data.name + ' ?');
    $('#delMarkerId').val(marker.data.id);
    $('#delMarkerModal').modal('show');
  });

  $('.editMarker').live('click', function() {
    var marker = map.getMarker($(this).data('markerid'));
    $('#editMarkerId').val(marker.data.id);
    $('#editMarkerName').val(marker.data.name);
    $('#editMarkerTyp').val(marker.data.typ);
    $('#editMarkerDescription').val(marker.data.description);

    $('#editMarkerModal').modal('show');
  });

  // when  the user moves the mouse it displays the coords on the left side
  google.maps.event.addListener(map, 'mousemove', function(overlay, point) {
    $('#coordsDisplay').html(formatPoint(overlay.latLng.jb) + " " + formatPoint(overlay.latLng.kb) + "<br /> gps:" + fromLatLngToGps(overlay));
  });

  // popups the add marker modal window
  google.maps.event.addListener(map, 'dblclick', function(overlay, point) {
    $('#addMarkerX').val(overlay.latLng.jb);
    $('#addMarkerY').val(overlay.latLng.kb);
    $('#addMarkerName').val("");
    $('#addMarkerDescription').val("");
    $('#directlink').val(location.origin+location.pathname+"?"+map.getZoom()+","+overlay.latLng.jb+","+overlay.latLng.kb);
    $('#addMarkerModal').modal('show');
     //e.Handled = true;
  });

  // create the markers toggle buttons
  var markerFilterHtml = "";
  for (marker in validMarkers) {
    var btnClass = (validMarkers[marker] == true) ? ' active' : '';
    markerFilterHtml += '<button type="button" data-toggle="button" data-type="' + marker + '" class="btn markerToggle' + btnClass + '" title="' + marker + '"><img src="markers/' + marker + '.png" /></button>';
  }
  $('#markerFilter').html(markerFilterHtml);
  $('button.markerToggle').live('click', function() {
    var state = $(this).hasClass('active');
    var type = $(this).data('type');

    map.toggleStaticMarker(type, state);
  });

  // add the static markers to the map
  $(overlayMarkers).each(function(i, markerInfo) {
    // vehicle == car
    if (markerInfo.t == 'vehicle') {
      markerInfo.t = 'car';
    }

    var marker = new google.maps.Marker({
      map: map,
      position: new google.maps.LatLng(markerInfo.lat, markerInfo.lng),
      title: markerInfo.n,
      icon: 'markers/' + markerInfo.t + '.png',
      data: markerInfo,
      visible: (validMarkers[markerInfo.t] == true),
      title: markerInfo.t
    });

    map.addStaticMarker(marker);

  });

  checkLocationForDirectLink();

});

/**
 * Transfrorms a point from the map to the internal gps coord
 */

function fromMapProjToGps(point) {
  var c = (1E3 * point).toString();
  return c = 0 > point ? "000" : 1 > point ? "00" + c.substr(0, 1) : 10 > point ? "0" + c.substr(0, 2) : c.substr(0, 3)
}

/**
 * This creates the string to display in the info field for gps coords
 */

function fromLatLngToGps(coords) {
  return fromMapProjToGps(coords.latLng.jb) + " " + fromMapProjToGps(coords.latLng.kb);
}

/**
 * Formats a point for displaying it in the frontend
 */

function formatPoint(point) {
  var val = Math.round(point * 1000) / 1000;
  return (val < 10) ? "0" + val : val;
}

/**
 * Loads the markers from the backend and displays them
 */

function getMarkersFromBackend() {
  $.getJSON('backend.php', {
    'action': 'getMarkers'
  }, function(data) {
    displayMarkers(data);
  });
}

/**
 * cleans all markers from the gui and from the map and adds the returned one
 */

function displayMarkers(data) {

  $('li.markerLi').remove();

  map.clearMarkers();

  $(data.markers).each(function(i, obj) {

    var image = 'images/' + obj.typ + '.png';

    $('#markerHeaderLi').after('<li class="markerLi"><span><span><img src="' + image + '"/><a href="#" class="markerLink" data-markerid="' + obj.id + '">' + obj.name + ' (' + formatPoint(obj.langY) + ', ' + formatPoint(obj.langX) + ')</a></span><a href="#" class="editMarker" data-markerid="' + obj.id + '"><i class="icon-edit"></i></a> <a href="#" class="delMarker" data-markerid="' + obj.id + '"><i class="icon-trash"></i></a></span></li>');

    var marker = new google.maps.Marker({
      map: map,
      position: new google.maps.LatLng(obj.langX, obj.langY),
      title: obj.name,
      data: obj,
      icon: image,
      draggable: true
    });

    var infoContent = '<div id="content">' + '<div id="siteNotice">' + '</div>' + '<h1 id="firstHeading" class="firstHeading">' + obj.name + '</h1>' + '<div id="bodyContent">' + obj.description + '</div>' + '</div>';
    var infowindow = new google.maps.InfoWindow({
      content: infoContent
    });

    google.maps.event.addListener(marker, 'dragend', function() {
      var pos = marker.getPosition();
      $.getJSON('backend.php', {
        'action': 'reposMarker',
        'id': marker.data.id,
        'langX': pos.jb,
        'langY': pos.kb
      }, function(data) {
        displayMarkers(data);
      });
    });

    // clicking on the marker moves it
    google.maps.event.addListener(marker, 'click', function() {
      map.setZoom(8);
      map.setCenter(marker.getPosition());
      infowindow.open(map, marker);
    });

    map.addMarker(marker);
  });
}

/**
 * check if the user wants to display a direct link marker
 */

function checkLocationForDirectLink() {
  var hash = location.search;
  if (hash == "") {
    return;
  }
  var infos = hash.substr(1).split(',');
  if (infos.length == 3) {
    map.setZoom(parseInt(infos[0]));
    var pos = new google.maps.LatLng(infos[1], infos[2]);
    map.setCenter(pos);
    var marker = new google.maps.Marker({
      map: map,
      position: pos
    });
    marker.setAnimation(google.maps.Animation.BOUNCE);
    window.setTimeout(function() {
      marker.setAnimation(null);
    }, 1500);
  }
}