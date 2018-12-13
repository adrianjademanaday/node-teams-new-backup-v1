const SERVER_ROOT = './../..';
var Q = require('q');
var LatLng = require(SERVER_ROOT + '/models/LatLng');

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');
var Route = mongoose.model('Route');
var HourlyStat = mongoose.model('HourlyStat');
var HourlySpeed = mongoose.model('HourlySpeed');
var tsd = require(SERVER_ROOT + '/models/TricycleSurveyData');

/**
 * 
 * Shows the Hourly Stats query page.
 * 
 */

exports.show = function(req, res) {
	Area.find({}, null, {sort: {name: 1}}, function(err, areas) {
		res.render('reports/hourlyStats/show', {
			areas: areas,
	 		routes: [],
	 		routeId: null,
	 		sampleNumber: null,
	 	});	
	});
};

/**
 * 
 * Handles the request for fetching the
 * queried report from the database.
 * 
 */

exports.fetch = function(req, res) {
	var routeId = req.query.routeId;
	routeId = routeId.trim();
	var hourId = parseInt(req.query.hourId);
	var sampleNumber = parseInt(req.query.sampleNumber);

	var argumentsPackage = {
		routeId: routeId,
		hourId: hourId,
		sampleNumber: sampleNumber
	}

	fetchRoute(argumentsPackage)
	.then(fetchReport)	
	.then(function(argumentsPackage) {
		res.json({
			report: argumentsPackage.hourlyStats,
			hourlySpeedsBySample: argumentsPackage.hourlySpeedsBySample,
			mapCenter: argumentsPackage.mapCenter
		});
	});
};

/**
 * 
 * Fetches the Route data given the routeId.
 * 
 */

function fetchRoute(argumentsPackage) {
	var defer = Q.defer();

	var routeId = argumentsPackage.routeId;

	Route.findByIdQ(routeId)
	.then(function(route) {
		argumentsPackage.mapCenter = {
			lat: route.mapCenter.lat,
			lng: route.mapCenter.lng
		};

		defer.resolve(argumentsPackage);
	});

	return defer.promise;
}

/**
 * 
 * Queries the report from the database.
 * 
 */

function fetchReport(argumentsPackage) {
	var defer = Q.defer();

	var routeId = argumentsPackage.routeId;
	var hourId = argumentsPackage.hourId;
	var sampleNumber = argumentsPackage.sampleNumber;

  var averagehourlyStats = null;
  var hourlySpeedsBySample = null;

  if (sampleNumber != 0) {
  	HourlyStat.find({routeId: routeId, hour: hourId, sampleNumber: sampleNumber}).lean().exec(function(err, hourlyStats) {
			HourlySpeed.find({routeId: routeId, hour: hourId, sampleNumber: sampleNumber}).lean().exec(function(err, hourlySpeeds) {
				averagehourlyStats = averageHourlyStats(hourlyStats);
				hourlySpeedsBySample = [hourlySpeeds];

				argumentsPackage.hourlyStats = averagehourlyStats;
				argumentsPackage.hourlySpeedsBySample = hourlySpeedsBySample;

				defer.resolve(argumentsPackage);			
			});	
		});	
  } else {
  	HourlyStat.find({routeId: routeId, hour: hourId}).lean().exec(function(err, hourlyStats) {
			HourlySpeed.find({routeId: routeId, hour: hourId}).lean().exec(function(err, hourlySpeeds) {
				averagehourlyStats = averageHourlyStats(hourlyStats);
				hourlySpeedsBySample = groupHourlySpeedsBySample(hourlySpeeds, hourlyStats.length);

				argumentsPackage.hourlyStats = averagehourlyStats;
				argumentsPackage.hourlySpeedsBySample = hourlySpeedsBySample;

				defer.resolve(argumentsPackage);			
			});	
		});	
  }

	return defer.promise;
}

/**
 * 
 * Groups speed data by hour. 
 * 
 */

function groupHourlySpeedsBySample(hourlySpeeds, numberOfSamples) {
	var hourlySpeedsBySample = [];

	for (var i = 0; i < numberOfSamples; i++) {
		var hourlySpeedsOfSample = [];

		hourlySpeeds.forEach(function(hs) {
			var sampleNumber = i + 1;

			if (hs.sampleNumber === sampleNumber) {
				hourlySpeedsOfSample.push(hs);
			}
		});

		hourlySpeedsBySample[i] = hourlySpeedsOfSample;
	}

	return hourlySpeedsBySample;
}

/**
 * 
 * Averages the computed hourly stats of all samples in the database.
 * 
 */

function averageHourlyStats(hourlyStats) {
	var hourlyStatsCount = hourlyStats.length;

	// _xxx means grand total / average of xxx

	var _totalDistanceTravelled = 0;
	var _totalBoarding = 0;
	var _totalAlighting = 0;
	var _tripCount = 0;
	var _averageDistanceTravelledPerTrip = 0;
	var _averageSpeedPerTrip = 0;
	var _50thPercentileSpeed = 0;
	var _80thPercentileSpeed = 0;
	var _totalWaitingTime = 0;
	var _totalMovingTimeWithLoad = 0;
	var _maxSpeed = 0;

	hourlyStats.forEach(function(hs) {
		_totalDistanceTravelled += hs.totalDistanceTravelled;
		_totalBoarding += hs.totalBoarding;
		_totalAlighting += hs.totalAlighting;
		_tripCount += hs.tripCount;
		_averageDistanceTravelledPerTrip += hs.averageDistanceTravelledPerTrip;
		_50thPercentileSpeed += hs._50thPercentileSpeed;
		_80thPercentileSpeed += hs._80thPercentileSpeed;
		_averageSpeedPerTrip += hs.averageSpeedPerTrip;
		_totalWaitingTime += hs.totalWaitingTime;
		_totalMovingTimeWithLoad += hs.totalMovingTimeWithLoad;
		_maxSpeed += hs.maxSpeed;
	});

	_totalDistanceTravelled /= hourlyStatsCount;
	_totalBoarding /= hourlyStatsCount;
	_totalAlighting /= hourlyStatsCount;
	_tripCount /= hourlyStatsCount;
	_averageDistanceTravelledPerTrip /= hourlyStatsCount;
	_averageSpeedPerTrip /= hourlyStatsCount;
	_50thPercentileSpeed /= hourlyStatsCount;
	_80thPercentileSpeed /= hourlyStatsCount;
	_totalWaitingTime /= hourlyStatsCount;
	_totalMovingTimeWithLoad /= hourlyStatsCount;
	_maxSpeed /= hourlyStatsCount;

	return {
		totalDistanceTravelled: _totalDistanceTravelled.toFixed(2), 
		totalBoarding: _totalBoarding.toFixed(2),
		totalAlighting: _totalAlighting.toFixed(2), 
		tripCount: _tripCount.toFixed(2),
		averageDistanceTravelledPerTrip: _averageDistanceTravelledPerTrip.toFixed(2),
		averageSpeedPerTrip: _averageSpeedPerTrip.toFixed(2),
		_50thPercentileSpeed: _50thPercentileSpeed.toFixed(2),
		_80thPercentileSpeed: _80thPercentileSpeed.toFixed(2),
		totalWaitingTime: _totalWaitingTime.toFixed(2),
		totalMovingTimeWithLoad: _totalMovingTimeWithLoad.toFixed(2),
		maxSpeed: _maxSpeed.toFixed(2),
		numberOfSamples: hourlyStatsCount
	}
}
