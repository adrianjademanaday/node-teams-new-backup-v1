// IMPORTS

var Q = require('q');
var mongoose = require('mongoose-q')();
var fs = require('fs');

const SERVER_ROOT = './../..';

var zipService = require(SERVER_ROOT + '/services/ZipService');
var surveyDataService = require(SERVER_ROOT + '/services/data/surveyData/SurveyDataService');

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
		res.render('data/surveyData/upload', {
			areaId: null,
			areas: areas,
			routeId: null,		
			passengerLoadsFilename: '',		
			outputZipFilename: '',
			createHourlyStats: true		
		});	
	});
}

/**
 * 
 * Handles the request for processing SurveyData into Passenger HourlyStats, 
 * BoardingAlightings, OriginDestinations and SpeedRecords
 * 
 */

module.exports.upload = function(req, res) {	
	res.connection.setTimeout(0);
	
	var routeId = req.body.routeId;

	var inputZipPath = req.files.surveyData.path;
	var fileDetails = zipService.zipToString(inputZipPath);

	var createHourlyStats = Boolean(req.body.createHourlyStats);

	getRouteDetails(routeId)
	.then(function(route) {
		fileDetails = surveyDataService.convertFileContentsToSurveyData(fileDetails, route.seatConfiguration.id);
	
		var outputZipFilename = req.body.outputZipFilename;	
		var batchDirectory = outputZipFilename + '-' + new Date().getTime().toString();; // add timestamp to temp directory name

		surveyDataService.process(routeId, fileDetails, outputZipFilename, batchDirectory, createHourlyStats)
		.then(function() {
			var outputZipFilePath = surveyDataService.OUTPUT_DIR + outputZipFilename + '.zip';

			while(!fs.existsSync(outputZipFilePath));
			
			res.download(outputZipFilePath);
		})
		.done();
	});
}

/**
 * 
 * Gets the Route data from the database
 * given the routeId.
 * 
 */

function getRouteDetails(routeId) {
	var defer = Q.defer();

	Route.findByIdQ(routeId)
	.then(function(route) {
		defer.resolve(route);
	});

	return defer.promise;
}