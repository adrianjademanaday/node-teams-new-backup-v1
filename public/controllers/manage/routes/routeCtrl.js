app.controller('routeCtrl', function($scope) {
	$scope.isShowFilter = false;
	$scope.filterButtonText = 'Show Filter';

	$scope.toggleFilter = function() {
		if ($scope.isShowFilter) {
			$scope.filterButtonText = 'Show Filter'
			$scope.isShowFilter = false;
		} else {
			$scope.filterButtonText = 'Hide Filter'
			$scope.isShowFilter = true;
		}
	}
});