// IMPORTS

const SERVER_ROOT = './../../..';
var LatLng = require(SERVER_ROOT + '/models/LatLng');
var moment = require('moment');

var mongoose = require('mongoose-q')();
var tsd = require(SERVER_ROOT + '/models/TricycleSurveyData');
var SpeedRecord = mongoose.model('SpeedRecord');


// CONSTANTS

const TIME_FORMAT = 'HH:mm:ss';
const NTH_PREVIOUS_INDEX_TO_COMPARE_FOR_SPEED = 2;
const MAX_DISTANCE_DIFFERENCE_COEFFICIENT = 16.67 // 60 kph
const MAX_SPEED = 60;

// Input csv indeces

const IN_TIME_INDEX = 5;
const IN_LAT_INDEX = 6;
const IN_LNG_INDEX = 7;

// Headers

const CURRENT_LAT_HEADER = '\"Current Lat\"';
const CURRENT_LNG_HEADER = '\"Current Lng\"';
const PREVIOUS_LAT_HEADER = '\"Destination Lat\"';
const PREVIOUS_LNG_HEADER = '\"Destination Lng\"';
const DISTANCE_DIFFERENCE_HEADER = '\"Distance\"';
const TIME_HEADER = '\"Time\"';
const TIME_DIFFERENCE_HEADER = '\"Time Difference\"';
const SPEED_HEADER = '\"Speed\"';
const IS_MOVING_HEADER = '\"Is Moving\"';
const HAS_LOAD_HEADER = '\"Has Load\"';

// Output csv indeces

const OUT_CURRENT_LAT_INDEX = 0;
const OUT_CURRENT_LNG_INDEX = 1;
const OUT_PREVIOUS_LAT_INDEX = 2;
const OUT_PREVIOUS_LNG_INDEX = 3;
const OUT_DISTANCE_DIFFERENCE_INDEX = 4;
const OUT_TIME_INDEX = 5
const OUT_TIME_DIFFERENCE_INDEX = 6;
const OUT_SPEED_INDEX = 7;	
const OUT_IS_MOVING_INDEX = 8;
const OUT_HAS_LOAD_INDEX = 9;
const ACTUAL_DISTANCE_DIFFERENCE_INDEX = 10;
const ACTUAL_TIME_DIFFERENCE_INDEX = 11;

const NO_DATA = '*';


// SERVICE FUNCTIONS

/**
 * 
 * Creates SpeedRecords from SurveyData.
 * 
 */

module.exports.process = function(surveyData, sampleNumber) {
	var previous = null;
	var actualPrevious = null;
	var distance = 0;

	var speedProfile = new Array();
	var speedProfilePersistent = new Array();

	addHeaders(speedProfile);
	
	surveyData.forEach(function(current, index) {
		var speedRecord = new Array();
		var speedRecordPersistent = new SpeedRecord();

		if (previous == null) {

			previousDistance = 0;

			speedRecord[OUT_CURRENT_LAT_INDEX] = current.lat; 
			speedRecord[OUT_CURRENT_LNG_INDEX] = current.lng;
			speedRecord[OUT_PREVIOUS_LAT_INDEX] = NO_DATA;
			speedRecord[OUT_PREVIOUS_LNG_INDEX] = NO_DATA;
			speedRecord[OUT_DISTANCE_DIFFERENCE_INDEX] = NO_DATA;
			speedRecord[OUT_TIME_INDEX] = NO_DATA;
			speedRecord[OUT_TIME_DIFFERENCE_INDEX] = NO_DATA;
			speedRecord[OUT_SPEED_INDEX] = NO_DATA;
			speedRecord[OUT_IS_MOVING_INDEX] = NO_DATA;
			speedRecord[OUT_HAS_LOAD_INDEX] = NO_DATA;
			speedRecord[ACTUAL_DISTANCE_DIFFERENCE_INDEX] = NO_DATA;
			speedRecord[ACTUAL_TIME_DIFFERENCE_INDEX] = NO_DATA;

			speedRecordPersistent.currentLat = current.lat; 
			speedRecordPersistent.currentLng = current.lng;
			speedRecordPersistent.previousLat = NO_DATA;
			speedRecordPersistent.previousLng = NO_DATA;
			speedRecordPersistent.distanceDifference = NO_DATA;
			speedRecordPersistent.time = NO_DATA;
			speedRecordPersistent.timeDifference = NO_DATA;
			speedRecordPersistent.speed = NO_DATA;
			speedRecordPersistent.isMoving = NO_DATA;
			speedRecordPersistent.hasLoad = NO_DATA;
			speedRecordPersistent.actualDistanceDifference = NO_DATA;
			speedRecordPersistent.actualTimeDifference = NO_DATA;
			speedRecordPersistent.sampleNumber = sampleNumber;			

		} else {

			var timeDifference = current.timeStamp.diff(previous.timeStamp) / (1000); // in seconds
			

			var start = new LatLng(previous.lat, previous.lng);
			var end = new LatLng(current.lat, current.lng);

			distance = start.getDistanceFrom(end); // in m		

			if (distance > (MAX_DISTANCE_DIFFERENCE_COEFFICIENT * timeDifference)) {
				distance = MAX_DISTANCE_DIFFERENCE_COEFFICIENT * timeDifference;
			}
			
			var speed = 0;
			
			if (timeDifference > 0) {
				speed = (distance / 1000) / (timeDifference / 3600); // convert time to hours

				if (speed > MAX_SPEED) {
					speed = MAX_SPEED;
				}
			}

			var actualStart = new LatLng(actualPrevious.lat, actualPrevious.lng);
			var actualEnd = end;
			var actualDistance = actualStart.getDistanceFrom(actualEnd); // in m											
			var actualTimeDifference = current.timeStamp.diff(actualPrevious.timeStamp) / (1000); // in seconds
			
			speedRecord[OUT_CURRENT_LAT_INDEX] = current.lat; 
			speedRecord[OUT_CURRENT_LNG_INDEX] = current.lng;
			speedRecord[OUT_PREVIOUS_LAT_INDEX] = previous.lat; 
			speedRecord[OUT_PREVIOUS_LNG_INDEX] = previous.lng; 
			speedRecord[OUT_DISTANCE_DIFFERENCE_INDEX] = distance; 
			speedRecord[OUT_TIME_INDEX] = current.timeStamp.format(TIME_FORMAT);
			speedRecord[OUT_TIME_DIFFERENCE_INDEX] = timeDifference;			
			speedRecord[OUT_SPEED_INDEX] = speed;
			speedRecord[OUT_IS_MOVING_INDEX] = current.isMoving;
			speedRecord[OUT_HAS_LOAD_INDEX] = current.hasLoad;
			speedRecord[ACTUAL_DISTANCE_DIFFERENCE_INDEX] = actualDistance; 
			speedRecord[ACTUAL_TIME_DIFFERENCE_INDEX] = actualTimeDifference;

			speedRecordPersistent.currentLat = current.lat; 
			speedRecordPersistent.currentLng = current.lng;
			speedRecordPersistent.previousLat = previous.lat;
			speedRecordPersistent.previousLng = previous.lng;
			speedRecordPersistent.distanceDifference = distance;
			speedRecordPersistent.time = current.timeStamp.format(TIME_FORMAT);
			speedRecordPersistent.timeDifference = timeDifference;
			speedRecordPersistent.speed = speed;
			speedRecordPersistent.isMoving = current.isMoving;
			speedRecordPersistent.hasLoad = current.hasLoad;
			speedRecordPersistent.actualDistanceDifference = actualDistance;
			speedRecordPersistent.actualTimeDifference = actualTimeDifference;
			speedRecordPersistent.sampleNumber = sampleNumber;		
		}		

		if (index >= NTH_PREVIOUS_INDEX_TO_COMPARE_FOR_SPEED) {
			previous = surveyData[index - NTH_PREVIOUS_INDEX_TO_COMPARE_FOR_SPEED];	
		}

		actualPrevious = surveyData[index];	

		speedProfile.push(speedRecord);
		speedProfilePersistent.push(speedRecordPersistent);
	});

	return {
		speedProfile: speedProfile,
		speedProfilePersistent: speedProfilePersistent
	};
}


// PRIVATE FUNCTIONS

/**
 * 
 * Add headers to SpeedRecords data.
 * 
 */

function addHeaders(speedProfile) {
	var header = [];
	header.push(CURRENT_LAT_HEADER);
	header.push(CURRENT_LNG_HEADER);
	header.push(PREVIOUS_LAT_HEADER);
	header.push(PREVIOUS_LNG_HEADER);
	header.push(DISTANCE_DIFFERENCE_HEADER);
	header.push(TIME_HEADER);
	header.push(TIME_DIFFERENCE_HEADER);
	header.push(SPEED_HEADER);
	header.push(IS_MOVING_HEADER);
	header.push(HAS_LOAD_HEADER);
	
	speedProfile.push(header);

	return speedProfile;
}

function saveSpeedProfile(speedProfilePersistent) {

}
