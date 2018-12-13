// IMPORTS

const SERVER_ROOT = './../../..';
var sensorToSeatParserService = require(SERVER_ROOT + '/services/data/SensorToSeatParserService');
var gpsTraceFromSurveyDataService = require(SERVER_ROOT + '/services/data/GpsTraceFromTricycleSurveyDataService');
var generateGridService = require(SERVER_ROOT + '/services/data/areaStop/GenerateGridService');

var zipService = require(SERVER_ROOT + '/services/ZipService');
var csvService = require(SERVER_ROOT + '/services/CsvService');

var mongoose = require('mongoose-q')();


// SERVICE FUNCTIONS

/**
 * 
 * Extracts SeatData from SurveyData and then
 * extracts the gps coordinates from SeatData.
 *  
 */

module.exports.extractPointsFromZipFiles = function(zipPath) {
	var allGpsPoints = [];
	var fileDetails = zipService.zipToString(zipPath);			
	
	fileDetails.forEach(function(fd) {
		var surveyDataCsv = csvService.stringToArray(fd.fileContent);
		var seatData = sensorToSeatParserService.process(surveyDataCsv);
		var points = gpsTraceFromSurveyDataService.process(seatData);

		allGpsPoints = allGpsPoints.concat(points);
	});

	return allGpsPoints;
}