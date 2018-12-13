// IMPORTS

var Q = require('q');
var mongoose = require('mongoose-q')();

// PROPERTIES

var OriginDestinationSchema = mongoose.Schema({

    route: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Route' 
    },
        
	seatNumber: Number,
	
    origin: { 
    	type: mongoose.Schema.Types.ObjectId, 
    	ref: 'RouteStop' 
    },

    originTimeStamp: Date,
	originHour: Number,
	
    destination: { 
    	type: mongoose.Schema.Types.ObjectId, 
    	ref: 'RouteStop' 
    },

    destinationTimeStamp: Date,
	destinationHour: Number,
    speedEntries: [],
    isMoving: Number,

    hour: Number,
    sampleNumber: Number
});

module.exports = mongoose.model('OriginDestination', OriginDestinationSchema);
