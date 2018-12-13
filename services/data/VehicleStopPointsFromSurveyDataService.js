// IMPORTS

const SERVER_ROOT = './../..';
var LatLng = require(SERVER_ROOT + '/models/LatLng');
var TricycleSurveyData = require(SERVER_ROOT + '/models/TricycleSurveyData');

var speedService = require(SERVER_ROOT + '/services/data/surveyData/SpeedService');

var Base = require('basejs');


// CONSTANTS

const NUMBER_OF_SEATS = 5;
const SEAT_1_INDEX = 1;

const MAX_SENSOR_READINGS = 15;
const MIN_ON_COUNT_NEEDED = 7;
const MIN_OFF_COUNT_NEEDED = 8;

module.exports.NUMBER_OF_SEATS = NUMBER_OF_SEATS;
module.exports.SEAT_1_INDEX = SEAT_1_INDEX;

module.exports.MAX_SENSOR_READINGS = MAX_SENSOR_READINGS;
module.exports.MIN_ON_COUNT_NEEDED = MIN_ON_COUNT_NEEDED;
module.exports.MIN_OFF_COUNT_NEEDED = MIN_OFF_COUNT_NEEDED;


// SERVICE FUNCTIONS

/**
 * 
 * Determines the locations where a vehicle would stop
 * and return them as points.
 * 
 */

module.exports.process = function(surveyData) {
	var latLngs = [];
	var hasBeenMoving = false;

	surveyData.forEach(function(sd, sdIndex) {

		if (!hasBeenMoving && (sd.isMoving === TricycleSurveyData.IS_MOVING || sd.isMoving ===  TricycleSurveyData.IS_TEMPORARILY_STOPPED)) {
			var latLng = new LatLng(sd.lat, sd.lng);
			latLngs.push(latLng);

			hasBeenMoving = true;
		} else if (hasBeenMoving && sd.isMoving === TricycleSurveyData.IS_STOPPED) {
			var latLng = new LatLng(sd.lat, sd.lng);
			latLngs.push(latLng);

			hasBeenMoving = false;
		}

	});

	return latLngs;
}


// PRIVATE FUNCTIONS

/**
 * 
 * Determines if a seat has been occupied.
 * 
 */

function hasBeenOn(seatIndex, surveyData, surveyDataIndex) {
	var onCount = 0;
	var reading = null;
	var result = null;

	for (var i = 0; i < MAX_SENSOR_READINGS; i++) {
		reading = surveyData[surveyDataIndex - i];
		
		if (reading == undefined) {			
			break; // reached end of surveyData
		} 

		if (reading.getSeat(seatIndex) === TricycleSurveyData.ON) {
			onCount++;
		}
	}

	return (onCount >= MIN_ON_COUNT_NEEDED);
}

module.exports.hasBeenOn = hasBeenOn;

/**
 * 
 * Determines if a seat has been unoccupied. 
 * 
 */

function hasBeenOff(seatIndex, surveyData, surveyDataIndex) {
	var offCount = 0;
	var reading = null;

	for (var i = 0; i < MAX_SENSOR_READINGS; i++) {
		reading = surveyData[surveyDataIndex - i];

		if (reading == undefined) {			
			break; // reached end of surveyData
		} 

		if (reading.getSeat(seatIndex) === TricycleSurveyData.OFF) {
			offCount++;
		}
	}

	return  (offCount >= MIN_OFF_COUNT_NEEDED);
}

module.exports.hasBeenOff = hasBeenOff;