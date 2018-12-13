// IMPORTS

var Q = require('q');
var mongoose = require('mongoose-q')();
var moment = require('moment');

var VehicleOriginDestination = mongoose.model('VehicleOriginDestination');
var VehicleRouteStop = mongoose.model('VehicleRouteStop');
var VehicleAreaStop = mongoose.model('VehicleAreaStop');


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
 *  Creates csv data from Vehicle OriginDestinations
 * 
 */

module.exports.process = function(vehicleOriginDestinations) {
	var defer = Q.defer();
	var csvArray = [];

	VehicleRouteStop.populate(vehicleOriginDestinations, 'origin destination', function(err, vehicleOriginDestinations) {
		VehicleAreaStop.populate(vehicleOriginDestinations, 'origin.vehicleAreaStop destination.vehicleAreaStop', function(err, originDestinations) {

			var header = [];
			header.push(ORIGIN_NAME_HEADER);
			header.push(ORIGIN_LAT_HEADER);
			header.push(ORIGIN_LNG_HEADER);
			header.push(ORIGIN_TIME_HEADER);
			header.push(DESTINATION_NAME_HEADER);
			header.push(DESTINATION_LAT_HEADER);
			header.push(DESTINATION_LNG_HEADER);
			header.push(DESTINATION_TIME_HEADER);
			csvArray.push(header);

			vehicleOriginDestinations.forEach(function(vod) {
				var csv = [];
				csv.push(vod.origin.vehicleAreaStop.name);
				csv.push(vod.origin.vehicleAreaStop.lat);
				csv.push(vod.origin.vehicleAreaStop.lng);
				csv.push(moment(vod.originTimeStamp).format(TIME_FORMAT));
				csv.push(vod.destination.vehicleAreaStop.name);
				csv.push(vod.destination.vehicleAreaStop.lat);
				csv.push(vod.destination.vehicleAreaStop.lng);
				csv.push(moment(vod.destinationTimeStamp).format(TIME_FORMAT));
				csvArray.push(csv);
			});

			defer.resolve(csvArray);
		});
	});
	
	return defer.promise;
}