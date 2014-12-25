// config/router.js

var http = require('http');

module.exports = function(app, passport, Users, Beers) {

var beerAPIpath 	= 'http://api.openbeerdatabase.com/v1/beers';
var breweryAPIpath 	= 'http://api.openbeerdatabase.com/v1/breweries';

// middleware to use for all requests
app.use(function(req, res, next) {

	console.log('Something is happening.');
	next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:10200/api)
app.get('/', function(req, res) {
	//Add header to the response before sending out. 'res' is the response object
	res.setHeader("Access-Control-Allow-Origin", "*");	
	res.json({ message: 'hooray! welcome to our api!' });	
});

app.get('/users', function(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	Users.find(function(err, users) {
		if (err)
			res.send(err);

		res.json(users);
	});
});

// route to test if user is logged in or not
app.get('/loggedin', function(req, res) {
	console.log(req.user);
	res.send(req.isAuthenticated() ? req.user : '0'); 
});

// route to log in
app.post('/login', function(req, res, next){
	res.setHeader("Access-Control-Allow-Origin", "*");
	passport.authenticate('local-login', function(err, user, info){
	console.log('login procedure');
	if (err)
		return res.json({error: err});
	if (!user)
		return res.json({error: info});

	req.logIn(user, function(error) {
		if (error)
			return res.json({error: err});

		return res.json(user);
	});
	})(req, res, next);
});

// route to register
app.post('/register',  function(req, res, next){
	res.setHeader("Access-Control-Allow-Origin", "*");
	passport.authenticate('local-register', function(err, user, info){
	console.log('register procedure');
	if (err)
		return res.json({error: err});
	if (!user)
		return res.json({error: info});

	req.logIn(user, function(error) {
		if (error)
			return res.json({error: err});
		return res.json(user);
	});
	})(req, res, next);
});

// route to log out
app.post('/logout', function(req, res) {
	req.logOut();
    res.send(200);
});

// route to load a user's profile -- must check if the user is logged in first
app.get('/profile', isLoggedIn, function(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	Users.findOne({"userID": req.body.userID}, function(err, user) {
		if (err)
			res.send(err);

		res.json(user);
	});
});

//get all the beers currently stored in the model
app.get('/beers', function(req, res) {
	Beers.find(function(err, beers) {
		if (err)
			res.send(err);

		res.json(beers);
	});
});

app.get('/profile/:user/:beername', function(req, res) {
	
	Beers.find({'owner': req.params.user}, function(err, beers) {
		if (err)
			res.send(err);

		res.json(beers);
	});
});

// Route through which a logged in user creates a new beer
app.post('/profile/:user/:beername', isLoggedIn, function(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	// Check if the beer has already been created by another user
	// If it has, then redirect the user to that page
	// If not, then add it to the mongoose database, 
	// pull the data from the direct them to that page

	Beers.findById(req.params.beername, function(err, savedbeer) {

		if (err)
		{
			var path = beerAPIpath + '.json?query=' + req.params.beername;
			console.log(path);
			var httpGet = http.get(path, function (response) {
				response.setEncoding('utf8');

				var data = '';

				response.on('data', function(chunk) {
					data+= chunk;
				})

				response.on('end', function() {

					var parsedResp = JSON.parse(data);

					if (parsedResp.beers.length > 0)
					{
						var beer = new Beers({
							owner: sanitize(req.params.user),
							privateComment: [{
								userID: sanitize(req.params.user),
								comment: sanitize(req.body.privateComment)
							}]
						});
						console.log(beer);
						console.log(beer.privateComment);

						beer.name = parsedResp.beers[0].name;
						beer.publicComment = parsedResp.beers[0].description;
						
						// save the beer and check for errors
						beer.save(function(err) {
							if (err)
								res.send(err);

							res.json({ 
								message: 'Beer created!', 
								beer: beer
							});
						});
					}
					else
						res.json({ message: 'Beer not found!'});
				});

				
			});
		}
		else
		{
			res.json({message: 'Beer already exists'});
		}

	});
});

app.put('/profile/:user/:beername', isLoggedIn, function(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	var beername = decodeURIComponent(req.params.beername);
	Beers.findOne({name: beername}, function(err, savedbeer) {

		if (err)
		{
			res.json({message: 'Beer does not exist!'});
		}
		else
		{
			var beername = decodeURIComponent(req.params.beername);
			console.log(beername);
			// Need to verify that this is the correct owner of the beer
			Beers.findOne({ name: beername}, function(err, savedbeer) {
				if (err)
					res.json({message: 'Beer not found'});
				else
				{
					if (savedbeer.owner !== req.params.user)
					{
						savedbeer.privateComment.push({"userID": req.params.user, "comment": req.body.privateComment});
						console.log(savedbeer.privateComment);
						savedbeer.save(function(err){
							if (err)
								res.json({message: 'Error in saving beer'});
							else
								res.json({message: 'Beer added successfully'});
						});
					}
					else
						res.json({message: 'This is already your beer!'});
				}
			});
		}
	});
});

app.put('/profile/:user/:beername/remove', isLoggedIn, function(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	var beername = decodeURIComponent(req.params.beername);
	Beers.findOne({name: beername}, function(err, savedbeer) {

		if (err)
		{
			res.json({message: 'Beer does not exist!'});
		}
		else
		{
			var beername = decodeURIComponent(req.params.beername);
			console.log(beername);
			// Need to verify that this is the correct owner of the beer
			Beers.findOne({ name: beername}, function(err, savedbeer) {
				if (err)
					res.json({message: 'Beer not found'});
				else
				{
					if (savedbeer.owner !== req.params.user)
					{
						var index = savedbeer.privateComment.indexOf({"userID": req.params.user});
						savedbeer.privateComment.splice(index, 1);
						console.log(savedbeer.privateComment);
						savedbeer.save(function(err){
							if (err)
								res.json({message: 'Error in saving beer'});
							else
								res.json({message: 'Beer added successfully'});
						});
					}
					else
						res.json({message: 'This is already your beer!'});
				}
			});
		}
	});
});

app.put('/profile/:user/:beername/favourite', isLoggedIn, function(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	var beername = decodeURIComponent(req.params.beername);
	Beers.findOne({name: beername}, function(err, savedbeer) {

		if (err)
		{
			res.json({message: 'Beer does not exist!'});
		}
		else
		{
			console.log(beername);
			// Need to verify that this is the correct owner of the beer
			Users.findOne({ userID: req.params.user}, function(err, saveduser) {
				if (err)
					res.json({message: 'User not found'});
				else
				{
					if (saveduser.favourites.indexOf(beername) === -1)
					{
						saveduser.favourites.push(beername);
						console.log(saveduser.favourites);
						saveduser.save(function(err){
							if (err)
								res.json({message: 'Error in saving favourite'});
							else
								res.json({message: 'Favourite added successfully'});
						});
					}
					else
						res.json({message: 'This is already your favourite!'});
				}
			});
		}
	});
});

// Route through which a logged in user deletes a beer that they own
app.delete('/profile/:user/:beername', isLoggedIn, function(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");

	var beername = decodeURIComponent(req.params.beername);
	console.log(beername);
	// Need to verify that this is the correct owner of the beer
	Beers.findOne({ name: beername}, function(err, savedbeer) {
		if (err)
			res.json({message: 'Beer not found'});
		else
		{
			console.log(savedbeer);
			console.log(savedbeer._id);
			console.log(req.params.user);
			console.log(savedbeer.owner);
			if (savedbeer.owner === req.params.user)
			{
				Beers.remove({
				_id: savedbeer._id
				},
				function(err, beer) {
					if (err)
						res.send(err);
					else
						res.json({message: 'Confirm delete'});
				});
			}
			else
				res.json({message: 'This is not your beer!'});
			
		}
		
	});
});

// this was to delete users mistakenly added to Beers schema
/*app.delete('/profile/:userid', function(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");

	// Need to verify that this is the correct owner of the beer
	Beers.find({ userID: req.params.userid}, function(err, savedbeer) {
		if (err)
			res.json({message: 'User not found'});
		else
		{
			console.log(savedbeer);
			console.log(savedbeer[0]._id);
			Beers.remove({
				_id: savedbeer[0]._id
			},
			function(err, beer) {
				if (err)
					res.send(err);
				else
					res.json({message: 'Confirm delete'});
			});
		}
		
	});
});*/

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
    {
    	console.log('Authorized!');
    	return next();
    }
        
    // if they aren't send an error message
    else
    {
    	console.log('Unauthorized!');
    	res.send(401);
    } 
    	
}

function sanitize(html) {
	
	var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';

	var tagOrComment = new RegExp(
		'<(?:'
		// Comment body.
		+ '!--(?:(?:-*[^->])*--+|-?)'
		// Special "raw text" elements whose content should be elided.
		+ '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
		+ '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
		// Regular name
		+ '|/?[a-z]'
		+ tagBody
		+ ')>',
		'gi');
  
  var oldHtml;
  do {
    oldHtml = html;
    html = html.replace(tagOrComment, '');
  } while (html !== oldHtml);
  return html.replace(/</g, '&lt;');
};

}