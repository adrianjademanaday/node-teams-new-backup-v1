// IMPORTS

const SERVER_ROOT = './../../..';
var LatLng = require(SERVER_ROOT + '/models/LatLng');
var Grid = require(SERVER_ROOT + '/models/Grid');


// CONSTANTS

const GRID_SIZE = 100; // the length of one side of the grid in meters


// SERVICE FUNCTIONS

/**
 * 
 * Computes the center given top left bounds and
 * bottom right bounds of an Area
 * 
 */

module.exports.computeCenter = function(topLeftBounds, bottomRightBounds) {
	var width = Math.abs(bottomRightBounds.lng - topLeftBounds.lng);
	var height = Math.abs(topLeftBounds.lat - bottomRightBounds.lat);

	var lat = bottomRightBounds.lat + (height / 2.0);
	var lng = topLeftBounds.lng + (width / 2.0);

	return new LatLng(lat, lng);
};

/**
 * 
 * Generates grids given a top left
 * and bottom right bounds of an Area
 * 
 */

module.exports.generateGrids = function(topLeftBounds, bottomRightBounds) {
	var numberOfHorizontalGrids = computeNumberOfHorizontalGrids(topLeftBounds, bottomRightBounds);
 	var numberOfVerticalGrids = computeNumberOfVerticalGrids(topLeftBounds, bottomRightBounds);

 	var grids = [];
 	var referencePoint = topLeftBounds;
 	var currentPoint = null;
 	var gridCount = 0;

 	for (i = 0; i < numberOfVerticalGrids; i++) {
 		for (j = 0; j < numberOfHorizontalGrids; j++) {
 			currentPoint = referencePoint
 											.addBottom(i * GRID_SIZE)
 											.addRight(j * GRID_SIZE); // move the current point from left to right and top to bottom to generate the grids


 			var topLeft = currentPoint;
			var topRight = currentPoint.addRight(GRID_SIZE);
			var bottomLeft = currentPoint.addBottom(GRID_SIZE);
			var bottomRight = currentPoint.addBottom(GRID_SIZE).addRight(GRID_SIZE);

 			var grid = new Grid(gridCount, topLeft, topRight, bottomLeft, bottomRight);
 			gridCount++;

 			grids.push(grid);
 		}
 	}

 	return grids;
};

/**
 * 
 * Computes the centers of each grid
 * 
 */

module.exports.computeCenterOfGrids = function(grids) {
	var centerPoints = [];

	grids.forEach(function(grid) {

		var lat = grid.bottomLeft.lat + ((grid.topLeft.lat - grid.bottomLeft.lat) / 2);
		var lng = grid.topLeft.lng + ((grid.topRight.lng - grid.topLeft.lng) / 2); 

		centerPoints.push(new LatLng(lat, lng));
	});

	return centerPoints;
};


// PRIVATE FUNCTIONS

/**
 * 
 * Computes the number of horizontal grids generating array of grids 
 * 
 */

function computeNumberOfHorizontalGrids(topLeftBounds, bottomRightBounds) {

	var start = new LatLng(topLeftBounds.lat, topLeftBounds.lng);
	var end = new LatLng(topLeftBounds.lat, bottomRightBounds.lng);

	var distance = start.getDistanceFrom(end);

  return Math.ceil(distance / GRID_SIZE); 
}

/**
 * 
 * Computes the number of vertical grids generating array of grids 
 * 
 */

function computeNumberOfVerticalGrids(topLeftBounds, bottomRightBounds) {
	var start = new LatLng(topLeftBounds.lat, topLeftBounds.lng);
	var end = new LatLng(bottomRightBounds.lat, topLeftBounds.lng);

	var distance = start.getDistanceFrom(end);

 	return Math.ceil(distance / GRID_SIZE);
}

