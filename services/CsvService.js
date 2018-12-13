var csvString = require('csv-string');

/**
 * 
 * Converts a whole csv string into an string array.
 * 
 */

module.exports.stringToArray = function(string) {
	return csvString.parse(string);
}

/**
 * 
 * Converts a string array into a whole csv string.
 * 
 */

module.exports.arrayToCsv = function(array) {
	return arrayCsv(array);
}