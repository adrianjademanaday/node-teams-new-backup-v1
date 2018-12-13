// IMPORTS

var Q = require('q');
var mongoose = require('mongoose-q')();

// PROPERTIES

var VehicleOriginDestinationSchema = mongoose.Schema({

    route: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Route' 
    },    

    origin: { 
    	type: mongoose.Schema.Types.ObjectId, 
    	ref: 'VehicleRouteStop' 
    },

    originHour: Number,

    originTimeStamp: Date,

    destination: { 
    	type: mongoose.Schema.Types.ObjectId, 
    	ref: 'VehicleRouteStop' 
    },

    destinationTimeStamp: Date,

    destinationHour: Number,

    speedEntries: [],
    isMoving: Number,

    hour: Number,
    sampleNumber: Number
});

module.exports = mongoose.model('VehicleOriginDestination', VehicleOriginDestinationSchema);