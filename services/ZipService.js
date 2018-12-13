// Zip/Unzip service wrapper

var Zip = require('adm-zip');

/**
 * 
 * Converts the contents of a zip file into a string 
 * 
 */

module.exports.zipToString = function(filename) {
	var fileDetails = [];
	var zip = new Zip(filename);

	zip.getEntries().forEach(function(file) {
		var fileDetail = {
			filename: file.entryName,
			fileContent: zip.readAsText(file.entryName)
		};

		fileDetails.push(fileDetail);
	});

	return fileDetails;
}