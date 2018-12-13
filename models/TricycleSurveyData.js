const SERVER_ROOT = './..';
var RawOriginDestination = require(SERVER_ROOT + '/models/RawOriginDestination');
var Base = require('basejs');

var GpsSurveyData = require(SERVER_ROOT + '/models/GpsSurveyData');

var TricycleSurveyData = GpsSurveyData.extend({
  constructor: function() {
  	
  },

  seat1: Number,
  seat2: Number,
  seat3: Number,
  seat4: Number,
  seat5: Number,
  seat6: Number,
  
  getSeat: function(number) {
  	switch(number) {
  		case 1: 
  			return this.seat1;
  		case 2: 
  			return this.seat2;
  		case 3: 
  			return this.seat3;
  		case 4: 
  			return this.seat4;
  		case 5: 
  			return this.seat5;
  	}
  }
});

// CONSTANTS

TricycleSurveyData.ON = '1';
TricycleSurveyData.OFF = '0';
TricycleSurveyData.NO_DATA = '*';

TricycleSurveyData.IS_MOVING = '1';
TricycleSurveyData.IS_STOPPED = '0';
TricycleSurveyData.IS_TEMPORARILY_STOPPED = '2';

TricycleSurveyData.HAS_LOAD = '1';
TricycleSurveyData.HAS_NO_LOAD = '0';

TricycleSurveyData.VALID_TIME_DIFFERENCE = '1';
TricycleSurveyData.INVALID_TIME_DIFFERENCE = '0';


// Input csv indeces

TricycleSurveyData.CSV_SENSOR_1_INDEX = 0;
TricycleSurveyData.CSV_SENSOR_2_INDEX = 1;
TricycleSurveyData.CSV_SENSOR_3_INDEX = 2;
TricycleSurveyData.CSV_SENSOR_4_INDEX = 3;
TricycleSurveyData.CSV_SENSOR_5_INDEX = 4;
TricycleSurveyData.CSV_SENSOR_6_INDEX = 5;
TricycleSurveyData.CSV_TIME_INDEX = 6;
TricycleSurveyData.CSV_LAT_INDEX = 7;
TricycleSurveyData.CSV_LNG_INDEX = 8;
TricycleSurveyData.CSV_IS_MOVING_INDEX = 9;
TricycleSurveyData.CSV_HAS_LOAD_INDEX = 10;
TricycleSurveyData.CSV_IS_VALID_TIME_DIFFERENCE = 11;

TricycleSurveyData.TIME_FORMAT = 'HH:mm:ss';

module.exports = TricycleSurveyData; 