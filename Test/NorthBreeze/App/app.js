'use strict';

var app = angular.module('app', ['ngRoute', 'dt', 'breeze.angular', 'jaydata', 'ui.bootstrap', 
/*'mgcrea.ngStrap',*/ 'ui.select2', 'ui.bootstrap.datetimepicker']);

////Workaround for manually trigger tooltips 
////http://stackoverflow.com/questions/20939754/good-way-to-dynamically-open-close-a-popover-or-tooltip-using-angular-based
////https://github.com/angular-ui/bootstrap/issues/590
////var tooltipToggle = bootstrap.Directives.TooltipToggle.directiveSettings();
//var popoverToggle = bootstrap.Directives.TooltipToggle.directiveSettings('popover', 'popoverHtmlUnsafe');
//app.directive(popoverToggle.directiveName, popoverToggle.directive)
//        .config(popoverToggle.directiveConfig);



// Define route objects, which are used by the routeProvider (for loading ng-view) and by the RouteCtrl (for displaying navigation bar)
app.modules = [
    {
        name: 'main',
        title: 'Home',
        isOpen: false,
        controller: function($scope) {
            $scope.vm = {
                date: new Date(),
                 
            };
            $scope.open = function($event) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.opened = true;
            };
        },
        baseTemplateUrl: 'App/main/views/',
        routes: [
            { path: '/', name: 'Home', templateUrl: 'home.html', }
        ]
    },
    /*
    {
        name: 'datatables',
        title: 'DataTables plugins',
        baseTemplateUrl: 'App/datatables/views',
        basePath: '/datatables/',
        routes: [
            { path: 'home', name: 'Customers', templateUrl: 'App/views/customers.html' },
            { path: '/customers', name: 'Customers', templateUrl: 'App/views/customers.html' },
        ]
    },*/
    {
        name: 'angular',
        title: 'DataTables & Angular',
        baseTemplateUrl: 'App/angular/views/',
        isOpen: false,
        basePath: '/angular/',
        routes: [
            { path: 'home', name: 'Home', templateUrl: 'home.html' },

            { path: 'editable', name: 'Editable', templateUrl: 'editable.html' },
            { path: 'i18n', name: 'i18n', templateUrl: 'i18n.html' },
            { path: 'command', name: 'Command', templateUrl: 'command.html' },
            { path: 'selectable', name: 'Selectable', templateUrl: 'selectable.html' },


            { path: 'browsers', name: 'Browsers', templateUrl: 'browsers.html', controller: 'AngularExamples.BrowsersController' },
            { path: 'performance', name: 'Performance', templateUrl: 'performance.html', controller: 'AngularExamples.PerformanceController' },

            //Editable plugin
            { path: 'editable-ui-select2', name: 'Editable select2', templateUrl: 'editableUiSelect2.html', controller: 'AngularExamples.EditableUiSelect2Controller' }

            
        ]
    },
    {
        name: 'jaydata',
        title: 'DataTables & JayData & Angular',
        baseTemplateUrl: 'App/jaydata/views/',
        isOpen: false,
        basePath: '/jaydata/',
        routes: [
            { path: 'home', name: 'Home', templateUrl: 'home.html', controller: 'JayDataExamples.HomeController' },
            { path: 'orders', name: 'Orders', templateUrl: 'orders.html', controller: 'JayDataExamples.OrdersController' },
            { path: 'customers', name: 'Customers', templateUrl: 'customers.html', controller: 'JayDataExamples.CustomerController' },
        ]
    },
    {
        name: 'breeze',
        title: 'DataTables & Breeze & Angular',
        baseTemplateUrl: 'App/breeze/views/',
        isOpen: false,
        basePath: '/breeze/',
        routes: [
            { path: 'home', name: 'Home', templateUrl: 'home.html', controller: 'BreezeExamples.HomeController' },
            { path: 'customers', name: 'Customers', templateUrl: 'customers.html', controller: 'BreezeExamples.CustomerController' },
            //{ path: 'employee', name: 'Employee', templateUrl: 'employee.html', controller: 'BreezeExamples.EmployeeController' },
            { path: 'orders', name: 'Orders', templateUrl: 'orders.html', controller: 'BreezeExamples.OrdersController' }
        ]
    }
];



app.factory('breezeDataServicePromise', ['$q', function ($q) {
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

app.factory('jayDataDataServicePromise', ['$q', '$data', function ($q, $data) {
    var deferred = $q.defer();
    $data.initService('odata', {serviceUrl: 'odata', oDataServiceHost: 'kurac'})
      .then(function (northwind) {
          deferred.resolve(northwind);
      }).fail(function (error) {
          throw error;
      });
    return deferred.promise;
}]);


app.config(['$tooltipProvider', function ($tooltipProvider) {
    $tooltipProvider.setTriggers({ 'open': 'close' });
}]);

// Configure the routeProvider, which displays a view in the ng-view div in index.html, based on the URI path (e.g. /customers)
app.config(['$routeProvider', function ($routeProvider) {

    var len = app.modules.length;
    for (var i = 0; i < len; i++) {
        var module = app.modules[i];
        for (var j = 0; j < module.routes.length; j++) {
            var rt = angular.extend({}, module.routes[j]);
            if (module.baseTemplateUrl)
                rt.templateUrl = module.baseTemplateUrl + rt.templateUrl;
            if (module.basePath)
                rt.path = module.basePath + rt.path;
            if (module.controller)
                rt.controller = module.controller;

            rt.resolve = rt.resolve || {};
            rt.resolve.breezedataservice = "breezeDataServicePromise";
            rt.resolve.jaydataservice = "jayDataDataServicePromise";
            $routeProvider.when(rt.path, rt);
        }
    }
    $routeProvider.otherwise({ redirectTo: '/' });
}]);

// RouteCtrl - expose app.routes and the current route for the navbar
app.controller('RouteCtrl', function ($scope, $route, $location) {
    $scope.$route = $route;
    $scope.modules = app.modules;

    angular.forEach(app.modules, function(module) {
        if ($location.$$path.indexOf(module.basePath) >= 0)
            module.isOpen = true;
    });

});