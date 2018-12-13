var Q = require('q');
var mongoose = require('mongoose-q')();
var GeoLabel = mongoose.model('GeoLabel');

// NOTE: Probable Unused Class

module.exports.process = function(areaStops) {
	var defer = Q.defer();

	loadAllGeoLabels(argumentsPackage)
	.then(function(argumentsPackage) {
		var areaStopsWithNames = matchAreaStopsToGeoLabels(argumentsPackage);

		defer.resolve(areaStops);
	});

	return defer.promise;
}

function loadAllGeoLabels(argumentsPackage) {
	var q = defer();

	GeoLabel.find({})
	.then(function(geoLabels) {
		argumentsPackage.geoLabels = geoLabels;

		defer.resolve(argumentsPackage);
	})

	return q.promise;
}

function matchAreaStopsToGeoLabels(argumentsPackage) {
	var geoLabels = argumentsPackage.geoLabels;
	var areaStops = argumentsPackage.areaStops;

	areaStops.forEach(function(as) {
		var nearestGeoLabel = as.toLatLng().findNearestPoint(geoLabels);

		as.name = nearestGeoLabel.name;
	});

	return areaStops;
}