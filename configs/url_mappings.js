// CONSTANTS

const SERVER_ROOT = './..';


// URL MAPPINGS

/**
 * 
 * Url mappings for browser request urls to corresponding controllers. 
 * 
 */

module.exports = function(app, user) {
	
	// Home
	{
		var indexController = require(SERVER_ROOT + '/controllers/IndexController');

		app.get('/', indexController.index);
		app.get('/home', indexController.index);
		app.get('/index', indexController.index);
		app.get('/index.html', indexController.index);	
	}
	
	// User manual
	{
		var usermanualReportController = require(SERVER_ROOT + '/controllers/usermanual/UsermanualController');

		app.get('/usermanual', usermanualReportController.show);
	}

	// Manage Areas
	{
		var areaController = require(SERVER_ROOT + '/controllers/manage/AreaController');

		app.get('/manage/areas', user.is('USER'), areaController.list);
		app.get('/manage/areas/:id', areaController.get);
		app.get('/manage/areas/create', areaController.create);	
		app.post('/manage/areas/add', areaController.add);
		app.get('/manage/areas/edit/:id', areaController.edit);
		app.post('/manage/areas/update/:id', areaController.update);
		app.get('/manage/areas/remove/:id', areaController.remove);		
	}

	// Manage Routes
	{
		var routeController = require(SERVER_ROOT + '/controllers/manage/RouteController');

		app.get('/manage/routes', user.is('USER'), routeController.list);
		app.get('/manage/routes/find', user.is('USER'), routeController.find);
		app.get('/manage/routes/create', routeController.create);	
		app.post('/manage/routes/add', routeController.add);
		app.get('/manage/routes/edit/:id', routeController.edit);
		app.post('/manage/routes/update/:id', routeController.update);
		app.get('/manage/routes/remove/:id', routeController.remove);		
	}

	// Data CleanSurveyData
	{
		var cleanSurveyDataController = require(SERVER_ROOT + '/controllers/data/CleanSurveyDataController');

		app.get('/data/cleanSurveyData/initUpload', cleanSurveyDataController.initUpload);
		app.post('/data/cleanSurveyData/upload', cleanSurveyDataController.upload);
	}

	// Data GpsTrace
	{
		var gpsTraceController = require(SERVER_ROOT + '/controllers/data/GpsTraceController');

		app.get('/data/gpsTrace/initUpload', gpsTraceController.initUpload);
		app.post('/data/gpsTrace/upload', gpsTraceController.upload);
	}

	// Data AreaStops
	{
		var areaStopController = require(SERVER_ROOT + '/controllers/data/AreaStopController');

		app.get('/data/areaStop/initUpload', areaStopController.initUpload);
		app.post('/data/areaStop/upload', areaStopController.upload);
	}

	// Data RouteStops
	{
		var routeStopController = require(SERVER_ROOT + '/controllers/data/RouteStopController');

		app.get('/data/routeStop/initUpload', routeStopController.initUpload);
		app.post('/data/routeStop/upload', routeStopController.upload);
	}

	// Data Survey Data
	{
		var surveyDataController = require(SERVER_ROOT + '/controllers/data/SurveyDataController');

		app.get('/data/surveyData/initUpload', surveyDataController.initUpload);
		app.post('/data/surveyData/upload', surveyDataController.upload);
	}	

	// Data VehicleAreaStops
	{
		var vehicleAreaStopController = require(SERVER_ROOT + '/controllers/data/VehicleAreaStopController');

		app.get('/data/vehicleAreaStop/initUpload', vehicleAreaStopController.initUpload);
		app.post('/data/vehicleAreaStop/upload', vehicleAreaStopController.upload);
	}

	// Data VehicleRouteStops
	{
		var vehicleRouteStopController = require(SERVER_ROOT + '/controllers/data/VehicleRouteStopController');

		app.get('/data/vehicleRouteStop/initUpload', vehicleRouteStopController.initUpload);
		app.post('/data/vehicleRouteStop/upload', vehicleRouteStopController.upload);
	}

	// Data Survey Data
	{
		var vehicleSurveyDataController = require(SERVER_ROOT + '/controllers/data/VehicleSurveyDataController');

		app.get('/data/vehicleSurveyData/initUpload', vehicleSurveyDataController.initUpload);
		app.post('/data/vehicleSurveyData/upload', vehicleSurveyDataController.upload);
	}

	// Hourly Stats Report
	{
		var hourlyStatsReportController = require(SERVER_ROOT + '/controllers/reports/HourlyStatsReportController');

		app.get('/reports/hourlyStats', hourlyStatsReportController.show);
		app.get('/reports/hourlyStats/fetch', hourlyStatsReportController.fetch);
	}	

	// Origin Destinations Report
	{
		var originDestinationsReportController = require(SERVER_ROOT + '/controllers/reports/OriginDestinationsReportController');

		app.get('/reports/originDestinations', originDestinationsReportController.show);
		app.get('/reports/originDestinations/fetch', originDestinationsReportController.fetch);
	}	

	// OD Matrix Report
	{
		var odMatrixReportController = require(SERVER_ROOT + '/controllers/reports/OdMatrixReportController');

		app.get('/reports/odMatrix', odMatrixReportController.show);
		app.post('/reports/odMatrix/fetch', odMatrixReportController.fetch);
	}

	// Area Stops Report

	{
		var areaStopReportController = require(SERVER_ROOT + '/controllers/reports/AreaStopReportController');

		app.get('/reports/areaStops', areaStopReportController.show);
		app.post('/reports/areaStops/fetch', areaStopReportController.fetch);
	}

	// Vehicle Origin Destinations Report
	{
		var vehicleOriginDestinationsReportController = require(SERVER_ROOT + '/controllers/reports/VehicleOriginDestinationsReportController');

		app.get('/reports/vehicleOriginDestinations', vehicleOriginDestinationsReportController.show);
		app.get('/reports/vehicleOriginDestinations/fetch', vehicleOriginDestinationsReportController.fetch);
	}	

	// Vehicle OD Matrix Report
	{
		var vehicleOdMatrixReportController = require(SERVER_ROOT + '/controllers/reports/VehicleOdMatrixReportController');

		app.get('/reports/vehicleOdMatrix', vehicleOdMatrixReportController.show);
		app.post('/reports/vehicleOdMatrix/fetch', vehicleOdMatrixReportController.fetch);
	}

	// Vehicle Area Stops Report
	{
		var vehicleAreaStopReportController = require(SERVER_ROOT + '/controllers/reports/VehicleAreaStopReportController');

		app.get('/reports/vehicleAreaStops', vehicleAreaStopReportController.show);
		app.post('/reports/vehicleAreaStops/fetch', vehicleAreaStopReportController.fetch);
	}


	// Delete Data
	{
		var deleteDataController = require(SERVER_ROOT + '/controllers/admin/DeleteDataController');

		app.get('/admin/delete/main', user.is('ADMIN'), deleteDataController.main);
		app.get('/admin/delete/surveyDataOnly', user.is('ADMIN'), deleteDataController.deleteSurveyDataOnly);
		app.get('/admin/delete/all', user.is('ADMIN'), deleteDataController.deleteAll);
	}
	
	// Manage Area
	{
		var manageAreaController = require(SERVER_ROOT + '/controllers/admin/ManageAreaController');
		app.get('/admin/manage/main', user.is('ADMIN'), manageAreaController.main);
		app.get('/admin/manage/initAddArea', user.is('ADMIN'), manageAreaController.initAddArea);
		app.post('/admin/manage/addArea', user.is('ADMIN'), manageAreaController.addArea);
		app.get('/admin/manage/initAddRoute', user.is('ADMIN'), manageAreaController.initAddRoute);
		app.post('/admin/manage/addRoute', user.is('ADMIN'), manageAreaController.addRoute);
		app.get('/admin/manage/viewRoute', user.is('ADMIN'), manageAreaController.viewRoute);
		app.get('/admin/manage/removeArea', user.is('ADMIN'), manageAreaController.removeArea);
		app.get('/admin/manage/removeRoute', user.is('ADMIN'), manageAreaController.removeRoute);
		app.get('/admin/manage/initEditArea', user.is('ADMIN'), manageAreaController.initEditArea);
		app.post('/admin/manage/editArea', user.is('ADMIN'), manageAreaController.editArea);
		app.get('/admin/manage/initEditRoute', user.is('ADMIN'), manageAreaController.initEditRoute);
		app.post('/admin/manage/editRoute', user.is('ADMIN'), manageAreaController.editRoute);
	}		

	// Reorder Area Stops
	{
		var reorderAreaStopsController = require(SERVER_ROOT + '/controllers/admin/ReorderAreaStopsController');

		app.get('/admin/reorderAreaStops/show', reorderAreaStopsController.show);
		app.post('/admin/reorderAreaStops/reorder', reorderAreaStopsController.reorder);
	}

	// Reorder Vehicle Area Stops
	{
		var reorderVehicleAreaStopsController = require(SERVER_ROOT + '/controllers/admin/ReorderVehicleAreaStopsController');

		app.get('/admin/reorderVehicleAreaStops/show', reorderVehicleAreaStopsController.show);
		app.post('/admin/reorderVehicleAreaStops/reorder', reorderVehicleAreaStopsController.reorder);
	}


	// Partials
	{
		var partialsController = require(SERVER_ROOT + '/controllers/PartialsController');

		app.get('/partials/:first/:second/:name', partialsController.handleThreeLevel);
		app.get('/partials/:first/:name', partialsController.handleTwoLevel);
		app.get('/partials/:name', partialsController.handleOneLevel);		
	}

	// Authentication
	{
		var authenticationController = require(SERVER_ROOT + '/controllers/AuthenticationController');

		app.get('/login', authenticationController.showLogin);
		app.post('/login', authenticationController.login);
		app.get('/logout', authenticationController.logout);	
	}

	// Test Data AreaStops
	{
		var areaStopController = require(SERVER_ROOT + '/controllers/test/data/AreaStopController');

		app.get('/test/data/areaStop/initUpload', areaStopController.initUpload);
		app.post('/test/data/areaStop/upload', areaStopController.upload);
	}

	// Test Data RouteStops
	{
		var routeStopController = require(SERVER_ROOT + '/controllers/test/data/RouteStopController');

		app.get('/test/data/routeStop/initUpload', routeStopController.initUpload);
		app.post('/test/data/routeStop/upload', routeStopController.upload);
	}

	// TestData Survey Data
	{
		var surveyDataController = require(SERVER_ROOT + '/controllers/test/data/SurveyDataController');

		app.get('/test/data/surveyData/initUpload', surveyDataController.initUpload);
		app.post('/test/data/surveyData/upload', surveyDataController.upload);
	}	

	console.log("***done  url_mappings.js***");

};
