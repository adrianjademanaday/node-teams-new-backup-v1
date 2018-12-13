const SERVER_ROOT = './../..';
var Q = require('q');
var fs = require('fs');
var csv = require('csv');
var path = require('path');

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');
var AreaStop = mongoose.model('AreaStop');
var Route = mongoose.model('Route');
var RouteStop = mongoose.model('RouteStop');
var OriginDestination = mongoose.model('OriginDestination');

const OUTPUT_DIR = DATA_DIR + 'downloads/';

/**
 * 
 * Shows the query page for Passenger Area Stops Report.
 * 
 */

exports.show = function(req, res) {
	Area.find({}, null, {sort: {name: 1}}, function(err, areas) {
		res.render('reports/areaStops/show', {
			areas: areas,
	 		areaId: null,
	 		outputFilename: null
	 	});	
	});
};

/**
 * 
 * Handles the request for fetching the
 * queried report from the database.
 * 
 */

exports.fetch = function(req, res) {
	res.connection.setTimeout(0);

	var areaId = req.body.areaId;
	var outputFilename = req.body.outputFilename;

	var batchDirectory = outputFilename + '-' + new Date().getTime().toString();; // add timestamp to temp directory name
	var outputFilePath = OUTPUT_DIR + batchDirectory + '/' + outputFilename + '-areaStops.csv';

	if (!fs.existsSync(OUTPUT_DIR + batchDirectory)) {
		fs.mkdirSync(OUTPUT_DIR + batchDirectory);	
	}

	var argumentsPackage = {
		areaId: areaId,
		outputFilePath: outputFilePath
	};

	getAreaDetails(argumentsPackage)
	.then(getAreaStopsDetails)
	.then(processAreaStops)
	.then(createAreaStopsFile)
	.then(function() {
		while(!path.existsSync(outputFilePath));

		res.download(outputFilePath);
	});
}

/**
 * 
 * Fetches the Area data given the areaId.
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
 * Fetches the Passenger Area Stops data of a given area.
 * 
 */

function getAreaStopsDetails(argumentsPackage) {
	var defer = Q.defer();

	var area = argumentsPackage.area;

	AreaStop.find({area: area}, null, {sort: {name: 1}}, function(err, areaStops) {
	  argumentsPackage.areaStops = areaStops;

	  defer.resolve(argumentsPackage);
	});

	return defer.promise;
}

/**
 * 
 * Creates Passenger AreaStop csv data from AreaStops data.
 * 
 */

function processAreaStops(argumentsPackage) {
	var areaStops = argumentsPackage.areaStops;
	var areaStopsCsv = new Array(areaStops.length);

	areaStops.forEach(function(as) {
		var row = new Array(3);

		row[0] = as.name;
		row[1] = as.lat;
		row[2] = as.lng;

		areaStopsCsv.push(row);
	});

	argumentsPackage.areaStopsCsv = areaStopsCsv;

	return argumentsPackage;
}

/**
 * 
 * Create the actual Passenger AreaStop csv file.
 * 
 */

function createAreaStopsFile(argumentsPackage) {
	var defer = Q.defer();

	var areaStopsCsv = argumentsPackage.areaStopsCsv;
	var outputFilePath = argumentsPackage.outputFilePath;
	
	console.log(outputFilePath);

	csv()
	.from.array(areaStopsCsv)
	.to.path(outputFilePath)
	.on('close', function() {
		defer.resolve(argumentsPackage);
	});	

	return defer.promise;
}