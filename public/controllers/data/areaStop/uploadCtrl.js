app.controller('uploadCtrl', function($scope, $http) {		
	$scope.topLeftBoundsLat = null;
	$scope.topLeftBoundsLng = null;
	$scope.bottomRightBoundsLat = null;
	$scope.bottomRightBoundsLng = null;	
	$scope.routes = [];
	
	$scope.loadAreaDetails = function() {
		$http.get('/manage/areas/' + $scope.areaId)
		.success(function(data) {
			$scope.area = data;
			$scope.routes = $scope.area.routes;
			$scope.topLeftBoundsLat = $scope.area.topLeftBounds.lat;
			$scope.topLeftBoundsLng = $scope.area.topLeftBounds.lng;
			$scope.bottomRightBoundsLat = $scope.area.bottomRightBounds.lat;
			$scope.bottomRightBoundsLng = $scope.area.bottomRightBounds.lng;
		})
		.error(function(error) {
			alert('Loading area from server failed.');
		});
	};
	
});