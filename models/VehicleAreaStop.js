// IMPORTS

const SERVER_ROOT = './..';

var mongoose = require('mongoose-q')();
var LatLng = require(SERVER_ROOT + '/models/LatLng');


// PROPERTIES

var VehicleAreaStopSchema = mongoose.Schema({
    name: String,
    gridNumber: Number,
    pointCount: 0,
    lat: Number,
    lng: Number,

    area: { 
  		type: mongoose.Schema.Types.ObjectId, 
  		ref: 'Area' 
  	}
});

VehicleAreaStopSchema.methods.toLatLng = function() {
	return new LatLng(this.lat, this.lng);
};

mongoose.model('VehicleAreaStop', VehicleAreaStopSchema);
module.exports = VehicleAreaStopSchema;