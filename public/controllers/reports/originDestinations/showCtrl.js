const MARKER_RADIUS = 5;
const MARKER_THICKNESS = 4;
const SURVEY_DATA_MARKER_COLOR = ['black', 'green', 'gold', 'orange', 'red'];

const SHOWING_BOARDINGS = 'Showing Boardings';
const SHOWING_ALIGHTINGS = 'Showing Alightings';

const PHILIPPINES_ZOOM_LEVEL = 5;
const DEFAULT_ZOOM_LEVEL = 15;
const DEFAULT_MAP_CENTER_LAT = 12.879721;
const DEFAULT_MAP_CENTER_LNG = 121.774017;

app.controller('showCtrl', function($scope, $http) {		
	$scope.routes = [];
	$scope.boardingAlightings = [];
	$scope.showBoardingOrAlighting = SHOWING_BOARDINGS;
	$scope.mapCenter = null;
	$scope.pageTitle = 'Boardings'

	$scope.toggleShowBoardingOrAlighting = function() {
		if ($scope.showBoardingOrAlighting === SHOWING_BOARDINGS) {
			$scope.showBoardingOrAlighting = SHOWING_ALIGHTINGS;
			$scope.pageTitle = 'Alightings';
		} else {
			$scope.showBoardingOrAlighting = SHOWING_BOARDINGS;
			$scope.pageTitle = 'Boardings';
		}

		updateMap($scope.boardingAlightings, $scope.mapCenter, $scope.showBoardingOrAlighting);
		// paginateBoardingAlightingsTable();
	}

	$scope.loadRoutes = function() {
		var areaId = $scope.area;

		$http.get('/manage/routes?' + 'areaId= ' + areaId)
		.success(function(data) {
			$scope.routes = data;
		})
		.error(function(error) {
			alert('Loading routes from server failed.');
		});
	};

	$scope.loadSamples = function() {
		$scope.numberOfSamples = 0;

		$scope.routes.forEach(function(r) {
			if (r._id === $scope.route) {
				$scope.numberOfSamples = r.totalSurveys;
			}
		});

		var samples = [];

		for (var i = 1; i <= $scope.numberOfSamples; i++) {
			var sample = {_id: (i), name: (i)};

			samples.push(sample);
		}

		$scope.samples = samples;		
	};	

	$scope.loadReport = function() {
		var routeId = $scope.route;
		var sampleNumber = $scope.sampleNumber;
		var hourId = $scope.hour;

		var isValid = true;

		if (routeId == undefined || routeId == null || routeId === "") {
			isValid = false;
		}

		if (hourId == undefined || hourId == null || hourId === "") {
			isValid = false;
		}

		if (sampleNumber == undefined || sampleNumber == null || sampleNumber === "") {
			sampleNumber = 0;
		}

		if (isValid) {
			$http.get('/reports/originDestinations/fetch?' + 'routeId= ' + routeId + '&hourId=' + hourId + '&sampleNumber=' + sampleNumber)
			.success(function(data) {
				$scope.boardingAlightings = data.report;
				$scope.mapCenter = data.mapCenter;

				updateMap($scope.boardingAlightings, data.mapCenter, $scope.showBoardingOrAlighting);				
			})
			.error(function(error) {
				alert('Loading passenger origin destinations report from server failed.');
			});
		} else {
			alert("Please select a route, hour and an optional sample number.");
		}
		
	};
});


var map = null;
var markerLayer = null;

function initMap() {
	
	map = L.map('map').setView([DEFAULT_MAP_CENTER_LAT, DEFAULT_MAP_CENTER_LNG], PHILIPPINES_ZOOM_LEVEL);

	// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	//     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	// }).addTo(map);

	var googleLayer = new L.Google('ROADMAP');
  map.addLayer(googleLayer);
}

function updateMap(boardingAlightings, mapCenter, showBoardingOrAlighting) {
	clearMap();
	centerMap(mapCenter);
	drawPoints(boardingAlightings, showBoardingOrAlighting);
}

function clearMap() {
	if (markerLayer != null) {
		map.removeLayer(markerLayer);
	}
}

function centerMap(mapCenter) {
	map.setView([mapCenter.lat, mapCenter.lng], DEFAULT_ZOOM_LEVEL);
}

function drawPoints(points, showBoardingOrAlighting) {
	var markers = [];
	var count = 0;
	var color = null;
	
	points.forEach(function(p) {
		var valueOfPoint = null;

		if (showBoardingOrAlighting === SHOWING_BOARDINGS) {
			valueOfPoint = p.boarding;
		} else {
			valueOfPoint = p.alighting;
		}

		if (valueOfPoint === 0) {
			color = SURVEY_DATA_MARKER_COLOR[0];
		} else if (valueOfPoint >= 1 && valueOfPoint <= 5) {
			color = SURVEY_DATA_MARKER_COLOR[1];
		} else if (valueOfPoint >= 6 && valueOfPoint <= 10) {
			color = SURVEY_DATA_MARKER_COLOR[2];
		} else if (valueOfPoint >= 11 && valueOfPoint <= 15) {
			color = SURVEY_DATA_MARKER_COLOR[3];
		} else if (valueOfPoint >= 16) {
			color = SURVEY_DATA_MARKER_COLOR[4];
		} 
		
		var marker = L.circleMarker([p.lat, p.lng], {
			color: color,
			opacity: 1.0,
			weight: MARKER_THICKNESS
		});

		marker.setRadius(MARKER_RADIUS);
		markers.push(marker);

		count = 0;	
	});	

	markerLayer = L.layerGroup(markers);
	map.addLayer(markerLayer);
}

// function paginateBoardingAlightingsTable() {
// 	$('#tbl_boardingAlightings').dataTable( {
// 		"bSort": false,
// 		"info": false,
// 		"iDisplayLength": 5,
// 		"sDom": "t<'row'<'col-md-12'p>>",
// 		"sPaginationType": "bootstrap"		
//   });
// }
