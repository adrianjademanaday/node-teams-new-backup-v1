// IMPORTS

const SERVER_ROOT = './../..';
var routeStopService = require(SERVER_ROOT + '/services/data/routeStop/RouteStopService');
var mapPointToRouteStopService = require(SERVER_ROOT + '/services/data/routeStop/MapPointToRouteStopService');
var zipService = require(SERVER_ROOT + '/services/ZipService');
var csvService = require(SERVER_ROOT + '/services/CsvService');

var Q = require('q');
var mongoose = require('mongoose-q')();
var LatLng = require(SERVER_ROOT + '/models/LatLng');

var AreaStop = mongoose.model('AreaStop');
var Area = mongoose.model('Area');
var RouteStop = mongoose.model('RouteStop');
var Route = mongoose.model('Route');


// ACTIONS

/**
 * 
 * Shows the SurveyData upload page
 * 
 */

module.exports.initUpload = function(req, res) {
	res.connection.setTimeout(0);

	Area.find({}, null, {sort: {name: 1}}, function(err, areas) {
		res.render('data/routeStop/upload', {
			areas: areas,
	 		areaId: null,
	 		routes: [],
	 		routeId: null,
	 		surveyData: null,	
	 	});	
	});
};

/**
 * 
 * Handles the request for processing SurveyData into Passenger RouteStops
 * 
 */

module.exports.upload = function(req, res) {
	res.connection.setTimeout(0);
	
 	var topLeftBoundsLat = parseFloat(req.body.topLeftBoundsLat);
 	var topLeftBoundsLng = parseFloat(req.body.topLeftBoundsLng);
 	var topLeftBounds = new LatLng(topLeftBoundsLat, topLeftBoundsLng);

 	var bottomRightBoundsLat = parseFloat(req.body.bottomRightBoundsLat);
 	var bottomRightBoundsLng = parseFloat(req.body.bottomRightBoundsLng);
 	var bottomRightBounds = new LatLng(bottomRightBoundsLat, bottomRightBoundsLng);
 	
	var areaId = req.body.areaId;
	var routeId = req.body.routeId;

	var zipPath = req.files.surveyData.path;	
	var allSurveyDataPoints = routeStopService.extractPointsFromZipFiles(zipPath);

	var argumentsPackage = {
		areaId: areaId,
		routeId: routeId,
		allSurveyDataPoints: allSurveyDataPoints,
		res: res
	}

	routeStopService.processUpload(argumentsPackage)
	.then(renderResponse)
	.done();	
}


// PRIVATE FUNCTIONS

/**
 * 
 * Renders a map of the results of clustering SurveyData into Passenger AreaStops. 
 * 
 */

function renderResponse(argumentsPackage) {	
	var mapCenter = argumentsPackage.mapCenter;
	var allSurveyDataPoints = argumentsPackage.allSurveyDataPoints;
	var routeStopPoints = argumentsPackage.routeStopPoints;
	var res = argumentsPackage.res;

	res.render('data/routeStop/results', {
		mapCenter: JSON.stringify(mapCenter),
 		surveyData: JSON.stringify(allSurveyDataPoints),
 		routeStops: JSON.stringify(routeStopPoints)
	});	
}

