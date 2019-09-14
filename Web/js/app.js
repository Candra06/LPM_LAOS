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

  .when('/search', {
    templateUrl: path.join(view, 'search.html'),
    controller: 'searchController'
  })

  .when('/detail/:appName', {
    templateUrl: path.join(view, 'detail.html'),
    controller: 'detailController'
  })

  .otherwise({ redirectTo: '/' })
}])