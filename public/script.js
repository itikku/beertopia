'use strict';

/*
	Beer Topia Angular Application
	*/

angular.module('beerApp', ['ui.router', 'ngResource', 'ui.bootstrap'])
.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider, $routeProvider, 
	$httpProvider, $locationProvider) {

    var checkLoggedin = function($q, $timeout, $http, $location, $rootScope){
      // Initialize a new promise
      var deferred = $q.defer();

      // Make an AJAX call to check if the user is logged in
      $http.get('/loggedin', {
      	user: $rootScope.user
      })
      	.success(function(user){
        // Authenticated
        if (user !== '0')
          $timeout(deferred.resolve, 0);

        // Not Authenticated
        else {
        	console.log('Not authenticated');
			alert('You need to log in.');
			$timeout(function(){deferred.reject();}, 0);
			$location.path('/homePage');
        }
      });

      return deferred.promise;
    };

    //================================================
    // Add an interceptor for AJAX errors
    //================================================
    var intercept = function() {
    	$httpProvider.responseInterceptors.push(function($q, $location) {
	      	return function(promise) {
		        return promise.then(
		          // Success: just return the response
		          function(response){
		            return response;
		          }, 
		          // Error: check the error status to get only the 401
		          function(response) {
		            if (response.status === 401)
		              $location.url('/homePage');
		            return $q.reject(response);
		          }
		        );
	      }
	    });
    };

	//use {} when you want beers/{beername} for example
	$stateProvider
	.state('home', {
	  url: '/homePage',
	  templateUrl: 'pages/homePage.html',
	  controller: 'MainCtrl'
	})
	.state('profile/:username', {
		url: '/profile/:username',
		templateUrl: 'pages/profile.html',
		controller: 'ProfileCtrl',
		resolve: {
			loggedin: checkLoggedin
		}
	});

	$urlRouterProvider.otherwise('/homePage');
}])
.run(function($rootScope, $http){
    $rootScope.message = '';

    // Logout function is available in any pages
    $rootScope.logout = function(){
      $rootScope.message = 'Logged out.';
      $http.post('/logout');
    };
})
.controller('MainCtrl', [
	'$scope',
	'$http',
	'$rootScope',
	'$location', 
	function($scope, $http, $rootScope, $location) {
		$scope.title = 'Beer-Topia';

		var params = $http.get('/beers')
			.success(function(data) {
				$scope.beers = data;
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});

		$scope.register = function(){
			$http.post('/register', {
				username: $scope.regUser,
				password: $scope.regPwd,
			})
			.success(function(user){
			// No error: authentication OK
				console.log(user.userID);
				$rootScope.message = 'Authentication successful!';
				$rootScope.user = user.userID;
				$location.path('/profile/' + user.userID);
			})
			.error(function(){
			// Error: authentication failed
				$rootScope.message = 'Authentication failed.';
				$location.path('/homePage');
			});
		};

		// Register the login() function
		$scope.login = function(){
		$http.post('/login', {
			username: $scope.loginUser,
			password: $scope.loginPwd,
			})
			.success(function(user){
			// No error: authentication OK
				$scope.message = 'Authentication successful!';
				$location.path('/profile/' + user.userID);
				$scope.resetForm();
			})
			.error(function(){
			// Error: authentication failed
				$scope.message = 'Authentication failed.';
				$location.path('/homePage');
				$scope.resetForm();
			});
		};

		$scope.resetForm = function(){
			$scope.regUser = '';
			$scope.regPwd = '';
			$scope.loginUser = '';
			$scope.loginPwd = '';
		};
	}
])
.controller('ProfileCtrl', [
	'$stateParams',
	'$scope',
	'$rootScope',
	'$http',
	'$state',
	function($stateParams, $scope, $rootScope, $http, $state) {
		$scope.username = $stateParams.username;

		console.log($scope.username);

		var allbeers = $http.get('/beers')
			.success(function(data) {
				$scope.allbeers = data;
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});

		var user = $http.get('/profile/' + $scope.username)
			.success(function(data) {
				$scope.user = data;
				console.log($scope.user);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});

		$scope.del = function(element) {
			console.log(element.beer.name);
			var encodedBeer = encodeURIComponent(element.beer.name);
			console.log(encodedBeer);
			$http.delete('/profile/' + $scope.username + '/' + encodedBeer)
			.success(function(data) {
				$state.transitionTo($state.current, $stateParams, {
					reload: true,
					inherit: false,
					notify: true
				});
			})
			.error(function(data){
				alert('Delete not completed correctly');
				console.log(data);
			});
		};

		$scope.add = function() {
			$http.post('/profile/' + $scope.username + '/' + $scope.newBeerName, {
				privateComment: $scope.newBeerComment
			})
			.success(function(data) {
				$state.transitionTo($state.current, $stateParams, {
					reload: true,
					inherit: false,
					notify: true
				});
			})
			.error(function(data){
				alert('Beer not added correctly');
				console.log(data);
			});
		};

		$scope.remove = function(element) {
			var encodedBeer = encodeURIComponent(element.beer.name);
			$http.put('/profile/' + $scope.username + '/' + encodedBeer + '/remove')
			.success(function(data) {
				$state.transitionTo($state.current, $stateParams, {
					reload: true,
					inherit: false,
					notify: true
				});
			})
			.error(function(data){
				alert('Beer not removed from your list correctly');
				console.log(data);
			});
		};

		$scope.addtomine = function(element) {

			var encodedBeer = encodeURIComponent(element.beer.name);
			$http.put('/profile/' + $scope.username + '/' + encodedBeer, {
				privateComment: $scope.existBeerComment
			})
			.success(function(data) {
				$state.transitionTo($state.current, $stateParams, {
					reload: true,
					inherit: false,
					notify: true
				});
			})
			.error(function(data){
				alert('Beer not added to your list correctly');
				console.log(data);
			});
		};

		$scope.logout = function() {
			$http.post('/logout')
			.success(function(data) {
				console.log(data);
				$state.go('home');
			})
			.error(function(data){
				console.log(data);
				alert('Unsuccessful logout!');
			})
		};

		/*$scope.favourite = function(element) {
			var encodedBeer = encodeURIComponent(element.beer.name);
			$http.put('/profile/' + $scope.username + '/' + encodedBeer + '/favourite')
			.success(function(data) {
				$state.transitionTo($state.current, $stateParams, {
					reload: true,
					inherit: false,
					notify: true
				});
			})
			.error(function(data){
				alert('Beer not added to favourites correctly');
				console.log(data);
			})
		};

		$scope.unfavourite = function(element) {
			var encodedBeer = encodeURIComponent(element.beer.name);
			$http.put('/profile/' + $scope.username + '/' + encodedBeer, {
				privateComment: $scope.existBeerComment
			})
			.success(function(data) {
				$state.transitionTo($state.current, $stateParams, {
					reload: true,
					inherit: false,
					notify: true
				});
			})
			.error(function(data){
				alert('Beer not removed from favourites correctly');
				console.log(data);
			});
		};*/

		$scope.isOwnedByMe = function(beer) {
			return (beer.owner == $scope.username);
		};

		$scope.isAlsoMine = function(beer) {
			if ($scope.isOwnedByMe(beer))
				return false;

			for (var i = 0; i < beer.privateComment.length; i++)
			{
				if (beer.privateComment[i].userID == $scope.username)
					return true;
			}

			return false;
		};

		$scope.isNotMine = function(beer) {

			for (var i = 0; i < beer.privateComment.length; i++)
			{
				if (beer.privateComment[i].userID == $scope.username)
					return false;
			}

			return true;
		};

		$scope.isFavourite = function(beer) {
			console.log(beer);
			/*var i = $scope.user.favourites.length;

			while (i--) {
				console.log($scope.user.favourites[i])
				if ($scope.beers.favourites[i] === beer)
					return true;
			}*/

			return false;
		};

	}
]);

/*var scotchTodo = angular.module('beerApp', []);

function mainController($scope, $http) {
    $scope.formData = {};

    // when landing on the page, get all todos and show them
    $http.get('/api/todos')
        .success(function(data) {
            $scope.todos = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });

    // when submitting the add form, send the text to the node API
    $scope.createTodo = function() {
        $http.post('/api/todos', $scope.formData)
            .success(function(data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    // delete a todo after checking it
    $scope.deleteTodo = function(id) {
        $http.delete('/api/todos/' + id)
            .success(function(data) {
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

}*/