const path = require('path')
var angular = require('angular')
var view = path.join(__dirname, '..', 'Web', 'components')
require('angular-route')
var lpm = angular.module('LPM', ['ngRoute'])

lpm.config(['$routeProvider', '$locationProvider', function ($route, $locationProvider) {
  $locationProvider.hashPrefix('');
  $route
  .when('/', {
    templateUrl: path.join(view, 'home.html'),
    controller: 'homeController'
  })

  .when('/installed', {
    templateUrl: path.join(view, 'installed.html'),
    controller: 'installedController'
  })

  .when('/detail', {
    templateUrl: path.join(view, 'installed.html'),
    controller: 'installedController'
  })

  .otherwise({ redirectTo: '/' })
}])