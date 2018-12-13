// IMPORTS

const SERVER_ROOT = './../..';
var LatLng = require(SERVER_ROOT + '/models/LatLng');
var TricycleSurveyData = require(SERVER_ROOT + '/models/TricycleSurveyData');

var Base = require('basejs');


// CONSTANTS

const NUMBER_OF_SEATS = 5; // maximum number of seats in a tricycle
const SEAT_1_INDEX = 1; // index of the first seat

const MAX_SENSOR_READINGS = 7; // 
const MIN_ON_COUNT_NEEDED = 4;
const MIN_OFF_COUNT_NEEDED = 4;

module.exports.NUMBER_OF_SEATS = NUMBER_OF_SEATS;
module.exports.SEAT_1_INDEX = SEAT_1_INDEX;

module.exports.MAX_SENSOR_READINGS = MAX_SENSOR_READINGS;
module.exports.MIN_ON_COUNT_NEEDED = MIN_ON_COUNT_NEEDED;
module.exports.MIN_OFF_COUNT_NEEDED = MIN_OFF_COUNT_NEEDED;


// SERVICE FUNCTIONS

/**
 * 
 * Extracts gps coordinates from survey data.
 * Used for displaying the gps trace of a sample.
 * 
 */

module.exports.process = function(surveyData) {
	
	var origin = [null, null, null, null, null, null];
	var latLngs = [];

	surveyData.forEach(function(sd) {

		var latLng = new LatLng(sd.lat, sd.lng);
		latLngs.push(latLng);

	});

	return latLngs;
}