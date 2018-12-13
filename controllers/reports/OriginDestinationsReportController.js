const SERVER_ROOT = './../..';
var Q = require('q');
var LatLng = require(SERVER_ROOT + '/models/LatLng');

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');
var Route = mongoose.model('Route');
var OriginDestination = mongoose.model('OriginDestination');
var AreaStop = mongoose.model('AreaStop');

/**
 * 
 * Shows the query page for Passenger Origin Destination Report.
 * 
 */

exports.show = function(req, res) {
	Area.find({}, null, {sort: {name: 1}}, function(err, areas) {
		res.render('reports/originDestinations/show', {
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
	.populate('routeStops', 'areaStop')
	.lean()
	.exec(function(err, route) {
		argumentsPackage.route = route;

		var opts = {
	    path: 'areaStop',
	  	select: 'name lat lng'  	
	  }

	  AreaStop.populate(route.routeStops, opts, function(err, routeStops) {
	  	argumentsPackage.mapCenter = {
				lat: route.mapCenter.lat,
				lng: route.mapCenter.lng
			};

			routeStops.sort(function(a, b) {return Number(a.areaStop.name) - Number(b.areaStop.name)});

			argumentsPackage.routeStops = routeStops;

			defer.resolve(argumentsPackage);			

	  	defer.resolve(routeStops);
	  });
	});

	return defer.promise;
}

/**
 * 
 * Fetches Passenger Origin Destination data from datase and
 * counts OriginDestinations by Passenger RouteStops.
 * 
 */

function fetchReport(argumentsPackage) {
	var defer = Q.defer();

	var routeId = argumentsPackage.routeId;
	var route = argumentsPackage.route;
	var hourId = argumentsPackage.hourId;
	var sampleNumber = argumentsPackage.sampleNumber;
	var routeStops = argumentsPackage.routeStops;

  var boardingAlightingCountsByStop = null;

  if (sampleNumber != 0) {
  	OriginDestination.find({route: route, hour: hourId, sampleNumber: sampleNumber}).lean().exec(function(err, originDestinations) {
			boardingAlightingCountsByStop = countBoardingAlightingsByStop(originDestinations, routeStops);

			argumentsPackage.boardingAlightingCountsByStop = boardingAlightingCountsByStop;

			defer.resolve(argumentsPackage);
		});
  } else {
  	OriginDestination.find({route: route, hour: hourId}).lean().exec(function(err, originDestinations) {
			boardingAlightingCountsByStop = countBoardingAlightingsByStop(originDestinations, routeStops);

			argumentsPackage.boardingAlightingCountsByStop = boardingAlightingCountsByStop;

			defer.resolve(argumentsPackage);
		});	
  }

	return defer.promise;
}

/**
 * 
 * Counts OriginDestinations by Passenger RouteStops.
 * 
 */

function countBoardingAlightingsByStop(originDestinations, routeStops) {
	var boardingAlightingCountsByStop = createBoardingAlightingCountsByStop(routeStops);

	routeStops.forEach(function(rs) {
		var totalBoarding = 0;
		var totalAlighting = 0;

		originDestinations.forEach(function(od) {
			if (od.origin.id === rs._id.id) {
				boardingAlightingCountsByStop[rs._id.id].boarding++;
			}

			if (od.destination.id === rs._id.id) {
				boardingAlightingCountsByStop[rs._id.id].alighting++;
			}			
		});
	});

	boardingAlightingCountsByStop = convertBoardingAlightingCountsByStopToArray(boardingAlightingCountsByStop, routeStops);

	return boardingAlightingCountsByStop;
}

/**
 * 
 * Create the array to hold the BoardingAlighting counts by Passenger RouteStop.
 * 
 */

function createBoardingAlightingCountsByStop(routeStops) {
	var boardingAlightingCountsByStop = [];

	routeStops.forEach(function(rs) {
		boardingAlightingCountsByStop[rs._id.id] = {
			boarding: 0,
			alighting: 0,
			name: rs.areaStop.name,
			lat: rs.areaStop.lat,
			lng: rs.areaStop.lng
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

function convertBoardingAlightingCountsByStopToArray(boardingAlightingCountsByStop, routeStops) {
	var results = [];

	routeStops.forEach(function(rs, index) {
		results[index] = boardingAlightingCountsByStop[rs._id.id];
	});

	return results;
}
