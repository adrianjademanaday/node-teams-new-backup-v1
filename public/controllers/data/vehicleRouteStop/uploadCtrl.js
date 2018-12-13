app.controller('uploadCtrl', function($scope, $http) {		
	$scope.routes = [];
	
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
	
});