// IMPORTS

const SERVER_ROOT = './../../..';
var sensorToSeatParserService = require(SERVER_ROOT + '/services/data/SensorToSeatParserService');
var boardingAlightingPointsFromSurveyDataService = require(SERVER_ROOT + '/services/data/BoardingAlightingPointsFromSurveyDataService');
var mapPointToRouteStopService = require(SERVER_ROOT + '/services/data/routeStop/MapPointToRouteStopService');
var zipService = require(SERVER_ROOT + '/services/ZipService');
var csvService = require(SERVER_ROOT + '/services/CsvService');

var Q = require('q');
var mongoose = require('mongoose-q')();

var Route = mongoose.model('Route');
var RouteStop = mongoose.model('RouteStop');
var AreaStop = mongoose.model('AreaStop');

// SERVICE FUNCTIONS

/**
 * 
 * Converts SurveyData into SeatData.
 * Maps each SeatData into their corresponding AreaStop
 * to create candidate RouteStops.
 * Saves candidate Passenger RouteStops with no duplicate Passenger RouteStop
 * with the same coordinates. 
 * 
 */

module.exports.processUpload = function(argumentsPackage) {
	var defer = Q.defer();

	var allSurveyDataPoints = argumentsPackage.allSurveyDataPoints;
	argumentsPackage.allSurveyDataPoints = allSurveyDataPoints;

	mapPointToRouteStopService.process(argumentsPackage)
	.then(saveRouteStops)
	.then(transformRouteStopsToPoints)
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
		var points = boardingAlightingPointsFromSurveyDataService.process(surveyData);

		allSurveyDataPoints = allSurveyDataPoints.concat(points);
	});

	return allSurveyDataPoints;
}


// PRIVATE FUNCTIONS

/**
 * 
 * Saves the candidate Passenger RouteStop that have no duplicate
 * Passenger RouteStop with the same coordinates.
 * 
 */

function saveRouteStops(argumentsPackage) {
	var defer = Q.defer();
	
	var routeId = argumentsPackage.routeId;
	var newRouteStops = argumentsPackage.routeStops;

	Route.findByIdQ(routeId)
	.then(populateAreaStopsOfRoute)
	.then(function(route) {
		newRouteStops.forEach(function(nrs) {
			nrs.route = route;
		});

		route.routeStops.forEach(function(rs) {
  		newRouteStops.forEach(function(nrs, index) {
  			if (nrs.areaStop.id === rs.areaStop.id) {
  				newRouteStops.splice(index, 1);
  			} 
  		});
  	});

  	RouteStop.create(newRouteStops)
		.then(function(results) {
			newRouteStops = Array.prototype.slice.call(arguments);
			
			route.routeStops = route.routeStops.concat(newRouteStops);	
			route.save(function(err) {
				argumentsPackage.routeStops = newRouteStops;
				argumentsPackage.mapCenter = route.mapCenter.toObject();

				defer.resolve(argumentsPackage);
			});
		});
	});

	return defer.promise;
}

/**
 * 
 * Converts Passenger RouteStops into points.
 * 
 */

function transformRouteStopsToPoints(argumentsPackage) {
	var defer = Q.defer();

	var routeStops = argumentsPackage.routeStops;

	AreaStop.populate(routeStops, 'areaStop', function(err, routeStops) {
		var routeStopPoints = [];

		routeStops.forEach(function(rs) {
			var point = {
				lat: rs.areaStop.lat,
				lng: rs.areaStop.lng
			};
			
			routeStopPoints.push(point);
		});

		argumentsPackage.routeStopPoints = routeStopPoints;

		defer.resolve(argumentsPackage);
	});

	return defer.promise;
}

/**
 * 
 * Fetches the Passenger AreaStops referenced by the RouteStops of the Route.
 * 
 */

function populateAreaStopsOfRoute(route) {
	var defer = Q.defer();

	var opts = {
    path: 'routeStop',
  	select: 'areaStop'  	
  }

  RouteStop.populate(route, opts, function(err, route) {
  	opts = {
	    path: 'areaStop',
	  	select: 'lat lng'  	
	  }	  	

		AreaStop.populate(route, opts, function(err, route) {
	  	defer.resolve(route);
	  });	
  });

	return defer.promise;
}