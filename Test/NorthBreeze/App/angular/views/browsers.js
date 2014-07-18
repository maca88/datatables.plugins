var app;
(function (app) {
    (function (AngularExamples) {
        var BrowsersController = (function () {
            function BrowsersController($scope) {
                this.idx = 0;
                this.eIdx = 30;
                this.subItemOptions = {};
                this.data = [];
                $scope.vm = this;
                this.$scope = $scope;
                this.initialize();
            }
            BrowsersController.prototype.initialize = function () {
                for (var i = 0; i < 1000; i++) {
                    var subItems = [];
                    for (var j = 0; j < i; j++) {
                        subItems.push({
                            prop1: "test" + j
                        });
                    }
                    this.data.push({
                        "engine": "Trident" + i,
                        "browser": "Internet Explorer 4.0" + i,
                        "platform": "Win 95+" + i,
                        "version": 4 + i,
                        "grade": "X" + i,
                        "date": new Date(),
                        "subItems": subItems
                    });
                }

                this.options = {
                    stateSave: false,
                    paging: true,
                    lengthChange: true,
                    searching: true,
                    info: true,
                    autoWidth: true,
                    deferRender: true,
                    order: [],
                    lengthMenu: [
                        [5, 10, 25, 50, 100, 200, -1],
                        [5, 10, 25, 50, 100, 200, "All"]
                    ],
                    columns: [
                        { iconColumn: true },
                        { data: "engine", title: "Engine", className: "text-right", type: "string", editable: { validators: { required: true } } },
                        { data: "browser", title: "Browser", type: "string", editable: true },
                        { data: "platform", title: "Platform", type: "string", editable: true },
                        { data: "version", title: "Version", type: "number", editable: true },
                        { data: "grade", title: "Grade", type: "string", editable: true },
                        { data: "date", title: "Date", type: "date", editable: true, expression: "data.date | date:'shortDate'" },
                        { template: "#options-tpl" }
                    ],
                    editable: {
                        createItem: this.getNewItem.bind(this),
                        validate: function (val, validator, row) {
                            switch (validator.name) {
                                case 'required':
                                    return !validator.options || (val != null && val != '');
                                default:
                                    throw 'Unknown validator ' + validator.name;
                            }
                        },
                        language: {
                            validators: {
                                'required': 'The value is required'
                            }
                        }
                    },
                    rowDetails: {
                        template: {
                            url: 'App/views/browsersDetails.html'
                        }
                    },
                    tableTools: {
                        "sRowSelect": "os",
                        "sSwfPath": "libs/datatables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
                        "aButtons": ["copy", "pdf", "select_all", "select_none"]
                    },
                    dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" + "T" + "D" + "C" + "E" + "t" + "<'row'<'col-xs-6'i><'col-xs-6'p>>R"
                };
            };

            BrowsersController.prototype.getNewItem = function () {
                var item = {
                    "engine": "Trident" + this.idx,
                    "browser": "Internet Explorer 4.0" + this.idx,
                    "platform": "Win 95+" + this.idx,
                    "version": 4 + this.idx,
                    "date": new Date(),
                    "grade": "X" + this.idx
                };
                this.idx++;
                return item;
            };

            BrowsersController.prototype.addItem = function () {
                this.data.push(this.getNewItem());
            };

            BrowsersController.prototype.addItemViaDt = function () {
                this.$scope.dtTable.row.add(this.getNewItem());
            };

            BrowsersController.prototype.removeItem = function (index) {
                this.data.splice(index, 1);
            };

            BrowsersController.prototype.swapItems = function () {
                this.swapItemsFromTo(0, 1);
            };

            BrowsersController.prototype.swapItemsFromTo = function (x, y) {
                var b = this.data[x];
                this.data[x] = this.data[y];
                this.data[y] = b;
            };

            BrowsersController.prototype.editRandomItem = function () {
                this.data[this.eIdx].engine = "1" + this.data[this.eIdx].engine;
                this.$scope.dtTable.row(this.eIdx).invalidate(); //manual invalidation for items that has not been rendered yet
                this.eIdx++;
            };

            BrowsersController.prototype.editItem = function (item) {
                this.data[item.index].engine = "1" + this.data[item.index].engine;
            };

            BrowsersController.prototype.removeItemViaDt = function (item) {
                this.$scope.dtTable.row(item.index).remove();
            };

            BrowsersController.prototype.canRemoveItem = function () {
                return this.$scope.dtTable.selectedRows.length > 0;
            };
            BrowsersController.$inject = ["$scope"];
            return BrowsersController;
        })();
        AngularExamples.BrowsersController = BrowsersController;
    })(app.AngularExamples || (app.AngularExamples = {}));
    var AngularExamples = app.AngularExamples;
})(app || (app = {}));

angular.module("app").controller("AngularExamples.BrowsersController", app.AngularExamples.BrowsersController);
//# sourceMappingURL=browsers.js.map
