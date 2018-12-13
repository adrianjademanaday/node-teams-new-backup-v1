// IMPORTS

const SERVER_ROOT = './../../..';
var LatLng = require(SERVER_ROOT + '/models/LatLng');
var areaStopService = require(SERVER_ROOT + '/services/data/areaStop/AreaStopService');

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');

var casual = require('casual');

// ACTIONS

module.exports.initUpload = function(req, res) {
	Area.find({}, function(err, areas) {
		res.render('test/data/areaStop/upload', {
			areas: areas,
	 		areaId: null,
	 		topLeftBoundsLat: 14.657582,
	 		topLeftBoundsLng: 121.043329,
	 		bottomRightBoundsLat: 14.630427,
	 		bottomRightBoundsLng: 121.072941,
	 		numberOfPoints: 100
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
 	var numberOfPoints = req.body.numberOfPoints;

 	var allSurveyDataPoints = casual.points(topLeftBounds, bottomRightBounds, numberOfPoints);

 	var argumentsPackage = {
 		topLeftBounds: topLeftBounds,
 		bottomRightBounds: bottomRightBounds,
 		areaId: areaId,
 		allSurveyDataPoints: allSurveyDataPoints,
 		res: res	
 	};

 	areaStopService.processUpload(argumentsPackage)
 	.then(renderResponse)
 	.done();
}


// PRIVATE FUNCTIONS

function renderResponse(argumentsPackage) {
	var center = argumentsPackage.center;
	var grids = argumentsPackage.grids;
	var filteredGrids = argumentsPackage.filteredGrids;	
	var allSurveyDataPoints = argumentsPackage.allSurveyDataPoints;
	var originalCentroids = argumentsPackage.originalCentroids;
	var snappedCentroids = argumentsPackage.snappedCentroids
	var res = argumentsPackage.res;

	res.render('test/data/areaStop/results', {
		grids: JSON.stringify(grids),
 		filteredGrids: JSON.stringify(filteredGrids),
 		center: JSON.stringify(center),
 		surveyData: JSON.stringify(allSurveyDataPoints),
 		originalCentroids: JSON.stringify(originalCentroids),
 		snappedCentroids: JSON.stringify(snappedCentroids)
	});	
}