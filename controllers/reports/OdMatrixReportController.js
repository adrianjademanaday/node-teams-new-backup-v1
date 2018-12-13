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
 * Shows the query page for Passenger OD Matrix Report.
 * 
 */

exports.show = function(req, res) {
	Area.find({}, null, {sort: {name: 1}}, function(err, areas) {
		res.render('reports/odMatrix/show', {
			areas: areas,
	 		routes: [],
	 		routeId: null,
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
	var outputFilePath = OUTPUT_DIR + outputFilename + '-' + hour + '-odMatrix.csv';


	if (!fs.existsSync(OUTPUT_DIR + batchDirectory)) {
		fs.mkdirSync(OUTPUT_DIR + batchDirectory);	
	}

	var argumentsPackage = {
		routeId: routeId,
		hour: hour,
		outputFilePath: outputFilePath
	};

	getRouteDetails(argumentsPackage)
	.then(getRouteStopsDetails)
	.then(processOdMatrix)
	.then(createOdMatrixFile)
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
 * Gets the Passenger RouteStop data from the database given the routeId. 
 * 
 */

function getRouteStopsDetails(argumentsPackage) {
	var defer = Q.defer();

	var route = argumentsPackage.route;

	RouteStop.find({route: route}, null, {sort: {name: 1}}, function(err, routeStops) {
	  opts = {
	    path: 'areaStop',
	  	select: 'name lat lng'  	
	  }

	  AreaStop.populate(routeStops, opts, function(err, routeStops) {
	  	routeStops.sort(function(a, b) {return Number(a.areaStop.name) - Number(b.areaStop.name)});
	  	
	  	argumentsPackage.routeStops = routeStops;

	  	defer.resolve(argumentsPackage);
	  });
	});

	return defer.promise;
}

/**
 * 
 * Creates the Passenger OD Matrix from processed Passenger OriginDestinations data. 
 * 
 */

function processOdMatrix(argumentsPackage) {
	var defer = Q.defer();

	var route = argumentsPackage.route;
	var routeStops = argumentsPackage.routeStops;
	var hour = argumentsPackage.hour;	

	var odMatrix = createOdMatrix(routeStops);
	var expectedOdResults = routeStops.length * routeStops.length;
	var resultsCount = 0;

	routeStops.forEach(function(rsRow, rowIndex) {
		routeStops.forEach(function(rsColumn, columnIndex) {
			OriginDestination.find({origin: rsRow, destination: rsColumn, hour: hour}, null, null, function(err, originDestinations) {
				odMatrix[rowIndex + 1][columnIndex + 1] = originDestinations.length;
				resultsCount++;

				if (resultsCount === expectedOdResults) {
					argumentsPackage.odMatrix = odMatrix;

					defer.resolve(argumentsPackage);
				}
			});
		});
	});

	return defer.promise;
}

/**
 * 
 * Prepares the Passenger OD Matrix csv.
 * 
 */

function createOdMatrix(routeStops) {
	var odMatrix = new Array(routeStops.length + 1);

	for (var i = 0; i < routeStops.length + 1; i++) {
		odMatrix[i] = new Array(routeStops.length + 1);
	}

	addColumnHeaders(routeStops, odMatrix);
	addRowHeaders(routeStops, odMatrix);

	return odMatrix;
}

/**
 * 
 * Adds the column header data into the Passenger OD Matrix csv. 
 * 
 */

function addColumnHeaders(routeStops, odMatrix) {
	routeStops.forEach(function(rs, index) {
		odMatrix[0][index + 1] = rs.areaStop.name;
	});
}

/**
 * 
 * Adds the row header data into the OD Matrix csv. 
 * 
 */

function addRowHeaders(routeStops, odMatrix) {
	routeStops.forEach(function(rs, index) {
		odMatrix[index + 1][0] = rs.areaStop.name; // NOTE: first row is column headers so start with second row for row headers	
	});	
}

/**
 * 
 * Create the actual Passenger OD Matrix csv file. 
 * 
 */

function createOdMatrixFile(argumentsPackage) {
	var defer = Q.defer();

	var odMatrix = argumentsPackage.odMatrix;
	var outputFilePath = argumentsPackage.outputFilePath;
	
	csv()
	.from.array(odMatrix)
	.to.path(outputFilePath)
	.on('close', function() {
		defer.resolve(argumentsPackage);
	});	

	return defer.promise;
}