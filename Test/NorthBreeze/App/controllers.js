'use strict';

// RouteCtrl - expose app.routes and the current route for the navbar
app.controller('RouteCtrl', function ($scope, $route) {
        $scope.$route = $route;
        $scope.links = app.routes;
});

// HomeCtrl - expose the changed entities in the EntityManager
app.controller('HomeCtrl', ['$scope', function ($scope) {

    $scope.reset = function () {
        app.dataservice.rejectChanges();
    }

    $scope.update = function () {
        app.dataservice.saveChanges();
    }

    // expose all the changed entities from the entityManager
    $scope.changedEntities = app.dataservice.getChanges();
    app.dataservice.subscribeChanges(function (changeargs) {
        $scope.changedEntities = app.dataservice.getChanges();
    });

}]);

// CustomerCtrl - load the customers and configure the grid to display them
app.controller('CustomerCtrl', ['$scope', function ($scope) {

    $scope.reset = function (customer) {
        customer.entityAspect.rejectChanges();
    }

    $scope.update = function (customer) {
        app.dataservice.saveChanges([customer], function() {
            $scope.$apply();
        });
    }

    $scope.customerOrdersGridOpts = {}

    $scope.customerGridOpts = {
        paging: true,
        lengthChange: true,
        searching: true,
        info: true,
        autoWidth: true,
        deferRender: true,
        processing: false,
        rowDetails: {
            icon: {
                openHtml: '<span class="glyphicon glyphicon-plus row-detail-icon"></span>',
                closeHtml: '<span class="glyphicon glyphicon-minus row-detail-icon"></span>',
                'class': 'row-detail-icon',
            }
        },
        rowDetailOpened: function (row) {
            var scope = angular.element(row.node()).scope();
            if (scope.ordersLoaded === true) return;
            var customer = row.data();
            customer.entityAspect.loadNavigationProperty("Orders")
                .then(function (json) {
                    console.log(customer.Orders);
                    scope.ordersLoaded = true;
                    scope.$apply();
                })
                .catch(function (error) {
                    throw error;
                });
        },
        breeze: {
            query: app.dataservice.getCustomersQuery(),
            entityName: "Customer",
            projectOnlyTableColumns: false //If true then server results will be plain objects (not breeze.Entity)
        },
        order: [],
        dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" +
        "D" + //RowDetails
        "C" + //ColVis
        "t" +
		"<'row'<'col-xs-6'i><'col-xs-6'p>>R"

    };
}]);

app.controller('OrderCtrl', function ($scope) {
    $scope.orders = $scope.orders || [];
    
    app.dataservice.getOrders()
        .then(querySucceeded)
        .fail(queryFailed);

    $scope.orderGridOpts = {
        paging: true,
        lengthChange: true,
        searching: true,
        info: true,
        autoWidth: true,
        deferRender: true,
        remoteState: {
            storeId: 'OrderGrid',
            getStatesFromServer: true,
            ajax: {
                'getAll': {
                    url: 'breeze/NorthBreeze/RemoteState'
                },
                'save': {
                    url: 'breeze/NorthBreeze/RemoteState'
                },
                'delete': {
                    url: 'breeze/NorthBreeze/RemoteState'
                },
                'setDefault': {
                    url: 'breeze/NorthBreeze/RemoteState'
                }
            }
        },
        dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" +
        "Y" + //Entity Filter
        "C" + //ColVis
        "B" + //RemoteState
        "t" +
		"<'row'<'col-xs-6'i><'col-xs-6'p>>R"

    };

    $scope.setState= function(itemIdx, stateName) {
        var item = $scope.orders[itemIdx];
        switch (stateName) {
            case 'deleted':
                item.entityAspect.setDeleted();
                break;
            case 'detached':
                item.entityAspect.setDetached();
                break;
            case 'modified':
                item.entityAspect.setModified();
                break;
            case 'unchanged':
                item.entityAspect.setUnchanged();
                break;
            default:
                break;
        }
        
        $scope.orderTable.draw(false);
    };

    //#region private functions
    function querySucceeded(data) {
        $scope.orders = data.results;
        $scope.$apply();
        app.logger.info("Fetched " + data.results.length + " Orders ");
    }

    function queryFailed(error) {
        logger.error(error.message, "Query failed");
    }
});
