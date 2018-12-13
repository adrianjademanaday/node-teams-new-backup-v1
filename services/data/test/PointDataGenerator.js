// IMPORTS

var casual = require('casual');

const SERVER_ROOT = './../../..'

var LatLng = require(SERVER_ROOT + '/models/LatLng');


// GENERATE FUNCTIONS

module.exports.generatePoint = function(referencePoint, maxHorizontalDistance, maxVerticalDistance) {
	var point = new LatLng(referencePoint.lat, referencePoint.lng);

	var horizontalDistance = casual.double(0.0, maxHorizontalDistance);
	var verticalDistance = casual.double(0.0, maxVerticalDistance);

	var newPoint = point.addRight(horizontalDistance).addBottom(verticalDistance);
	
	return newPoint;
}

module.exports.generatePoints = function(topLeftBounds, bottomRightBounds, count) {
	var points = [];

	var topRightBounds = new LatLng(topLeftBounds.lat, bottomRightBounds.lng);
	var bottomLeftBounds = new LatLng(bottomRightBounds.lat, topLeftBounds.lng);
	var maxHorizontalDistance = topRightBounds.getDistanceFrom(topLeftBounds);
	var maxVerticalDistance = topLeftBounds.getDistanceFrom(bottomLeftBounds);

	for (var i = 0; i < count; i++) {
		var point = casual.point(topLeftBounds, maxHorizontalDistance, maxVerticalDistance);

		points.push(point);
	}

	return points;	    
}