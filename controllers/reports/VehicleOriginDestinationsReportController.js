const SERVER_ROOT = './../..';
var Q = require('q');
var LatLng = require(SERVER_ROOT + '/models/LatLng');

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');
var Route = mongoose.model('Route');
var VehicleOriginDestination = mongoose.model('VehicleOriginDestination');
var VehicleAreaStop = mongoose.model('VehicleAreaStop');

/**
 * 
 * Shows the query page for Vehicle Origin Destination Report.
 * 
 */

exports.show = function(req, res) {
	Area.find({}, null, {sort: {name: 1}}, function(err, areas) {
		res.render('reports/vehicleOriginDestinations/show', {
			areas: areas,
	 		routes: [],
	 		routeId: null,
	 		sampleNumber: null,
	 	});	
	});
};

/**
 * 
 * Handles the request for fetching the
 * queried report from the database.
 * 
 */

exports.fetch = function(req, res) {
	var routeId = req.query.routeId;
	routeId = routeId.trim();
	
	var hourId = parseInt(req.query.hourId);
	var sampleNumber = parseInt(req.query.sampleNumber);

	var argumentsPackage = {
		routeId: routeId,
		hourId: hourId,
		sampleNumber: sampleNumber
	}

	fetchRoute(argumentsPackage)
	.then(fetchReport)	
	.then(function(argumentsPackage) {
		res.json({
			report: argumentsPackage.boardingAlightingCountsByStop,
			mapCenter: argumentsPackage.mapCenter
		});
	});
};

/**
 * 
 * Fetches the Route data given the routeId.
 * 
 */

function fetchRoute(argumentsPackage) {
	var defer = Q.defer();

	var routeId = argumentsPackage.routeId;

	Route.findById(routeId)
	.populate('vehicleRouteStops', 'vehicleAreaStop')
	.lean()
	.exec(function(err, route) {
		argumentsPackage.route = route;

		var opts = {
	    path: 'vehicleAreaStop',
	  	select: 'name lat lng'  	
	  }

	  VehicleAreaStop.populate(route.vehicleRouteStops, opts, function(err, vehicleRouteStops) {
	  	argumentsPackage.mapCenter = {
				lat: route.mapCenter.lat,
				lng: route.mapCenter.lng
			};

			vehicleRouteStops.sort(function(a, b) {return Number(a.vehicleAreaStop.name) - Number(b.vehicleAreaStop.name)});

			argumentsPackage.vehicleRouteStops = vehicleRouteStops;

			defer.resolve(argumentsPackage);			

	  	defer.resolve(vehicleRouteStops);
	  });
	});

	return defer.promise;
}

/**
 * 
 * Fetches Vehicle Origin Destination data from datase and
 * counts OriginDestinations by Vehicle RouteStops.
 * 
 */

function fetchReport(argumentsPackage) {
	var defer = Q.defer();

	var routeId = argumentsPackage.routeId;
	var route = argumentsPackage.route;
	var hourId = argumentsPackage.hourId;
	var sampleNumber = argumentsPackage.sampleNumber;
	var vehicleRouteStops = argumentsPackage.vehicleRouteStops;

  var boardingAlightingCountsByStop = null;

  if (sampleNumber != 0) {
  	VehicleOriginDestination.find({route: route, hour: hourId, sampleNumber: sampleNumber}).lean().exec(function(err, vehicleOriginDestinations) {
			boardingAlightingCountsByStop = countBoardingAlightingsByStop(vehicleOriginDestinations, vehicleRouteStops);

			argumentsPackage.boardingAlightingCountsByStop = boardingAlightingCountsByStop;

			defer.resolve(argumentsPackage);
		});
  } else {
  	VehicleOriginDestination.find({route: route, hour: hourId}).lean().exec(function(err, vehicleOriginDestinations) {
			boardingAlightingCountsByStop = countBoardingAlightingsByStop(vehicleOriginDestinations, vehicleRouteStops);

			argumentsPackage.boardingAlightingCountsByStop = boardingAlightingCountsByStop;

			defer.resolve(argumentsPackage);
		});	
  }

	return defer.promise;
}

/**
 * 
 * Counts OriginDestinations by Vehicle RouteStops.
 * 
 */

function countBoardingAlightingsByStop(vehicleOriginDestinations, vehicleRouteStops) {
	var boardingAlightingCountsByStop = createBoardingAlightingCountsByStop(vehicleRouteStops);

	vehicleRouteStops.forEach(function(vrs) {
		var totalBoarding = 0;
		var totalAlighting = 0;

		vehicleOriginDestinations.forEach(function(vod) {
			if (vod.origin.id === vrs._id.id) {
				boardingAlightingCountsByStop[vrs._id.id].boarding++;
			}

			if (vod.destination.id === vrs._id.id) {
				boardingAlightingCountsByStop[vrs._id.id].alighting++;
			}			
		});
	});

	boardingAlightingCountsByStop = convertBoardingAlightingCountsByStopToArray(boardingAlightingCountsByStop, vehicleRouteStops);
	
	return boardingAlightingCountsByStop;
}

/**
 * 
 * Create the array to hold the BoardingAlighting counts by Vehicle RouteStop.
 * 
 */

function createBoardingAlightingCountsByStop(vehicleRouteStops) {
	var boardingAlightingCountsByStop = [];

	vehicleRouteStops.forEach(function(vrs) {
		boardingAlightingCountsByStop[vrs._id.id] = {
			boarding: 0,
			alighting: 0,
			name: vrs.vehicleAreaStop.name,
			lat: vrs.vehicleAreaStop.lat,
			lng: vrs.vehicleAreaStop.lng
		}
	});

	return boardingAlightingCountsByStop;
}

/**
 * 
 * Converts BoardingAlighting counts into a numbered index array
 * so that it can easily be consumed by Cube.
 * 
 */

function convertBoardingAlightingCountsByStopToArray(boardingAlightingCountsByStop, vehicleRouteStops) {
	var results = [];

	vehicleRouteStops.forEach(function(rs, index) {
		results[index] = boardingAlightingCountsByStop[rs._id.id];
	});

	return results;
}
