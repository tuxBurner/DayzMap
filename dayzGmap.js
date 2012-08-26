   function getWindowHeight() {
     if (window.self && self.innerHeight) {
       return self.innerHeight;
     }
     if (document.documentElement && document.documentElement.clientHeight) {
       return document.documentElement.clientHeight;
     }
     return 0;
   }

   function resizeMapDiv() {
     //Resize the height of the div containing the map.
     //Do not call any map methods here as the resize is called before the map is created.
     var d = document.getElementById("map");

     var offsetTop = 0;
     for (var elem = d; elem != null; elem = elem.offsetParent) {
       offsetTop += elem.offsetTop;

     }
     var height = getWindowHeight() - offsetTop - 16;

     if (height >= 0) {
       d.style.height = height + "px";
     }
   }

   /**
    * This projection cares that one square on the map is one point on the map
    */

   function DayzMapProjection() {
     // offset to adjust the map grid to the coords  
     this.origin = new google.maps.LatLng(-7.0648, 0.52);
     this.size = 20.807;
     this.unitsPerDegree = 256 / this.size
   }
   DayzMapProjection.prototype.fromLatLngToPoint = function(a) {
     var c = (a.lng() - this.origin.lng()) * this.unitsPerDegree,
       a = (a.lat() - this.origin.lat()) * this.unitsPerDegree;
     return new google.maps.Point(c, a)
   };
   DayzMapProjection.prototype.fromPointToLatLng = function(a, c) {
     var b = a.x,
       d = 0 > a.y ? 0 : a.y,
       d = (256 < d ? 256 : d) / this.unitsPerDegree + this.origin.lat(),
       b = b / this.unitsPerDegree + this.origin.lng();
     return new google.maps.LatLng(d, b, c)
   };
   var dayzProjection = new DayzMapProjection;

   var dayzImageMapOptions = {
     getTileUrl: function(coord, zoom) {
       return "map-tiles/" + zoom + "/" + coord.x + "/" + (Math.pow(2, zoom) - coord.y - 1) + ".png";
     },
     tileSize: new google.maps.Size(256, 256),
     minZoom: 2,
     maxZoom: 6,
     name: "DayzMap",
     isPng: true
   };

   var dayzImageMap = new google.maps.ImageMapType(dayzImageMapOptions);
   dayzImageMap.projection = dayzProjection;

   var map;
   $(function() {
     resizeMapDiv();
     var mapCenter = new google.maps.LatLng(7.5, 7);
     var myOptions = {
       zoom: 3,
       minZoom: 2,
       maxZoom: 6,
       center: mapCenter,
       panControl: true,
       zoomControl: true,
       mapTypeControl: true,
       scaleControl: false,
       streetViewControl: false,
       overviewMapControl: false,
       draggableCursor: "default",
       mapTypeControlOptions: {
         mapTypeIds: ["DayzMap"]
       },
       mapTypeId: "DayzMap",
       isPng: true
     }
     map = new google.maps.Map(document.getElementById("map"), myOptions);
     map.mapTypes.set("DayzMap", dayzImageMap);

   });

   google.maps.Map.prototype.markers = null;
   google.maps.Map.prototype.staticmarkers = new Object();

   google.maps.Map.prototype.addMarker = function(marker) {
     if (this.markers == null) {
       this.markers = new Object();
     }
     this.markers[marker.data.id] = marker;
   };

   google.maps.Map.prototype.getMarker = function(markerId) {
     return this.markers[markerId];
   };

   google.maps.Map.prototype.clearMarkers = function() {
     if (this.markers != null) {

       for (var member in this.markers) {
         this.markers[member].setMap(null);
       }
     }

     this.markers = null;
   };

   google.maps.Map.prototype.addStaticMarker = function(marker) {
     if (this.staticmarkers[marker.data.t] == null) {
       this.staticmarkers[marker.data.t] = new Array();
     }

     this.staticmarkers[marker.data.t].push(marker);
   }

   /**
    * toggles the markes from visible to hidden
    */
   google.maps.Map.prototype.toggleStaticMarker = function(type, visible) {
     for (idx in this.staticmarkers[type]) {
       this.staticmarkers[type][idx].setVisible(visible);
     }
   }