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
                for (var i = 0; i < 100; i++) {
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

                this.versions = [1, 2, 3, 4, 5, 6, 7];
                this.versionGroups = [{ label: 'Group1', items: [1, 2, 3] }, { label: 'Group2', items: [4, 5, 6] }];

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
                        {
                            data: "engine", title: "Engine", className: "text-right", type: "string",
                            editable: {
                                validators: { required: true, minlength: 3 },
                                template: {
                                    control: {
                                        attrs: {}
                                    }
                                }
                            }
                        },
                        { data: "browser", title: "Browser", type: "string", editable: true },
                        { data: "platform", title: "Platform", type: "string", editable: true },
                        {
                            data: "version", title: "Version", type: "number",
                            //Settings1 - with a placeholder
                            //editable: {
                            //    validators: { required: true },
                            //    options: [{ text: 'Version 1', value: 1 }, { text: 'Version 2', value: 2 }],
                            //    type: 'select',
                            //    settings: {
                            //        allowClear: true,
                            //        placeholder: 'Select a version',
                            //        width: '150px'
                            //    }
                            //}
                            //Setting2 - with a placeholder and custom option model - using the vm property versions
                            //editable: {
                            //    validators: { required: true },
                            //    type: 'select',
                            //    settings: {
                            //        allowClear: true,
                            //        placeholder: 'Select a version',
                            //        width: '150px'
                            //    },
                            //    template: {
                            //        option: {
                            //            attrs: {
                            //                'ng-repeat': 'item in vm.versions',
                            //                'ng-bind': 'item',
                            //                'ng-value': 'item',
                            //            }
                            //        }
                            //    }
                            //}
                            //Settings3 - using groups with a placeholder
                            //editable: {
                            //    validators: { required: true },
                            //    groups: [
                            //        { name: 'Group 1', options: [{ text: 'Version 1', value: 1 }, { text: 'Version 2', value: 2 }] },
                            //        { name: 'Group 2', options: [{ text: 'Version 3', value: 3 }, { text: 'Version 4', value: 4 }] }],
                            //    type: 'select',
                            //    settings: {
                            //        allowClear: true,
                            //        placeholder: 'Select a version',
                            //        width: '150px'
                            //    }
                            //}
                            //Settings4 - using groups with a placeholder and custom group model
                            editable: {
                                validators: { required: true },
                                groups: true,
                                type: 'select',
                                settings: {
                                    allowClear: true,
                                    placeholder: 'Select a version',
                                    width: '150px'
                                },
                                template: {
                                    optgroup: {
                                        attrs: {
                                            'ng-repeat': 'group in vm.versionGroups',
                                            'label': '{{group.label}}'
                                        }
                                    },
                                    option: {
                                        attrs: {
                                            'ng-repeat': 'item in group.items',
                                            'ng-bind': 'item',
                                            'ng-value': 'item'
                                        }
                                    }
                                }
                            }
                        },
                        { data: "grade", title: "Grade", type: "string", editable: true },
                        {
                            data: "date", title: "Date", type: "datetime", width: "200px",
                            editable: {
                                validators: { required: true },
                                template: {
                                    time: { attrs: { 'data-minute-step': 10 } }
                                }
                            },
                            expression: "data.date | date:'shortDate'"
                        },
                        { template: "#options-tpl" },
                        {
                            commands: [
                                "bs.icon.edit",
                                "bs.icon.remove",
                                "bs.icon.reject",
                                {
                                    name: "custom",
                                    template: '<button ng-click="$commands.custom.click()">Custom</button>',
                                    scope: {
                                        click: function () {
                                            alert('yeeey');
                                        }
                                    }
                                }
                            ]
                        }
                    ],
                    editable: {
                        services: {
                            data: {
                                type: dt.editable.DefaultDataSerice,
                                settings: {
                                    createItem: this.getNewItem.bind(this)
                                }
                            },
                            display: {
                                plugins: {}
                            }
                        },
                        editor: {
                            type: dt.editable.InlineEditor
                        },
                        //row validators
                        validators: {
                            'dt-test': 'test'
                        },
                        language: {
                            'required': 'The value is required',
                            'minlength': 'Minimum length is {{options}}',
                            'dtTest': 'Custom row validator, type "test" in the engine column'
                        }
                    },
                    rowDetails: {
                        behavior: 'accordion',
                        destroyOnClose: true,
                        buttons: {
                            collapseAll: {
                                visible: true
                            },
                            expandAll: {
                                visible: true
                            }
                        },
                        template: {
                            url: 'App/angular/views/browsersDetails.html'
                        }
                    },
                    tableTools: {
                        "sRowSelect": "os",
                        "sSwfPath": "libs/datatables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
                        "aButtons": ["select_all", "select_none", "editable_remove", "editable_add"]
                    },
                    dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" + "T" + "D" + "C" + "t" + "<'row'<'col-xs-6'i><'col-xs-6'p>>R"
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
