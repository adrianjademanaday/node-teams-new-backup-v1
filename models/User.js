// IMPORTS

var mongoose = require('mongoose-q')();


// PROPERTIES

var UserSchema = mongoose.Schema({
    username: String,
    password: String,
    fullname: String,
    role: String
});

// METHODS

UserSchema.methods.validatePassword = function(password) {
	return this.password === password;	
};


var User = mongoose.model('User', UserSchema);
module.exports = User;