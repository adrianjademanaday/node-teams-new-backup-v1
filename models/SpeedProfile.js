// IMPORTS

var Q = require('q');
var mongoose = require('mongoose-q')();

// PROPERTIES

var SpeedProfileSchema = mongoose.Schema({

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

module.exports = mongoose.model('SpeedProfile', SpeedProfileSchema);
