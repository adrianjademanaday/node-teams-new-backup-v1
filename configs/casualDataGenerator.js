// IMPORTS

var casual = require('casual');

const SERVER_ROOT = './..'


// GENERATORS

module.exports = function() {
	var pointDataGenerator = require(SERVER_ROOT + '/services/data/test/PointDataGenerator');
	casual.define('point', pointDataGenerator.generatePoint);
	casual.define('points', pointDataGenerator.generatePoints);		

	var tricycleSurveyDataGenerator = require(SERVER_ROOT + '/services/data/test/TricycleSurveyDataGenerator');
	casual.define('surveyData', tricycleSurveyDataGenerator.generateSurveyData);

	console.log("***done  casualDataGenerator.js***");
}