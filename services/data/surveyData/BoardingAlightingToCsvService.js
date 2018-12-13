// IMPORTS

var Q = require('q');
var moment = require('moment');
var mongoose = require('mongoose-q')();

var BoardingAlighting = mongoose.model('BoardingAlighting');
var OriginDestination = mongoose.model('OriginDestination');
var RouteStop = mongoose.model('RouteStop');
var AreaStop = mongoose.model('AreaStop');


// CONSTANTS

const TIME_FORMAT = 'HH:mm:ss';

const BOARDING_ALIGHTING_HEADER = '\"Boarding/Alighting\"';
const STOP_NAME = '\"Stop Name\"';
const LAT_HEADER = '\"Lat\"';
const LNG_HEADER = '\"Lng\"';
const TIME_HEADER = '\"Time\"';


// SERVICE FUNCTIONS

/**
 * 
 * Creates csv data from Passenger BoardingAlightings
 * 
 */

module.exports.process = function(boardingAlightings) {
	var defer = Q.defer();

	var csvArray = [];

	var header = [];
	header.push(BOARDING_ALIGHTING_HEADER);
	header.push(STOP_NAME);
	header.push(LAT_HEADER);
	header.push(LNG_HEADER);
	header.push(TIME_HEADER);
	csvArray.push(header);

	RouteStop.populate(boardingAlightings, 'routeStop', function(err, boardingAlightings) {
		AreaStop.populate(boardingAlightings, 'routeStop.areaStop', function(err, boardingAlightings) {
			boardingAlightings.forEach(function(ba) {
				var csv = [];
				csv.push(ba.direction);
				csv.push(ba.routeStop.areaStop.name);
				csv.push(ba.routeStop.areaStop.lat);
				csv.push(ba.routeStop.areaStop.lng);
				csv.push(moment(ba.timeStamp).format(TIME_FORMAT));
				csvArray.push(csv);
			});

			defer.resolve(csvArray);
		});
	});	

	return defer.promise;
}