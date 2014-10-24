var app;
(function (app) {
    (function (BreezeExamples) {
        var EmployeeController = (function () {
            function EmployeeController($scope, dataservice) {
                $scope.vm = this;
                this.$scope = $scope;
                this.dataservice = dataservice;
                this.dataservice.getAllEmployees().then(this.onEmployeesLoaded.bind(this)).fail(function (error) {
                    throw error.message;
                });
                this.initialize();
            }
            EmployeeController.prototype.initialize = function () {
                this.options = {
                    paging: true,
                    lengthChange: true,
                    searching: true,
                    info: true,
                    autoWidth: true,
                    deferRender: true,
                    order: [],
                    entityFilter: {
                        adapter: 'breeze'
                    },
                    tableTools: {
                        "sRowSelect": "os",
                        "sSwfPath": "libs/datatables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
                        "aButtons": ["editable_restore_deleted", "editable_delete", "editable_add", "editable_reject", "select_all", "select_none"]
                    },
                    breezeEditable: {
                        entityType: 'Order',
                        createEntity: this.dataservice.createEntity
                    },
                    dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" + "C" + "T" + "G" + "L" + "t" + "<'row'<'col-xs-6'i><'col-xs-6'p>>R"
                };
            };

            EmployeeController.prototype.onEmployeesLoaded = function (data) {
                var _this = this;
                this.employee = data.results[0];
                this.$scope.$digest();
                this.employee.entityAspect.loadNavigationProperty("Orders").then(function (json) {
                    _this.ordersLoaded = true;
                    _this.$scope.$digest();
                }).catch(function (error) {
                    throw error;
                });
            };

            EmployeeController.prototype.rejectChanges = function () {
                this.dataservice.rejectChanges();
            };

            EmployeeController.prototype.saveChanges = function () {
                var _this = this;
                this.dataservice.saveChanges(null, function () {
                    _this.$scope.$digest();
                });
            };
            EmployeeController.$inject = ["$scope", "dataservice"];
            return EmployeeController;
        })();
        BreezeExamples.EmployeeController = EmployeeController;
    })(app.BreezeExamples || (app.BreezeExamples = {}));
    var BreezeExamples = app.BreezeExamples;
})(app || (app = {}));

angular.module("app").controller("BreezeExamples.EmployeeController", app.BreezeExamples.EmployeeController);
