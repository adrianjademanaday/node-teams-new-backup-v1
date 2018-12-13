var Base = require('basejs');

var RawOriginDestination = Base.extend({
	
	constructor: function() {
		
	},

	origin: {
		lat: Number,
		lng: Number,
		time: String		
	},

	destination: {
		lat: Number,
		lng: Number,
		time: String
	},

});

module.exports = RawOriginDestination;