// Constants

var PARTIALS_FOLDER = '../public/partials/';


// Actions

exports.handleOneLevel = function(req, res) {
	console.log('A');
	var name = req.params.name;
	res.render(PARTIALS_FOLDER + '/' + name);
};

exports.handleTwoLevel = function(req, res) {
	console.log('B');
	var name = req.params.name;
	var first = req.params.first;
	res.render(PARTIALS_FOLDER + first + '/' + name);
};

exports.handleThreeLevel = function(req, res) {
	console.log('C');
	var name = req.params.name;
	var first = req.params.first;
	var second = req.params.second;
	res.render(PARTIALS_FOLDER + first + '/' + second + '/' + name);
};