const SERVER_ROOT = './../..';
var Q = require('q');
var LatLng = require(SERVER_ROOT + '/models/LatLng');

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');
var Route = mongoose.model('Route');
var stsp = require(SERVER_ROOT + '/services/data/SensorToSeatParserService');


/**
 * 
 * Display The Manage Area Main page.
 * 
 */
exports.main = function(req, res) {
	Area.aggregate(
	[
	  {$sort :{name: 1} },
      {
         $project: {
			name: 1,
            numberOfRoutes: { $size: "$routes" },
            lat: "$mapCenter.lat",
            lang: "$mapCenter.lng"
         }
      }
	], function(err, docs){
		res.render('admin/manage/main', {
			areas: docs
		});		
	   }
	);
};

/**
 * 
 * Display the add are page.
 * 
 */
module.exports.initAddArea = function(req, res) {
	res.render('admin/manage/addArea', {});
};

/**
 * 
 * Display The Manage route page and posting all available areas from the database.
 * 
 */
module.exports.initAddRoute = function(req, res) {
	Area.find({}, null, {sort: {name: 1}}, function(err, docs) {
		res.render('admin/manage/addRoute', {
			areas: docs
	 	});	
	});
};


/**
 * 
 * Process the handle request from add area page, then save in to database.
 * 
 */
function initArea(name, topLeftBoundsLat, topLeftBoundsLng, bottomRightBoundsLat, bottomRightBoundsLng) {
	var area = new Area({
		name: name,
		longName: name,

		topLeftBounds: {
			lat: topLeftBoundsLat,
			lng: topLeftBoundsLng
		},

		bottomRightBounds: {
			lat: bottomRightBoundsLat,
			lng: bottomRightBoundsLng
		},

		areaStops: []
	});

	area.computeCenter();	
	area.save();

	return area;
};


/**
 * 
 * Handles the request from add area.
 * 
 */
module.exports.addArea = function(req, res) {
	var nameOfArea = req.body.nameOfArea;
	var topLeftLat = parseFloat(req.body.topLeftLat);
	var topLeftLng = parseFloat(req.body.topLeftLng);
	var bottomRightLat = parseFloat(req.body.bottomRightLat);
	var bottomRightLng = parseFloat(req.body.bottomRightLng);

	var newArea = initArea(nameOfArea, topLeftLat, topLeftLng, bottomRightLat, bottomRightLng);
	Area.update({ "_id" : newArea._id },
		function(err, next){
			if(err){
				console.log("Error" + err);                
			}
			else{                
				console.log("Existing data was update.");
			}
	});
	
	Area.aggregate(
	[
	  {$sort :{name: 1} },
      {
         $project: {
			name: 1,
            numberOfRoutes: { $size: "$routes" },
            lat: "$mapCenter.lat",
            lang: "$mapCenter.lng"
         }
      }
	], function(err, docs){
		res.render('admin/manage/main', {
			areas: docs
		});		
	   }
	);
};

/**
 * 
 * Process the handle request from add route page, then save in to database.
 * 
 */
function initRoute(areaId, name, lat, lng, seatConfiguration) {
	var route = new Route({
		areaId: areaId,

		name: name,
		longName: name,

		mapCenter: {
			lat: lat,
			lng: lng
		},
		
		routeStops: [],

		seatConfiguration: seatConfiguration,
		totalSurveys: 0		
	});

	route.save();

	return route;
};

/**
 * 
 * handle and display the request process from add route page.
 * 
 */
module.exports.addRoute = function(req, res) {
	var areaId = req.body.areaId;
	var nameOfRoute = req.body.nameOfRoute;
	var setConfig = req.body.setConfig;
	var mapCenterLat = parseFloat(req.body.mapCenterLat);
	var mapCenterLng = parseFloat(req.body.mapCenterLng);
	
	if(setConfig == 0){
		var setConfigs = stsp.TWO_IN_AND_ONE_DRIVER_BACK_SEAT_CONFIGURATION;
	}
	else if(setConfig == 1){
		var setConfigs = stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION;
	}
	else if(setConfig == 2){
		var setConfigs = stsp.TWO_FRONT_AND_FOUR_BACK_SEAT_CONFIGURATION;
	}
	else{
		var setConfigs = stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION;
	}
	var newRoute = initRoute(areaId, nameOfRoute, mapCenterLat, mapCenterLng, setConfigs);
	
	Area.update({ "_id" : areaId },{ "$addToSet" : { "routes" : newRoute._id } },
		function(err, next){
			if(err){
				console.log("Error" + err);                
			}
			else{                
				console.log("Existing data was update.");
			}
	});
	Area.aggregate(
	[
	  {$sort :{name: 1} },
      {
         $project: {
			name: 1,
            numberOfRoutes: { $size: "$routes" },
            lat: "$mapCenter.lat",
            lang: "$mapCenter.lng"
         }
      }
	], function(err, docs){
		res.render('admin/manage/main', {
			areas: docs
		});		
	   }
	);
};

/**
 * 
 * Fetch the data from the database and display the list of routes of an area.
 * 
 */
exports.viewRoute = function(req, res){
	var qs = req.query;
	Route.find({areaId: qs.id}, null, {sort: {name: 1}}, function(err, docs){
		res.render('admin/manage/viewRoute',{routes: docs, name: qs});
	});
};

/**
 * 
 * Remove the row of area collection base on the areaId.
 * 
 */
exports.removeArea = function(req, res){
	var qs =req.query;
	Area.remove({_id: qs.id},function(err,next){
		if(err){
            console.log("Error" + err);                
        }
        else{                
            console.log(qs.id + "removed");
        }
	});
	Route.remove({areaId: qs.id},function(err,next){
		if(err){
            console.log("Error" + err);                
        }
        else{                
            console.log(qs.id + "removed");
        }
	});
	Area.aggregate(
	[
	  {$sort :{name: 1} },
      {
         $project: {
			name: 1,
            numberOfRoutes: { $size: "$routes" },
            lat: "$mapCenter.lat",
            lang: "$mapCenter.lng"
         }
      }
	], function(err, docs){
		res.render('admin/manage/main', {
			areas: docs
		});		
	   }
	);
};


/**
 * 
 * Remove the row of route collection base on the routeId.
 * 
 */
exports.removeRoute = function(req, res){
	var qs = req.query;
	Route.remove({_id: qs.removeId},function(err,next){
		if(err){
            console.log("Error" + err);                
        }
        else{                
            console.log(qs.removeId + "removed");
        }
	});
	Area.update({ "_id" : qs.id },{ "$pull" : { "routes" : qs.removeId } },
		function(err, next){
			if(err){
				console.log("Error" + err);                
			}
			else{                
				console.log("Existing data was update.");
			}
	});
	Route.find({areaId: qs.id}, null, {sort: {name: 1}}, function(err, docs){
		res.render('admin/manage/viewRoute',{routes: docs, name: qs});
	});
};


/**
 * 
 * Display the updata page of area.
 * 
 */
module.exports.initEditArea = function(req, res){
	var qs = req.query;
	Area.find({_id: qs.id},function(err, docs){
		res.render('admin/manage/editArea', {areas: docs});
	});
};

module.exports.editArea = function(req, res){
	var areaId = req.body.areaId
	var nameOfArea = req.body.nameOfArea;
	var topLeftLat = parseFloat(req.body.topLeftLat);
	var topLeftLng = parseFloat(req.body.topLeftLng);
	var bottomRightLat = parseFloat(req.body.bottomRightLat);
	var bottomRightLng = parseFloat(req.body.bottomRightLng);
	
	Area.update({ "_id" : areaId },
		{ "$set" : { 
			"name" : nameOfArea,
			"topLeftBounds.lat": topLeftLat, 
			"topLeftBounds.lng": topLeftLng, 
			"bottomRightBounds.lat": bottomRightLat,
			"bottomRightBounds.lng": bottomRightLng 
		}},
		function(err, next){
			if(err){
				console.log("Error" + err);                
			}
			else{                
				console.log("Existing data was update.");
			}
	});
	
	Area.aggregate(
	[
	  {$sort :{name: 1} },
      {
         $project: {
			name: 1,
            numberOfRoutes: { $size: "$routes" },
            lat: "$mapCenter.lat",
            lang: "$mapCenter.lng"
         }
      }
	], function(err, docs){
		res.render('admin/manage/main', {
			areas: docs
		});		
	   }
	);
	
};


/**
 * 
 * Display the updata page of route.
 * 
 */

module.exports.initEditRoute = function(req, res){
	var qs = req.query;
	Area.find({_id: qs.areaId},function(errFirst,nextFirst){
		if(errFirst){
			console.log("Error" + errFirst);                
		}
		else{
			Area.find({}, null, {sort: {name: 1}}, function(errSecond, nextSecond) {
				if(errFirst){
					console.log("Error" + errSecond);                
				}
				else{
					Route.find({_id: qs.id},function(err, docs){
						res.render('admin/manage/editRoute', {routes: docs, areasFirst: nextFirst, areasSecond: nextSecond});
					});
				}
			});
		}	
	});
};

module.exports.editRoute = function(req, res){
	var areaId = req.body.areaId;
	var curAreaId = req.body.curAreaId;
	var routeId = req.body.routeId;
	var nameOfRoute = req.body.nameOfRoute;
	var setConfig = req.body.setConfig;
	var mapCenterLat = parseFloat(req.body.mapCenterLat);
	var mapCenterLng = parseFloat(req.body.mapCenterLng);
	
	if(setConfig == 0){
		var setConfigs = stsp.TWO_IN_AND_ONE_DRIVER_BACK_SEAT_CONFIGURATION;
	}
	else if(setConfig == 1){
		var setConfigs = stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION;
	}
	else if(setConfig == 2){
		var setConfigs = stsp.TWO_FRONT_AND_FOUR_BACK_SEAT_CONFIGURATION;
	}
	else{
		var setConfigs = stsp.THREE_IN_AND_TWO_DRIVER_BACK_SEAT_CONFIGURATION;
	}
	
	if(curAreaId != areaId){
		
		var newRoute = initRoute(areaId, nameOfRoute, mapCenterLat, mapCenterLng, setConfigs);
		
		Area.update({ "_id" : areaId },{ "$addToSet" : { "routes" : newRoute._id } },
			function(err, next){
				if(err){
					console.log("Error" + err);                
				}
				else{                
					console.log("Existing data was update.");
				}
		});
		
		Route.remove({_id: routeId},function(err,next){
			if(err){
				console.log("Error" + err);                
			}
			else{                
				console.log(routeId + "removed");
			}
		});
		
		Area.update({ "_id" : curAreaId },{ "$pull" : { "routes" : routeId } },
			function(err, next){
				if(err){
					console.log("Error" + err);                
				}
				else{                
					console.log("Existing data was update.");
				}
		});
		
	}
	else{
		
		Route.update({ "_id" : routeId },
		{ "$set" : { 
			"name" : nameOfRoute,
			"longName" : nameOfRoute, 
			"seatConfiguration" : setConfigs,
			"mapCenter.lat" : mapCenterLat,
			"mapCenter.lng" : mapCenterLng
		}},
		function(err, next){
			if(err){
				console.log("Error" + err);                
			}
			else{                
				console.log("Existing data was update.");
			}
		});
	
	
	}
	
	Area.aggregate(
	[
	  {$sort :{name: 1} },
      {
         $project: {
			name: 1,
            numberOfRoutes: { $size: "$routes" },
            lat: "$mapCenter.lat",
            lang: "$mapCenter.lng"
         }
      }
	], function(err, docs){
		res.render('admin/manage/main', {
			areas: docs
		});		
	   }
	);
	
};


