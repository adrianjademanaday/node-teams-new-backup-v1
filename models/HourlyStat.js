// IMPORTS

var Q = require('q');
var mongoose = require('mongoose-q')();

// PROPERTIES

var HourlyStatSchema = mongoose.Schema({
 
    sampleNumber: Number,
    routeId: String,
    hour: Number,
    totalDistanceTravelled: Number,
    totalBoarding: Number,
    totalAlighting: Number,
    tripCount: Number,
    averageDistanceTravelledPerTrip: Number,
    averageSpeedPerTrip: Number,
    totalWaitingTime: Number,
    totalMovingTimeWithLoad: Number,
    maxSpeed: Number,
    _50thPercentileSpeed: Number,
    _80thPercentileSpeed: Number,

    speeds: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'HourlySpeed'
    }],

});

module.exports = mongoose.model('HourlyStat', HourlyStatSchema);