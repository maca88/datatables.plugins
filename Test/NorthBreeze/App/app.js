'use strict';

// Declare app level module which depends ngGrid
var app = angular.module('NorthBreeze', ['ngRoute', 'dt', 'breeze.angular']);

// Define route objects, which are used by the routeProvider (for loading ng-view) and by the RouteCtrl (for displaying navigation bar)
app.routes = [
    { path: '/', name: 'Home', templateUrl: 'App/views/home.html', controller: 'HomeCtrl' },
    { path: '/customers', name: 'Customers', templateUrl: 'App/views/customers.html', controller: 'CustomerCtrl' },
    { path: '/browsers', name: 'Browsers', templateUrl: 'App/views/browsers.html', controller: 'BrowserCtrl' },
    { path: '/orders', name: 'Orders', templateUrl: 'App/views/orders.html', controller: 'OrderCtrl' },
    { path: '/employee-editor', name: 'Employee', templateUrl: 'App/views/employeeEditor.html', controller: 'EmployeeEditorCtrl' },
    { path: '/performance', name: 'PerformanceTest', templateUrl: 'App/views/performance.html', controller: 'PerformanceCtrl' }
];

app.factory('dataServicePromise', ['$q', function ($q) {

    //breeze.config.initializeAdapterInstance("modelLibrary", "backingStore", true); // backingStore is the modelLibrary for Angular

    var serviceName = 'breeze/NorthBreeze'; // route to the (same origin) Web Api controller

    var manager = new breeze.EntityManager(serviceName);  // gets metadata from /breeze/NorthBreeze/Metadata
    var deferred = $q.defer();
    manager.fetchMetadata().then(function (schema) {
        deferred.resolve(app.dataservice(manager));
    }).fail(function (error) {
        throw error;
    });
    return deferred.promise;
}]);

// Configure the routeProvider, which displays a view in the ng-view div in index.html, based on the URI path (e.g. /customers)
app.config(['$routeProvider', function ($routeProvider) {

    var len = app.routes.length;
    for (var i = 0; i < len; i++) {
        var rt = app.routes[i];
        rt.resolve = rt.resolve || {};
        rt.resolve.dataservice = "dataServicePromise";
        $routeProvider.when(rt.path, rt);
    }
    $routeProvider.otherwise({ redirectTo: '/' });
}]);