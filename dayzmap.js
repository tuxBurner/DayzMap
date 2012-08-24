
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
  //validMarkers['vehicle'] = false;
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
     $.post('backend.php',{"langX" : langX, "langY" : langY, "name" : name, "description" : description, "typ" : typ}, function(data){
        displayMarkers(data);
     },"json");
  });


  $('#editMarkerBtn').click(function() {
     $('#editMarkerModal').modal('hide');

     var typ = $('#editMarkerTyp').val();
     var name = $('#editMarkerName').val();
     var description = $('#editMarkerDescription').val();
     var id = $('#editMarkerId').val();
     $.post('backend.php',{"id" : id, "name" : name, "description" : description, "typ" : typ}, function(data){
        displayMarkers(data);
     },"json");
  });

  $('#refreshMarkers').click(function() {
    getMarkersFromBackend();
  });

   $('#delMarkerBtn').click(function(){
    $('#delMarkerModal').modal('hide');
    var markerId = $('#delMarkerId').val();
    $.getJSON('backend.php',{'action' : 'delMarker', 'id' : markerId}, function(data) {
      displayMarkers(data);
    });
  });


  // pan the map to the position
  $('.markerLink').live('click',function(){
    var marker = map.getMarker($(this).data('markerid'));
    map.setZoom(8);
    map.setCenter(marker.getPosition());
    marker.setAnimation(google.maps.Animation.BOUNCE);
    window.setTimeout(function() {
      marker.setAnimation(null);
    }, 1500);

  }); 


  $('.delMarker').live('click',function(){
    var marker = map.getMarker($(this).data('markerid'));
    $('#delMarkerQuestion').html('Delete marker: '+marker.data.name+' ?');
    $('#delMarkerId').val(marker.data.id);
    $('#delMarkerModal').modal('show');
  });

  $('.editMarker').live('click',function(){
    var marker = map.getMarker($(this).data('markerid'));
    $('#editMarkerId').val(marker.data.id);
    $('#editMarkerName').val(marker.data.name);
    $('#editMarkerTyp').val(marker.data.typ);
    $('#editMarkerDescription').val(marker.data.description);

    $('#editMarkerModal').modal('show');
  });

  // when  the user moves the mouse it displays the coords on the left side
  google.maps.event.addListener(map, 'mousemove', function(overlay,point) {
    $('#coordsDisplay').html((Math.round(overlay.latLng.Ya * 1000) / 1000 )+" , "+(Math.round(overlay.latLng.Xa * 1000) / 1000 ));
  }); 

  // popups the add marker modal window
  google.maps.event.addListener(map, 'click', function(overlay,point) {
    $('#addMarkerX').val(overlay.latLng.Xa);
    $('#addMarkerY').val(overlay.latLng.Ya);
    $('#addMarkerName').val("");
    $('#addMarkerDescription').val("");
    $('#addMarkerModal').modal('show');
  });

  // create the markers toggle buttons
  var markerFilterHtml = "";
  for(marker in validMarkers) {
    var btnClass = (validMarkers[marker] == true) ? ' active' : '';
    markerFilterHtml+='<button type="button" data-toggle="button" data-type="'+marker+'" class="btn markerToggle'+btnClass+'" title="'+marker+'"><img src="markers/'+marker+'.png" /></button>';
  }
  $('#markerFilter').html(markerFilterHtml);
  $('button.markerToggle').live('click',function(){
    var state = $(this).hasClass('active');
    var type = $(this).data('type');

    map.toggleStaticMarker(type,state);
  });
  

  // add the static markers to the map
  $(overlayMarkers).each(function(i,markerInfo) {
      
       // vehicle == car
       if(markerInfo.t == 'vehicle') {
         markerInfo.t = 'car'; 
       }


       var marker = new google.maps.Marker({
          map:map,
          position: new google.maps.LatLng(markerInfo.lat,markerInfo.lng),
          title: markerInfo.n,
          icon: 'markers/'+markerInfo.t+'.png',
          data: markerInfo,
          visible: (validMarkers[markerInfo.t] == true),
          title: markerInfo.t
      });

       map.addStaticMarker(marker);
    
  });



});


google.maps.Map.prototype.markers = null;
google.maps.Map.prototype.staticmarkers = new Object();

google.maps.Map.prototype.addMarker = function(marker) {
  if(this.markers == null) {
    this.markers = new Object();
  }
    this.markers[marker.data.id] = marker;
};

google.maps.Map.prototype.getMarker = function(markerId) {
  return this.markers[markerId];
};


google.maps.Map.prototype.clearMarkers = function() {
    if(this.markers != null) {

      for (var member in this.markers) {
        this.markers[member].setMap(null);
      }
    }  
    
    this.markers = null;
};

google.maps.Map.prototype.addStaticMarker = function(marker) {
    if(this.staticmarkers[marker.data.t] == null) {
      this.staticmarkers[marker.data.t] = new Array();
    }

    this.staticmarkers[marker.data.t].push(marker);
}

/**
* toggles the markes from visible to hidden
*/
google.maps.Map.prototype.toggleStaticMarker = function(type,visible) {
  for(idx in this.staticmarkers[type]) {
    this.staticmarkers[type][idx].setVisible(visible); 
  }
}

/**
* Loads the markers from the backend and displays them
*/
function getMarkersFromBackend() {
  $.getJSON('backend.php',{'action' : 'getMarkers'},function(data) {
    displayMarkers(data);
  });
}

/**
* cleans all markers from the gui and from the map and adds the returned one 
*/
function displayMarkers(data) {

     $('li.markerLi').remove();      

     map.clearMarkers();      

     $(data.markers).each(function(i,obj) {

       var image = 'images/'+obj.typ+'.png';
      
       $('#markerHeaderLi').after('<li class="markerLi"><span><span><img src="'+image+'"/><a href="#" class="markerLink" data-markerid="'+obj.id+'">'+obj.name+' ('+(Math.round(obj.langY * 1000) / 1000)+', '+(Math.round(obj.langX* 1000) / 1000)+')</a></span><a href="#" class="editMarker" data-markerid="'+obj.id+'"><i class="icon-edit"></i></a> <a href="#" class="delMarker" data-markerid="'+obj.id+'"><i class="icon-trash"></i></a></span></li>');

       var marker = new google.maps.Marker({
          map:map,
          position: new google.maps.LatLng(obj.langX,obj.langY),
          title: obj.name,
          data: obj,
          icon: image,
          draggable:true
      });

      var infoContent =  '<div id="content">'+
            '<div id="siteNotice">'+
            '</div>'+
            '<h1 id="firstHeading" class="firstHeading">'+obj.name+'</h1>'+
            '<div id="bodyContent">'+
            obj.description+
            '</div>'+
            '</div>';
      var infowindow = new google.maps.InfoWindow({ content: infoContent});

      google.maps.event.addListener(marker,'dragend', function(){
        var pos = marker.getPosition();
        $.getJSON('backend.php',{'action' : 'reposMarker', 'id' : marker.data.id, 'langX' : pos.Xa, 'langY' : pos.Ya}, function(data) {
          displayMarkers(data);
        });
      }); 

      // clicking on the marker moves it
      google.maps.event.addListener(marker, 'click', function() {
         map.setZoom(8);
         map.setCenter(marker.getPosition());
         infowindow.open(map,marker);
      });

      map.addMarker(marker);
    });
}
