// app/models/Beers.js

var mongoose	= require('mongoose');
var Schema		= mongoose.Schema;
var bcrypt		= require('bcrypt-nodejs');		

var Beers = new Schema({
	name: String,
	owner: String,
	publicComment: String,
	privateComment: [{
		userID: String,
		comment: String
	}]
});

module.exports= mongoose.model('Beers', Beers)

