// IMPORTS

var Q = require('q');
var mongoose = require('mongoose-q')();
var casual = require('casual');

const SERVER_ROOT = './../../..';

var zipService = require(SERVER_ROOT + '/services/ZipService');
var surveyDataService = require(SERVER_ROOT + '/services/data/surveyData/SurveyDataService');

var Area = mongoose.model('Area');

var LatLng = require(SERVER_ROOT + '/models/LatLng');


// CONSTANTS

const OUTPUT_DIR = APP_DIR + '/temp/downloads';


// ACTIONS

module.exports.initUpload = function(req, res) {
	Area.find({}, function(err, areas) {
		res.render('test/data/surveyData/upload', {
			areaId: null,
			areas: areas,
			routeId: null,		
			topLeftBoundsLat: 14.597538,
	 		topLeftBoundsLng: 121.05217,
	 		bottomRightBoundsLat: 14.533074,
	 		bottomRightBoundsLng: 121.123924,
	 		numberOfPoints: 50,
			outputZipFilename: 'test-output.zip'		
		});	
	});
}

module.exports.upload = function(req, res) {
	var topLeftBoundsLat = parseFloat(req.body.topLeftBoundsLat);
 	var topLeftBoundsLng = parseFloat(req.body.topLeftBoundsLng);
 	var topLeftBounds = new LatLng(topLeftBoundsLat, topLeftBoundsLng);

 	var bottomRightBoundsLat = parseFloat(req.body.bottomRightBoundsLat);
 	var bottomRightBoundsLng = parseFloat(req.body.bottomRightBoundsLng);
 	var bottomRightBounds = new LatLng(bottomRightBoundsLat, bottomRightBoundsLng);

	var routeId = req.body.routeId;
	var numberOfPoints = req.body.numberOfPoints;

	fileDetails = generateFileDetails(topLeftBounds, bottomRightBounds, numberOfPoints);
	
	var outputZipFilename = req.body.outputZipFilename;	
	var batchDirectory = outputZipFilename + '-' + new Date().getTime().toString();; // add timestamp to temp directory name

	surveyDataService.processUpload(routeId, fileDetails, outputZipFilename, batchDirectory)
	.then(res.download(OUTPUT_DIR + '/' + outputZipFilename + '.zip'))
	.done();
}

function generateFileDetails(topLeftBounds, bottomRightBounds, numberOfPoints) {
	var fileDetails = [];
	var fileDetail = {};

	fileDetail.filename = 'test-input.csv';
	fileDetail.surveyData = casual.surveyData(topLeftBounds, bottomRightBounds, numberOfPoints);

	fileDetails.push(fileDetail);	

	return fileDetails;
}