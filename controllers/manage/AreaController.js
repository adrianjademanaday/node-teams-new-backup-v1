// IMPORTS

var mongoose = require('mongoose-q')();
var Area = mongoose.model('Area');
var Route = mongoose.model('Route');


// ACTIONS

/**
 * 
 * Shows a list of all Areas.
 * 
 */

exports.list = function (req, res) {
	var callBack = function(err, areas) {
		if (err) {
			return res.status(500).send(err);
		}

		res.format({
			json: function() {
				res.json(areas);
			},

			html: function() {
				res.render('manage/areas/list', {
					areas: areas
				});			
			}
		});
	};

	Area.find({}, callBack);	
};

/**
 * 
 * Shows info regarding an Area.
 * 
 */

exports.get = function(req, res) {
	var id = req.params.id;

	Area.findOne({_id: id}, function(err, area) {
		if (err) {
			return res.status(500).send(err);
		}

		if (!area) {
			return res.status(404).send("Area not found with id: " + id);
		}

		var opts = {
		  path: 'routes',
			select: 'name '  	
		}

		Route.populate(area, opts, function(err, area) {
			res.format({
				json: function() {
					res.json(area);
				},

				html: function() {
					res.render('manage/areas/show', {
						area: area
					});			
				}
			});	
		});
	});
}

/**
 * 
 * Shows the add Area page.
 * 
 */

exports.create = function(req, res) {
	var area = new Area({
		name: '',
		longName: '',
		areaStops: [],
		routes: []
	});

	res.render('manage/areas/add', {
		area: area
	});
};

/**
 * 
 * Adds a new Area into the database.
 * 
 */

exports.add = function(req, res) {
	var area = new Area(req.body);

	area.save(function(err) {
		if (err) {
			return res.status(500).send(err);
		}

		res.redirect('/manage/areas');
	});	
};

/**
 * 
 * Shows the edit page for a selected Area. 
 * 
 */

exports.edit = function(req, res) {
	var id = req.params.id;

	Area.findOne({_id: id}, function(err, area) {
		if (err) {
			return res.status(500).send(err);
		}

		if (!area) {
			return res.status(404).send("Area not found with id: " + id);
		}

		res.render('manage/areas/edit', {
			area: area
		});
	});
}

/**
 * 
 * Updates the Area in the database.
 * 
 */

exports.update = function(req, res) {
	var id = req.body.id;

	Area.findByIdAndUpdate(id, req.body, function(err, area) {
		if (err) {
			return res.status(500).send(err);
		}

		if (!area) {
			return res.status(404).send("Area not found with id: " + id);
		}

		res.redirect('/manage/areas');		
	});
};

/**
 * 
 * Removes the selected Area from the database. 
 * 
 */

exports.remove = function(req, res) {
	var id = req.params.id;

	Area.findOne({_id: id}, function(err, area) {
		if (err) {
			return res.status(500).send(err);
		}

		if (!area) {
			return res.status(404).send("Area not found with id: " + id);
		}

		area.remove(function(err) {
			if (err) {
				return res.status(500).send(err);
			}

			res.redirect('/manage/areas');
		});
	});	
};