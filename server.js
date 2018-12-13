#!/bin/env node

// CONSTANTS
//
const DOWNLOADS_FOLDER = 'downloads';
const UPLOADS_FOLDER = 'uploads';


// IMPORTS

var fs = require('fs');
var express = require('express');
var path = require('path');
//var timeout = require('req-timeout');
var ConnectRoles = require('connect-roles');
var cookieSession = require('cookie-session');
var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser');
var logger = require('morgan');

var user = new ConnectRoles();

var autoLogin = require('./configs/middlewares/autoLogin');
var authentication = require('./configs/middlewares/authentication');

// Create an Express app
var app = express();

//app.use(timeout(30 * 60 * 1000)); 
APP_DIR = __dirname;

//app.set('views', __dirname + '/views');
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

// Add a simple route for static content served from 'public'
//app.use(express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

//app.use(express.cookieParser());

//app.use(express.session({secret: 'secret'}));
app.use(cookieSession({
	name: 'session',
	keys: ['key1', 'key2'],
	maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }));

app.use(autoLogin);         // NOTE: must be disabled in production.
app.use(authentication);
//app.use(user);
app.use(user.middleware());

//app.use(logger('dev'));

//console.log(user);

//--edited by NCT
//app.use(bodyParser());
//app.use(express.urlencoded());
//app.use(express.json());
app.use(cookieParser())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
 
app.use(errorHandler());
app.locals.pretty = true;

//app.use(function(req, res, next) {
//    var err = new Error('Not Found');
//    err.status = 404;
//    next(err);
//});

//app.get('/', function(req, res) {
//	console.log('Cookies: ', req.cookies)
//  })


// Run other configurations

require('./configs/environment')(app);
require('./configs/models')();
require('./configs/bootstrap').init();
require('./configs/authorizations')(user);
require('./configs/url_mappings')(app, user);
require('./configs/casualDataGenerator')();

createDownloadsFolderIfNotExists();
createUploadsFolderIfNotExists();


app.listen(APP_PORT, '0.0.0.0', function() { //APP_IP_ADDRESS
	console.log('application listening on ' + APP_IP_ADDRESS + ':' + APP_PORT);
});

function createDownloadsFolderIfNotExists() {
	if (!fs.existsSync(DATA_DIR + DOWNLOADS_FOLDER)) {
		fs.mkdirSync(DATA_DIR + 'downloads');
	} 
}

function createUploadsFolderIfNotExists() {
	if (!fs.existsSync(DATA_DIR + UPLOADS_FOLDER)) {
		fs.mkdirSync(DATA_DIR + 'uploads');
	} 
}
