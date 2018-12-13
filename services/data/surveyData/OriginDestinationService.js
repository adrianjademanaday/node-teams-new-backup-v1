// IMPORTS

const SERVER_ROOT = './../../..'
var boardingAlightingPointsFromSurveyDataService = require(SERVER_ROOT + '/services/data/BoardingAlightingPointsFromSurveyDataService');

var moment = require('moment');
var Q = require('q');
var mongoose = require('mongoose-q')();

var OriginDestination = mongoose.model('OriginDestination');
var AreaStop = mongoose.model('AreaStop');
var RouteStop = mongoose.model('RouteStop');
var Route = mongoose.model('Route');
var LatLng = require(SERVER_ROOT + '/models/LatLng');


// CONSTANTS

const MIN_VALID_OD_DURATION = 10;


// SERVICE FUNCTIONS

/**
 * 
 * Process SeatData into Passenger OriginDestinations.
 * 
 */

module.exports.process = function(routeId, surveyData, speedProfile, sampleNumber) {
	var defer = Q.defer(); 
	var originDestinations = [];

	var origin = [null, null, null, null, null, null];
	
	var seat1Index = boardingAlightingPointsFromSurveyDataService.SEAT_1_INDEX;
	var numberOfSeats = boardingAlightingPointsFromSurveyDataService.NUMBER_OF_SEATS;

	Route.findById(routeId)
	.populate('routeStops', 'areaStop')
	.lean()
	.exec(function(err, route) {

		convertRouteStopsToPoints(route.routeStops)
		.then(function(routeStops) {
			var speedEntriesIncludedInOd = [];

			surveyData.forEach(function(sd, sdIndex) {

				for (seat = 0; seat < numberOfSeats; seat++) {

					var seatHasBeenOn = boardingAlightingPointsFromSurveyDataService.hasBeenOn(seat1Index + seat, surveyData, sdIndex);
					var seatHasBeenOff = boardingAlightingPointsFromSurveyDataService.hasBeenOff(seat1Index + seat, surveyData, sdIndex);

					if (seatHasBeenOn) {
						if (origin[seat] == null) {
							origin[seat] = new LatLng(sd.lat, sd.lng);
							origin[seat].timeStamp = sd.timeStamp;
							origin[seat].hour = moment(sd.timeStamp).hour();
						}

						speedEntriesIncludedInOd.push(speedProfile[sdIndex]); 

					} else if (seatHasBeenOff && origin[seat] != null) {
						speedEntriesIncludedInOd.push(speedProfile[sdIndex]); 

						var destination = new LatLng(sd.lat, sd.lng);
						destination.timeStamp = sd.timeStamp;
						
						var originRouteStop = origin[seat].findNearestPoint(routeStops);
						var destinationRouteStop = destination.findNearestPoint(routeStops);

						var originDestination = new OriginDestination({
							route: route,

							seatNumber: seat,

							origin: originRouteStop,

							originLatLng: {
								lat: originRouteStop.lat,
								lng: originRouteStop.lng
							},

							originTimeStamp: origin[seat].timeStamp,

							destination: destinationRouteStop,

							destinationLatLng: {
								lat: destinationRouteStop.lat,
								lng: destinationRouteStop.lng
							},

							destinationTimeStamp: destination.timeStamp,

							speedEntries: speedEntriesIncludedInOd,
							isMoving: sd.isMoving,

							hour: origin[seat].hour,
							sampleNumber: sampleNumber
						});

						originDestinations.push(originDestination);
						origin[seat] = null;
						speedEntriesIncludedInOd = [];
					}

				}
			});		

			originDestinations = filterShortTimeOriginDestinations(originDestinations);
	
			defer.resolve(originDestinations);
		});		
	});	

	return defer.promise;
}

/**
 * 
 * Converts Passenger RouteStops into points.
 * 
 */

function convertRouteStopsToPoints(routeStops) {
	var defer = Q.defer();

	var opts = {
    path: 'areaStop',
  	select: 'lat lng name'  	
  }

  AreaStop.populate(routeStops, opts, function(err, routeStops) {
  	routeStops.forEach(function(rs) {
  		rs.lat = rs.areaStop.lat,
  		rs.lng = rs.areaStop.lng
  	});

  	defer.resolve(routeStops);
  });

	return defer.promise;
}

/**
 * 
 * Filters out Passenger OriginDestinations with a short duration to avoid miscounts.
 * 
 */

function filterShortTimeOriginDestinations(originDestinations) {
	var validOriginDestinations = [];

	originDestinations.forEach(function(od) {
		var destinationMomentTime = moment(od.destinationTimeStamp);
		var timeDifference = destinationMomentTime.diff(od.originTimeStamp, 'seconds');

		if (od.origin != od.destination) {
			if (timeDifference >= MIN_VALID_OD_DURATION) {
				validOriginDestinations.push(od);
			}	
		}		
	});

	return validOriginDestinations;
}