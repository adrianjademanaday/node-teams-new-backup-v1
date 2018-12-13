// IMPORTS

const SERVER_ROOT = './../../..';

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');
var RouteStop = mongoose.model('RouteStop');

var Q = require('q');


// SERVICE FUNCTIONS

/**
 * 
 * Maps points of SurveyData into their corresponding Passenger AreaStop
 * to create candidate Passenger RouteStops.
 * Filters out candidate Passenger RouteStops with the same Passenger AreaStop.
 * 
 */

exports.process = function(argumentsPackage) {
	var routeStops = [];
	var defer = Q.defer();

	var areaId = argumentsPackage.areaId;
	var allSurveyDataPoints = argumentsPackage.allSurveyDataPoints;

	Area.findById(areaId).populate('areaStops').exec(function(err, area) {
		var includedAreaStops = [];
		var saveTasks = [];
		var count = 0;

		allSurveyDataPoints.forEach(function(p) {
			var nearestAreaStop = p.findNearestPoint(area.areaStops);

			if (includedAreaStops.indexOf(nearestAreaStop) === -1) {
				count++;

				var routeStop = new RouteStop({
					name: 'RS-' + count,
					longName: 'Long RS-' + count,
					order: 0,
					areaStop: nearestAreaStop
				});

				routeStops.push(routeStop);
				includedAreaStops.push(nearestAreaStop);
			}	
		});		

		argumentsPackage.routeStops = routeStops;

		defer.resolve(argumentsPackage);
	});

	return defer.promise;
};