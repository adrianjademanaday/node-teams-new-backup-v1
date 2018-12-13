// IMPORTS

var mongoose = require('mongoose-q')();
var OriginDestination = mongoose.model('OriginDestination');
var BoardingAlighting = mongoose.model('BoardingAlighting');

// SERVICE FUNCTIONS

/**
 * 
 * Create Passenger BoardingAlightings from Passenger OriginDestinations.
 * 
 */

function process(originDestinations) {
	var boardingAlightings = [] 

	originDestinations.forEach(function(od) {
		var boarding = new BoardingAlighting({
			direction: BoardingAlighting.BOARDING,
			routeStop: od.origin,
			timeStamp: od.originTimeStamp
		});

		var alighting = new BoardingAlighting({
			direction: BoardingAlighting.ALIGHTING,
			routeStop: od.destination,
			timeStamp: od.destinationTimeStamp
		});

		boardingAlightings.push(boarding);
		boardingAlightings.push(alighting);
	});

	return boardingAlightings;
}

module.exports.process = process;