const MARKER_RADIUS = 4;
const SURVEY_DATA_MARKER_COLOR = ['red', 'orange', 'blue', 'green'];

const PHILIPPINES_ZOOM_LEVEL = 5;
const DEFAULT_ZOOM_LEVEL = 15;
const DEFAULT_MAP_CENTER_LAT = 12.879721;
const DEFAULT_MAP_CENTER_LNG = 121.774017;

app.controller('showCtrl', function($scope, $http) {		
	$scope.routes = [];	
	$scope.report = null;

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
		var numberOfSamples = 0;

		$scope.routes.forEach(function(r) {
			if (r._id === $scope.route) {
				numberOfSamples = r.totalSurveys;
			}
		});

		var samples = [];

		for (var i = 1; i <= numberOfSamples; i++) {
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
			$http.get('/reports/hourlyStats/fetch?' + 'routeId= ' + routeId + '&hourId=' + hourId + '&sampleNumber=' + sampleNumber)
			.success(function(data) {
				$scope.report = data.report;

				updateMap(data.hourlySpeedsBySample, data.mapCenter);
			})
			.error(function(error) {
				alert('Loading hourly stat report from server failed.');
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

function updateMap(hourlySpeedsBySample, mapCenter) {
	clearMap();
	centerMap(mapCenter);

	var numberOfSamples = hourlySpeedsBySample.length;

	for (var i = 0; i < numberOfSamples; i++) {
		drawPoints(hourlySpeedsBySample[i], SURVEY_DATA_MARKER_COLOR[i]);
	}
}

function clearMap() {
	if (markerLayer != null) {
		map.removeLayer(markerLayer);
	}
}

function centerMap(mapCenter) {
	map.setView([mapCenter.lat, mapCenter.lng], DEFAULT_ZOOM_LEVEL);
}

function drawPoints(points, color) {
	var markers = [];
	var count = 0;
	var drawLimit = 4;
	var loadColor = String;
	var movingColor = String;
	var vehicleStatus = String;
	points.forEach(function(p) {
		if (count == drawLimit) {
			var marker = L.circleMarker([p.lat, p.lng], {
				color: color,
				opacity: 1.0
			});
			
			if(p.status == 0){
				movingColor = "<font color='red'>";
				vehicleStatus = 'Stopped';
			}
			else if(p.status == 1){
				movingColor = "<font color='green'>";
				vehicleStatus = 'Moving';
			}
			else if(p.status == 2){
				movingColor = "<font color='blue'>";
				vehicleStatus = 'Temporarily Stopped'
			}
			else{
				vehicleStatus = 'Stopped';
			}
			
			if(p.load > 0){
				loadColor = "<font color='green'>";
			}
			else{
				loadColor = "<font color='red'>";
			}
			
			marker.bindPopup("<b>Time:</b> " + "<font color='blue'>" + p.time + "</font>" + "<br>" + "<b>Load:</b> " + loadColor + p.load + "</font>" + "<br>" + "<b>Status:</b> " + movingColor + vehicleStatus + "</font>");
			marker.on('mouseover', function (e) {
				this.openPopup();
			});
			
			//marker.on('mouseout', function (e) {
			//	this.closePopup();
			//});
			
			marker.setRadius(MARKER_RADIUS);
			markers.push(marker);

			count = 0;	
		} else {
			count++;
		}	
	});	

	markerLayer = L.layerGroup(markers);
	map.addLayer(markerLayer);
}
