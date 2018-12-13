// IMPORTS

const SERVER_ROOT = './../../..';
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

var casual = require('casual');

// ACTIONS

module.exports.initUpload = function(req, res) {
	Area.find({}, function(err, areas) {
		res.render('test/data/routeStop/upload', {
			areas: areas,
	 		areaId: null,
	 		routes: [],
	 		routeId: null,
	 		topLeftBoundsLat: 14.597538,
	 		topLeftBoundsLng: 121.05217,
	 		bottomRightBoundsLat: 14.533074,
	 		bottomRightBoundsLng: 121.123924,
	 		numberOfPoints: 1000	
	 	});	
	});
};

module.exports.upload = function(req, res) {
 	var topLeftBoundsLat = parseFloat(req.body.topLeftBoundsLat);
 	var topLeftBoundsLng = parseFloat(req.body.topLeftBoundsLng);
 	var topLeftBounds = new LatLng(topLeftBoundsLat, topLeftBoundsLng);

 	var bottomRightBoundsLat = parseFloat(req.body.bottomRightBoundsLat);
 	var bottomRightBoundsLng = parseFloat(req.body.bottomRightBoundsLng);
 	var bottomRightBounds = new LatLng(bottomRightBoundsLat, bottomRightBoundsLng);
 	
	var areaId = req.body.areaId;
	var routeId = req.body.routeId;
	var numberOfPoints = req.body.numberOfPoints;

	var allSurveyDataPoints = casual.points(topLeftBounds, bottomRightBounds, numberOfPoints)

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

function renderResponse(argumentsPackage) {	
	var mapCenter = argumentsPackage.mapCenter;
	var allSurveyDataPoints = argumentsPackage.allSurveyDataPoints;
	var routeStopPoints = argumentsPackage.routeStopPoints;
	var res = argumentsPackage.res;

	res.render('test/data/routeStop/results', {
		mapCenter: JSON.stringify(mapCenter),
 		surveyData: JSON.stringify(allSurveyDataPoints),
 		routeStops: JSON.stringify(routeStopPoints)
	});	
}

