// IMPORTS

const SERVER_ROOT = './../../..';
var sensorToSeatParserService = require(SERVER_ROOT + '/services/data/SensorToSeatParserService');
var surveyDataCleanerService = require(SERVER_ROOT + '/services/data/SurveyDataCleanerService');
var boardingAlightingPointsFromSurveyDataService = require(SERVER_ROOT + '/services/data/BoardingAlightingPointsFromSurveyDataService');
var generateGridService = require(SERVER_ROOT + '/services/data/areaStop/GenerateGridService');
var filterGridService = require(SERVER_ROOT + '/services/data/areaStop/FilterGridService');
var snapPointToRoadService = require(SERVER_ROOT + '/services/data/areaStop/SnapPointToRoadService');

var zipService = require(SERVER_ROOT + '/services/ZipService');
var csvService = require(SERVER_ROOT + '/services/CsvService');

var Grid = require(SERVER_ROOT + '/models/Grid');

var moment = require('moment');
var Q = require('q');
var mongoose = require('mongoose-q')();

var AreaStop = mongoose.model('AreaStop');
var Area = mongoose.model('Area');


// SERVICE FUNCTIONS

/**
 * 
 * Creates and saves Pasenger AreaStops from survey data in zip files.
 * 
 */

module.exports.process = function(argumentsPackage) {
	var defer = Q.defer();

	getAreaDetails(argumentsPackage)	
	.then(function(argumentsPackage) {
		argumentsPackage = extractPointsFromZipFiles(argumentsPackage);

		processUpload(argumentsPackage)
		.then(defer.resolve);
	});	
 	
 	return defer.promise;
}


// PRIVATE FUNCTIONS

/**
 * 
 * Get the other fields of given Area from the database
 * 
 */

function getAreaDetails(argumentsPackage) {
	var defer = Q.defer();

	var areaId = argumentsPackage.areaId;

	Area.findByIdQ(areaId)
	.then(function(area) {
		argumentsPackage.area = area;

		defer.resolve(argumentsPackage);
	});

	return defer.promise;
}

/**
 * 
 * Extracts raw GPS coordaintes from zip files
 * 
 */

function extractPointsFromZipFiles(argumentsPackage) {
	var zipPath = argumentsPackage.zipPath;
	
	var allSurveyDataPoints = [];
	var fileDetails = zipService.zipToString(zipPath);	
	var seatConfigurationId = argumentsPackage.seatConfigurationId;		
	
	fileDetails.forEach(function(fd, index) {
		var surveyDataCsv = csvService.stringToArray(fd.fileContent);		
		var surveyData = sensorToSeatParserService.process(surveyDataCsv, seatConfigurationId);
		var points = boardingAlightingPointsFromSurveyDataService.process(surveyData);

		allSurveyDataPoints = allSurveyDataPoints.concat(points);
	});

	argumentsPackage.allSurveyDataPoints = allSurveyDataPoints;

	return argumentsPackage;	
}

/**
 * 
 * Generates grids from given Area top left and bottom right bounds.
 * Cluster extracted points into grids and compute its centroid.
 * Each centroid is a candidate Passenger AreaStop.
 * A candidate Passenger AreaStop is saved into the database if there is
 * no matching Passenger AreaStop with the same coordinates.
 * 
 */

function processUpload(argumentsPackage) {
	var defer = Q.defer();

	var topLeftBounds = argumentsPackage.topLeftBounds;
	var bottomRightBounds = argumentsPackage.bottomRightBounds;
	var allSurveyDataPoints = argumentsPackage.allSurveyDataPoints;

	var center = Grid.computeCenter(topLeftBounds, bottomRightBounds);
 	var grids = generateGridService.generateGrids(topLeftBounds, bottomRightBounds);	

	var filteredGrids = filterGridService.process(grids, allSurveyDataPoints);
	var originalCentroids = snapPointToRoadService.processOriginalCentroids(filteredGrids);
	var snappedCentroids = snapPointToRoadService.processSnappedCentroids(filteredGrids);
	
	argumentsPackage.center = center;
	argumentsPackage.grids = grids;
	argumentsPackage.filteredGrids = filteredGrids;
	argumentsPackage.originalCentroids = originalCentroids;
	argumentsPackage.snappedCentroids = snappedCentroids;

	saveAreaStops(argumentsPackage)
	.then(function(argumentsPackage) {
		defer.resolve(argumentsPackage);
	}); 

	return defer.promise;
}

/**
 * 
 * Checks whether a candidate Passenger AreaStop has no matching Passenger AreaStop
 * with the same coordinates. If it has none then it is saved
 * into the database.
 * 
 */

function saveAreaStops(argumentsPackage) {
	var defer = Q.defer();

	var areaStopsToCreate = [];	
	var areaStopsToUpdate = [];

	var area = argumentsPackage.area;
	var centroids = argumentsPackage.originalCentroids;

	var opts = {
    path: 'areaStops',
  	select: 'lat lng gridNumber pointCount'  	
  }

  AreaStop.populateQ(area, opts)
  .then(function(area) {
  	centroids.forEach(function(c) {
  		var hasMatchingAreaStop = false;
  		var matchingAreaStop = null;

  		area.areaStops.forEach(function(as) {
	  		if (c.gridNumber === as.gridNumber) {
	  			matchingAreaStop = as;
	  			return;
	  		}
	  	});

	  	if (matchingAreaStop != null) {
  			var totalLat = (matchingAreaStop.lat * matchingAreaStop.pointCount) + (c.lat * c.pointCount);
  			var totalLng = (matchingAreaStop.lng * matchingAreaStop.pointCount) + (c.lng * c.pointCount);

  			matchingAreaStop.lat = totalLat / (matchingAreaStop.pointCount + c.pointCount);
  			matchingAreaStop.lng = totalLng / (matchingAreaStop.pointCount + c.pointCount);
  			matchingAreaStop.pointCount += c.pointCount;
  			matchingAreaStop.save();  			
  		} else {
  			var areaStop = new AreaStop();

				areaStop.name = 'CS-' + c.gridNumber;
				areaStop.area = area;
				areaStop.longName = areaStop.name;
				areaStop.lat = c.lat;
				areaStop.lng = c.lng;
				areaStop.gridNumber = c.gridNumber;
				areaStop.pointCount = 1;

				areaStopsToCreate.push(areaStop);
				area.areaStops.push(areaStop);
				areaStop.save();				
  		}
  	});		  	

  	AreaStop.create(areaStopsToCreate, function(err) {
  		area.markModified('areaStops');
  		area.save(defer.resolve(argumentsPackage))			
		});
  });

  return defer.promise;
}