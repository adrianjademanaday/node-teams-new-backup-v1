// IMPORTS

const SERVER_ROOT = './../..';

var gpsTraceService = require(SERVER_ROOT + '/services/data/gpsTrace/GpsTraceService');

var LatLng = require(SERVER_ROOT + '/models/LatLng');
var Grid = require(SERVER_ROOT + '/models/Grid');

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');


// ACTIONS



module.exports.initUpload = function(req, res) {
	Area.find({}, function(err, areas) {
		res.render('data/gpsTrace/upload', {
	 		topLeftBoundsLat: 14.653098,
	 		topLeftBoundsLng: 121.063156,
	 		bottomRightBoundsLat: 14.622621,
	 		bottomRightBoundsLng:  121.077619,
	 		surveyData: '',	
	 	});	
	});
};

/**
 * 
 * Handles the request for extracting gps trace from SurveyData
 * 
 */

module.exports.upload = function(req, res) {
 	var topLeftBoundsLat = parseFloat(req.body.topLeftBoundsLat);
 	var topLeftBoundsLng = parseFloat(req.body.topLeftBoundsLng);
 	var topLeftBounds = new LatLng(topLeftBoundsLat, topLeftBoundsLng);

 	var bottomRightBoundsLat = parseFloat(req.body.bottomRightBoundsLat);
 	var bottomRightBoundsLng = parseFloat(req.body.bottomRightBoundsLng);
 	var bottomRightBounds = new LatLng(bottomRightBoundsLat, bottomRightBoundsLng);

 	var zipPath = req.files.surveyData.path;

 	var allGpsPoints = gpsTraceService.extractPointsFromZipFiles(zipPath);
 	var center = Grid.computeCenter(topLeftBounds, bottomRightBounds);

 	var argumentsPackage = {
 		center: center,
 		allGpsPoints: allGpsPoints,
 		res: res	
 	};

 	renderResponse(argumentsPackage);
}


// PRIVATE FUNCTIONS

/**
 * 
 * Renders a map with the GPS trace of the uploaded SurveyData. 
 * 
 */

function renderResponse(argumentsPackage) {
	var center = argumentsPackage.center;
	var allGpsPoints = argumentsPackage.allGpsPoints;
	var res = argumentsPackage.res;

	res.render('data/gpsTrace/results', {
 		center: JSON.stringify(center),
 		surveyData: JSON.stringify(allGpsPoints)
	});	
}