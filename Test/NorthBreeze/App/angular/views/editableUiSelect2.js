var app;
(function (app) {
    (function (AngularExamples) {
        var EditableUiSelect2Controller = (function () {
            function EditableUiSelect2Controller($scope) {
                this.data = [];
                this.objVersions = [
                    { id: 1, text: '1' },
                    { id: 2, text: '2' },
                    { id: 3, text: '3' },
                    { id: 4, text: '4' },
                    { id: 5, text: '5' }
                ];
                this.versions = [1, 2, 3, 4, 5, 6, 7];
                this.versionGroups = [
                    { label: 'Group1', items: [1, 2, 3] },
                    { label: 'Group2', items: [4, 5, 6] }
                ];
                $scope.vm = this;

                for (var i = 0; i < 100; i++) {
                    this.data.push({
                        "objVersion": this.objVersions[0],
                        "version": 1,
                        "versionGroup": 1
                    });
                }

                this.options = {
                    deferRender: true,
                    columns: [
                        {
                            data: "objVersion", title: "Version Object",
                            expression: "data.objVersion.id + '-' + data.objVersion.text",
                            editable: {
                                asInput: true,
                                type: 'select',
                                settings: {
                                    allowClear: true,
                                    placeholder: "Select a version",
                                    data: this.objVersions
                                }
                            }
                        },
                        {
                            data: "versionGroup", title: "Version", type: "number",
                            editable: {
                                validators: { required: true },
                                groups: true,
                                type: 'select',
                                settings: {
                                    allowClear: true,
                                    placeholder: 'Select a version'
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
                        }
                    ],
                    editable: {
                        services: {
                            data: {
                                type: dt.editable.DefaultDataSerice
                            }
                        }
                    }
                };
            }
            EditableUiSelect2Controller.$inject = ['$scope'];
            return EditableUiSelect2Controller;
        })();
        AngularExamples.EditableUiSelect2Controller = EditableUiSelect2Controller;
    })(app.AngularExamples || (app.AngularExamples = {}));
    var AngularExamples = app.AngularExamples;
})(app || (app = {}));

angular.module("app").controller("AngularExamples.EditableUiSelect2Controller", app.AngularExamples.EditableUiSelect2Controller);
//# sourceMappingURL=editableUiSelect2.js.map
