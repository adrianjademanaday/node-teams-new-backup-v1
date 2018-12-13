const SERVER_ROOT = './../..';
var Q = require('q');
var fs = require('fs');
var csv = require('csv');
var path = require('path');
var moment = require('moment');

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');
var VehicleAreaStop = mongoose.model('VehicleAreaStop');
var Route = mongoose.model('Route');
var VehicleRouteStop = mongoose.model('VehicleRouteStop');
var VehicleOriginDestination = mongoose.model('VehicleOriginDestination');

const OUTPUT_DIR = DATA_DIR + 'downloads/';

/**
 * 
 * Shows the query page for Vehicle OD Matrix Report.
 * 
 */

exports.show = function(req, res) {
	Area.find({}, null, {sort: {name: 1}}, function(err, areas) {
		res.render('reports/vehicleOdMatrix/show', {
			areas: areas,
	 		routes: [],
	 		routeId: null,
	 		hour: null,
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

	var routeId = req.body.routeId;
	var hour = req.body.hour;
	var outputFilename = req.body.outputFilename;

	var batchDirectory = outputFilename + '-' + new Date().getTime().toString();; // add timestamp to temp directory name
	var outputFilePath = OUTPUT_DIR + outputFilename + '-' + hour + '-vodMatrix.csv';

	if (!fs.existsSync(OUTPUT_DIR + batchDirectory)) {
		fs.mkdirSync(OUTPUT_DIR + batchDirectory);	
	}

	var argumentsPackage = {
		routeId: routeId,
		hour: hour,
		outputFilePath: outputFilePath
	};

	getRouteDetails(argumentsPackage)
	.then(getVehicleRouteStopsDetails)
	.then(processVehicleOdMatrix)
	.then(createVehicleOdMatrixFile)
	.then(function() {
		while(!path.existsSync(outputFilePath));

		res.download(outputFilePath);
	});
}

/**
 * 
 * Writes the files under the given directory into a zip file.
 * 
 */

function outputZipFile(batchDirectory, outputZipFilePath) {
	var outputZip = new Zip();
 
  outputZip.addLocalFolder(OUTPUT_DIR + batchDirectory);  
  outputZip.writeZip(OUTPUT_DIR + outputZipFilePath);
}

/**
 * 
 * Gets the Route data from the database given the routeId. 
 * 
 */

function getRouteDetails(argumentsPackage) {
	var defer = Q.defer();

	var routeId = argumentsPackage.routeId;

	Route.findByIdQ(routeId)
	.then(function(route) {
		argumentsPackage.route = route;

		defer.resolve(argumentsPackage);
	});

	return defer.promise;
}

/**
 * 
 * Gets the Vehicle RouteStop data from the database given the routeId. 
 * 
 */

function getVehicleRouteStopsDetails(argumentsPackage) {
	var defer = Q.defer();

	var route = argumentsPackage.route;

	VehicleRouteStop.find({route: route}, null, {sort: {name: 1}}, function(err, vehicleRouteStops) {
	  opts = {
	    path: 'vehicleAreaStop',
	  	select: 'name lat lng'  	
	  }

	  VehicleAreaStop.populate(vehicleRouteStops, opts, function(err, vehicleRouteStops) {
	  	vehicleRouteStops.sort(function(a, b) {return Number(a.vehicleAreaStop.name) - Number(b.vehicleAreaStop.name)});

	  	argumentsPackage.vehicleRouteStops = vehicleRouteStops;

	  	defer.resolve(argumentsPackage);
	  });
	});

	return defer.promise;
}

/**
 * 
 * Creates the Vehicle OD Matrix from processed Passenger OriginDestinations data. 
 * 
 */

function processVehicleOdMatrix(argumentsPackage) {
	var defer = Q.defer();

	var route = argumentsPackage.route;
	var vehicleRouteStops = argumentsPackage.vehicleRouteStops;
	var hour = argumentsPackage.hour;	

	var expectedVehicleOdResults = vehicleRouteStops.length * vehicleRouteStops.length;

	var vehicleOdMatrix = createVehicleOdMatrix(vehicleRouteStops);				
	var resultsCount = 0;

	vehicleRouteStops.forEach(function(vrsRow, rowIndex) {
		vehicleRouteStops.forEach(function(vrsColumn, columnIndex) {
			VehicleOriginDestination.find({origin: vrsRow, destination: vrsColumn, originHour: hour}, null, null, function(err, vehicleOriginDestinations) {
				
				vehicleOdMatrix[rowIndex + 1][columnIndex + 1] = vehicleOriginDestinations.length;
				resultsCount++;

				if (resultsCount === expectedVehicleOdResults) {
					argumentsPackage.vehicleOdMatrix = vehicleOdMatrix;

					defer.resolve(argumentsPackage);					
				}
			});
		});
	});

	return defer.promise;
}

/**
 * 
 * Prepares the Vehicle OD Matrix csv.
 * 
 */

function createVehicleOdMatrix(vehicleRouteStops) {
	var vehicleOdMatrix = new Array(vehicleRouteStops.length + 1);

	for (var i = 0; i < vehicleRouteStops.length + 1; i++) {
		vehicleOdMatrix[i] = new Array(vehicleRouteStops.length + 1);
	}

	addColumnHeaders(vehicleRouteStops, vehicleOdMatrix);
	addRowHeaders(vehicleRouteStops, vehicleOdMatrix);

	return vehicleOdMatrix;
}

/**
 * 
 * Adds the column header data into the Vehicle OD Matrix csv. 
 * 
 */

function addColumnHeaders(vehicleRouteStops, vehicleOdMatrix) {
	vehicleRouteStops.forEach(function(vrs, index) {
		vehicleOdMatrix[0][index + 1] = vrs.vehicleAreaStop.name;
	});
}

/**
 * 
 * Adds the row header data into the OD Matrix csv. 
 * 
 */

function addRowHeaders(vehicleRouteStops, vehicleOdMatrix) {
	vehicleRouteStops.forEach(function(vrs, index) {
		vehicleOdMatrix[index + 1][0] = vrs.vehicleAreaStop.name; // NOTE: first row is column headers so start with second row for row headers	
	});	
}

/**
 * 
 * Create the actual Vehicle OD Matrix csv file. 
 * 
 */

function createVehicleOdMatrixFile(argumentsPackage) {
	var defer = Q.defer();

	var outputFilePath = argumentsPackage.outputFilePath;
	
	for (var hour = 1; hour <= 24; hour++) {
		var vehicleOdMatrix = argumentsPackage.vehicleOdMatrix
		
		csv()
		.from.array(vehicleOdMatrix)
		.to.path(outputFilePath)
		.on('close', function() {
			defer.resolve(argumentsPackage);
		});	
	}

	return defer.promise;
}