// IMPORTS

var Q = require('q');
var mongoose = require('mongoose-q')();

// PROPERTIES

var HourlySpeedSchema = mongoose.Schema({
 
 	sampleNumber: Number,
    routeId: String,
    time: String,
    hour: Number,
    lat: Number,
    lng: Number,
    isMoving: Boolean,
    status: Number,
    hasLoad: Boolean,
    load: Number

});

module.exports = mongoose.model('HourlySpeed', HourlySpeedSchema);
