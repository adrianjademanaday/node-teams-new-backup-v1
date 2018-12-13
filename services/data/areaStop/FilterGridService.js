// IMPORTS

const SERVER_ROOT = './../../..'
var Grid = require(SERVER_ROOT + '/models/Grid');
var LatLng = require(SERVER_ROOT + '/models/LatLng');


// SERVICE FUNCTIONS

/**
 * 
 * Cluster points into respective grids
 * and then filter out empty grids
 * 
 */

module.exports.process = function(grids, points) {

	grids.forEach(function(g) {
		points.forEach(function(point, index) {			
			if (g.encloses(point)) {
				g.addPoint(point);
			}			
		})
	});

	var filteredGrids = [];

	grids.forEach(function(g) {
		if (g.hasPoints()) {
			filteredGrids.push(g);
		}
	});	

	return filteredGrids;
}