// IMPORTS

const SERVER_ROOT = './../..'
var TricycleSurveyData = require(SERVER_ROOT + '/models/TricycleSurveyData');
var _ = TricycleSurveyData; // alias for TricycleSurveyData;

var moment = require('moment');

// CONSTANTS

const TWO_IN_AND_ONE_DRIVER_BACK_SEAT_CONFIGURATION = {
	id: 0,
	name: 'Two In and One Driver Back'
};

const THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION = {
	id: 1,
	name: 'Three In and Two Driver Back'	
};

const TWO_FRONT_AND_FOUR_BACK_SEAT_CONFIGURATION = {
	id: 2,
	name: 'Two Front and Four Back'	
};

module.exports.TWO_IN_AND_ONE_DRIVER_BACK_SEAT_CONFIGURATION = TWO_IN_AND_ONE_DRIVER_BACK_SEAT_CONFIGURATION;
module.exports.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION = THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION;
module.exports.TWO_FRONT_AND_FOUR_BACK_SEAT_CONFIGURATION = TWO_FRONT_AND_FOUR_BACK_SEAT_CONFIGURATION;

module.exports.SEAT_CONFIGURATIONS = [
  TWO_IN_AND_ONE_DRIVER_BACK_SEAT_CONFIGURATION,
  THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION,
  TWO_FRONT_AND_FOUR_BACK_SEAT_CONFIGURATION
];


// VARIABLES

var surveyDataCsv = null;

// SERVICE FUNCTIONS

/**
 * 
 * Converts SurveyData into SensorData.
 * 
 */

module.exports.process = function(surveyDataCsvs, seatConfigurationId) {
	
	addOffRowToTop(surveyDataCsvs);
	addOffRowToBottom(surveyDataCsvs);

	var surveyData = new Array();

	surveyDataCsvs.forEach(function(sdCsv) {
		var surveyDatum = null;

		switch(parseInt(seatConfigurationId)) {
			case TWO_IN_AND_ONE_DRIVER_BACK_SEAT_CONFIGURATION.id:
				surveyDatum = processTwoInAndOneDriverBack(sdCsv);
				break;
			case THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION.id:
				surveyDatum = processThreeInAndTwoDriverBack(sdCsv);
				break;
			case TWO_FRONT_AND_FOUR_BACK_SEAT_CONFIGURATION.id:
				surveyDatum = processTwoFrontAndFourBack(sdCsv);
				break;
			default:
				surveyDatum = processThreeInAndTwoDriverBack(sdCsv);
		}

		surveyData.push(surveyDatum);
	});	
	
	return surveyData;
};


// PRIVATE FUNCTIONS

/**
 * 
 * Add a series of rows containing OFF sensor values (0,0,0,0,0,0) to ensure that
 * sensors start as OFF.   
 * 
 */

function addOffRowToTop(surveyDataCsvs) {
	if (surveyDataCsvs.length > 0) {

		var topContainer = [];
		var top = new Array();

		top[_.CSV_SENSOR_1_INDEX] = _.OFF;
		top[_.CSV_SENSOR_2_INDEX] = _.OFF;
		top[_.CSV_SENSOR_3_INDEX] = _.OFF;
		top[_.CSV_SENSOR_4_INDEX] = _.OFF;
		top[_.CSV_SENSOR_5_INDEX] = _.OFF;
		top[_.CSV_SENSOR_6_INDEX] = _.OFF;

		top[_.CSV_TIME_INDEX] = surveyDataCsvs[0][_.CSV_TIME_INDEX];
		top[_.CSV_LAT_INDEX] = surveyDataCsvs[0][_.CSV_LAT_INDEX];
		top[_.CSV_LNG_INDEX] = surveyDataCsvs[0][_.CSV_LNG_INDEX];

		topContainer.push(top);
		surveyDataCsvs = topContainer.concat(surveyDataCsvs);
	} 
}

/**
 * 
 * Add a series of rows containing OFF sensor values (0,0,0,0,0,0) to ensure that
 * sensors end as OFF.   
 * 
 */

function addOffRowToBottom(surveyDataCsvs) {
	if (surveyDataCsvs.length > 0) {
		var bottom = new Array();

		bottom[_.CSV_SENSOR_1_INDEX] = _.OFF;
		bottom[_.CSV_SENSOR_2_INDEX] = _.OFF;
		bottom[_.CSV_SENSOR_3_INDEX] = _.OFF;
		bottom[_.CSV_SENSOR_4_INDEX] = _.OFF;
		bottom[_.CSV_SENSOR_5_INDEX] = _.OFF;
		bottom[_.CSV_SENSOR_6_INDEX] = _.OFF;

		var last = surveyDataCsvs.length - 1;

		bottom[_.CSV_TIME_INDEX] = surveyDataCsvs[last][_.CSV_TIME_INDEX];
		bottom[_.CSV_LAT_INDEX] = surveyDataCsvs[last][_.CSV_LAT_INDEX];
		bottom[_.CSV_LNG_INDEX] = surveyDataCsvs[last][_.CSV_LNG_INDEX];

		surveyDataCsvs.push(bottom);
	}
}

/**
 * 
 * Convert SurveyData into SeatData using a Two Passengers Inside and 
 * One at the back of the Driver seat configuration. 
 * 
 */

function processTwoInAndOneDriverBack(surveyDataCsv) {
	var surveyDatum = new TricycleSurveyData();

	var sensor1  = surveyDataCsv[_.CSV_SENSOR_1_INDEX];
	var sensor2  = surveyDataCsv[_.CSV_SENSOR_2_INDEX];
	var sensor3  = surveyDataCsv[_.CSV_SENSOR_3_INDEX];
	
	if (sensor1 === _.ON && sensor2 === _.ON) {
		surveyDatum.seat1 = _.ON;
	} else if (sensor1 === _.ON || sensor2 === _.ON) {
		surveyDatum.seat1 = _.ON;
	} else {
		surveyDatum.seat1 = _.OFF;
	}

	if (sensor2 === _.ON && sensor3 === _.ON) {
		surveyDatum.seat2 = _.ON;
	} else if (sensor3 === _.ON) {
		surveyDatum.seat2 = _.ON;
	} else {
		surveyDatum.seat2 = _.OFF;
	}

	var sensor5  = surveyDataCsv[_.CSV_SENSOR_5_INDEX];

	surveyDatum.seat3 = _.OFF;

	if (sensor5 === _.ON) {
		surveyDatum.seat4 = _.ON;
	} else {
		surveyDatum.seat4 = _.OFF;
	}

	surveyDatum.seat5 = _.OFF;
	
	surveyDatum.lat = parseFloat(surveyDataCsv[_.CSV_LAT_INDEX]);
	surveyDatum.lng = parseFloat(surveyDataCsv[_.CSV_LNG_INDEX]);
	surveyDatum.timeStamp = moment(surveyDataCsv[_.CSV_TIME_INDEX], _.TIME_FORMAT);
	surveyDatum.isMoving = surveyDataCsv[_.CSV_IS_MOVING_INDEX];
	surveyDatum.hasLoad = surveyDataCsv[_.CSV_HAS_LOAD_INDEX];

	return surveyDatum;
}

/**
 * 
 * Convert SurveyData into SeatData using a Three Passengers Inside and 
 * Two at the back of the Driver seat configuration. (Quezon City)
 * 
 */

function processThreeInAndTwoDriverBack(surveyDataCsv) {
	var surveyDatum = new TricycleSurveyData();

	var sensor1  = surveyDataCsv[_.CSV_SENSOR_1_INDEX];
	var sensor2  = surveyDataCsv[_.CSV_SENSOR_2_INDEX];
	var sensor3  = surveyDataCsv[_.CSV_SENSOR_3_INDEX];
	
	/*if (sensor1 === _.ON && sensor2 === _.ON) {
		surveyDatum.seat1 = _.ON;
	} else if (sensor1 === _.ON || sensor2 === _.ON) {
		surveyDatum.seat1 = _.ON;
	} else {
		surveyDatum.seat1 = _.OFF;
	}

	if (sensor2 === _.ON && sensor3 === _.ON) {
		surveyDatum.seat2 = _.ON;
	} else if (sensor3 === _.ON) {
		surveyDatum.seat2 = _.ON;
	} else {
		surveyDatum.seat2 = _.OFF;
	}*/
	
	if (sensor2 === _.ON){
		if (sensor1 === _.OFF && sensor3 === _.OFF){
			surveyDatum.seat1 = _.ON;
		}
		else{
			if(sensor1 === _.ON){
				surveyDatum.seat1 = _.ON;
			}
			else{
				surveyDatum.seat1 = _.OFF;
			}
			
			if(sensor3 === _.ON){
				surveyDatum.seat2 = _.ON;
			}
			else{
				surveyDatum.seat2 = _.OFF;
			}
		}
	}
	else{
		if(sensor1 === _.ON){
			surveyDatum.seat1 = _.ON;
		}
		else{
			surveyDatum.seat1 = _.OFF;
		}
			
		if(sensor3 === _.ON){
			surveyDatum.seat2 = _.ON;
		}
		else{
			surveyDatum.seat2 = _.OFF;
		}
	}
	

	var sensor4  = surveyDataCsv[_.CSV_SENSOR_4_INDEX];
	var sensor5  = surveyDataCsv[_.CSV_SENSOR_5_INDEX];
	var sensor6  = surveyDataCsv[_.CSV_SENSOR_6_INDEX];

	if (sensor4 === _.ON) {
		surveyDatum.seat3 = _.ON;
	} else {
		surveyDatum.seat3 = _.OFF;
	}

	if (sensor5 === _.ON) {
		surveyDatum.seat4 = _.ON;
	} else {
		surveyDatum.seat4 = _.OFF;
	}

	if (sensor6 === _.ON) {
		surveyDatum.seat5 = _.ON;
	} else {
		surveyDatum.seat5 = _.OFF;
	}
	
	surveyDatum.lat = parseFloat(surveyDataCsv[_.CSV_LAT_INDEX]);
	surveyDatum.lng = parseFloat(surveyDataCsv[_.CSV_LNG_INDEX]);
	surveyDatum.timeStamp = moment(surveyDataCsv[_.CSV_TIME_INDEX], _.TIME_FORMAT);
	surveyDatum.isMoving = surveyDataCsv[_.CSV_IS_MOVING_INDEX];
	surveyDatum.hasLoad = surveyDataCsv[_.CSV_HAS_LOAD_INDEX];

	return surveyDatum;
}

/**
 * 
 * Convert SurveyData into SeatData using a Two Passengers In Front and 
 * Four at the back of the Driver or one sensor is to one seat configuration. (General Santos, Dipolog) 
 * 
 */

function processTwoFrontAndFourBack(surveyDataCsv) {
	var surveyDatum = new TricycleSurveyData();

	var sensor1  = surveyDataCsv[_.CSV_SENSOR_1_INDEX];
	var sensor2  = surveyDataCsv[_.CSV_SENSOR_2_INDEX];
	var sensor3  = surveyDataCsv[_.CSV_SENSOR_3_INDEX];
	var sensor4  = surveyDataCsv[_.CSV_SENSOR_4_INDEX];
	var sensor5  = surveyDataCsv[_.CSV_SENSOR_5_INDEX];
	var sensor6  = surveyDataCsv[_.CSV_SENSOR_6_INDEX];
		
	if (sensor1 === _.ON) {
		surveyDatum.seat1 = _.ON;
	} else {
		surveyDatum.seat1 = _.OFF;
	}

	if (sensor2 === _.ON) {
		surveyDatum.seat2 = _.ON;
	} else {
		surveyDatum.seat2 = _.OFF;
	}

	if (sensor3 === _.ON) {
		surveyDatum.seat3 = _.ON;
	} else {
		surveyDatum.seat3 = _.OFF;
	}

	if (sensor4 === _.ON) {
		surveyDatum.seat4 = _.ON;
	} else {
		surveyDatum.seat4 = _.OFF;
	}

	if (sensor5 === _.ON) {
		surveyDatum.seat5 = _.ON;
	} else {
		surveyDatum.seat5 = _.OFF;
	}

	if (sensor6 === _.ON) {
		surveyDatum.seat6 = _.ON;
	} else {
		surveyDatum.seat6 = _.OFF;
	}
	
	surveyDatum.lat = parseFloat(surveyDataCsv[_.CSV_LAT_INDEX]);
	surveyDatum.lng = parseFloat(surveyDataCsv[_.CSV_LNG_INDEX]);
	surveyDatum.timeStamp = moment(surveyDataCsv[_.CSV_TIME_INDEX], _.TIME_FORMAT);
	surveyDatum.isMoving = surveyDataCsv[_.CSV_IS_MOVING_INDEX];
	surveyDatum.hasLoad = surveyDataCsv[_.CSV_HAS_LOAD_INDEX];

	return surveyDatum;
}
