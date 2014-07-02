'use strict';

// RouteCtrl - expose app.routes and the current route for the navbar
app.controller('RouteCtrl', function ($scope, $route) {
        $scope.$route = $route;
        $scope.links = app.routes;
});

// HomeCtrl - expose the changed entities in the EntityManager
app.controller('HomeCtrl', ['$scope', 'dataservice', function ($scope, dataservice) {

    $scope.reset = function () {
        dataservice.rejectChanges();
    }

    $scope.update = function () {
        dataservice.saveChanges();
    }

    // expose all the changed entities from the entityManager
    $scope.changedEntities = dataservice.getChanges();
    dataservice.subscribeChanges(function (changeargs) {
        $scope.changedEntities = dataservice.getChanges();
    });

}]);

// CustomerCtrl - load the customers and configure the grid to display them
app.controller('CustomerCtrl', ['$scope', 'dataservice', function ($scope, dataservice) {

    $scope.reset = function (customer) {
        customer.entityAspect.rejectChanges();
    }

    $scope.update = function (customer) {
        dataservice.saveChanges([customer], function() {
            $scope.$apply();
        });
    }

    $scope.customerOrdersGridOpts = {}

    $scope.customerGridOpts = {
        paging: true,
        lengthChange: true,
        searching: true,
        info: true,
        stateSave: true,
        autoWidth: true,
        deferRender: true,
        processing: false,
        rowDetails: {
            icon: {
                openHtml: '<span class="glyphicon glyphicon-plus row-detail-icon"></span>',
                closeHtml: '<span class="glyphicon glyphicon-minus row-detail-icon"></span>',
                className: 'row-detail-icon',
            },
            template: '#row-details-tpl',
            opened: function (row) {
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
        serverSide: true,
        //scrollX: true,
        //scrollCollapse: true,
        breezeRemote: {
            prefetchPages: 3,
            //method: 'POST',
            sendExtraData: function(data) {
                return data['formFilter'];
            },
            query: dataservice.getCustomersQuery(),
            entityName: "Customer",
            projectOnlyTableColumns: false //If true then server results will be plain objects (not breeze.Entity)
        },
        order: [],
        tableTools: {
            "sRowSelect": "single",
            "sSwfPath": "libs/datatables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
        },
        formFilter: {
            formSelectors: ['#cust-dt-filter']
        },
        dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" +
        "T" + //TableTools
        "D" + //RowDetails
        "C" + //ColVis
        "<'pull-right'A>" + //AdvancedFilter
        "F" + //BreezeRemote
        "J" + //ColResize
        "K" + //FormFilter
        "t" +
		"<'row'<'col-xs-6'i><'col-xs-6'p>>R"

    };
}]);

app.controller('OrderCtrl', function ($scope, dataservice) {
    $scope.orders = $scope.orders || [];
    
    dataservice.getOrders()
        .then(querySucceeded)
        .fail(queryFailed);

    $scope.orderGridOpts = {
        paging: true,
        lengthChange: true,
        lengthMenu: [[3, 25, 50, -1], [3, 25, 50, "All"]],
        searching: true,
        info: true,
        //autoWidth: true,
        scrollX: true,
        scrollCollapse: true,
        deferRender: true,
        stateSave: true,
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
        formFilter: {
            formSelectors: ['#order-dt-filter'],
            clientFilter: function(currentFormsData, data, dataIndex, rowData) {
                if (!currentFormsData) return true;
                var result = true;
                for (var i = 0; i < currentFormsData.length; i++) {
                    var name = currentFormsData[i].name;
                    switch(name) {
                        case 'city':
                            result &= currentFormsData[i].value == '' || rowData.ShipCity == currentFormsData[i].value;
                            break;
                        case 'region':
                            result &= currentFormsData[i].value == '' || rowData.ShipRegion == currentFormsData[i].value;
                            break;
                        case 'name':
                            result &= currentFormsData[i].value == '' || rowData.ShipName == currentFormsData[i].value;
                            break;
                    }
                }
                return result;
            }
        },
        dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" +
        "G" + //BreezeFilter
        "C" + //ColVis
        "<'pull-left'B>" + //RemoteState
        "<'pull-right'A><'clearfix'>" + //AdvancedFilter
        "t" +
        "K" + //FormFilter
        "J" + //ColResize
        "I" + //ColPin
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
