// IMPORTS

var mongoose = require('mongoose-q')();
var Route = mongoose.model('Route');
var Area = mongoose.model('Area');


// ACTIONS

/**
 * 
 * Shows a list of all Routes.
 * 
 */

exports.list = function (req, res) {
	var callBack = function(err, routes) {
		if (err) {
			return res.status(500).send(err);
		}

		res.format({
			json: function() {
				res.json(routes);
			},

			html: function() {
				res.render('manage/routes/list', {
					routes: routes
				});			
			}
		});
	};

	var areaId = req.query.areaId;
	areaId = areaId.trim();

	Route.find({areaId: areaId}, null, {sort: {name: 1}}, callBack);	
};

/**
 * 
 * Shows info regarding an Route.
 * 
 */

exports.find = function (req, res) {
	var callBack = function(err, routes) {
		if (err) {
			return res.status(500).send(err);
		}

		res.json(routes);
	};

	var routeId = req.query.routeId;
	routeId = routeId.trim();

	Route.find({id: routeId}, null, {sort: {name: 1}}, callBack);	
};

/**
 * 
 * Shows the add Route page.
 * 
 */

exports.create = function(req, res) {
	var route = new Route({
		name: '',
		longName: '',
		routeStops: []
	});

	res.render('manage/routes/add', {
		route: route
	});
};

/**
 * 
 * Adds a new Route into the database.
 * 
 */

exports.add = function(req, res) {
	var route = new Route(req.body);

	route.save(function(err) {
		if (err) {
			return res.status(500).send(err);
		}

		res.redirect('/manage/routes');
	});	
};

/**
 * 
 * Shows the edit page for a selected Route. 
 * 
 */

exports.edit = function(req, res) {
	var id = req.params.id;

	Route.findOne({_id: id}, function(err, route) {
		if (err) {
			return res.status(500).send(err);
		}

		if (!route) {
			return res.status(404).send("Route not found with id: " + id);
		}

		res.render('manage/routes/edit', {
			route: route
		});
	});
}

/**
 * 
 * Updates the Route in the database.
 * 
 */

exports.update = function(req, res) {
	var id = req.body.id;

	Route.findByIdAndUpdate(id, req.body, function(err, route) {
		if (err) {
			return res.status(500).send(err);
		}

		if (!route) {
			return res.status(404).send("Route1 not found with id: " + id);
		}

		res.redirect('/manage/routes');		
	});
};

/**
 * 
 * Removes the selected Route from the database. 
 * 
 */

exports.remove = function(req, res) {
	var id = req.params.id;

	Route.findOne({_id: id}, function(err, route) {
		if (err) {
			return res.status(500).send(err);
		}

		if (!route) {
			return res.status(404).send("Route not found with id: " + id);
		}

		route.remove(function(err) {
			if (err) {
				return res.status(500).send(err);
			}

			res.redirect('/manage/routes');
		});
	});	
};