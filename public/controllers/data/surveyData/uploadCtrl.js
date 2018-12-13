app.controller('uploadCtrl', function($scope, $http) {		
	$scope.routes = [];
	$scope.outputZipFilename = '';

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

	$scope.updateFilenames = function() {
		var surveyDataFilename = getNameFromPath($scope.surveyDataFilename);

		$scope.outputZipFilename = surveyDataFilename + '-output';		
	};

	function getNameFromPath(filename) {
		filename = filename.split('.');
		filename = filename[0];
		filename = filename.split('\\');
		filename = filename[filename.length - 1];

		return filename;
	}
});