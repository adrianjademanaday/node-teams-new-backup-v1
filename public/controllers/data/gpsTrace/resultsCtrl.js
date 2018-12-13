// CONSTANTS

const MARKER_RADIUS = 3;

const SURVEY_DATA_MARKER_COLOR = 'red';

const DEFAULT_ZOOM_LEVEL = 13;

// VARIABLES

var map = null;

// FUNCTIONS

function init(mapCenter, surveyData) {
	
	map = L.map('map').setView([mapCenter.lat, mapCenter.lng], DEFAULT_ZOOM_LEVEL);

	// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	//     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	// }).addTo(map);

	var googleLayer = new L.Google('ROADMAP');
   map.addLayer(googleLayer);

	drawPoints(surveyData, SURVEY_DATA_MARKER_COLOR);
}

function drawGrids(grids, color, weight) {
	grids.forEach(function(g) {		
		latlngs = [];

		latlngs.push([g.topLeft.lat, g.topLeft.lng]);
		latlngs.push([g.topRight.lat, g.topRight.lng]);
		latlngs.push([g.bottomRight.lat, g.bottomRight.lng]);
		latlngs.push([g.bottomLeft.lat, g.bottomLeft.lng]);
		latlngs.push([g.topLeft.lat, g.topLeft.lng]);

		L.polyline(latlngs, {
			color: color,
			weight: weight
		}).addTo(map);
	});	
}

function drawSurveyData(surveyData) {
	surveyData.forEach(function(sd) {
		L.circleMarker([sd.lat, sd.lng], {
			color: SURVEY_DATA_MARKER_COLOR,
			opacity: 1.0
		})
		.setRadius(MARKER_RADIUS)
		.addTo(map);
	});	
}

function drawPoints(points, color) {
	points.forEach(function(p) {
		L.circleMarker([p.lat, p.lng], {
			color: color,
			opacity: 1.0
		})
		.setRadius(MARKER_RADIUS)
		.addTo(map);
	});	
}