// IMPORTS

var Q = require('q');
var mongoose = require('mongoose-q')();
var moment = require('moment');

var OriginDestination = mongoose.model('OriginDestination');
var RouteStop = mongoose.model('RouteStop');
var AreaStop = mongoose.model('AreaStop');


// CONSTANTS

const SEAT_NUMBER_OFFSET = 1;
const TIME_FORMAT = 'HH:mm:ss';

const SEAT_HEADER = 'Seat';
const ORIGIN_NAME_HEADER = '\"Origin\"';
const ORIGIN_LAT_HEADER = '\"Origin Lat\"';
const ORIGIN_LNG_HEADER = '\"Origin Lng\"';
const ORIGIN_TIME_HEADER = '\"Origin Time\"';
const DESTINATION_NAME_HEADER = '\"Destination\"';
const DESTINATION_LAT_HEADER = '\"Destination Lat\"';
const DESTINATION_LNG_HEADER = '\"Destination Lng\"';
const DESTINATION_TIME_HEADER = '\"Destination Time\"';


// SERVICE FUNCTIONS

/**
 * 
 *  Creates csv data from Passenger OriginDestinations
 * 
 */

module.exports.process = function(originDestinations) {
	var defer = Q.defer();
	var csvArray = [];

	RouteStop.populate(originDestinations, 'origin destination', function(err, originDestinations) {
		AreaStop.populate(originDestinations, 'origin.areaStop destination.areaStop', function(err, originDestinations) {

			var header = [];
			header.push(SEAT_HEADER);
			header.push(ORIGIN_NAME_HEADER);
			header.push(ORIGIN_LAT_HEADER);
			header.push(ORIGIN_LNG_HEADER);
			header.push(ORIGIN_TIME_HEADER);
			header.push(DESTINATION_NAME_HEADER);
			header.push(DESTINATION_LAT_HEADER);
			header.push(DESTINATION_LNG_HEADER);
			header.push(DESTINATION_TIME_HEADER);
			csvArray.push(header);

			originDestinations.forEach(function(od) {
				var csv = [];
				csv.push((od.seatNumber + SEAT_NUMBER_OFFSET));
				csv.push(od.origin.areaStop.name);
				csv.push(od.origin.areaStop.lat);
				csv.push(od.origin.areaStop.lng);
				csv.push(moment(od.originTimeStamp).format(TIME_FORMAT));
				csv.push(od.destination.areaStop.name);
				csv.push(od.destination.areaStop.lat);
				csv.push(od.destination.areaStop.lng);
				csv.push(moment(od.destinationTimeStamp).format(TIME_FORMAT));
				csvArray.push(csv);
			});

			defer.resolve(csvArray);
		});
	});
	
	return defer.promise;
}