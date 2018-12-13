// IMPORTS

const SERVER_ROOT = './..'
var LatLng = require(SERVER_ROOT + '/models/LatLng');

var geolib = require('geolib');
var Base = require('basejs');
var _ = require('underscore');

var LatLng = require(SERVER_ROOT + '/models/LatLng');
var AreaStopCentroid = require(SERVER_ROOT + '/models/AreaStopCentroid');

// CLASS DEF

var Grid = Base.extend({
  constructor: function(number, topLeft, topRight, bottomLeft, bottomRight) {
    this.number = number;
    this.topLeft = topLeft;
    this.topRight = topRight;
    this.bottomLeft = bottomLeft;
    this.bottomRight = bottomRight;
    this.points = [];
    this.center = null;
  },

  number: undefined,
  topLeft: undefined,
  topRight: undefined,
  topLeft: undefined,
  topRight: undefined,
  points: [],
    
  encloses: function(point) {
    var point = this.convertPoint(point);

    var coordinates = [
      this.convertPoint(this.topLeft),
      this.convertPoint(this.topRight),      
      this.convertPoint(this.bottomRight),
      this.convertPoint(this.bottomLeft)
    ];

    return geolib.isPointInside(point, coordinates);
  },

  convertPoint: function(point) {
    return {
      latitude: point.lat,
      longitude: point.lng
    };
  },

  addPoint: function(point) {
    this.points.push(point);
  },

  hasPoints: function() {
    return this.points.length > 0;
  },

  getCentroid: function() {
    var totalLat = _.reduce(this.points, function(memo, p) { 
      return memo + p.lat; 
    }, 0);

    var totalLng = _.reduce(this.points, function(memo, p) { 
      return memo + p.lng; 
    }, 0);

    var averageLat = totalLat / this.points.length;
    var averageLng = totalLng / this.points.length;

    return new AreaStopCentroid(averageLat, averageLng, this.number, this.points.length);    
  }
}, {
  computeCenter: function(topLeftBounds, bottomRightBounds) {
    var width = Math.abs(bottomRightBounds.lng - topLeftBounds.lng);
    var height = Math.abs(topLeftBounds.lat - bottomRightBounds.lat);

    var lat = bottomRightBounds.lat + (height / 2.0);
    var lng = topLeftBounds.lng + (width / 2.0);

    return new LatLng(lat, lng);
  }
});

module.exports = Grid; 