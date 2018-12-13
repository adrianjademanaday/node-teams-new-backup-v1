// IMPORTS

const SERVER_ROOT = './../../..'

var moment = require('moment');
var Q = require('q');
var mongoose = require('mongoose-q')();

var VehicleOriginDestination = mongoose.model('VehicleOriginDestination');
var VehicleAreaStop = mongoose.model('VehicleAreaStop');
var VehicleRouteStop = mongoose.model('VehicleRouteStop');
var tsd = require(SERVER_ROOT + '/models/TricycleSurveyData');
var Route = mongoose.model('Route');
var LatLng = require(SERVER_ROOT + '/models/LatLng');


// CONSTANTS

const MIN_VALID_OD_DURATION = 10;


// SERVICE FUNCTIONS

/**
 * 
 * Process SeatData into Vehicle OriginDestinations.
 * 
 */

module.exports.process = function(routeId, surveyData, sampleNumber) {
	var defer = Q.defer(); 
	
	var origin = null;

	Route.findById(routeId)
	.populate('vehicleRouteStops', 'vehicleAreaStop')
	.lean()
	.exec(function(err, route) {

		convertVehicleRouteStopsToPoints(route.vehicleRouteStops)
		.then(function(vehicleRouteStops) {
			
			var hasBeenMoving = false;

			var vehicleOriginDestinations = [];

			surveyData.forEach(function(sd, sdIndex) {

				if (!hasBeenMoving && sd.isMoving === tsd.IS_MOVING) {
					origin = new LatLng(sd.lat, sd.lng);
					origin.timeStamp = sd.timeStamp;
					origin.hour = moment(origin.timeStamp).hour();

					hasBeenMoving = true;
				} else if (hasBeenMoving && (sd.isMoving === tsd.IS_STOPPED || sd.isMoving === tsd.IS_TEMPORARILY_STOPPED)) {
					var destination = new LatLng(sd.lat, sd.lng);
					destination.timeStamp = sd.timeStamp;
					destination.hour = moment(destination.timeStamp).hour();

					var originVehicleRouteStop = origin.findNearestPoint(vehicleRouteStops);
					var destinationVehicleRouteStop = destination.findNearestPoint(vehicleRouteStops);

					var vehicleOriginDestination = new VehicleOriginDestination({
						route: route,

						origin: originVehicleRouteStop,

						originLatLng: {
							lat: originVehicleRouteStop.lat,
							lng: originVehicleRouteStop.lng
						},

						originTimeStamp: origin.timeStamp,
						originHour: origin.hour,

						destination: destinationVehicleRouteStop,

						destinationLatLng: {
							lat: destinationVehicleRouteStop.lat,
							lng: destinationVehicleRouteStop.lng
						},

						destinationTimeStamp: destination.timeStamp,
						destinationHour: destination.hour,

						isMoving: sd.isMoving,

						hour: origin.hour,
						sampleNumber: sampleNumber
					});

					vehicleOriginDestinations.push(vehicleOriginDestination);
					origin = null;
					
					hasBeenMoving = false;
				}

			});		

			vehicleOriginDestinations = filterShortTimeVehicleOriginDestinations(vehicleOriginDestinations);
	
			defer.resolve(vehicleOriginDestinations);
		});		
	});	

	return defer.promise;
}

/**
 * 
 * Group Vehicle OriginDestinations by hour.
 * 
 */

function groupVehicleOriginDestinationsByTheHour(vehicleOriginDestinations) {
	var vehicleOriginDestinationsByTheHour = createArrayByTheHour();

	for (var hour = 1; hour <= 24; hour++) {
		console.log('Hour: ' + hour);

		vehicleOriginDestinations.forEach(function (vod, index) {
			var momentTime = moment(vod.originTimeStamp);

			if (momentTime.hour() === hour) {
				vehicleOriginDestinationsByTheHour[hour].push(vod);
			}
		});
	}

	return vehicleOriginDestinationsByTheHour;
}

/**
 * 
 * Creates an empty array with hour as indeces.
 * 
 */

function createArrayByTheHour() {
	var arrayByTheHour = [];

	for (var i = 1; i <= 24; i++) {
		arrayByTheHour[i] = [];
	}	

	return arrayByTheHour;
}

/**
 * 
 * Converts Vehicle RouteStops into points.
 * 
 */

function convertVehicleRouteStopsToPoints(vehicleRouteStops) {
	var defer = Q.defer();

	var opts = {
    path: 'vehicleAreaStop',
  	select: 'lat lng name'  	
  }

  VehicleAreaStop.populate(vehicleRouteStops, opts, function(err, vehicleRouteStops) {
  	vehicleRouteStops.forEach(function(vrs) {
  		vrs.lat = vrs.vehicleAreaStop.lat,
  		vrs.lng = vrs.vehicleAreaStop.lng
  	});

  	defer.resolve(vehicleRouteStops);
  });

	return defer.promise;
}

/**
 * 
 * Filters out Vehicle OriginDestinations with a short duration to avoid miscounts.
 * 
 */

function filterShortTimeVehicleOriginDestinations(vehicleOriginDestinations) {
	var validVehicleOriginDestinations = [];

	vehicleOriginDestinations.forEach(function(vod) {
		var destinationMomentTime = moment(vod.destinationTimeStamp);
		var timeDifference = destinationMomentTime.diff(vod.originTimeStamp, 'seconds');

		if (timeDifference >= MIN_VALID_OD_DURATION) {
			validVehicleOriginDestinations.push(vod);
		}	
	});

	return validVehicleOriginDestinations;
}