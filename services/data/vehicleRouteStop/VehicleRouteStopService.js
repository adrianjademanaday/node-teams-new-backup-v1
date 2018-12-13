// IMPORTS

const SERVER_ROOT = './../../..';
var sensorToSeatParserService = require(SERVER_ROOT + '/services/data/SensorToSeatParserService');
var vehicleMapPointToRouteStopService = require(SERVER_ROOT + '/services/data/vehicleRouteStop/VehicleMapPointToRouteStopService');
var vehicleStopPointsFromSurveyDataService = require(SERVER_ROOT + '/services/data/VehicleStopPointsFromSurveyDataService');
var zipService = require(SERVER_ROOT + '/services/ZipService');
var csvService = require(SERVER_ROOT + '/services/CsvService');

var Q = require('q');
var mongoose = require('mongoose-q')();

var Route = mongoose.model('Route');
var VehicleRouteStop = mongoose.model('VehicleRouteStop');
var VehicleAreaStop = mongoose.model('VehicleAreaStop');

// SERVICE FUNCTIONS

/**
 * 
 * Converts SurveyData into SeatData.
 * Maps each SeatData into their corresponding AreaStop
 * to create candidate RouteStops.
 * Saves candidate Vehicle RouteStops with no duplicate Vehicle RouteStop
 * with the same coordinates. 
 * 
 */

module.exports.processUpload = function(argumentsPackage) {
	var defer = Q.defer();

	var allSurveyDataPoints = argumentsPackage.allSurveyDataPoints;
	argumentsPackage.allSurveyDataPoints = allSurveyDataPoints;

	vehicleMapPointToRouteStopService.process(argumentsPackage)
	.then(saveVehicleRouteStops)
	.then(transformVehicleRouteStopsToPoints)
	.then(function(argumentsPackage) {
		defer.resolve(argumentsPackage)
	});

	return defer.promise;
}

/**
 * 
 * Extracts points from SurveyData inside zip files.
 * 
 */

module.exports.extractPointsFromZipFiles = function(zipPath) {
	var allSurveyDataPoints = [];
	var fileDetails = zipService.zipToString(zipPath);			
	
	fileDetails.forEach(function(fd) {
		var surveyDataCsv = csvService.stringToArray(fd.fileContent);
		var surveyData = sensorToSeatParserService.process(surveyDataCsv);
		var points = vehicleStopPointsFromSurveyDataService.process(surveyData);

		allSurveyDataPoints = allSurveyDataPoints.concat(points);
	});

	return allSurveyDataPoints;
}


// PRIVATE FUNCTIONS

/**
 * 
 * Saves the candidate Vehicle RouteStop that have no duplicate
 * Vehicle RouteStop with the same coordinates.
 * 
 */

function saveVehicleRouteStops(argumentsPackage) {
	var defer = Q.defer();
	
	var routeId = argumentsPackage.routeId;
	var newVehicleRouteStops = argumentsPackage.vehicleRouteStops;

	Route.findByIdQ(routeId)
	.then(populateVehicleAreaStopsOfRoute)
	.then(function(route) {
		newVehicleRouteStops.forEach(function(nrs) {
			nrs.route = route;
		});

		route.vehicleRouteStops.forEach(function(rs) {
  		newVehicleRouteStops.forEach(function(nrs, index) {
  			if (nrs.vehicleAreaStop.id === rs.vehicleAreaStop.id) {
  				newVehicleRouteStops.splice(index, 1);
  			} 
  		});
  	});

  	VehicleRouteStop.create(newVehicleRouteStops)
		.then(function(results) {
			newVehicleRouteStops = Array.prototype.slice.call(arguments);
			
			route.vehicleRouteStops = route.vehicleRouteStops.concat(newVehicleRouteStops);	
			route.save(function(err) {
				argumentsPackage.vehicleRouteStops = newVehicleRouteStops;
				argumentsPackage.mapCenter = route.mapCenter.toObject();

				defer.resolve(argumentsPackage);
			});
		});
	});

	return defer.promise;
}

/**
 * 
 * Converts Vehicle RouteStops into points.
 * 
 */

function transformVehicleRouteStopsToPoints(argumentsPackage) {
	var defer = Q.defer();

	var vehicleRouteStops = argumentsPackage.vehicleRouteStops;

	VehicleAreaStop.populate(vehicleRouteStops, 'vehicleAreaStop', function(err, vehicleRouteStops) {
		var vehicleRouteStopPoints = [];

		vehicleRouteStops.forEach(function(rs) {
			var point = {
				lat: rs.vehicleAreaStop.lat,
				lng: rs.vehicleAreaStop.lng
			};
			
			vehicleRouteStopPoints.push(point);
		});

		argumentsPackage.vehicleRouteStopPoints = vehicleRouteStopPoints;

		defer.resolve(argumentsPackage);
	});

	return defer.promise;
}

/**
 * 
 * Fetches the Vehicle AreaStops referenced by the RouteStops of the Route.
 * 
 */

function populateVehicleAreaStopsOfRoute(route) {
	var defer = Q.defer();

	var opts = {
    path: 'vehicleRouteStop',
  	select: 'vehicleAreaStop'  	
  }

  VehicleRouteStop.populate(route, opts, function(err, route) {
  	opts = {
	    path: 'vehicleAreaStop',
	  	select: 'lat lng'  	
	  }	  	

		VehicleAreaStop.populate(route, opts, function(err, route) {
	  	defer.resolve(route);
	  });	
  });

	return defer.promise;
}