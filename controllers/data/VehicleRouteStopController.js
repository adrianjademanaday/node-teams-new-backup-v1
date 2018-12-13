// IMPORTS

const SERVER_ROOT = './../..';
var vehicleRouteStopService = require(SERVER_ROOT + '/services/data/vehicleRouteStop/VehicleRouteStopService');
var zipService = require(SERVER_ROOT + '/services/ZipService');
var csvService = require(SERVER_ROOT + '/services/CsvService');

var Q = require('q');
var mongoose = require('mongoose-q')();
var LatLng = require(SERVER_ROOT + '/models/LatLng');

var Area = mongoose.model('Area');
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
		res.render('data/vehicleRouteStop/upload', {
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
 * Handles the request for processing SurveyData into Vehicle RouteStops
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
	var allSurveyDataPoints = vehicleRouteStopService.extractPointsFromZipFiles(zipPath);

	var argumentsPackage = {
		areaId: areaId,
		routeId: routeId,
		allSurveyDataPoints: allSurveyDataPoints,
		res: res
	}

	vehicleRouteStopService.processUpload(argumentsPackage)
	.then(renderResponse)
	.done();	
}


// PRIVATE FUNCTIONS

/**
 * 
 * Renders a map of the results of clustering SurveyData into Vehicle AreaStops. 
 * 
 */

function renderResponse(argumentsPackage) {	
	var mapCenter = argumentsPackage.mapCenter;
	var allSurveyDataPoints = argumentsPackage.allSurveyDataPoints;
	var vehicleRouteStopPoints = argumentsPackage.vehicleRouteStopPoints;
	var res = argumentsPackage.res;

	res.render('data/vehicleRouteStop/results', {
		mapCenter: JSON.stringify(mapCenter),
 		surveyData: JSON.stringify(allSurveyDataPoints),
 		vehicleRouteStops: JSON.stringify(vehicleRouteStopPoints)
	});	
}

