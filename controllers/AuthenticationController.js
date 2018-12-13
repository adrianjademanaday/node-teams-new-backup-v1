var mongoose = require('mongoose-q')();
var md5 = require('MD5');
var User = mongoose.model('User');

exports.showLogin = function(req, res) {
  res.render('login', {});
}

exports.login = function(req, res) {
	var username = req.body.username;
	var password = md5(req.body.password);

	User.findOne({username: username}, function (err, user) {
    if (err) { 
    	res.send(500, err); 
    }

    if (!user) {
      res.send(500, {error: 'Incorrect username'});
    }

    if (!user.validatePassword(password)) {
      res.send(500, {error: 'Incorrect password'});
    } else {
      req.session.user = {
        username: user.username,
        fullname: user.fullname,
        role: user.role
      };
      
    	res.redirect('/index');
    }      
  });
};

exports.logout = function(req, res) {
	req.session.user = null;
	res.redirect('/login');
};
