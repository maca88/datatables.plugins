//Selectable plugin
angular.module("dt").config([
    "dtSettings", function (dtSettings) {
        dtSettings.dtTableCreatedCallbacks.push(function (dataTable, $element, options, scope, attrs, $compile) {
            //#region Selectable
            if (attrs.dtSelectable != null || options.selectable != null) {
                var tblScope = $element.scope();
                var selectedRow = null;
                var selectedItem = null;
                var selectedRowIndex = null;

                var resetSelectedItem = function () {
                    if (selectedRow != null)
                        angular.element(selectedRow.node()).removeClass("dt-selected-row");
                    selectedRow = null;
                    selectedItem = null;
                    selectedRowIndex = null;
                };

                var selectRow = function (row) {
                    if (selectedRow != null)
                        angular.element(selectedRow.node()).removeClass("dt-selected-row");
                    angular.element(row.node()).addClass("dt-selected-row");
                };

                Object.defineProperty(tblScope, "$selectedRow", {
                    get: function () {
                        return selectedRow;
                    },
                    set: function (value) {
                        if (selectedRow == value)
                            return;
                        selectRow(value);
                        selectedRow = value;
                        selectedItem = value.data();
                        selectedRowIndex = value.index();
                    }
                });
                Object.defineProperty(tblScope, "$selectedItem", {
                    get: function () {
                        return selectedItem;
                    },
                    set: function (value) {
                        var index = dataTable.rows().data().indexOf(value);
                        if (index < 0 || index == selectedRowIndex)
                            return;
                        var row = dataTable.row(index);
                        selectRow(row);
                        selectedRow = row;
                        selectedItem = selectedRow.data();
                        selectedRowIndex = selectedRow.index();
                    }
                });
                Object.defineProperty(tblScope, "$selectedRowIndex", {
                    get: function () {
                        return selectedRowIndex;
                    },
                    set: function (value) {
                        if (value == null || value == "") {
                            resetSelectedItem();
                            return;
                        }
                        var rowIndex = parseInt(value);
                        if (!angular.isNumber(rowIndex) || isNaN(rowIndex)) {
                            return;
                        }
                        var row = dataTable.row(rowIndex);
                        if (row.length == 0) {
                            return;
                        }
                        if (selectedRow == row)
                            return;
                        selectRow(row);
                        selectedRow = row;
                        selectedItem = selectedRow.data();
                        selectedRowIndex = selectedRow.index();
                    }
                });

                // respond to click for selecting a row
                $element.on('click', 'tbody tr', function (e) {
                    var elem = e.currentTarget;
                    var row = dataTable.row(elem);
                    if (row.length == 0)
                        return;
                    tblScope.$selectedRow = row;
                    if (!tblScope.$$phase)
                        tblScope.$apply();
                });
            }
            //#endregion
        });
    }
]);
//# sourceMappingURL=angular.dataTables.selectable.js.map
