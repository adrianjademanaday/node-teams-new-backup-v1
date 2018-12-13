// IMPORTS

var SERVER_ROOT = './..';

var mongoose = require('mongoose-q')();
var LatLng = require(SERVER_ROOT + '/models/LatLng');


// PROPERTIES

var RouteStopSchema = mongoose.Schema({
    name: String,
    longName: String,
    order: Number,
    
    route: { 
  		type: mongoose.Schema.Types.ObjectId, 
  		ref: 'Route' 
  	},

    areaStop: { 
  		type: mongoose.Schema.Types.ObjectId, 
  		ref: 'AreaStop' 
  	}
});

// RouteStopSchema..virtual('latLng').set(function (name) {
//   var split = name.split(' ');
//   this.name.first = split[0];
//   this.name.last = split[1];
// });

mongoose.model('RouteStop', RouteStopSchema);
module.exports = RouteStopSchema;