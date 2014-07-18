var app;
(function (app) {
    (function (BreezeExamples) {
        var OrdersController = (function () {
            function OrdersController($scope, breezedataservice) {
                this.orders = [];
                $scope.vm = this;
                this.$scope = $scope;
                this.dataservice = breezedataservice;
                this.initialize();
            }
            OrdersController.prototype.initialize = function () {
                this.dataservice.getOrders().then(this.onOrdersLoaded.bind(this)).fail(function (error) {
                    throw error.message;
                });

                this.orderGridOpts = {
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
                    entityFilter: {
                        adapter: dt.BreezeEntityFilterAdapter
                    },
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
                        clientFilter: function (currentFormsData, data, dataIndex, rowData) {
                            if (!currentFormsData)
                                return true;
                            var result = true;
                            for (var i = 0; i < currentFormsData.length; i++) {
                                var name = currentFormsData[i].name;
                                switch (name) {
                                    case 'city':
                                        result &= (currentFormsData[i].value == '' || rowData.ShipCity == currentFormsData[i].value);
                                        break;
                                    case 'region':
                                        result &= (currentFormsData[i].value == '' || rowData.ShipRegion == currentFormsData[i].value);
                                        break;
                                    case 'name':
                                        result &= (currentFormsData[i].value == '' || rowData.ShipName == currentFormsData[i].value);
                                        break;
                                }
                            }
                            return result;
                        }
                    },
                    dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" + "G" + "C" + "<'pull-left'B>" + "<'pull-right'A><'clearfix'>" + "t" + "K" + "I" + "J" + "<'row'<'col-xs-6'i><'col-xs-6'p>>R"
                };
            };

            OrdersController.prototype.onOrdersLoaded = function (data) {
                this.orders = data.results;
                this.$scope.$apply();
            };

            OrdersController.prototype.setState = function (itemIdx, stateName) {
                var item = this.orders[itemIdx];
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
                this.$scope.orderTable.draw(false);
            };
            OrdersController.$inject = ["$scope", "breezedataservice"];
            return OrdersController;
        })();
        BreezeExamples.OrdersController = OrdersController;
    })(app.BreezeExamples || (app.BreezeExamples = {}));
    var BreezeExamples = app.BreezeExamples;
})(app || (app = {}));

angular.module("app").controller("BreezeExamples.OrdersController", app.BreezeExamples.OrdersController);
//# sourceMappingURL=orders.js.map
