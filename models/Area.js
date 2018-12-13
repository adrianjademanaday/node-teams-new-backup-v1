// IMPORTS

var mongoose = require('mongoose-q')();

const SERVER_ROOT = './..'
var LatLng = require(SERVER_ROOT + '/models/LatLng');


// SCHEMA

var AreaSchema = mongoose.Schema({
	name: String,
	
	topLeftBounds: {
		lat: Number,
		lng: Number
	},

	bottomRightBounds: {
		lat: Number,
		lng: Number
	},

	mapCenter: {
		lat: Number,
		lng: Number
	},

	areaStops: [{
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'AreaStop' 
	}],

	vehicleAreaStops: [{
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'VehicleAreaStop' 
	}],

	routes: [{
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'Route' 
	}],	
});

AreaSchema.methods.computeCenter = function() {
	var width = Math.abs(this.bottomRightBounds.lng - this.topLeftBounds.lng);
  var height = Math.abs(this.topLeftBounds.lat - this.bottomRightBounds.lat);

  var lat = this.bottomRightBounds.lat + (height / 2.0);
  var lng = this.topLeftBounds.lng + (width / 2.0);

  this.mapCenter = new LatLng(lat, lng);
};

mongoose.model('Area', AreaSchema);	
module.exports = AreaSchema;
	
