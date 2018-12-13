// IMPORTS

var mongoose = require('mongoose-q')();

// PROPERTIES

var RouteSchema = mongoose.Schema({
    areaId: String,

    name: String,
    longName: String,
    
    mapCenter: {
    	lat: Number,
    	lng: Number
    },
    
    routeStops: [{
    	type: mongoose.Schema.Types.ObjectId, 
	  	ref: 'RouteStop' 
    }],

    vehicleRouteStops: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'VehicleRouteStop' 
    }],

    seatConfiguration: {
        id: Number,
        name: String        
    },

    totalSurveys: Number
});

mongoose.model('Route', RouteSchema);
module.exports = RouteSchema;