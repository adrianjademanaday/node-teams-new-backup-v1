var Base = require('basejs');

var GpsSurveyData = Base.extend({
  constructor: function() {
    
  },

  lat: Number,
  lng: Number,
  timeStamp: Date,
});

module.exports = GpsSurveyData; 