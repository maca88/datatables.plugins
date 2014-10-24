var app;
(function (app) {
    (function (BreezeExamples) {
        var CustomerController = (function () {
            function CustomerController($scope, breezedataservice) {
                this.customerOrdersGridOpts = {};
                $scope.vm = this;
                this.$scope = $scope;
                this.dataservice = breezedataservice;
                this.initialize();
            }
            CustomerController.prototype.initialize = function () {
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
                        remoteAdapter: dt.BreezeAdvancedFilterAdapter
                    },
                    colResize: {},
                    rowDetails: {
                        template: '#row-details-tpl',
                        rowExpanded: function (row) {
                            var scope = angular.element(row.node()).scope();
                            if (scope.ordersLoaded === true)
                                return;
                            var customer = row.data();
                            customer.entityAspect.loadNavigationProperty("Orders").then(function (json) {
                                console.log(customer.Orders);
                                scope.ordersLoaded = true;
                                scope.$apply();
                            }).catch(function (error) {
                                throw error;
                            });
                        }
                    },
                    serverSide: true,
                    //scrollX: true,
                    //scrollCollapse: true,
                    remoteFilter: {
                        adapter: dt.BreezeRemoteFilterAdapter,
                        prefetchPages: 3,
                        //method: 'POST',
                        sendExtraData: function (data) {
                            return data['formFilter'];
                        },
                        query: this.dataservice.getCustomersQuery(),
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

            CustomerController.prototype.reset = function (customer) {
                customer.entityAspect.rejectChanges();
            };

            CustomerController.prototype.update = function (customer) {
                var _this = this;
                this.dataservice.saveChanges([customer], function () {
                    _this.$scope.$apply();
                });
            };
            CustomerController.$inject = ["$scope", "breezedataservice"];
            return CustomerController;
        })();
        BreezeExamples.CustomerController = CustomerController;
    })(app.BreezeExamples || (app.BreezeExamples = {}));
    var BreezeExamples = app.BreezeExamples;
})(app || (app = {}));

angular.module("app").controller("BreezeExamples.CustomerController", app.BreezeExamples.CustomerController);
