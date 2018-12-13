// IMPORTS

const SERVER_ROOT = './../../..';

var moment = require('moment');
var Q = require('q');
var mongoose = require('mongoose-q')();

var tsd = require(SERVER_ROOT + '/models/TricycleSurveyData');

var BoardingAlighting = mongoose.model('BoardingAlighting');
var HourlyStat = mongoose.model('HourlyStat');
var HourlySpeed = mongoose.model('HourlySpeed');


// CONSTANTS

const TIME_FORMAT = 'HH:mm:ss';
const NO_DATA = '*';

const HOUR_HEADER = '\"Hour\"';
const TOTAL_DISTANCE_TRAVELLED_PER_HOUR_HEADER = '\"Distance Travelled (Km)\"';
const TOTAL_BOARDING_PER_HOUR_HEADER = '\"Boarding\"';
const TOTAL_ALIGHTING_PER_HOUR_HEADER = '\"Alighting\"';
const AVERAGE_DISTANCE_TRAVELLED_PER_TRIP_PER_HOUR_HEADER = '\"Ave. Distance Per Trip (Km)\"';
const AVERAGE_SPEED_PER_TRIP_PER_HOUR_HEADER = '\"Ave. Speed Per Trip (Kph)\"';
const FIFTIETH_PERCENTILE_SPEED_HEADER = '\"50th Percentile Speed (Kph)\"';
const EIGHTIETH_PERCENTILE_SPEED_HEADER = '\"80th Percentile Speed (Kph)\"';
const TOTAL_WAITING_TIME_PER_HOUR_HEADER = '\"Waiting Time (min.)\"';
const TOTAL_MOVING_TIME_WITH_LOAD_PER_HOUR_HEADER = '\"Moving Time with Load (min.)\"';
const MAX_SPEED_PER_HOUR_HEADER = '\"Max Speed (Kph)\"';
const TRIP_COUNT_PER_HOUR_HEADER = '\"Trips\"';

const TOTAL_DISTANCE_TRAVELLED_PER_HOUR_INDEX = 1;
const TOTAL_BOARDING_PER_HOUR_INDEX = 2;
const TOTAL_ALIGHTING_PER_HOUR_INDEX = 3;
const AVERAGE_DISTANCE_TRAVELLED_PER_TRIP_PER_HOUR_INDEX = 4;
const AVERAGE_SPEED_PER_HOUR_INDEX = 5;
const FIFTIETH_PERCENTILE_SPEED_INDEX = 6;
const EIGHTIETH_PERCENTILE_SPEED_INDEX = 7;
const TOTAL_WAITING_TIME_PER_HOUR_INDEX = 8;
const TOTAL_MOVING_TIME_WITH_LOAD_PER_HOUR_INDEX = 9;
const MAX_SPEED_PER_HOUR_INDEX = 10;
const TRIP_COUNTS_PER_HOUR_INDEX = 11;

// Speed Profile Indeces

const OUT_CURRENT_LAT_INDEX = 0;
const OUT_CURRENT_LNG_INDEX = 1;
const OUT_PREVIOUS_LAT_INDEX = 2;
const OUT_PREVIOUS_LNG_INDEX = 3;
const OUT_DISTANCE_DIFFERENCE_INDEX = 4;
const OUT_TIME_INDEX = 5;
const OUT_TIME_DIFFERENCE_INDEX = 6;
const OUT_SPEED_INDEX = 7;	
const OUT_IS_MOVING_INDEX = 8;
const OUT_HAS_LOAD_INDEX = 9;
const ACTUAL_DISTANCE_DIFFERENCE_INDEX = 10;
const ACTUAL_TIME_DIFFERENCE_INDEX = 11;

const MAX_SPEED_IN_KPH = 60;

// PUBLIC FUNCTIONS

/**
 * 
 * Computes the various hourly stats
 * 
 */

module.exports.process = function(route, speedProfile, boardingAlightings, sampleNumber, surveyData) {
	var defer = Q.defer();

	var statsByTheHour = createArrayByTheHour();
	var statsByTheHourPersistent = createPersistentHourlyStats(route, sampleNumber);

	addHeaders(statsByTheHour);
	addHourColumn(statsByTheHour, statsByTheHourPersistent);

	var speedProfileByTheHour = groupSpeedProfileByTheHour(speedProfile);
	// var originDestinationsByTheHour = groupOriginDestinationsByTheHour(originDestinations);
	var boardingAlightingsByTheHour = groupBoardingAlightingsByTheHour(boardingAlightings);

	getTotalDistanceTravelledPerHour(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent);
	getTotalBoardingPerHour(boardingAlightingsByTheHour, statsByTheHour, statsByTheHourPersistent);
	getTotalAlightingPerHour(boardingAlightingsByTheHour, statsByTheHour, statsByTheHourPersistent);
	getTripCountsByTheHour(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent);
	getAverageDistanceTravelledPerTripPerHour(statsByTheHour, statsByTheHourPersistent);
	getFiftiethPercentileSpeed(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent);
	getEightiethPercentileSpeed(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent)
	getWeightedAverageSpeedPerTripPerHour(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent);
	getTotalWaitingTimePerHour(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent);
	getTotalMovingTimeWithLoadPerHour(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent);
	getMaxSpeedPerHour(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent);

	var argumentsPackage = {
		route: route,
		speedProfileByTheHour: speedProfileByTheHour,
		statsByTheHourPersistent: statsByTheHourPersistent,		
		sampleNumber: sampleNumber,
		surveyData: surveyData
	};

	 saveSpeedEntries(argumentsPackage)
	 .then(saveHourlyStats)
	 .then(defer.resolve(statsByTheHour));

	defer.resolve(statsByTheHour);

	return defer.promise;
}


// PRIVATE FUNCTIONS

// TODO: Remove this.

function createPersistentHourlyStats(route, sampleNumber) {
	var hourlyStats = [];

	for (var hour = 1; hour <= 24; hour++) {
		var hourlyStat = new HourlyStat();
		hourlyStat.hour = hour;
		hourlyStat.routeId = route.id;
		hourlyStat.sampleNumber = sampleNumber;

		hourlyStats.push(hourlyStat);		
	}

	return hourlyStats;
}

/**
 * 
 * Creates an empty array with hours as indeces.
 * 
 */

function createArrayByTheHour() {
	var arrayByTheHour = [];

	for (var i = 1; i <= 24; i++) {
		arrayByTheHour[i] = [];
	}	

	return arrayByTheHour;
}

/**
 * 
 * Groups SpeedRecords by hour.
 * 
 */

function groupSpeedProfileByTheHour(speedProfile) {

	var speedProfileByTheHour = createArrayByTheHour();

	for (var hour = 1; hour <= 24; hour++) {
		speedProfile.forEach(function (speedEntry, index) {
			if (index != 0 ||  speedEntry[OUT_TIME_INDEX] != NO_DATA) {
				var momentTime = moment(speedEntry[OUT_TIME_INDEX], TIME_FORMAT);

				if (momentTime.hour() === hour) {
					speedProfileByTheHour[hour].push(speedEntry);
				}	
			}
		});
	}

	return speedProfileByTheHour;
}

/**
 * 
 * Group OriginDestinations by Hour.
 * 
 */

function groupOriginDestinationsByTheHour(originDestinations) {
	var originDestinationsByTheHour = createArrayByTheHour();

	for (var hour = 1; hour <= 24; hour++) {
		originDestinations.forEach(function (od) {
			var momentTime = moment(od.originTimeStamp);

			if (momentTime.hour() === hour) {
				originDestinationsByTheHour[hour].push(od);
			}
		});
	}

	return originDestinationsByTheHour;
}

/**
 * 
 * Group BoardingAlightings by hour.  
 * 
 */

function groupBoardingAlightingsByTheHour(boardingAlightings) {
	var boardingDestinationsByTheHour = createArrayByTheHour();

	for (var hour = 1; hour <= 24; hour++) {
		boardingAlightings.forEach(function (ba) {
			var momentTime = moment(ba.timeStamp);

			if (momentTime.hour() === hour) {
				boardingDestinationsByTheHour[hour].push(ba);
			}
		});
	}

	return boardingDestinationsByTheHour;
}

/**
 * 
 * Adds headers to the HourlyStats array for csv generation.
 * 
 */

function addHeaders(statsByTheHour) {
	var header = [];
	header.push(HOUR_HEADER);
	header.push(TOTAL_DISTANCE_TRAVELLED_PER_HOUR_HEADER);
	header.push(TOTAL_BOARDING_PER_HOUR_HEADER);
	header.push(TOTAL_ALIGHTING_PER_HOUR_HEADER);
	header.push(AVERAGE_DISTANCE_TRAVELLED_PER_TRIP_PER_HOUR_HEADER);
	header.push(AVERAGE_SPEED_PER_TRIP_PER_HOUR_HEADER);
	header.push(FIFTIETH_PERCENTILE_SPEED_HEADER);
	header.push(EIGHTIETH_PERCENTILE_SPEED_HEADER);
	header.push(TOTAL_WAITING_TIME_PER_HOUR_HEADER);
	header.push(TOTAL_MOVING_TIME_WITH_LOAD_PER_HOUR_HEADER);
	header.push(MAX_SPEED_PER_HOUR_HEADER);
	header.push(TRIP_COUNT_PER_HOUR_HEADER);
		
	statsByTheHour[0] = header;

	return statsByTheHour;
}

/**
 * 
 * Adds the hour column to the HourlyStats array for csv generation.
 * 
 */

function addHourColumn(statsByTheHour, statsByTheHourPersistent) {
	for (var hour = 1; hour <= 24; hour++) {
		statsByTheHour[hour][0] = hour;
		statsByTheHourPersistent[hour - 1].hour = hour;
	}

	return statsByTheHour;
}

/***
 * 
 * Computes the total distance travelled per hour of all samples.
 * 
 */

function getTotalDistanceTravelledPerHour(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent) {
	for (var hour = 1; hour <= 24; hour++) {
		var totalDistance = 0;		
		var hasMoved = false;
		
		speedProfileByTheHour[hour].forEach(function(speedEntry, index) {
			if (!hasMoved && speedEntry[OUT_IS_MOVING_INDEX] !== tsd.IS_STOPPED) {
				hasMoved = true;				
			} else if (hasMoved && speedEntry[OUT_IS_MOVING_INDEX] !== tsd.IS_STOPPED) {
				totalDistance += speedEntry[ACTUAL_DISTANCE_DIFFERENCE_INDEX];				
			} else if (hasMoved && speedEntry[OUT_IS_MOVING_INDEX] === tsd.IS_STOPPED) {
				totalDistance += speedEntry[ACTUAL_DISTANCE_DIFFERENCE_INDEX];						
				hasMoved = false;
			}			
		});

		totalDistance /= 1000 // convert to Km
		totalDistance = totalDistance.toFixed(4);

		statsByTheHour[hour][TOTAL_DISTANCE_TRAVELLED_PER_HOUR_INDEX] = totalDistance;
		statsByTheHourPersistent[hour - 1].totalDistanceTravelled = totalDistance;
	}

	return statsByTheHour;
}

/***
 * 
 * Computes the total boarding counts per hour of all samples.
 * 
 */

function getTotalBoardingPerHour(boardingAlightingsByTheHour, statsByTheHour, statsByTheHourPersistent) {
	for (var hour = 1; hour <= 24; hour++) {
		var total = 0;

		var boardingAlightingOfHour = boardingAlightingsByTheHour[hour]

		boardingAlightingOfHour.forEach(function(ba) {
			if (ba.direction === BoardingAlighting.BOARDING) {
				total++;
			}
		});

		statsByTheHour[hour][TOTAL_BOARDING_PER_HOUR_INDEX] = total;
		statsByTheHourPersistent[hour - 1].totalBoarding = total;
	}

	return statsByTheHour;
}

/**
 * 
 * Computes the total Alightings per hour of all samples.
 * 
 */

function getTotalAlightingPerHour(boardingAlightingsByTheHour, statsByTheHour, statsByTheHourPersistent) {
	for (var hour = 1; hour <= 24; hour++) {
		var total = 0;

		var boardingAlightingOfHour = boardingAlightingsByTheHour[hour];

		boardingAlightingOfHour.forEach(function(ba) {
			if (ba.direction === BoardingAlighting.ALIGHTING) {
				total++;
			}
		});

		statsByTheHour[hour][TOTAL_ALIGHTING_PER_HOUR_INDEX] = total;
		statsByTheHourPersistent[hour - 1].totalAlighting = total;
	}

	return statsByTheHour;
}

/**
 * 
 * Counts the number of trips per hour of all samples.
 * 
 */

function getTripCountsByTheHour(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent) {
	for (var hour = 1; hour <= 24; hour++) {
		var totalDistance = 0;		
		var hasMoved = false;
		var tripCount = 0;

		var speedProfileOfHour = speedProfileByTheHour[hour];

		speedProfileOfHour.forEach(function(speedEntry, index) {
			if (!hasMoved && speedEntry[OUT_IS_MOVING_INDEX] !== tsd.IS_STOPPED) {
				hasMoved = true;				
				tripCount++			
			} else if (hasMoved && speedEntry[OUT_IS_MOVING_INDEX] === tsd.IS_STOPPED) {
				hasMoved = false;
			}
		});

		statsByTheHour[hour][TRIP_COUNTS_PER_HOUR_INDEX] = tripCount;
		statsByTheHourPersistent[hour - 1].tripCount = tripCount;
	}

	return statsByTheHour;
}

/**
 * 
 * Counts the average distance travelled per trip per hour of all samples.
 * 
 */

function getAverageDistanceTravelledPerTripPerHour(statsByTheHour, statsByTheHourPersistent) {
	for (var hour = 1; hour <= 24; hour++) {
		var totalDistance = statsByTheHour[hour][TOTAL_DISTANCE_TRAVELLED_PER_HOUR_INDEX];
		var tripCounts = statsByTheHour[hour][TRIP_COUNTS_PER_HOUR_INDEX];
		var averageDistance = 0;

		if (tripCounts > 0) {
			averageDistance =  totalDistance / tripCounts;
		} 

		averageDistance = averageDistance.toFixed(4);

		statsByTheHour[hour][AVERAGE_DISTANCE_TRAVELLED_PER_TRIP_PER_HOUR_INDEX] = averageDistance;
		statsByTheHourPersistent[hour - 1].averageDistanceTravelledPerTrip = averageDistance;
	}

	return statsByTheHour;
}

/**
 *
 * Computes the weighted average speed per trip per hour of all samples. 
 * 
 */

function getWeightedAverageSpeedPerTripPerHour(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent) {
	for (var hour = 1; hour <= 24; hour++) {
		var totalDistanceOfTrip = 0;		
		var totalTimeOfTrip = 0;
		var hasMoved = false;		
		var totalDistance = 0;
		var totalTime = 0;
		
		speedProfileByTheHour[hour].forEach(function(speedEntry, index) {
			if (!hasMoved && speedEntry[OUT_IS_MOVING_INDEX] !== tsd.IS_STOPPED) {
				hasMoved = true;
			} else if (hasMoved && speedEntry[OUT_IS_MOVING_INDEX] !== tsd.IS_STOPPED) {
				totalDistanceOfTrip += speedEntry[ACTUAL_DISTANCE_DIFFERENCE_INDEX];				
				totalTimeOfTrip += speedEntry[ACTUAL_TIME_DIFFERENCE_INDEX];				
			} else if (hasMoved && speedEntry[OUT_IS_MOVING_INDEX] === tsd.IS_STOPPED) {
				totalDistanceOfTrip += speedEntry[ACTUAL_DISTANCE_DIFFERENCE_INDEX];						
				totalTimeOfTrip += speedEntry[ACTUAL_TIME_DIFFERENCE_INDEX];				

				totalDistance += totalDistanceOfTrip;
				totalTime += totalTimeOfTrip;

				hasMoved = false;
			}
		});

		var averageSpeed = 0;

		if (totalTime > 0) {
			totalDistance /= 1000 // convert to Km
			totalTime /= 60 * 60 // convert to hour

			averageSpeed = totalDistance / totalTime;
		}

		averageSpeed = averageSpeed.toFixed(2);

		statsByTheHour[hour][AVERAGE_SPEED_PER_HOUR_INDEX] = averageSpeed;
		statsByTheHourPersistent[hour - 1].averageSpeedPerTrip = averageSpeed;
	}

	return statsByTheHour;
}

/**
 * 
 * Computes the total waiting time per hour of all samples.
 * 
 */

function getTotalWaitingTimePerHour(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent) {
	for (var hour = 1; hour <= 24; hour++) {
		var totalWaiting = 0;
		var timeStartOfWaiting = null;
		var timeEndOfWaiting = null;
		var hasStopped = false;

		speedProfileByTheHour[hour].forEach(function(speedEntry, index) {
			if (!hasStopped && speedEntry[OUT_IS_MOVING_INDEX] === tsd.IS_STOPPED) {
				hasStopped = true;
				timeStartOfWaiting = moment(speedEntry[OUT_TIME_INDEX], tsd.TIME_FORMAT);				
			} else if (hasStopped && speedEntry[OUT_IS_MOVING_INDEX] !== tsd.IS_STOPPED) {
				timeEndOfWaiting = moment(speedEntry[OUT_TIME_INDEX], tsd.TIME_FORMAT);				

				if (timeStartOfWaiting != null && timeEndOfWaiting != null) {
					totalWaiting += timeEndOfWaiting.diff(timeStartOfWaiting, 'seconds');					
				}

				timeStartOfWaiting = null;
				timeEndOfWaiting = null;
				hasStopped = false;
			}
		});

		totalWaiting /= 60 // convert from seconds to minutes		
		totalWaiting = totalWaiting.toFixed(2);

		statsByTheHour[hour][TOTAL_WAITING_TIME_PER_HOUR_INDEX] = totalWaiting;
		statsByTheHourPersistent[hour - 1].totalWaitingTime = totalWaiting;
	}

	return statsByTheHour;
}

/**
 * 
 * Computes the total moving time with load per hour of all samples.
 * 
 */

function getTotalMovingTimeWithLoadPerHour(speedProfileByTheHour, statsByTheHour, statsByTheHourPersistent) {
	for (var hour = 1; hour <= 24; hour++) {
		var totalTime = 0;

		speedProfileByTheHour[hour].forEach(function(speedEntry) {
			if (speedEntry[OUT_HAS_LOAD_INDEX] === tsd.HAS_LOAD && speedEntry[OUT_IS_MOVING_INDEX] === tsd.IS_MOVING) {
				totalTime += speedEntry[ACTUAL_TIME_DIFFERENCE_INDEX];
			}
		});

		totalTime /= 60 // convert from seconds to minutes
		totalTime = totalTime.toFixed(2);

		statsByTheHour[hour][TOTAL_MOVING_TIME_WITH_LOAD_PER_HOUR_INDEX] = totalTime;
		statsByTheHourPersistent[hour - 1].totalMovingTimeWithLoad = totalTime;
	}

	return statsByTheHour;
}

/**
 * 
 * Determines the maximum speed per hour of all samples.
 * 
 */

function getMaxSpeedPerHour(speedProfilesByTheHour, statsByTheHour, statsByTheHourPersistent) {
	for (var hour = 1; hour <= 24; hour++) {
		var maxSpeed = 0;

		var speedProfileByTheHour = speedProfilesByTheHour[hour];

		speedProfileByTheHour.forEach(function(speedEntry) {
			if (speedEntry[OUT_SPEED_INDEX] != NO_DATA && speedEntry[OUT_SPEED_INDEX] > maxSpeed) {
				maxSpeed = speedEntry[OUT_SPEED_INDEX];
			}
		});

		maxSpeed = maxSpeed.toFixed(2);

		statsByTheHour[hour][MAX_SPEED_PER_HOUR_INDEX] = maxSpeed;
		statsByTheHourPersistent[hour - 1].maxSpeed = maxSpeed;
	}

	return statsByTheHour;
}

/**
 * 
 * Determines the 50th percentile speed per hour of all samples.
 * 
 */

function getFiftiethPercentileSpeed(speedProfilesByTheHour, statsByTheHour, statsByTheHourPersistent) {
	for (var hour = 0; hour <= 24; hour++) {
		var speedProfileOfTheHour = speedProfilesByTheHour[hour];

		if (speedProfileOfTheHour != undefined && speedProfileOfTheHour != null && speedProfileOfTheHour != []) {
			var percentileSpeed = getPercentileSpeed(speedProfileOfTheHour, 50);

			statsByTheHour[hour][FIFTIETH_PERCENTILE_SPEED_INDEX] = percentileSpeed;
			statsByTheHourPersistent[hour - 1]._50thPercentileSpeed = percentileSpeed;		
		}
	}

	return statsByTheHour;
}

/**
 * 
 * Determines the 0th percentile speed per hour of all samples.
 * 
 */

function getEightiethPercentileSpeed(speedProfilesByTheHour, statsByTheHour, statsByTheHourPersistent) {
	for (var hour = 0; hour <= 24; hour++) {
		var speedProfileOfTheHour = speedProfilesByTheHour[hour];

		if (speedProfileOfTheHour != undefined && speedProfileOfTheHour != null && speedProfileOfTheHour != []) {
			var percentileSpeed = getPercentileSpeed(speedProfileOfTheHour, 80);

			statsByTheHour[hour][EIGHTIETH_PERCENTILE_SPEED_INDEX] = percentileSpeed;
			statsByTheHourPersistent[hour - 1]._80thPercentileSpeed = percentileSpeed;		
		}
	}

	return statsByTheHour;
}

/**
 * 
 * Computes the given percentile speed.
 * 
 */

function getPercentileSpeed(speedProfileOfTheHour, percentile) {	
	var countsBySpeedResults = countBySpeed(speedProfileOfTheHour);

	var countsBySpeed = countsBySpeedResults.countsBySpeed;
	var totalNonZeroSpeeds = countsBySpeedResults.totalNonZeroSpeeds;

	var currentCountTotal = 0;
	var currentPercentage = 0;
	var currentPercentile = 0;
	
	if (totalNonZeroSpeeds > 0) {
		for (var speed = 0; speed <= MAX_SPEED_IN_KPH; speed++) {
			currentCountTotal += countsBySpeed[speed];
			currentPercentage = (currentCountTotal / totalNonZeroSpeeds) * 100;
			currentPercentile += currentPercentage;

			if (currentPercentile >= percentile) {
				return speed;
			}
		}
	}

	return 0;
}

/**
 * 
 * Counts the occurence of a given speed from given samples.  
 * 
 */

function countBySpeed(speedProfile) {
	var countsBySpeed = createCountsBySpeed();
	var totalNonZeroSpeeds = 0;

	for (var speed = 1; speed <= MAX_SPEED_IN_KPH; speed++) {
		var totalSpeedCount = 0;
		var nextSpeed = speed + 1;

		speedProfile.forEach(function(se) {
			if (se[OUT_SPEED_INDEX] != NO_DATA && (se[OUT_SPEED_INDEX] >= speed && se[OUT_SPEED_INDEX] < nextSpeed) ) {
				totalSpeedCount++;
			}
		});

		countsBySpeed[speed] = totalSpeedCount;
		totalNonZeroSpeeds += totalSpeedCount;
	}

	return {
		countsBySpeed: countsBySpeed,
		totalNonZeroSpeeds: totalNonZeroSpeeds
	}
}

/**
 * 
 * Creates a array with speed as indeces.
 * 
 */

function createCountsBySpeed() {
	var countsBySpeed = [];

	for (var i = 0; i <= 60; i++) {
		countsBySpeed[i] = 0;
	}	

	return countsBySpeed;
}

/**
 * 
 * Creates HourlySpeeds by hour and
 * saves them into the database.
 * 
 */

function saveSpeedEntries(argumentsPackage) {
	var defer = Q.defer();

	var route = argumentsPackage.route;
	var speedProfileByTheHour = argumentsPackage.speedProfileByTheHour;
	var statsByTheHourPersistent = argumentsPackage.statsByTheHourPersistent;
	var sampleNumber = argumentsPackage.sampleNumber;
	var surveyData = argumentsPackage.surveyData;

	var hourlySpeedsByHour = createArrayByTheHour();
	var load = [], status = [];
	var i = 0;
	var ctr = 0;
	surveyData.forEach(function(survey,indeces){
		var totalLoad = (parseInt(survey.seat1) + parseInt(survey.seat2) + parseInt(survey.seat3) + parseInt(survey.seat4) + parseInt(survey.seat5));
		load[i] = totalLoad;
		status[i] = survey.isMoving;
		i = i + 1;
	});
	
	for (var hour = 1; hour <= 24; hour++) {
		var speedProfileOfTheHour = speedProfileByTheHour[hour];
		var hourlySpeedsOfHour = [];
		speedProfileOfTheHour.forEach(function(sp) {
			ctr++;
			var hourlySpeed = new HourlySpeed({
				sampleNumber: sampleNumber,
				routeId: route.id,
				hour: hour,
				lat: sp[OUT_CURRENT_LAT_INDEX], 
				lng: sp[OUT_CURRENT_LNG_INDEX],
				isMoving: sp[OUT_IS_MOVING_INDEX],
				status: status[ctr],
				hasLoad: sp[OUT_HAS_LOAD_INDEX],
				time: sp[OUT_TIME_INDEX],
				load: load[ctr]
			});
			hourlySpeedsByHour[hour].push(hourlySpeed);
		});
	}
	HourlySpeed.create(hourlySpeedsByHour[6], function(err) {
		HourlySpeed.create(hourlySpeedsByHour[7], function(err) {		
			HourlySpeed.create(hourlySpeedsByHour[8], function(err) {
				HourlySpeed.create(hourlySpeedsByHour[9], function(err) {
					HourlySpeed.create(hourlySpeedsByHour[10], function(err) {
						HourlySpeed.create(hourlySpeedsByHour[11], function(err) {
							HourlySpeed.create(hourlySpeedsByHour[12], function(err) {
								HourlySpeed.create(hourlySpeedsByHour[13], function(err) {
									HourlySpeed.create(hourlySpeedsByHour[14], function(err) {
										HourlySpeed.create(hourlySpeedsByHour[15], function(err) {
											HourlySpeed.create(hourlySpeedsByHour[16], function(err) {
												HourlySpeed.create(hourlySpeedsByHour[17], function(err) {
													HourlySpeed.create(hourlySpeedsByHour[18], function(err) {
														HourlySpeed.create(hourlySpeedsByHour[19], function(err) {
															HourlySpeed.create(hourlySpeedsByHour[20], function(err) {
																defer.resolve(argumentsPackage);
															});
														});
													});
												});
											});
										});
									});
								});
							});
						});	
					});
				});
			});
		});		
	});

	return defer.promise;
}

/**
 * 
 * Saves the HourlyStats into the database.
 * 
 */

function saveHourlyStats(argumentsPackage) {
	var defer = Q.defer();

	var speedProfileByTheHour = argumentsPackage.speedProfileByTheHour;
	var statsByTheHourPersistent = argumentsPackage.statsByTheHourPersistent;

	HourlyStat.create(statsByTheHourPersistent, function(err) {
		defer.resolve(argumentsPackage);
	});

	return defer.promise;
}
