// IMPORTS

var SERVER_ROOT = './..';

var mongoose = require('mongoose-q')();
var LatLng = require(SERVER_ROOT + '/models/LatLng');


// PROPERTIES

var VehicleRouteStopSchema = mongoose.Schema({
    name: String,
    longName: String,
    order: Number,
    
    route: { 
  		type: mongoose.Schema.Types.ObjectId, 
  		ref: 'Route' 
  	},

    vehicleAreaStop: { 
  		type: mongoose.Schema.Types.ObjectId, 
  		ref: 'VehicleAreaStop' 
  	}
});

mongoose.model('VehicleRouteStop', VehicleRouteStopSchema);
module.exports = VehicleRouteStopSchema;