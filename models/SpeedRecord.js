// IMPORTS

var Q = require('q');
var mongoose = require('mongoose-q')();

// PROPERTIES

var SpeedRecordSchema = mongoose.Schema({

    sampleNumber: Number,
    currentLat: Number, 
    curretnLng: Number,
    previousLat: Number, 
    previousLng: Number,
    distanceDifference: Number,
    time: Number,
    timeDifference: Number,
    speed: Number,
    isMoving: Number,
    hasLoad: Number,
    actualDistanceDifference: Number,
    actualTimeDifference: Number

});

module.exports = mongoose.model('SpeedRecord', SpeedRecordSchema);
