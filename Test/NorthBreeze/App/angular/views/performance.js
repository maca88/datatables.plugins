var app;
(function (app) {
    (function (AngularExamples) {
        var PerformanceController = (function () {
            function PerformanceController($scope) {
                this.numItems = 50000;
                this.data = [];
                $scope.vm = this;
                this.$scope = $scope;
                this.initialize();
            }
            PerformanceController.prototype.initialize = function () {
                console.time('generateData');
                for (var i = 0; i < this.numItems; i++) {
                    this.data.push([i, i, i, i, i]);
                }
                console.timeEnd('generateData');

                this.options = {
                    deferRender: true,
                    dom: "TfrtiSJ",
                    scrollY: 200,
                    scrollCollapse: true,
                    stateSave: true,
                    //scrollX: true,
                    tableTools: {
                        "sRowSelect": "os",
                        "sSwfPath": "libs/datatables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
                        "aButtons": []
                    }
                };
            };

            PerformanceController.prototype.addItem = function () {
                this.numItems++;
                this.data.push([this.numItems, this.numItems, this.numItems, this.numItems, this.numItems]);
            };

            PerformanceController.prototype.removeItem = function (items) {
                var _this = this;
                window.angular.forEach(items.sort(function (a, b) {
                    return b.index - a.index;
                }), function (item) {
                    _this.data.splice(item.index, 1);
                });
            };
            PerformanceController.$inject = ["$scope"];
            return PerformanceController;
        })();
        AngularExamples.PerformanceController = PerformanceController;
    })(app.AngularExamples || (app.AngularExamples = {}));
    var AngularExamples = app.AngularExamples;
})(app || (app = {}));

angular.module("app").controller("AngularExamples.PerformanceController", app.AngularExamples.PerformanceController);
//# sourceMappingURL=performance.js.map
