// IMPORTS

const SERVER_ROOT = './../../..';
var sensorToSeatParserService = require(SERVER_ROOT + '/services/data/SensorToSeatParserService');
var surveyDataCleanerService = require(SERVER_ROOT + '/services/data/SurveyDataCleanerService');
var vehicleStopPointsFromSurveyDataService = require(SERVER_ROOT + '/services/data/VehicleStopPointsFromSurveyDataService');
var generateGridService = require(SERVER_ROOT + '/services/data/areaStop/GenerateGridService');
var filterGridService = require(SERVER_ROOT + '/services/data/areaStop/FilterGridService');
var snapPointToRoadService = require(SERVER_ROOT + '/services/data/areaStop/SnapPointToRoadService');

var zipService = require(SERVER_ROOT + '/services/ZipService');
var csvService = require(SERVER_ROOT + '/services/CsvService');

var Grid = require(SERVER_ROOT + '/models/Grid');

var moment = require('moment');
var Q = require('q');
var mongoose = require('mongoose-q')();

var VehicleAreaStop = mongoose.model('VehicleAreaStop');
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
		var points = vehicleStopPointsFromSurveyDataService.process(surveyData);

		allSurveyDataPoints = allSurveyDataPoints.concat(points);
	});

	argumentsPackage.allSurveyDataPoints = allSurveyDataPoints;

	return argumentsPackage;	
}

/**
 * 
 * Generates grids from given Area top left and bottom right bounds.
 * Cluster extracted points into grids and compute its centroid.
 * Each centroid is a candidate Vehicle AreaStop.
 * A candidate Vehicle AreaStop is saved into the database if there is
 * no matching Vehicle AreaStop with the same coordinates.
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

	saveVehicleAreaStops(argumentsPackage)
	.then(function(argumentsPackage) {
		defer.resolve(argumentsPackage);
	}); 

	return defer.promise;
}

/**
 * 
 * Checks whether a candidate Vehicle AreaStop has no matching Vehicle AreaStop
 * with the same coordinates. If it has none then it is saved
 * into the database.
 * 
 */

function saveVehicleAreaStops(argumentsPackage) {
	var defer = Q.defer();

	var vehicleAreaStopsToCreate = [];	
	
	var area = argumentsPackage.area;
	var centroids = argumentsPackage.originalCentroids;

	var opts = {
    path: 'vehicleAreaStops',
  	select: 'lat lng gridNumber pointCount'  	
  }

  VehicleAreaStop.populateQ(area, opts)
  .then(function(area) {
  	centroids.forEach(function(c) {
  		var matchingVehicleAreaStop = null;

  		area.vehicleAreaStops.forEach(function(vas) {
	  		if (c.gridNumber === vas.gridNumber) {
	  			matchingVehicleAreaStop = vas;
	  			return;
	  		}
	  	});

	  	if (matchingVehicleAreaStop != null) {
  			var totalLat = (matchingVehicleAreaStop.lat * matchingVehicleAreaStop.pointCount) + (c.lat * c.pointCount);
  			var totalLng = (matchingVehicleAreaStop.lng * matchingVehicleAreaStop.pointCount) + (c.lng * c.pointCount);

  			matchingVehicleAreaStop.lat = totalLat / (matchingVehicleAreaStop.pointCount + c.pointCount);
  			matchingVehicleAreaStop.lng = totalLng / (matchingVehicleAreaStop.pointCount + c.pointCount);
  			matchingVehicleAreaStop.pointCount += c.pointCount;
  			matchingVehicleAreaStop.save();  			
  		} else {
  			var vehicleAreaStop = new VehicleAreaStop();

				vehicleAreaStop.name = 'CS-' + c.gridNumber;
				vehicleAreaStop.area = area;
				vehicleAreaStop.longName = vehicleAreaStop.name;
				vehicleAreaStop.lat = c.lat;
				vehicleAreaStop.lng = c.lng;
				vehicleAreaStop.gridNumber = c.gridNumber;
				vehicleAreaStop.pointCount = 1;

				vehicleAreaStopsToCreate.push(vehicleAreaStop);
				area.vehicleAreaStops.push(vehicleAreaStop);
				vehicleAreaStop.save();				
  		}
  	});		  	

  	VehicleAreaStop.create(vehicleAreaStopsToCreate, function(err) {
  		area.markModified('vehicleAreaStops');
  		area.save(defer.resolve(argumentsPackage))			
		});
  });

	return defer.promise;
}
