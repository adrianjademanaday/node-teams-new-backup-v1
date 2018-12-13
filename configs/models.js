// CONSTANTS

const SERVER_ROOT = './..';

/**
 * 
 * Initialize database connection.
 * Generate model table definitions in database if not existing
 * or needs to be updated. 
 * 
 */

module.exports = function() {
	var mongoose = require('mongoose-q')();

	//mongoose.connect('mongodb://' + DB_USERNAME + ':'+ DB_PASSWORD + '@' + DB_HOST + ':' + DB_PORT + '/' + DB_DATABASE);
	mongoose.connect('mongodb://' + DB_HOST + ':' + DB_PORT + '/' + DB_DATABASE, { useNewUrlParser: true });

	// REGISTER MODELS
	require(SERVER_ROOT + '/models/AreaStop');
	require(SERVER_ROOT + '/models/VehicleAreaStop');
	require(SERVER_ROOT + '/models/Area');
	require(SERVER_ROOT + '/models/RouteStop');
	require(SERVER_ROOT + '/models/VehicleRouteStop');
	require(SERVER_ROOT + '/models/Route');
	require(SERVER_ROOT + '/models/SpeedRecord');
	require(SERVER_ROOT + '/models/VehicleOriginDestination');
	require(SERVER_ROOT + '/models/OriginDestination');
	require(SERVER_ROOT + '/models/BoardingAlighting');
	require(SERVER_ROOT + '/models/User');
	require(SERVER_ROOT + '/models/GeoLabel');
	require(SERVER_ROOT + '/models/HourlyStat');
	require(SERVER_ROOT + '/models/HourlySpeed');
	
	console.log("***done  models.js***");	
}