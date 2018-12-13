// IMPORTS

var Q = require('q');
var mongoose = require('mongoose-q')();

var md5 = require('MD5');
var Area = mongoose.model('Area');
var Route = mongoose.model('Route');
var User = mongoose.model('User');

const SERVER_ROOT = './..';
var stsp = require(SERVER_ROOT + '/services/data/SensorToSeatParserService');

// PUBLIC FUNCTIONS

/**
 * 
 * Initialize (bootstrap) database data.
 * I.e. Users, Areas and Routes.
 * 
 */

module.exports.init = function()  {
	//mongoose.connection.on('open', function() {
	mongoose.connection.on('connected', function() {
	     //clearAllAndInitAreas();	
	     //clearSurveyDataOnly();

		  initUsers();
		  
		console.log("***done  bootstrapping.js***");

  		//console.log('database bootstrapping done');
	});
}

module.exports.clearAllAndInitAreas = function() {
	clearAllAndInitAreas();
};

module.exports.clearSurveyDataOnly = function() {
	clearSurveyDataOnly();
};


// PRIVATE FUNCTIONS

/**
 * 
 * Clears ALL data and reinitializes Area data (clears associated AreaStops). 
 * 
 */

function clearAllAndInitAreas() {
	removeCollection('speedprofiles')
	.then(removeCollection('origindestinations'))
	.then(removeCollection('vehicleorigindestinations'))
	.then(removeCollection('boardingalightings'))
	.then(removeCollection('hourlystats'))
	.then(removeCollection('hourlyspeeds'))
	.then(removeRouteStops())	
	.then(removeCollection('routestops'))
	.then(removeAreaStops())
	.then(removeCollection('areastops'))
	.then(removeVehicleRouteStops())	
	.then(removeCollection('vehicleroutestops'))
	.then(removeVehicleAreaStops())
	.then(removeCollection('vehicleareastops'))
	.then(removeCollection('routes'))
	.then(removeCollection('areas'))
	.then(createAreas())
	.done();
}

/**
 * 
 * Clears SpeedRecords, OriginDestinations and BoardingAlightings. 
 * 
 */

function clearSurveyDataOnly() {
	removeCollection('speedprofiles')
	.then(removeCollection('origindestinations'))
	.then(removeCollection('vehicleorigindestinations'))
	.then(removeCollection('boardingalightings'))
	.then(removeCollection('hourlystats'))	
	.then(removeCollection('hourlyspeeds'))
	.done();	
}

/**
 * 
 * Initializes Area data.
 * 
 */

function createAreas() {

	// 	name, topLeftBoundsLat, topLeftBoundsLng, bottomRightBoundsLat, bottomRightBoundsLng, routes

	// var diliman = initArea('Diliman', 14.659326, 121.062341, 14.650711, 121.075838);
	// diliman.routes = initDilimanRoutes(diliman.id);

	var sanFernando = initArea('San Fernando', 15.149020, 120.564308, 14.977622, 120.742493);
	sanFernando.routes = initSanFernadoRoutes(sanFernando.id);

	var puertoPrinsesa = initArea('Puerto Prinsesa', 9.824941, 118.676376, 9.719378, 118.776627);
	puertoPrinsesa.routes = initPuertoPrinsesaRoutes(puertoPrinsesa.id);

	var dipolog = initArea('Dipolog', 8.640595, 123.30162, 8.478994, 123.378696);
	dipolog.routes = initDipologRoutes(dipolog.id);

	var iloilo = initArea('Iloilo', 10.789466, 122.34581, 10.675453, 122.621155);
	iloilo.rotues = initIloiloRoutes(iloilo.id);

	var generalSantos = initArea('General Santos', 6.19824, 125.089302, 6.047699, 125.251694);
	generalSantos.routes = initGenSanRoutes(generalSantos.id);

	var pasig = initArea('Pasig', 14.620461, 121.04805, 14.504491, 121.132164);
	pasig.routes = initPasigRoutes(pasig.id);
	
	var quezon = initArea('Quezon', 14.785220, 120.987700, 14.586620, 121.138762);
	quezon.routes = initQuezonRoutes(quezon.id);
}

/**
 * 
 * Initializes an Area.
 * 
 */

function initArea(name, topLeftBoundsLat, topLeftBoundsLng, bottomRightBoundsLat, bottomRightBoundsLng) {
	var area = new Area({
		name: name,
		longName: name,

		topLeftBounds: {
			lat: topLeftBoundsLat,
			lng: topLeftBoundsLng
		},

		bottomRightBounds: {
			lat: bottomRightBoundsLat,
			lng: bottomRightBoundsLng
		},

		areaStops: []
	});

	area.computeCenter();	
	area.save();

	return area;
}

/**
 * 
 * Removes a specific collection or table from database.
 * 
 */

function removeCollection(name) {
	var defer = Q.defer();

	mongoose.connection.db.dropCollection(name, function(err) {
		defer.resolve();
	});
	
	return defer.promise;
}

/**
 * 
 * Removes children Passenger RouteStops from parent Route in database.
 * 
 */

function removeRouteStops() {
	var defer = Q.defer();

	Route.findQ({})
	.then(function(routes) {
		routes.forEach(function(r) {
			r.routeStops = [];
			r.save();
		});

		defer.resolve();
	});

	return defer.promise;
}

/**
 * 
 * Removes children Vehicle RouteStops from parent Route in database.
 * 
 */

function removeVehicleRouteStops() {
	var defer = Q.defer();

	Route.findQ({})
	.then(function(routes) {
		routes.forEach(function(r) {
			r.vehicleRouteStops = [];
			r.save();
		});

		defer.resolve();
	});

	return defer.promise;
}

/**
 * 
 * Removes children Passenger AreaStops from parent Area in database.
 * 
 */

function removeAreaStops() {
	var defer = Q.defer();

	Area.findQ({})
	.then(function(areas) {
		areas.forEach(function(a) {
			a.areaStops = [];
			a.save();
		});

		defer.resolve();
	});

	return defer.promise;
}

/**
 * 
 * Removes children Vehicle AreaStops from parent Area in database.
 * 
 */

function removeVehicleAreaStops() {
	var defer = Q.defer();

	Area.findQ({})
	.then(function(areas) {
		areas.forEach(function(a) {
			a.vehicleAreaStops = [];
			a.save();
		});

		defer.resolve();
	});

	return defer.promise;
}

/**
 * 
 * Initializes Route data in database.
 * 
 */

function initRoute(areaId, name, lat, lng, seatConfiguration) {
	var route = new Route({
		areaId: areaId,

		name: name,
		longName: name,

		mapCenter: {
			lat: lat,
			lng: lng
		},
		
		routeStops: [],

		seatConfiguration: seatConfiguration,
		totalSurveys: 0		
	});

	route.save();

	return route;
}

/**
 * 
 * Initializes Diliman Routes.
 * 
 */

function initDilimanRoutes(areaId) {
	var routes = [];
	
	routes.push(initRoute(areaId, 'Diliman', 14.654967, 121.068563, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));

	return routes;
}

/**
 * 
 * Initializes San Fernando Routes.
 * 
 */

function initSanFernadoRoutes(areaId) {
	var routes = [];

	routes.push(initRoute(areaId, 'McDo', 				15.059394, 120.656705, stsp.TWO_IN_AND_ONE_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Saint Jude', 	15.059394, 120.656705, stsp.TWO_IN_AND_ONE_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'TDP', 					15.059394, 120.656705, stsp.TWO_IN_AND_ONE_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Uni Del', 			15.059394, 120.656705, stsp.TWO_IN_AND_ONE_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'BPM', 					15.059394, 120.656705, stsp.TWO_IN_AND_ONE_DRIVER_BACK_SEAT_CONFIGURATION));	

	return routes;
}

/**
 * 
 * Initializes Puerto Prinsesa Routes. 
 * 
 */

function initPuertoPrinsesaRoutes(areaId) {
	var routes = [];

	routes.push(initRoute(areaId, 'Frontliner', 	9.77893, 118.750534, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Monica', 			9.77893, 118.750534, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Pas', 					9.77893, 118.750534, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'San Pedro', 		9.77893, 118.750534, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));

	return routes;
}

/**
 * 
 * Initializes Dipolog Routes.
 * 
 */

function initDipologRoutes(areaId) {
	var routes = [];

	routes.push(initRoute(areaId, 'Galas', 					8.583333, 123.333333, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'IntegTerminal', 	8.583333, 123.333333, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Dicayas', 				8.583333, 123.333333, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Sicayab', 				8.583333, 123.333333, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Sinaman', 				8.583333, 123.333333, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'StaFilomena', 		8.583333, 123.333333, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));

	return routes;
}

/**
 * 
 * Initializes Iloilo Routes.  
 * 
 */

function initIloiloRoutes(areaId) {
	var routes = [];

	routes.push(initRoute(areaId, 'BA', 				10.72015, 122.562106, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Calajunan', 	10.72015, 122.562106, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Katurdas', 	10.72015, 122.562106, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Villa', 			10.72015, 122.562106, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));

	return routes;
}

/**
 * 
 * Initializes General Santos Routes.
 * 
 */

function initGenSanRoutes(areaId) {
	var routes = [];

	routes.push(initRoute(areaId, 'Fab',		6.116386, 125.171618, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Ligaya', 6.116386, 125.171618, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Mab', 		6.116386, 125.171618, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Sani', 	6.116386, 125.171618, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Sin', 		6.116386, 125.171618, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Sm', 		6.116386, 125.171618, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));

	return routes;
}

/**
 * 
 * Initializes Pasig Routes.
 * 
 */

function initPasigRoutes(areaId) {
	var routes = [];

	routes.push(initRoute(areaId, 'A',		14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'VA', 14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'Samca', 		14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'SLRPP', 	14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'MIP', 		14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'SPRGEV', 		14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'JRMF',		14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'MERSAN', 14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'SVRPM', 		14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'PI', 	14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'PRTMG', 		14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'BISPP', 		14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));

	routes.push(initRoute(areaId, 'JASS', 14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'PPC', 		14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'PROFMA', 	14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	routes.push(initRoute(areaId, 'PRRESMA', 		14.576377, 121.08511, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	
	return routes;
}
/**
 * 
 * Initializes Quezon Routes.
 * 
 */

function initQuezonRoutes(areaId) {
	var routes = [];

	routes.push(initRoute(areaId, 'QCA',		14.676208, 121.043861, stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION));
	
	return routes;
}

/**
 * 
 * Initializes User data.
 * 
 */

function initUsers() {
	removeCollection('users');

	var user = new User({
		username: 'user',
		password: md5('str1d3'),
		fullname: 'user',
		role: 'USER'		
	});

	user.save();

	var admin = new User({
		username: 'admin',
		password: md5('str1d3'),
		fullname: 'admin',
		role: 'ADMIN'		
	});

	admin.save();
}
