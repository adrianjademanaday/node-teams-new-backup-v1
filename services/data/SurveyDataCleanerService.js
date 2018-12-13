// IMPORTS

const SERVER_ROOT = './../..';

var Q = require('q');
var mongoose = require('mongoose-q')();
var moment = require('moment');

var LatLng = require(SERVER_ROOT + '/models/LatLng');
var tsd = require(SERVER_ROOT + '/models/TricycleSurveyData');


// CONSTANTS 

const NTH_PREVIOUS_INDEX_TO_COMPARE_FOR_SPEED = 2;
const MIN_DISTANCE_TO_BE_MOVING = 1; // meters
const MAX_SECONDS_DIFFERENCE_BETWEEN_READINGS_FOR_BEFORE_AND_AFTER_DATA_CORRECTION = 2; //original is 5
const NUMBER_OF_READINGS_TO_PAD_IN_TIME_GAPS = 5; //original is 5

const MIN_PHILIPPINE_LAT = 4.390229; 
const MIN_PHILIPPINE_LNG = 115.048828;
const MAX_PHILIPPINE_LAT = 20.055931;
const MAX_PHILIPPINE_LNG = 128.452148;


// PUBLIC FUNCTIONS

/**
 * 
 * Cleans the raw survey data.
 * If the vehicle is moving then the sensor should stay ON
 * if it was on, and OFF when it was off.
 * 
 */

module.exports.process = function(surveyDataCsvs, numberOfSensors, temporarilyStoppedThreshold) {
	removeDuplicateEntriesWithSameTime(surveyDataCsvs);
	removeInvalidLatLng(surveyDataCsvs);
	removeInvalidTime(surveyDataCsvs);
	convertTime(surveyDataCsvs);
	markVehicleMovementStatusFrom(surveyDataCsvs, temporarilyStoppedThreshold);	
	correctSeatStatusForward(surveyDataCsvs, numberOfSensors);
	correctSeatStatusBackward(surveyDataCsvs, numberOfSensors);
	
	var indecesOfGaps = markGapsBetweenReadings(surveyDataCsvs);
	padGapsBetweenReadings(surveyDataCsvs, indecesOfGaps);

	setAllStatusesToOffWhenNotMoving(surveyDataCsvs, numberOfSensors);
	markHasLoad(surveyDataCsvs, numberOfSensors);

	return surveyDataCsvs;
};


// PRIVATE FUNCTIONS

/**
 * 
 * Removes duplicate SurveyData with the same time. 
 * Gps module sometimes update more in a second leaving 
 * entries with the same time in seconds.
 *  
 */

function removeDuplicateEntriesWithSameTime(surveyDataCsvs) {
	//for (var i = surveyDataCsvs.length - 1; i > 0; i--) {
	//	var currentTime = surveyDataCsvs[i][tsd.CSV_TIME_INDEX];
	//	var previousTime = surveyDataCsvs[i - 1][tsd.CSV_TIME_INDEX];

	//	if (currentTime === previousTime) {
	//		surveyDataCsvs.splice(i, 1);
	//	}
	//}
	
	for (var i = surveyDataCsvs.length -1; i > 0; i--) {
		var previousSeat = 0;
		var currentSeat = 0;
		var currentTime = surveyDataCsvs[i][tsd.CSV_TIME_INDEX];
		var previousTime = surveyDataCsvs[i - 1][tsd.CSV_TIME_INDEX];
		if (currentTime === previousTime) {
			for(var seat = 0; seat < 6; seat++){
				if(surveyDataCsvs[i][seat] == 1){
					currentSeat++;
				}
				if(surveyDataCsvs[i - 1][seat] == 1){
					previousSeat++;
				}
			}
			if(previousSeat > currentSeat){
				surveyDataCsvs.splice(i, 1);
			}
			else if(previousSeat < currentSeat){
				surveyDataCsvs.splice(i - 1, 1);
			}
			else{
				surveyDataCsvs.splice(i, 1);
			}
		}
	}

	return surveyDataCsvs;
}

/**
 * 
 * Removes coordinates that are beyond the Philippine area.
 *  
 */

function removeInvalidLatLng(surveyDataCsvs) {
	for (var i = surveyDataCsvs.length - 1; i > 0; i--) {
		var currentLat = surveyDataCsvs[i][tsd.CSV_LAT_INDEX];
		var currentLng = surveyDataCsvs[i][tsd.CSV_LNG_INDEX];
		
		var isRemoveReading = false;

		if (currentLat < MIN_PHILIPPINE_LAT) {
			isRemoveReading = true;
		}

		if (currentLat > MAX_PHILIPPINE_LAT) {
			isRemoveReading = true;
		}

		if (currentLng < MIN_PHILIPPINE_LNG) {
			isRemoveReading = true;
		}

		if (currentLng > MAX_PHILIPPINE_LNG) {
			isRemoveReading = true;
		}

		if (isRemoveReading) {
			surveyDataCsvs.splice(i, 1);
		}
	}

	return surveyDataCsvs;	
}

/**
 * 
 * Removes invalid time.
 * 
 */

function removeInvalidTime(surveyDataCsvs) {	
	for (var i = surveyDataCsvs.length - 1; i > 0; i--) {
		var currentTime = moment(surveyDataCsvs[i][tsd.CSV_TIME_INDEX], tsd.TIME_FORMAT);
		var previousTime = null;
		var isRemove = false;

		if (i > 0) {
			previousTime = moment(surveyDataCsvs[i - 1][tsd.CSV_TIME_INDEX], tsd.TIME_FORMAT);
		}

		if (!currentTime.isValid()) {
			surveyDataCsvs.splice(i, 1);
		} else if (currentTime.unix() < previousTime.unix()) {
			surveyDataCsvs.splice(i, 1);
		}	
	}

	return surveyDataCsvs;
}

/**
 * 
 * marks SurveyData according to if vehicle is moving or not.
 * 
 */

function markVehicleMovementStatusFrom(surveyDataCsvs, temporarilyStoppedThreshold) {
	var temporarilyStoppedIndeces = [];
	var isOverMaxTemporarilyStoppedIndeces = false;

	surveyDataCsvs.forEach(function(sdCsv, sdCsvIndex) {
		var isVehicleMoving = determineIsVehicleMoving(surveyDataCsvs, sdCsvIndex);	

		if (!isVehicleMoving) {
			surveyDataCsvs[sdCsvIndex][tsd.CSV_IS_MOVING_INDEX] = tsd.IS_STOPPED;

			if (temporarilyStoppedIndeces.length <= temporarilyStoppedThreshold) {
				temporarilyStoppedIndeces.push(sdCsvIndex);					
			} else {
				isOverMaxTemporarilyStoppedIndeces = true;				
			}
		} else {
			surveyDataCsvs[sdCsvIndex][tsd.CSV_IS_MOVING_INDEX] = tsd.IS_MOVING;

			if (!isOverMaxTemporarilyStoppedIndeces) {
				temporarilyStoppedIndeces.forEach(function(notMovingIndex) {
					surveyDataCsvs[notMovingIndex][tsd.CSV_IS_MOVING_INDEX] = tsd.IS_TEMPORARILY_STOPPED;
				});
			}			

			temporarilyStoppedIndeces = [];			
			isOverMaxTemporarilyStoppedIndeces = false;
		}
	});

	return surveyDataCsvs;
}

/**
 * 
 * Determines if the vehicle has a load.
 * 
 */

function markHasLoad(surveyDataCsvs, numberOfSensors) {
	surveyDataCsvs.forEach(function(sdCsv, sdCsvIndex) {
		var hasSensorThatIsOn = false;

		for (var seat = 0; seat < numberOfSensors; seat++) {
			if (sdCsv[seat] === tsd.ON) {
				hasSensorThatIsOn = true;
				break;
			}
		}

		if (hasSensorThatIsOn) {
			surveyDataCsvs[sdCsvIndex][tsd.CSV_HAS_LOAD_INDEX] = tsd.HAS_LOAD;
		} else {
			surveyDataCsvs[sdCsvIndex][tsd.CSV_HAS_LOAD_INDEX] = tsd.HAS_NO_LOAD;
		}
	});

	return surveyDataCsvs;
}

/**
 * 
 * Reads a series of sensor values from beginning to end. 
 * If vehicle HAS BEEN moving and sensor HAS BEEN ON
 * a number of readings before then set current value to ON.
 * i.e. When the passenger momentarily disengages the sensor.
 * 
 */

function correctSeatStatusForward(surveyDataCsvs, numberOfSensors) {
	surveyDataCsvs.forEach(function(sdCsv, sdCsvIndex) {
		for (var seat = 0; seat < numberOfSensors; seat++) {
			if (isDataBeforeIsOn(surveyDataCsvs, sdCsvIndex, seat) && isVehicleMoving(sdCsv) && isTimeDifferenceWithDataBeforeValid(surveyDataCsvs, sdCsvIndex)) {
				surveyDataCsvs[sdCsvIndex][seat] = tsd.ON;
			}
		}
	});

	return surveyDataCsvs;
}

/**
 * 
 * Reads a series of sensor values from end to end. 
 * If vehicle WOULD HAVE BEEN moving and sensor WOULD HAVE BEEN ON
 * a number of readings after then set current value to ON.
 * I.e. when the passenger didnt seat properly in 
 * when the vehicle started moving.
 * 
 */

function correctSeatStatusBackward(surveyDataCsvs, numberOfSensors) {
	for (var sdCsvIndex = surveyDataCsvs.length - 1; sdCsvIndex >= 0; sdCsvIndex--) {
		for (var seat = 0; seat < numberOfSensors; seat++) {
			var sdCsv = surveyDataCsvs[sdCsvIndex];

			if (isDataAfterIsOn(surveyDataCsvs, sdCsvIndex, seat) && isVehicleMovingOrTemporarilyStopped(sdCsv) && isTimeDifferenceWithDataAfterValid(surveyDataCsvs, sdCsvIndex)) {
				surveyDataCsvs[sdCsvIndex][seat] = tsd.ON;
			}
			
			//if (isDataAfterIsOn(surveyDataCsvs, sdCsvIndex, seat) && isVehicleMovingOrTemporarilyStoppedBoardingAlight(sdCsv) && isTimeDifferenceWithDataAfterValid(surveyDataCsvs, sdCsvIndex)) {
			//	surveyDataCsvs[sdCsvIndex][seat] = tsd.ON;
			//}
		}
	}

	return surveyDataCsvs;
}

/**
 * 
 * Sets all sensor values to OFF when vehicle is not moving. 
 * 
 */

function setAllStatusesToOffWhenNotMoving(surveyDataCsvs, numberOfSensors) {
	surveyDataCsvs.forEach(function(sdCsv, sdCsvIndex) {
		if (isVehicleStopped(sdCsv)) {
			for (var seat = 0; seat < numberOfSensors; seat++) {
				sdCsv[seat] = tsd.OFF;
			}
		}		
	});

	return surveyDataCsvs;	
}

/**
 * 
 * Determines if vehicle is moving or not.
 * 
 */

function determineIsVehicleMoving(surveyDataCsvs, index) {
	var distance = 0;

	if (index > NTH_PREVIOUS_INDEX_TO_COMPARE_FOR_SPEED) {
		var current = surveyDataCsvs[index];
		current = new LatLng(current[tsd.CSV_LAT_INDEX], current[tsd.CSV_LNG_INDEX]);

		var nthPrevious = surveyDataCsvs[index - NTH_PREVIOUS_INDEX_TO_COMPARE_FOR_SPEED];
		nthPrevious = new LatLng(nthPrevious[tsd.CSV_LAT_INDEX], nthPrevious[tsd.CSV_LNG_INDEX]);

		distance = current.getDistanceFrom(nthPrevious);	
	} 

	var result = distance > MIN_DISTANCE_TO_BE_MOVING;

	return result;
}

/**
 * 
 * Determines if vehicle is moving or 
 * momentarily stopped in transit i.e. stuck in traffic.
 * 
 */

function isVehicleMovingOrTemporarilyStopped(surveyDataCsv) {
	var result = ((surveyDataCsv[tsd.CSV_IS_MOVING_INDEX] === tsd.IS_MOVING) || (surveyDataCsv[tsd.CSV_IS_MOVING_INDEX] === tsd.IS_TEMPORARILY_STOPPED));

	return result;
}

/**
 * 
 * Determines if vehicle is momentarily stopped in transit i.e. boarding Alight.
 * 
 */

function isVehicleMovingOrTemporarilyStoppedBoardingAlight(surveyDataCsv) {
	var result = surveyDataCsv[tsd.CSV_IS_MOVING_INDEX] === tsd.IS_TEMPORARILY_STOPPED;

	return result;
}

/**
 * 
 * Determines if vehicle is moving.
 * 
 */

function isVehicleMoving(surveyDataCsv) {
	var result = surveyDataCsv[tsd.CSV_IS_MOVING_INDEX] === tsd.IS_MOVING;

	return result;
}

/**
 * 
 * Determines if vehicle is stopped.
 * 
 */

function isVehicleStopped(surveyDataCsv) {
	var result = surveyDataCsv[tsd.CSV_IS_MOVING_INDEX] === tsd.IS_STOPPED;

	return result;
}

/**
 * 
 * Determines if sensor values before current value was ON.
 * 
 */

function isDataBeforeIsOn(surveyDataCsvs, sdCsvIndex, seat) {
	if (sdCsvIndex > 1) {
		var seatStatusBefore = surveyDataCsvs[sdCsvIndex - 1][seat];
		var result = (seatStatusBefore === tsd.ON);

		return result;	
	} else {
		return false;
	}
}

/**
 * 
 * Determines if there is a sufficiently huge invalid jump in time difference
 * between current and the value before.
 * 
 */

function isTimeDifferenceWithDataBeforeValid(surveyDataCsvs, sdCsvIndex) {
	if (sdCsvIndex > 1) {
		var beforeSdCsvTime = surveyDataCsvs[sdCsvIndex - 1][tsd.CSV_TIME_INDEX];
		var currentSdCsvTime = surveyDataCsvs[sdCsvIndex][tsd.CSV_TIME_INDEX];

		var momentBeforeSdCsvTime = moment(beforeSdCsvTime, tsd.TIME_FORMAT);
		var momentCurrentSdCsvTime = moment(currentSdCsvTime, tsd.TIME_FORMAT);

		var timeDifference = momentCurrentSdCsvTime.diff(momentBeforeSdCsvTime, 'seconds');
		var result = timeDifference <= MAX_SECONDS_DIFFERENCE_BETWEEN_READINGS_FOR_BEFORE_AND_AFTER_DATA_CORRECTION;

		return result;	
	} else {
		return false;
	}
}

/**
 * 
 * Determines if sensor values after current value will be ON.
 * 
 */

function isDataAfterIsOn(surveyDataCsvs, sdCsvIndex, seat) {
	if (sdCsvIndex < (surveyDataCsvs.length - 1)) {
		var seatStatusAfter = surveyDataCsvs[sdCsvIndex + 1][seat];
		var result = (seatStatusAfter === tsd.ON);

		return result;
	} else {
		return false;
	}
}

/**
 * 
 * Determines if there is a sufficiently huge invalid jump in time difference
 * between current and the value after.
 * 
 */

function isTimeDifferenceWithDataAfterValid(surveyDataCsvs, sdCsvIndex) {
	if (sdCsvIndex < (surveyDataCsvs.length - 1)) {
		var afterSdCsvTime = surveyDataCsvs[sdCsvIndex + 1][tsd.CSV_TIME_INDEX];
		var currentSdCsvTime = surveyDataCsvs[sdCsvIndex][tsd.CSV_TIME_INDEX];

		var momentAfterSdCsvTime = moment(afterSdCsvTime, tsd.TIME_FORMAT);
		var momentCurrentSdCsvTime = moment(currentSdCsvTime, tsd.TIME_FORMAT);

		var timeDifference = momentAfterSdCsvTime.diff(momentCurrentSdCsvTime, 'seconds');
		var result = timeDifference <= MAX_SECONDS_DIFFERENCE_BETWEEN_READINGS_FOR_BEFORE_AND_AFTER_DATA_CORRECTION;

		return result;	
	} else {
		return false;
	}	
}

/**
 * 
 * Marks huge time differences between readings.
 * 
 */

function markGapsBetweenReadings(surveyDataCsvs) {
	var indecesOfGaps = [];

	surveyDataCsvs.forEach(function(surveyDataCsv, index) {
		if ((index < (surveyDataCsvs.length - 1)) && (!isTimeDifferenceWithDataAfterValid(surveyDataCsvs, index))) {
			indecesOfGaps.push(index);
		}
	});

	return indecesOfGaps;
}

/**
 * 
 * Fills gaps between readings with huge time differences i.e. when logging stops due to no GPS signal.
 * Places default SurveyData values (sensor OFF and vehicle is STOPPED).
 * 
 */

function padGapsBetweenReadings(surveyDataCsvs, indecesOfGaps) {
	indecesOfGaps.reverse().forEach(function(index) {
		var currentSurveyDataCsv = surveyDataCsvs[index];
		var aaa = surveyDataCsvs[index - 1];
		var bbb = surveyDataCsvs[index - 2];
		var ccc = surveyDataCsvs[index - 3];
		var ddd = surveyDataCsvs[index - 4];
		var eee = surveyDataCsvs[index - 5];

			
		var time = currentSurveyDataCsv[tsd.CSV_TIME_INDEX];
		var lat = currentSurveyDataCsv[tsd.CSV_LAT_INDEX];
		var lng = currentSurveyDataCsv[tsd.CSV_LNG_INDEX];		

		var OFF = tsd.OFF;
		var STOPPED = tsd.IS_STOPPED;

		var surveyDataCsvPadding = [OFF,OFF,OFF,OFF,OFF,OFF,time, lat, lng, STOPPED];

		for (var i = 0; i < NUMBER_OF_READINGS_TO_PAD_IN_TIME_GAPS; i++) {
			surveyDataCsvs.splice(index + 1, 0, surveyDataCsvPadding);
		}
	});

	return surveyDataCsvs;
}

/**
 * 
 * Converts the time from GPS data by adding 8
 *  hours to match Philippine time zone.
 * 
 */

function convertTime(surveyDataCsvs) {
	var momentTime = null;

	surveyDataCsvs.forEach(function(sdCsv, index) {
		momentTime = moment(sdCsv[tsd.CSV_TIME_INDEX], tsd.TIME_FORMAT)

		if (sdCsv[tsd.CSV_TIME_INDEX] < 16) {
			momentTime.add('hours', 8);
		} else {
			momentTime.subtract('hours', 16);
		}

		surveyDataCsvs[index][tsd.CSV_TIME_INDEX] = momentTime.format(tsd.TIME_FORMAT);
	});
}
