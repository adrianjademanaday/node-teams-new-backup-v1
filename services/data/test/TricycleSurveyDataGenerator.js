// IMPORTS

var moment = require('moment');
var casual = require('casual');

const SERVER_ROOT = './../../..'

var TricycleSurveyData = require(SERVER_ROOT + '/models/TricycleSurveyData');
var LatLng = require(SERVER_ROOT + '/models/LatLng');

// CONSTANTS

const MIN_CONSECUTIVE_SURVEY_DATA_WITH_SAME_STATUS = 5;
const MAX_CONSECUTIVE_SURVEY_DATA_WITH_SAME_STATUS = 20;
const MAX_SECONDS_BETWEEN_SURVEY_DATUM = 2;

const NUMBER_OF_SEATS = 5;
const SEAT1 = 0;
const SEAT2 = 1;
const SEAT3 = 2;
const SEAT4 = 3;
const SEAT5 = 4;


// GENERATE FUNCTIONS

module.exports.generateSurveyData = function(topLeftBounds, bottomRightBounds, count) {
	var surveyData = [];
	var consecutiveSameStatusSurveyDataCount = initilizeConsecutiveSameStatusSurveyDataCount();
	var status = initializeSurveyDataStatus();
	var time = moment(new Date());
	var secondsToAdd = 0;

	var topRightBounds = new LatLng(topLeftBounds.lat, bottomRightBounds.lng);
	var bottomLeftBounds = new LatLng(bottomRightBounds.lat, topLeftBounds.lng);
	var maxHorizontalDistance = topRightBounds.getDistanceFrom(topLeftBounds);
	var maxVerticalDistance = topLeftBounds.getDistanceFrom(bottomLeftBounds);

	for (var index = 0; index < count; index++) {
		var surveyDatum = new TricycleSurveyData();

		for (var seat = 0; seat < NUMBER_OF_SEATS; seat++) {
			if (consecutiveSameStatusSurveyDataCount[seat] === 0) {
				consecutiveSameStatusSurveyDataCount[seat] = casual.integer(MIN_CONSECUTIVE_SURVEY_DATA_WITH_SAME_STATUS, MAX_CONSECUTIVE_SURVEY_DATA_WITH_SAME_STATUS);

				if (status[seat] === TricycleSurveyData.OFF) {
					status[seat] = TricycleSurveyData.ON;
				} else {
					status[seat] = TricycleSurveyData.OFF;
				}
			}

			consecutiveSameStatusSurveyDataCount[seat]--;
		}

		surveyDatum.seat1 = status[SEAT1];
		surveyDatum.seat2 = status[SEAT2];
		surveyDatum.seat3 = status[SEAT3];
		surveyDatum.seat4 = status[SEAT4];
		surveyDatum.seat5 = status[SEAT5];

		var location = new LatLng(topLeftBounds.lat, topLeftBounds.lng);
		var horizontalDistance = casual.double(0.0, maxHorizontalDistance);
		var verticalDistance = casual.double(0.0, maxVerticalDistance);
		location = location.addRight(horizontalDistance).addBottom(verticalDistance);
		surveyDatum.lat = location.lat;
		surveyDatum.lng = location.lng;

		secondsToAdd = casual.integer(1, MAX_SECONDS_BETWEEN_SURVEY_DATUM);
		time = time.add('seconds', secondsToAdd);
		surveyDatum.timeStamp = time;

		surveyData.push(surveyDatum);
	}		

	return surveyData;
}


// PRIVATE FUNCTIONS

function initilizeConsecutiveSameStatusSurveyDataCount() {
	var consecutiveSameStatusSurveyDataCount = new Array(NUMBER_OF_SEATS);

	for (var i = 0; i < NUMBER_OF_SEATS; i++) {
		consecutiveSameStatusSurveyDataCount[i] = 0;
	}

	return consecutiveSameStatusSurveyDataCount;
}

function initializeSurveyDataStatus() {
	var status = new Array(NUMBER_OF_SEATS);

	for (var i = 0; i < NUMBER_OF_SEATS; i++) {
		status[i] = TricycleSurveyData.ON; // so that the first consecutive status are OFF
	}	

	return status;
}