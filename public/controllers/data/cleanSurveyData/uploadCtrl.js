app.controller('uploadCtrl', function($scope, $http) {		
	$scope.outputZipFilename = '';

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