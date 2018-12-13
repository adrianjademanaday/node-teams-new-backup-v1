// CONSTANTS

const MARKER_RADIUS = 3;
const SURVEY_DATA_MARKER_COLOR = 'orange';
const ROUTE_STOPS_MARKER_COLOR = 'green';

const DEFAULT_ZOOM_LEVEL = 13;

// VARIABLES

var map = null;

// FUNCTIONS

function init(mapCenter, surveyData, vehicleRouteStops) {
	
	map = L.map('map').setView([mapCenter.lat, mapCenter.lng], DEFAULT_ZOOM_LEVEL);

	// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	//     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	// }).addTo(map);

	var googleLayer = new L.Google('ROADMAP');
   map.addLayer(googleLayer);

	drawPoints(surveyData, SURVEY_DATA_MARKER_COLOR);
	drawPoints(vehicleRouteStops, ROUTE_STOPS_MARKER_COLOR);	
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