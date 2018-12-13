// IMPORTS

var fs = require('fs');


const SERVER_ROOT = './../..';
var LatLng = require(SERVER_ROOT + '/models/LatLng');

var cleanSurveyDataService = require(SERVER_ROOT + '/services/data/cleanSurveyData/CleanSurveyDataService');
var zipService = require(SERVER_ROOT + '/services/ZipService');
var surveyDataService = require(SERVER_ROOT + '/services/data/surveyData/SurveyDataService');

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');


// ACTIONS

/**
 * 
 * Shows the SurveyData upload page
 * 
 */

module.exports.initUpload = function(req, res) {
	res.connection.setTimeout(0);
	
	var from = new LatLng(18.549928, 121.099548);
	var to = from.addRight(100);

	var distance = from.getDistanceFrom(to);

	console.log("survey data init")

	Area.find({}, null, {sort: {name: 1}}, function(err, areas) {
		res.render('data/cleanSurveyData/upload', {
	 		surveyData: '',
	 		numberOfSensors: 6,
	 		temporarilyStoppedThreshold: 60 //60 is orginal
	 	});	
	});
};

/**
 * 
 * Handles the request for cleaning SurveyData.
 * 
 */

module.exports.upload = function(req, res) {
//	res.connection.setTimeout(0);

	var numberOfSensors = req.body.numberOfSensors;
 	var zipPath = req.files.surveyData.path;
 	var outputZipFilename = req.body.outputZipFilename;	
	var batchDirectory = outputZipFilename + '-' + new Date().getTime().toString();; // add timestamp to temp directory name
	var temporarilyStoppedThreshold = parseInt(req.body.temporarilyStoppedThreshold);

	var fileDetails = zipService.zipToString(zipPath);
	fileDetails = surveyDataService.convertFileContentsToSurveyDataCsvs(fileDetails);
	
	console.log('upload function');

 	var argumentsPackage = {
 		numberOfSensors: numberOfSensors,
 		fileDetails: fileDetails,
 		outputZipFilename: outputZipFilename,
 		batchDirectory: batchDirectory,
 		temporarilyStoppedThreshold: temporarilyStoppedThreshold,
 		res: res	
 	};


	 
 	cleanSurveyDataService.process(argumentsPackage)
	.then(function() {
		var outputZipFilePath = surveyDataService.OUTPUT_DIR + outputZipFilename + '.zip';

		while(!fs.existsSync(outputZipFilePath));
		
		res.download(outputZipFilePath);
	})
	.done();
}
