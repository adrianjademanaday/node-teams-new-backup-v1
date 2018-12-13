const SERVER_ROOT = './../..';

var rimraf = require('rimraf');
var fs = require('fs');

const DOWNLOADS_FOLDER = 'downloads';
const UPLOADS_FOLDER = 'uploads';


var bootstrap = require(SERVER_ROOT + '/configs/bootstrap');

/**
 * 
 * Admin related functions
 * 
 * 
 */

exports.main = function(req, res) {
	res.render('admin/delete/main', {
		message: 'Please choose an action.'
	});	
};

/**
 * 
 * Delete uploaded SurveyData only.
 * Leaving Areas, Routes, AreaStops and RouteStops intact. 
 * 
 */

exports.deleteSurveyDataOnly = function(req, res) {
	rimraf(DATA_DIR + 'downloads', function() {
		createDownloadsFolderIfNotExists();

		bootstrap.clearSurveyDataOnly();

		res.render('admin/delete/main', {
			message: 'All Survey Data has been deleted.'
		});
	});
};

/**
 * 
 * Deletes SurveyData, AreaStops, RouteStops
 * and reinitializes Areas and Routes. 
 * 
 */

exports.deleteAll = function(req, res) {
	rimraf(DATA_DIR + 'downloads', function() {
		createDownloadsFolderIfNotExists();

		bootstrap.clearAllAndInitAreas();

		res.render('admin/delete/main', {
			message: 'All data has been deleted.'
		});
	});
};

/**
 * 
 * Creates the downloads folder if not exists.
 * Location depends on the DATA_DIR setting in 
 * /configs/environment.js.
 * When downloading files such as generated output csvs
 * a download folder is required to store them before
 * the file is sent to the client browser. 
 * 
 */

function createDownloadsFolderIfNotExists() {
	if (!fs.existsSync(DATA_DIR + DOWNLOADS_FOLDER)) {
		fs.mkdirSync(DATA_DIR + 'downloads');
	} 
}

/**
 * 
 * Creates the uploads folder if not exists.
 * Location depends on the DATA_DIR setting in 
 * /configs/environment.js.
 * This folder is where all uploaded data is kept.
 * When uploading data a directory must be defined
 * to store uploaded files before they are processed.
 * 
 */

function createUploadsFolderIfNotExists() {
	if (!fs.existsSync(DATA_DIR + UPLOADS_FOLDER)) {
		fs.mkdirSync(DATA_DIR + 'uploads');
	} 
}