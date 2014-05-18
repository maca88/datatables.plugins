'use strict';

// Declare app level module which depends ngGrid
var app = angular.module('NorthBreeze', ['ngRoute', 'dt']);

// Define route objects, which are used by the routeProvider (for loading ng-view) and by the RouteCtrl (for displaying navigation bar)
app.routes = [
    { path: '/', name: 'Home', templateUrl: 'App/views/home.html', controller: 'HomeCtrl' },
    { path: '/customers', name: 'Customers[RowDetails, TableTools, BreezeRemote]', templateUrl: 'App/views/customers.html', controller: 'CustomerCtrl' },
    { path: '/browsers', name: 'Browsers[RowDetails, TableTools]', templateUrl: 'App/views/browsers.html', controller: 'BrowserCtrl' },
    { path: '/orders', name: 'Orders[EntityFilter, RemoteState]', templateUrl: 'App/views/orders.html', controller: 'OrderCtrl' },
    { path: '/employee-editor', name: 'Employee[BreezeEditable]', templateUrl: 'App/views/employeeEditor.html', controller: 'EmployeeEditorCtrl' }
];

// Configure the routeProvider, which displays a view in the ng-view div in index.html, based on the URI path (e.g. /customers)
app.config(['$routeProvider', function ($routeProvider) {

    var len = app.routes.length;
    for (var i = 0; i < len; i++) {
        var rt = app.routes[i];
        $routeProvider.when(rt.path, rt);
    }
    $routeProvider.otherwise({ redirectTo: '/' });
}]);