var app;
(function (app) {
    (function (JayDataExamples) {
        var OrdersController = (function () {
            function OrdersController($scope, jaydataservice) {
                this.orders = [];
                $scope.vm = this;
                this.$scope = $scope;
                this.dataservice = jaydataservice;
                this.initialize();
            }
            OrdersController.prototype.initialize = function () {
                this.dataservice.Orders.toArray(this.onOrdersLoaded.bind(this));
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
                        adapter: dt.JayDataEntityFilterAdapter
                    },
                    remoteState: {
                        storeId: 'OrderGrid',
                        getStatesFromServer: true,
                        ajax: {
                            getAll: {
                                url: 'breeze/NorthBreeze/RemoteState'
                            },
                            save: {
                                url: 'breeze/NorthBreeze/RemoteState'
                            },
                            remove: {
                                url: 'breeze/NorthBreeze/RemoteState'
                            },
                            setDefault: {
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
                this.orders = data;
                this.$scope.$apply();
            };

            OrdersController.prototype.getStateName = function (state) {
                switch (state) {
                    case $data.EntityState.Detached:
                        return 'Detached';
                    case $data.EntityState.Unchanged:
                        return 'Unchanged';
                    case $data.EntityState.Added:
                        return 'Added';
                    case $data.EntityState.Modified:
                        return 'Modified';
                    case $data.EntityState.Deleted:
                        return 'Deleted';
                    default:
                        return 'Undefined';
                }
            };

            OrdersController.prototype.setState = function (itemIdx, stateName) {
                var item = this.orders[itemIdx];
                switch (stateName) {
                    case 'attach':
                        this.dataservice.Orders.attach(item);
                        break;
                    case 'deleted':
                        this.dataservice.Orders.remove(item);
                        break;
                    case 'detached':
                        this.dataservice.Orders.detach(item);
                        break;
                    case 'modified':
                        item.entityState = $data.EntityState.Modified;
                        break;
                    case 'unchanged':
                        item.entityState = $data.EntityState.Unchanged;
                        break;
                    default:
                        break;
                }
                //this.$scope.orderTable.draw(false);
            };
            OrdersController.$inject = ["$scope", "jaydataservice"];
            return OrdersController;
        })();
        JayDataExamples.OrdersController = OrdersController;
    })(app.JayDataExamples || (app.JayDataExamples = {}));
    var JayDataExamples = app.JayDataExamples;
})(app || (app = {}));

angular.module("app").controller("JayDataExamples.OrdersController", app.JayDataExamples.OrdersController);
//# sourceMappingURL=orders.js.map
