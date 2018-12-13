// IMPORTS

const SERVER_ROOT = './../../..';
var LatLng = require(SERVER_ROOT + '/models/LatLng');
var generateGridService = require(SERVER_ROOT + '/services/data/areaStops/GenerateGridService');


// CONSTANTS

const NUMBER_OF_MAIN_POINTS = 10;
const MAX_NUMBER_OF_NEAR_POINTS = 20
const MAX_DISTANCE = 20; // meters


// SERVICE FUNCTIONS

module.exports.generate = function(grids) {
	var chosenGrids = chooseGrids(grids);
	var gridCenters = generateGridService.computeCenterOfGrids(chosenGrids);
	var points = generatePoints(gridCenters);

	return {
		grids: chosenGrids,
		points: points		
	};
}


// PRIVATE FUNCTIONS

function chooseGrids(grids) {
	var selected = [];
	
	var index = 0;

	for (var i = 0; i < NUMBER_OF_MAIN_POINTS; i++) {	
		do {			
			index = Math.floor((Math.random() * grids.length) + 1);
		} while(selected.indexOf(grids[index], selected) > -1);

		selected.push(grids[index]);
	}

	return selected;
}

function generatePoints(gridCenters) {
	var points = [];

	gridCenters.forEach(function(gc) {
		var numberOfPoints = Math.floor((Math.random() * MAX_NUMBER_OF_NEAR_POINTS) + 1);
		console.log(numberOfPoints);

		for (var i = 0; i < numberOfPoints; i++) {
			var top = Math.floor((Math.random() * MAX_DISTANCE) + 1);
			var bottom = Math.floor((Math.random() * MAX_DISTANCE) + 1);

			var topToAdd = bottom - top;

			var left = Math.floor((Math.random() * MAX_DISTANCE) + 1);	
			var right = Math.floor((Math.random() * MAX_DISTANCE) + 1);

			var leftToAdd = right - left;

			var point = new LatLng(gc.lat, gc.lng);
			point = point
								.addTop(topToAdd)
								.addLeft(leftToAdd);

			points.push(point);
		}
	});

	return points;
}