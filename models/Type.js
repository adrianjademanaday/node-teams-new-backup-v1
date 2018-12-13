// IMPORTS

var mongoose = require('mongoose-q')();


// PROPERTIES

var TypeSchema = mongoose.Schema({
    category: String,    
    types: {
    	name: String    	
    }
});


var Type = mongoose.model('Type', TypeSchema);
module.exports = Type;