//app/model/User.js

var mongoose	= require('mongoose');
var Schema		= mongoose.Schema;
var bcrypt		= require('bcrypt-nodejs');		

var Users = new Schema({
	userID: String,
	password: String,
	favourites: Array,
});

// generate a hash
Users.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//checking if password is valid
Users.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('Users', Users);