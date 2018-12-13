const SERVER_ROOT = './../..';

var Q = require('q');

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');
var AreaStop = mongoose.model('AreaStop');
var RouteStop = mongoose.model('RouteStop');

var bootstrap = require(SERVER_ROOT + '/configs/bootstrap');

/**
 * 
 * Shows the main page for Reorder Passenger AreaStops task
 * 
 */

exports.show = function(req, res) {
	Area.find({}, null, {sort: {name: 1}}, function(err, areas) {
		res.render('admin/reorderAreaStops/show', {
			areas: areas,
	 		areaId: null,
	 		message: null	 		
	 	});	
	});
};

/**
 * 
 * Renames all Vehicle AreaStops by number and sorts them by that.
 * 
 */

exports.reorder = function(req, res) {
	var number = 1;

	var areaId = req.body.areaId;

	fetchArea(areaId)
	.then(function(area) {
		AreaStop.find({area: area}, null, {sort: {name: 1}}, function(err, areaStops) {
			areaStops.forEach(function(as) {

				as.name = '' + number;
				number++;

				as.save();
				
			});
		});

        // TODO: remove this

		// RouteStop.find({area: area}, null, {sort: {name: 1}}, function(err, routeStops) {
		// 	opts = {
		//     path: 'areaStop',
		//   	select: 'name lat lng'  	
		//   }

		//   AreaStop.populate(routeStops, opts, function(err, routeStops) {
		//   	routeStops.forEach(function(rs) {			
		// 			rs.name = rs.areaStop.name;
					
		// 			rs.save();
		// 		});	
		//   });
		// });

		Area.find({}, null, {sort: {name: 1}}, function(err, areas) {
			res.render('admin/reorderAreaStops/show', {
				areas: areas,
		 		areaId: null,
		 		message: 'Reordered Passenger Area Stops'
		 	});	
		});
	});
};

/**
 * 
 * Queries the area from database using given the areaId.
 * 
 */

function fetchArea(areaId) {
	var defer = Q.defer();

	Area.findById(areaId)	
	.exec(function(err, area) {
		defer.resolve(area);
	});

	return defer.promise;
}