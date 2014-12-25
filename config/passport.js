// config/passport.js

// load all the things we need
var LocalStrategy	= require('passport-local').Strategy;

var Users			= require('../app/models/Users');

module.exports		= function(passport) {

	// serialize the user for a persistent session
	passport.serializeUser(function(user, done) {
        console.log(user);
        console.log('serialize');
		done(null, user);
	});

	// deserialize the user
	passport.deserializeUser(function(user, done) {
        console.log(user);
        console.log('deserialize');
        Users.findOne({'userID': user.userID}, function(err, user) {
            done(err, user);
        });
    });

    // LOCAL SIGNUP

    passport.use('local-register', new LocalStrategy(
        function(username, password, done) {
    	 // asynchronous

    	 // User.findOne won't fire unless data is sent back
    	process.nextTick(function() {
    	 	Users.findOne({ 'userID': username}, function(err, user) {
    	 		if (err)
    	 			return done(err);

    	 		if (user) 
    	 		{
    	 			return done(null, false, { message: 'Username is already taken' });
    	 		}
    	 		else
    	 		{
    	 			var newUser = new Users();

    	 			newUser.userID = username;
    	 			newUser.password = newUser.generateHash(password);

    	 			// save the user

    	 			newUser.save(function(err) {
                        console.log(err);
    	 				if (err)
    	 					throw err;

    	 				return done(null, newUser);
    	 			})
    	 		}
    	 	});
    	 });
    }));

    passport.use('local-login', new LocalStrategy(
        function(username, password, done) {

            console.log(username);
            process.nextTick(function() {
                // we are checking to see if the user trying to login already exists
                Users.findOne({ 'userID' :  username }, function(err, user) {
                    // if there are any errors, return the error before anything else
                    if (err)
                        return done(err);

                    // if no user is found, return the message
                    if (!user)
                        return done(null, false, {message: 'No user found'});

                    console.log(user);

                    // if the user is found but the password is wrong
                    if (!user.validPassword(password))
                        return done(null, false, {message: 'Oops! Wrong password.'});
                    
                    // all is well, return successful user
                    return done(null, user);
                });
            });
    }));
};