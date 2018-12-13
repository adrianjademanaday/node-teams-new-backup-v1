/***
 * 
 * Application Environment settings.
 * I.e.Hosting info, Database definitons, Download directory location.
 * 
 */

module.exports = function(app) {
	
	// CONSTANTS

	const PRODUCTION = 'prod';
	const DEVELOPMENT = 'dev';
	const TESTING = 'test'

	AUTO_LOGIN = true // so that we don't have to login everytime the server restarts to speed development up
    AUTO_LOGIN_ROLE = 'ADMIN'


	// const DEFAULT_ENVIRONMENT = PRODUCTION;  
	const DEFAULT_ENVIRONMENT = DEVELOPMENT;
		

	// PRODUCTION

	var production = function() {
		DATA_DIR = process.env.OPENSHIFT_DATA_DIR;


		APP_IP_ADDRESS = process.env.OPENSHIFT_NODEJS_IP;
		APP_PORT = process.env.OPENSHIFT_NODEJS_PORT;
		

		DB_HOST = process.env.OPENSHIFT_MONGODB_DB_HOST;
		DB_PORT = process.env.OPENSHIFT_MONGODB_DB_PORT;
		DB_DATABASE = "teams";
		DB_USERNAME = "admin";
		DB_PASSWORD = "3Qx9tMzBRpKK"; 
	};


	// DEVELOPMENT

	var development = function() {
		DATA_DIR = APP_DIR + '/data/';
		APP_IP_ADDRESS = 'localhost';
		APP_PORT = 3000;

		DB_HOST = 'localhost';
		DB_PORT = 27017;
		DB_DATABASE = "node_dev";
		DB_USERNAME = "user";
		DB_PASSWORD = "str1d3";
	};


	// TESTING

	var testing = function() {
		DATA_DIR = APP_DIR + '/data/';
		APP_IP_ADDRESS = 'localhost';
		APP_PORT = 3001;

		DB_HOST = "localhost";
		DB_PORT = 27017
		DB_DATABASE = "node_test"
		DB_USERNAME = "";
		DB_PASSWORD = "";
	};	

	switch(process.env.NODE_ENV) {
		case PRODUCTION:
			production();
			console.log('environment set to production');

			break;
		case DEVELOPMENT:			
			development();
			console.log('environment set to development');

			break;
		case TESTING:
			testing();
			console.log('environment set to testing');

			break;
		default:
			if (DEFAULT_ENVIRONMENT === DEVELOPMENT) {
				development();
				console.log('using default development environment');
			} else if (DEFAULT_ENVIRONMENT === PRODUCTION) {
				production();
				console.log('using default production environment');
			} else {
				testing();
				console.log('using default testing environment');
			}
	}	

	console.log("***done  environment.js***");
	
};
