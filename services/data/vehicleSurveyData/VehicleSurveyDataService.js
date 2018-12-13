// IMPORTS

var Q = require('q');
var fs = require('fs');
var csv = require('csv');
var Zip = require('adm-zip');
var mongoose = require('mongoose-q')();

var Route = mongoose.model("Route");

const SERVER_ROOT = './../../..';
var csvService = require(SERVER_ROOT + '/services/CsvService');
var sensorToSeatParserService = require(SERVER_ROOT + '/services/data/SensorToSeatParserService');
var vehicleOriginDestinationService = require(SERVER_ROOT + '/services/data/vehicleSurveyData/VehicleOriginDestinationService');
var vehicleOriginDestinationToCsvService = require(SERVER_ROOT + '/services/data/vehicleSurveyData/VehicleOriginDestinationToCsvService');

var VehicleOriginDestination = mongoose.model('VehicleOriginDestination');


// CONSTANTS

const OD_FILE_SUFFIX = '-vod.csv';
OUTPUT_DIR = DATA_DIR + 'downloads/';

module.exports.OUTPUT_DIR = OUTPUT_DIR;

// SERVICE FUNCTIONS

/**
 * 
 * Processes SeatData from all files into 
 * OriginDestinations, HourlyStats and SpeedRecords.
 * 
 */

module.exports.process = function(routeId, fileDetails, outputZipFilename, batchDirectory) {
	var defer = Q.defer();
	var tasks = [];

	// NOTE: will create csv file for speed, origin-destination and boarding/alighting

	fileDetails.forEach(function(fileDetail, index) {
		tasks.push(processFileDetail(routeId, fileDetail, batchDirectory, (index + 1)));
	});

	// NOTE: will put all the speed, origin-destination and boarding/alighting CSVs into one zip file

	Q.allSettled(tasks)
	.then(function() {
		outputZipFile(batchDirectory, outputZipFilename);
	})
	.then(function() {
		Route.findByIdQ(routeId)
		.then(function(route) {
			route.totalSurveys = fileDetails.length;

			route.saveQ()
			.then(function() {
				defer.resolve();
			});
		});		
	});	

	return defer.promise;
}

/**
 * 
 * Parses the contents of the csv file into SeatData given the SeatConfiguration.
 * 
 */

module.exports.convertFileContentsToSurveyData = function(fileDetails, seatConfiguration) {
	fileDetails.forEach(function(fileDetail) {
		var surveyDataCsv = csvService.stringToArray(fileDetail.fileContent);	
		fileDetail.surveyData = sensorToSeatParserService.process(surveyDataCsv, seatConfiguration);
	});

	return fileDetails;
}

module.exports.convertFileContentsToSurveyDataCsvs = function(fileDetails) {
	fileDetails.forEach(function(fileDetail) {
		fileDetail.surveyDataCsv = csvService.stringToArray(fileDetail.fileContent);	
	});

	return fileDetails;
}


// PRIVATE FUNCTIONS

/**
 * 
 * Processes SeatData from one file into 
 * OriginDestinations.
 * 
 */

function processFileDetail(routeId, fileDetail, batchDirectory, sampleNumber) {
	var defer = Q.defer();

	var surveyData = fileDetail.surveyData;
	var inputFilename = getNameFromPath(fileDetail.filename);
	
	if (!fs.existsSync(OUTPUT_DIR + batchDirectory)) {
		fs.mkdirSync(OUTPUT_DIR + batchDirectory);	
	} 

	var argumentsPackage = {
		routeId: routeId,
		surveyData: surveyData,
		inputFilename: inputFilename,
		batchDirectory: batchDirectory,
		sampleNumber: sampleNumber
	};
	
	getRouteDetails(routeId, argumentsPackage)
	.then(processVehicleOriginDestinations)	
	.then(createVehicleOriginDestinationFile)
	.then(defer.resolve)
	.done();	

	return defer.promise;
}

/**
 * 
 * Writes the files under the given directory into a zip file.
 * 
 */

function outputZipFile(batchDirectory, outputZipFilename) {
	var outputZip = new Zip();
 
  outputZip.addLocalFolder(OUTPUT_DIR + batchDirectory);  
  outputZip.writeZip(OUTPUT_DIR + outputZipFilename + '.zip');
}

/**
 * 
 * Gets the route data from the database.
 * 
 */

function getRouteDetails(routeId, argumentsPackage) {
	var defer = Q.defer();

	Route.findByIdQ(routeId)
	.then(function(route) {
		argumentsPackage.route = route;

		defer.resolve(argumentsPackage);	
	});

	return defer.promise;
}

/**
 * 
 * Processes SeatData into Vehicle OriginDestinations.
 * 
 */

function processVehicleOriginDestinations(argumentsPackage) {
	var defer = Q.defer();

	var routeId = argumentsPackage.routeId;
	var surveyData = argumentsPackage.surveyData;
	var sampleNumber = argumentsPackage.sampleNumber;

	vehicleOriginDestinationService.process(routeId, surveyData, sampleNumber)
	.then(function(vehicleOriginDestinations) {
		VehicleOriginDestination.create(vehicleOriginDestinations)
		.then(function(err) {
			argumentsPackage.vehicleOriginDestinations = vehicleOriginDestinations;

			defer.resolve(argumentsPackage);
		});
		
	});

	return defer.promise;
}

/**
 * 
 * Writes output Vehicle OriginDestinations into a csv file.
 * 
 */

function createVehicleOriginDestinationFile(argumentsPackage) {
	var defer = Q.defer();
		
	var batchDirectory = argumentsPackage.batchDirectory;
	var inputFilename = argumentsPackage.inputFilename;

	var vehicleOriginDestinations = argumentsPackage.vehicleOriginDestinations;

	vehicleOriginDestinationToCsvService.process(vehicleOriginDestinations)
	.then(function(vehicleOriginDestinationCsvs) {
		csv()
		.from.array(vehicleOriginDestinationCsvs)
		.to.path(OUTPUT_DIR + batchDirectory + '/' + inputFilename + OD_FILE_SUFFIX)
		.on('close', function() {		
			defer.resolve(argumentsPackage);			
		});		
	});

	return defer.promise;
}

/**
 * 
 * Gets the name part of a filename.
 * 
 */

function getNameFromPath(filename) {
	filename = filename.split('.');
	filename = filename[0];
	filename = filename.split('\\');	
	filename = filename[filename.length - 1];

	return filename;
}