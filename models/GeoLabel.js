// IMPORTS

var mongoose = require('mongoose-q')();

var SERVER_ROOT = './..';
var LatLng = require(SERVER_ROOT + '/models/LatLng');

// SCHEMA

var GeoLabelSchema = mongoose.Schema({
	name: String,
	
	lat: Number,
	lng: Number

});

GeoLabelSchema.methods.toLatLng = function() {
	return new LatLng(this.lat, this.lng);
};

mongoose.model('GeoLabel', GeoLabelSchema);
module.exports = GeoLabelSchema;
	
