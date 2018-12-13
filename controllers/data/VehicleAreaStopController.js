// IMPORTS

const SERVER_ROOT = './../..';
var LatLng = require(SERVER_ROOT + '/models/LatLng');
var vehicleAreaStopService = require(SERVER_ROOT + '/services/data/vehicleAreaStop/VehicleAreaStopService');
var stsp = require(SERVER_ROOT + '/services/data/SensorToSeatParserService');

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');
var tsd = require(SERVER_ROOT + '/models/TricycleSurveyData');


// ACTIONS

/**
 * 
 * Shows the SurveyData upload page
 * 
 */

module.exports.initUpload = function(req, res) {
	res.connection.setTimeout(0);

	Area.find({}, null, {sort: {name: 1}}, function(err, areas) {
		res.render('data/vehicleAreaStop/upload', {
			areas: areas,
	 		areaId: null,	 	
	 		seatConfigurations: stsp.SEAT_CONFIGURATIONS,
	 		seatConfigurationId: null,	
	 		topLeftBoundsLat: null,
	 		topLeftBoundsLng: null,
	 		bottomRightBoundsLat: null,
	 		bottomRightBoundsLng: null,
	 		surveyData: '',	
	 	});	
	});
};

/**
 * 
 * Handles the request for processing SurveyData into Vehicle AreaStops
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

 	var seatConfigurationId = req.body.seatConfigurationId;

 	var areaId = req.body.areaId;
 	 	
 	var zipPath = req.files.surveyData.path;

 	var argumentsPackage = {
 		areaId: areaId, 	
 		seatConfigurationId: seatConfigurationId,
 		zipPath: zipPath,
 		topLeftBounds: topLeftBounds,
 		bottomRightBounds: bottomRightBounds, 		
 		res: res,	
 	};

 	vehicleAreaStopService.process(argumentsPackage)
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
	var center = argumentsPackage.center;
	var grids = argumentsPackage.grids;
	var filteredGrids = argumentsPackage.filteredGrids;	
	var allSurveyDataPoints = argumentsPackage.allSurveyDataPoints;
	var originalCentroids = argumentsPackage.originalCentroids;
	var snappedCentroids = argumentsPackage.snappedCentroids;
	var areaName = argumentsPackage.area.name;
	var res = argumentsPackage.res;

	res.render('data/vehicleAreaStop/results', {
		grids: JSON.stringify(grids),
 		filteredGrids: JSON.stringify(filteredGrids),
 		center: JSON.stringify(center),
 		surveyData: JSON.stringify(allSurveyDataPoints),
 		originalCentroids: JSON.stringify(originalCentroids),
 		snappedCentroids: JSON.stringify(snappedCentroids)
	});	
}