var geolib = require('geolib');
var Base = require('basejs');

var AreaStopCentroid = Base.extend({
  constructor: function(lat, lng, gridNumber, pointCount) {
    this.lat = lat;
    this.lng = lng;
    this.gridNumber = gridNumber;
    this.pointCount = pointCount;
  },

  lat: Number,
  lng: Number,
  gridNumber: Number,
  pointCount: Number
});

module.exports = AreaStopCentroid; 