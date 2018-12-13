// IMPORTS

const SERVER_ROOT = './../..';
var LatLng = require(SERVER_ROOT + '/models/LatLng');
var TricycleSurveyData = require(SERVER_ROOT + '/models/TricycleSurveyData');

var Base = require('basejs');


// CONSTANTS

const NUMBER_OF_SEATS = 5;
const SEAT_1_INDEX = 1;

/**
 * 
 * To determine if a seat has been occupied or not MAX_SENSOR_READINGS 
 * is taken. 
 * 
 * If the number of ON counts is equal to or more than MIN_ON_COUNT_NEEDED
 * then the seat was occupied.
 * 
 * If the number of ON counts is equal to or more than MIN_OFF_COUNT_NEEDED
 * then the seat was unoccupied.
 * 
 */
const MAX_SENSOR_READINGS = 15; // 15
const MIN_ON_COUNT_NEEDED = 7; // 7
const MIN_OFF_COUNT_NEEDED = 8; // 8

module.exports.NUMBER_OF_SEATS = NUMBER_OF_SEATS;
module.exports.SEAT_1_INDEX = SEAT_1_INDEX;

module.exports.MAX_SENSOR_READINGS = MAX_SENSOR_READINGS;
module.exports.MIN_ON_COUNT_NEEDED = MIN_ON_COUNT_NEEDED;
module.exports.MIN_OFF_COUNT_NEEDED = MIN_OFF_COUNT_NEEDED;


// SERVICE FUNCTIONS

/**
 * 
 * Processes SeatData into BoardingAlightings
 * and returns them as points.
 * 
 */

module.exports.process = function(surveyData) {
	
	var origin = [null, null, null, null, null, null];
	var latLngs = [];

	surveyData.forEach(function(sd, sdIndex) {

		for (seat = 0; seat < NUMBER_OF_SEATS; seat++) {

			var seatHasBeenOn = hasBeenOn(SEAT_1_INDEX + seat, surveyData, sdIndex);
			var seatHasBeenOff = hasBeenOff(SEAT_1_INDEX + seat, surveyData, sdIndex);

			if (seatHasBeenOn && origin[seat] == null) {
				origin[seat] = new LatLng(sd.lat, sd.lng);
			} else if (seatHasBeenOff && origin[seat] != null) {
				var destination = new LatLng(sd.lat, sd.lng);
				
				latLngs.push(origin[seat]);
				latLngs.push(destination);

				origin[seat] = null;
			}

		}

	});

	return latLngs;
}


// PRIVATE FUNCTIONS

/**
 * 
 * Checks whether a seat is occupied.
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
 * Checks whether a seat is unoccupied.
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
