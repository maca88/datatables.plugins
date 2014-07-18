var app;
(function (app) {
    (function (JayDataExamples) {
        var CustomerController = (function () {
            function CustomerController($scope, jaydataservice) {
                this.customerOrdersGridOpts = {};
                $scope.vm = this;
                this.$scope = $scope;
                this.dataservice = jaydataservice;
                this.initialize();
            }
            CustomerController.prototype.initialize = function () {
                var _this = this;
                this.customerGridOpts = {
                    paging: true,
                    columnDefs: [
                        {
                            targets: 0,
                            resizable: false
                        }
                    ],
                    lengthChange: true,
                    searching: true,
                    info: true,
                    stateSave: true,
                    autoWidth: true,
                    deferRender: true,
                    processing: false,
                    advancedFilter: {
                        remoteAdapter: dt.JayDataAdvancedFilterAdapter
                    },
                    colResize: {},
                    rowDetails: {
                        template: '#row-details-tpl',
                        opened: function (row) {
                            var scope = angular.element(row.node()).scope();
                            if (scope.ordersLoaded === true)
                                return;
                            var customer = row.data();
                            _this.dataservice.loadItemProperty(customer, 'Orders', {
                                success: function (json) {
                                    customer.Orders = json;
                                    scope.ordersLoaded = true;
                                    scope.$apply();
                                },
                                error: function (error) {
                                    throw error;
                                }
                            });
                        }
                    },
                    serverSide: true,
                    //scrollX: true,
                    //scrollCollapse: true,
                    remoteFilter: {
                        adapter: dt.JayDataRemoteFilterAdapter,
                        prefetchPages: 3,
                        //method: 'POST',
                        sendExtraData: function (data) {
                            return data['formFilter'];
                        },
                        query: this.dataservice.Customers,
                        entityName: "Customer",
                        projectOnlyTableColumns: false
                    },
                    order: [],
                    tableTools: {
                        "sRowSelect": "single",
                        "sSwfPath": "libs/datatables/extensions/TableTools/swf/copy_csv_xls_pdf.swf"
                    },
                    formFilter: {
                        formSelectors: ['#cust-dt-filter']
                    },
                    dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" + "T" + "D" + "C" + "<'pull-right'A>" + "F" + "J" + "K" + "t" + "<'row'<'col-xs-6'i><'col-xs-6'p>>R"
                };
            };

            CustomerController.prototype.getStateName = function (state) {
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

            CustomerController.prototype.reset = function (customer) {
                var _this = this;
                customer.refresh().then(function () {
                    customer.entityState = $data.EntityState.Unchanged;
                    if (!_this.$scope.$$phase)
                        _this.$scope.$apply();
                });
                //if (!this.$scope.$$phase) this.$scope.$apply();
            };

            CustomerController.prototype.update = function (customer) {
                var _this = this;
                customer.save().then(function () {
                    if (!_this.$scope.$$phase)
                        _this.$scope.$apply();
                });
            };
            CustomerController.$inject = ["$scope", "jaydataservice"];
            return CustomerController;
        })();
        JayDataExamples.CustomerController = CustomerController;
    })(app.JayDataExamples || (app.JayDataExamples = {}));
    var JayDataExamples = app.JayDataExamples;
})(app || (app = {}));

angular.module("app").controller("JayDataExamples.CustomerController", app.JayDataExamples.CustomerController);
//# sourceMappingURL=customers.js.map
