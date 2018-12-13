// IMPORTS

var mongoose = require('mongoose-q')();


// PROPERTIES

var BoardingAlightingSchema = mongoose.Schema({

		direction: Number, // boarding or alighting	

    routeStop: { 
    	type: mongoose.Schema.Types.ObjectId, 
    	ref: 'RouteStop' 
    },

    timeStamp: Date

});

// ENUMS

BoardingAlightingSchema.statics.BOARDING = 0;
BoardingAlightingSchema.statics.ALIGHTING = 1;

module.exports = mongoose.model('BoardingAlighting', BoardingAlightingSchema);
