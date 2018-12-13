var geolib = require('geolib');
var Base = require('basejs');

var LatLng = Base.extend({
  constructor: function(lat, lng) {
    this.lat = lat;
    this.lng = lng;
  },

  lat: String,
  lng: Number,

  getDistanceFrom: function(other) {
    var start = {latitude: this.lat, longitude: this.lng};  
    var end = {latitude: other.lat, longitude: other.lng};  

    return geolib.getDistance(start, end);
  },

  addRight: function(distance) {  
    var lat = this.lat;
    var lng = this.lng + ((180 / Math.PI) * (distance / 6378137));
    
    return new LatLng(lat, lng);;
  },

  addLeft: function(distance) {  
    return this.addRight(-1 * distance);
  },

  addTop: function(distance) {  
    var lat = this.lat + ((180 / Math.PI) * (distance / 6378137));
    var lng = this.lng;

    return new LatLng(lat, lng);;
  },

  addBottom: function(distance) {  
    return this.addTop(-1 * distance);
  },  

  isInside: function(polygonCoordinates) {
    return new Error('not implemented');
  }, 

  findNearestPoint: function(points) {
    var nearestDistance = Number.MAX_VALUE;
    var nearestPoint = null;
    var that = this;

    points.forEach(function(p) {
      var distance = that.getDistanceFrom(p);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPoint = p;
      }
    }); 

    return nearestPoint;
  },

  getFormattedLat: function(decimalPlaces) {
    decimalPlaces = decimalPlaces || 6;
    var factor = 1;

    for (i = 1; i <= decimalPlaces; i++) {
      factor = factor * 10;
    }

    return Math.round(this.lat * factor) / factor;
  }, 

  getFormattedLng: function(decimalPlaces) {
    decimalPlaces = decimalPlaces || 6;
    var factor = 1;

    for (i = 1; i <= decimalPlaces; i++) {
      factor = factor * 10;
    }

    return Math.round(this.lng * factor) / factor;
  }

});

module.exports = LatLng; 