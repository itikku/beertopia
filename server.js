var express		= require('express'); 		// call express
var app        	= express(); 				// define our app using express
var expressSession = require('express-session');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var bodyParser 	= require('body-parser');

app.use(cookieParser());
app.use(expressSession({ secret: 'mySecretKey'}));
//Configuring passport
app.use(passport.initialize());
app.use(passport.session());

var Users     	= require('./app/models/Users');
var Beers     	= require('./app/models/Beers');
var mongoose   	= require('mongoose');

mongoose.connect('mongodb://itikku:billytikky88@proximus.modulusmongo.net:27017/Tyxa8qep'); // connect to our database



require('./config/passport')(passport); // pass passport for configuration





app.use(express.static(__dirname + '/public'));    

//serializing and deserializing user instance?

/*passport.serializeUser(function(user, done) {
  done(null, user._id);
});
 
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});*/

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//app.use(express.static(__dirname+'/public'));

var port = process.env.PORT || 10200; 		// set our port

// REGISTER OUR ROUTES -------------------------------
// load our routes and pass in our app and fully configured passport
require('./routes/router.js')(app, passport, Users, Beers); 

//app.use('', static_router);

// application -------------------------------------------------------------
app.get('*', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});


// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);