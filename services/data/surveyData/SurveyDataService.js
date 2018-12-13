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
var speedService = require(SERVER_ROOT + '/services/data/surveyData/SpeedService');
var originDestinationService = require(SERVER_ROOT + '/services/data/surveyData/OriginDestinationService');
var originDestinationToCsvService = require(SERVER_ROOT + '/services/data/surveyData/OriginDestinationToCsvService');
var boardingAlightingService = require(SERVER_ROOT + '/services/data/surveyData/BoardingAlightingService');
var boardingAlightingToCsvService = require(SERVER_ROOT + '/services/data/surveyData/BoardingAlightingToCsvService');
var hourlyStatsService = require(SERVER_ROOT + '/services/data/surveyData/HourlyStatsService');

var OriginDestination = mongoose.model('OriginDestination');
var BoardingAlighting = mongoose.model('BoardingAlighting');


// CONSTANTS

const SPEED_FILE_SUFFIX = '-speed.csv';
const OD_FILE_SUFFIX = '-od.csv';
const BA_FILE_SUFFIX = '-ba.csv';
const HOURLY_STATS_FILE_SUFFIX = '-hourly.csv';
OUTPUT_DIR = DATA_DIR + 'downloads/';

module.exports.OUTPUT_DIR = OUTPUT_DIR;


// VARIABLES

var allProcessedData = {
	allSpeedProfiles: [],
	allOriginDestinations: [],
	allBoardingAlightings: []
};

var _createHourlyStats = false;


// SERVICE FUNCTIONS

/**
 * 
 * Processes SeatData from all files into 
 * OriginDestinations, HourlyStats and SpeedRecords.
 * 
 */

module.exports.process = function(routeId, fileDetails, outputZipFilename, batchDirectory, createHourlyStats) {
	var defer = Q.defer();
	var tasks = [];

	_createHourlyStats = createHourlyStats

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

// TODO: rename surveyData into seatData

module.exports.convertFileContentsToSurveyData = function(fileDetails, seatConfiguration) {
	fileDetails.forEach(function(fileDetail) {
		var surveyDataCsv = csvService.stringToArray(fileDetail.fileContent);	
		fileDetail.surveyData = sensorToSeatParserService.process(surveyDataCsv, seatConfiguration);
	});

	return fileDetails;
}

/**
 * 
 * Parses the contents of the csv file into SurveyData.
 * 
 */

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
 * OriginDestinations, HourlyStats and SpeedRecords.
 * 
 */

function processFileDetail(routeId, fileDetail, batchDirectory, sampleNumber) {
	var defer = Q.defer();

	var surveyData = fileDetail.surveyData;
	var inputFilename = getNameFromPath(fileDetail.filename);
	
	if (!fs.existsSync(OUTPUT_DIR + batchDirectory)) {
		fs.mkdirSync(OUTPUT_DIR + batchDirectory);	
	} 

	var speedResults = speedService.process(surveyData);	
	var speedProfile = speedResults.speedProfile;
	var speedProfilePersistent = speedResults.speedProfilePersistent;

	var argumentsPackage = {
		speedProfile: speedProfile,
		speedProfilePersistent: speedProfilePersistent,
		routeId: routeId,
		surveyData: surveyData,
		inputFilename: inputFilename,
		batchDirectory: batchDirectory,
		sampleNumber: sampleNumber
	};
	
	if (_createHourlyStats) {
		getRouteDetails(routeId, argumentsPackage)
		.then(createSpeedFile)
		.then(processOriginDestinations)	
		.then(createOriginDestinationFile)
		.then(processBoardingAlightings)	
		.then(createBoardingAlightingFile)
		.then(processHourlyStatistics)
		.then(createHourlyStatisticsFile)
		.then(defer.resolve)
		.done();
	} else {
		getRouteDetails(routeId, argumentsPackage)
		.then(createSpeedFile)
		.then(processOriginDestinations)	
		.then(createOriginDestinationFile)
		.then(processBoardingAlightings)	
		.then(createBoardingAlightingFile)	
		.then(defer.resolve)
		.done();	
	}

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
 * Writes output SpeedRecords into a csv file.
 * 
 */

function createSpeedFile(argumentsPackage) {
	var defer = Q.defer();

	var speedProfile = argumentsPackage.speedProfile;
	
	var batchDirectory = argumentsPackage.batchDirectory;
	var inputFilename = argumentsPackage.inputFilename;

	csv()
	.from.array(speedProfile)
	.to.path(OUTPUT_DIR + batchDirectory + '/' + inputFilename + SPEED_FILE_SUFFIX)
	.on('close', function() {
		console.log("create Speeds");
		defer.resolve(argumentsPackage);
	});	

	return defer.promise;
}

/**
 * 
 * Processes SeatData into Passenger OriginDestinations.
 * 
 */

function processOriginDestinations(argumentsPackage) {
	var defer = Q.defer();

	var routeId = argumentsPackage.routeId;
	var surveyData = argumentsPackage.surveyData;
	var speedProfile = argumentsPackage.speedProfile; 
	var sampleNumber = argumentsPackage.sampleNumber;

	originDestinationService.process(routeId, surveyData, speedProfile, sampleNumber)
	.then(function(originDestinations) {
		
		if (_createHourlyStats) {
			argumentsPackage.originDestinations = originDestinations;

			defer.resolve(argumentsPackage);
		} else {
			OriginDestination.create(originDestinations)
			.then(function(err) {
				// var originDestinations = Array.prototype.slice.call(arguments);
				argumentsPackage.originDestinations = originDestinations;

				defer.resolve(argumentsPackage);
			});
		}
		
	});

	return defer.promise;
}

/**
 * 
 * Writes output Passenger OriginDestinations into a csv file.
 * 
 */

function createOriginDestinationFile(argumentsPackage) {
	var defer = Q.defer();
		
	var batchDirectory = argumentsPackage.batchDirectory;
	var inputFilename = argumentsPackage.inputFilename;

	var originDestinations = argumentsPackage.originDestinations;

	originDestinationToCsvService.process(originDestinations)
	.then(function(originDestinationCsvs) {
		csv()
		.from.array(originDestinationCsvs)
		.to.path(OUTPUT_DIR + batchDirectory + '/' + inputFilename + OD_FILE_SUFFIX)
		.on('close', function() {
			console.log("create OriginDestination");

			argumentsPackage.originDestinations = originDestinations;

			defer.resolve(argumentsPackage);
		});		
	});

	return defer.promise;
}

/**
 * 
 * Processes OriginDestinations into BoardingAlightings.
 * 
 */

function processBoardingAlightings(argumentsPackage) {
	var defer = Q.defer();

	var originDestinations = argumentsPackage.originDestinations;

	var boardingAlightings = boardingAlightingService.process(originDestinations);

	if (_createHourlyStats) {
		argumentsPackage.boardingAlightings = boardingAlightings;

		defer.resolve(argumentsPackage);
	} else {
		BoardingAlighting.create(boardingAlightings)
		.then(function(results) {
			// var boardingAlightings = Array.prototype.slice.call(arguments);
			argumentsPackage.boardingAlightings = boardingAlightings;

			defer.resolve(argumentsPackage);
		});		
	}

	return defer.promise;
}

/**
 * 
 * Writes output BoardingAlightings into a csv file.
 * 
 */

function createBoardingAlightingFile(argumentsPackage) {
	var defer = Q.defer();
		
	var batchDirectory = argumentsPackage.batchDirectory;
	var inputFilename = argumentsPackage.inputFilename;

	var boardingAlightings = argumentsPackage.boardingAlightings;

	boardingAlightingToCsvService.process(boardingAlightings)
	.then(function(boardingAlightingCsvs) {
		csv()
		.from.array(boardingAlightingCsvs)
		.to.path(OUTPUT_DIR + batchDirectory + '/' + inputFilename + BA_FILE_SUFFIX)
		.on('close', function() {
			console.log("created BoardingAlighting");

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

/**
 * 
 * Processes SeatData and SpeedRecords into HourlyStatistics.
 * 
 */

function processHourlyStatistics(argumentsPackage) {
	var defer = Q.defer();

	var route = argumentsPackage.route;
	var speedProfile = argumentsPackage.speedProfile;
	// var originDestinations = argumentsPackage.originDestinations;
	var boardingAlightings = argumentsPackage.boardingAlightings;
	var sampleNumber = argumentsPackage.sampleNumber;
	var surveyData = argumentsPackage.surveyData;

	hourlyStatsService.process(route, speedProfile, boardingAlightings, sampleNumber, surveyData)
	.then(function(statsByTheHour) {
		argumentsPackage.statsByTheHour = statsByTheHour;	

		defer.resolve(argumentsPackage);
	});

	return defer.promise;
}

/**
 * 
 * Writes output HourlyStatistics into a csv file.
 * 
 */

function createHourlyStatisticsFile(argumentsPackage) {
	var defer = Q.defer();
	
	var batchDirectory = argumentsPackage.batchDirectory;
	var inputFilename = argumentsPackage.inputFilename;
	var statsByTheHour = argumentsPackage.statsByTheHour;

	csv()
	.from.array(statsByTheHour)
	.to.path(OUTPUT_DIR + batchDirectory + '/' + inputFilename + HOURLY_STATS_FILE_SUFFIX)
	.on('close', function() {
		console.log("created HourlyStatistics");

		defer.resolve(argumentsPackage);
	});	

	return defer.promise;
}
