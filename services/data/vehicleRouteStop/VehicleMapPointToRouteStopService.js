// IMPORTS

const SERVER_ROOT = './../../..';

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');
var VehicleRouteStop = mongoose.model('VehicleRouteStop');

var Q = require('q');


// SERVICE FUNCTIONS

/**
 * 
 * Maps points of SurveyData into their corresponding Vehicle AreaStop
 * to create candidate Vehicle RouteStops.
 * Filters out candidate Vehicle RouteStops with the same Vehicle AreaStop.
 * 
 */

exports.process = function(argumentsPackage) {
	var vehicleRouteStops = [];
	var defer = Q.defer();

	var areaId = argumentsPackage.areaId;
	var allSurveyDataPoints = argumentsPackage.allSurveyDataPoints;

	Area.findById(areaId).populate('vehicleAreaStops').exec(function(err, area) {
		var includedVehicleAreaStops = [];
		var saveTasks = [];
		var count = 0;

		allSurveyDataPoints.forEach(function(p) {
			var nearestVehicleAreaStop = p.findNearestPoint(area.vehicleAreaStops);

			if (includedVehicleAreaStops.indexOf(nearestVehicleAreaStop) === -1) {
				count++;

				var vehicleRouteStop = new VehicleRouteStop({
					name: 'RS-' + count,
					longName: 'Long RS-' + count,
					order: 0,
					vehicleAreaStop: nearestVehicleAreaStop
				});

				vehicleRouteStops.push(vehicleRouteStop);
				includedVehicleAreaStops.push(nearestVehicleAreaStop);
			}	
		});		

		argumentsPackage.vehicleRouteStops = vehicleRouteStops;

		defer.resolve(argumentsPackage);
	});

	return defer.promise;
};