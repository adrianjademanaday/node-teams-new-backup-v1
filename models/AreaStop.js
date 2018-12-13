// IMPORTS

const SERVER_ROOT = './..';

var mongoose = require('mongoose-q')();
var LatLng = require(SERVER_ROOT + '/models/LatLng');


// PROPERTIES

var AreaStopSchema = mongoose.Schema({
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

AreaStopSchema.methods.toLatLng = function() {
	return new LatLng(this.lat, this.lng);
};

mongoose.model('AreaStop', AreaStopSchema);
module.exports = AreaStopSchema;