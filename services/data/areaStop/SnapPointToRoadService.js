// SERVICE FUNCTIONS

// NOTE: Probable Unused Class

module.exports.processOriginalCentroids = function(grids) {
	var centroids = [];

	grids.forEach(function(g) {
		var centroid = g.getCentroid();

		centroids.push(centroid);
	});

	return centroids;
};

module.exports.processSnappedCentroids = function(grids) {
	var snappedCentroids = [];

	grids.forEach(function(g) {
		var centroid = g.getCentroid();

		snappedCentroids.push(centroid);
	});

	return snappedCentroids;
};