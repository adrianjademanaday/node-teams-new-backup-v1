// IMPORTS

var Q = require('q');
var fs = require('fs');
var csv = require('csv');
var Zip = require('adm-zip');
var mongoose = require('mongoose-q')();

const SERVER_ROOT = './../../..';
var csvService = require(SERVER_ROOT + '/services/CsvService');
var surveyDataCleanerService = require(SERVER_ROOT + '/services/data/SurveyDataCleanerService');


// CONSTANTS

OUTPUT_DIR = DATA_DIR;

module.exports.OUTPUT_DIR = OUTPUT_DIR;


// SERVICE FUNCTIONS

/**
 * 
 * Cleans the raw survey data.
 * If the vehicle is moving then the sensor should stay ON
 * if it was on, and OFF when it was off.
 * 
 */

module.exports.process = function(argumentsPackage) {
	var defer = Q.defer();
	var tasks = [];

	var numberOfSensors = argumentsPackage.numberOfSensors;
	var fileDetails = argumentsPackage.fileDetails;
	var outputZipFilename = argumentsPackage.outputZipFilename;
	var batchDirectory = argumentsPackage.batchDirectory;
	var temporarilyStoppedThreshold = argumentsPackage.temporarilyStoppedThreshold;

	// NOTE: will create csv file for speed, origin-destination and boarding/alighting

	fileDetails.forEach(function(fileDetail) {
		tasks.push(processFileDetail(numberOfSensors, fileDetail, batchDirectory, temporarilyStoppedThreshold));
	});

	// NOTE: will put all the speed, origin-destination and boarding/alighting CSVs into one zip file

	Q.allSettled(tasks)
	.then(function() {
		outputZipFile(batchDirectory, outputZipFilename);

		defer.resolve();
	});	

	return defer.promise;
}


// PRIVATE FUNCTIONS

/**
 * 
 * Fetches the zip file from the upload directory.
 * Cleans each file included in the zip file. 
 * 
 */

function processFileDetail(numberOfSensors, fileDetail, batchDirectory, temporarilyStoppedThreshold) {
	var defer = Q.defer();

	var surveyDataCsv = fileDetail.surveyDataCsv;
	var inputFilename = getNameFromPath(fileDetail.filename);
	
	if (!fs.existsSync(OUTPUT_DIR + '/' + batchDirectory)) {
		fs.mkdirSync(OUTPUT_DIR + '/' + batchDirectory);	
	} 

	var argumentsPackage = {
		surveyDataCsv: surveyDataCsv,
		inputFilename: inputFilename,
		batchDirectory: batchDirectory		
	}

	surveyDataCsv = surveyDataCleanerService.process(surveyDataCsv, numberOfSensors, temporarilyStoppedThreshold);	
	
	createSurveyDataFile(surveyDataCsv, argumentsPackage)
	.then(defer.resolve);	

	return defer.promise;
}

// NOTE: Probable Unused Function

function outputZipFile(batchDirectory, outputZipFilename) {
  var outputZip = new Zip();

  outputZip.addLocalFolder(OUTPUT_DIR + batchDirectory);  
  outputZip.writeZip(OUTPUT_DIR + '/' + outputZipFilename + '.zip');
}

/**
 * 
 * Creates the cleaned SurveyData csv file. 
 * 
 */

function createSurveyDataFile(surveyDataCsv, argumentsPackage) {
	var defer = Q.defer();
	
	var batchDirectory = argumentsPackage.batchDirectory;
	var inputFilename = argumentsPackage.inputFilename;

	csv()
	.from.array(surveyDataCsv)
	.to.path(OUTPUT_DIR + '/' + batchDirectory + '/' + inputFilename + '.csv')
	.on('close', function() {
		defer.resolve(argumentsPackage);
	});	

	return defer.promise;
}

/***
 * 
 * Gets the name part of the filename.
 * 
 */

function getNameFromPath(filename) {
	filename = filename.split('.');
	filename = filename[0];
	filename = filename.split('\\');	
	filename = filename[filename.length - 1];

	return filename;
}