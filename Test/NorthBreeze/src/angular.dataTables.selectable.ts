//Selectable plugin
angular.module("dt")
    .config([
        "dtSettings", (dtSettings) => {
            //We have to remove the selected row/cell if the selected cell will be removed
            dtSettings.dtTableCreatingCallbacks.push(($element, options, scope, attrs, $compile) => {
                if (attrs.dtSelectable == null && options.selectable == null) return;
                var tblScope: any = $element.scope();

                var origRemovingRow = options.removingRow;
                options.removingRow = (settings, row, thatIdx) => {
                    if (tblScope.$selectedRowIndex == row)
                        tblScope.$selectedRowIndex = null;
                    if (angular.isFunction(origRemovingRow))
                        origRemovingRow(settings, row, thatIdx);
                };

            });

            dtSettings.dtTableCreatedCallbacks.push((dataTable, $element, options, scope, attrs, $compile) => {
                if (attrs.dtSelectable == null && options.selectable == null) return;
                var tblScope: any = $element.scope();

                //#region Row
                var selectedRow = null;
                var selectedRowNode = null;
                var selectedRowData = null;
                var selectedRowIndex = null;

                var resetSelectedRow = function () {
                    if (selectedRowNode != null)
                        angular.element(selectedRowNode).removeClass("dt-selected-row");
                    selectedRow = null;
                    selectedRowNode = null;
                    selectedRowData = null;
                    selectedRowIndex = null;
                };

                var selectRow = function(row) {
                    if (selectedRowNode != null)
                        angular.element(selectedRowNode).removeClass("dt-selected-row");
                    if (row == null) return;
                    angular.element(row.node()).addClass("dt-selected-row");
                };

                Object.defineProperty(tblScope, "$selectedRow", {
                    get: function () {
                        return selectedRow;
                    },
                    set: function (value) {
                        if (value == null || value == "") {
                            resetSelectedRow();
                            resetSelectedCell();
                            return;
                        }
                        if (selectedRow == value) return;
                        selectRow(value);
                        selectedRow = value;
                        selectedRowNode = value.node();
                        selectedRowData = value.data();
                        selectedRowIndex = value.index();
                        if (selectedCell != null && selectedCell.index().row != selectedRowIndex)
                            resetSelectedCell();
                    }
                });
                Object.defineProperty(tblScope, "$selectedRowData", {
                    get: function () {
                        return selectedRowData;
                    }/*,
                    set: function (value) {
                        var index = dataTable.rows().data().indexOf(value);
                        if (index < 0 || index == selectedRowIndex)
                            return;
                        var row = dataTable.row(index);
                        if (row.length == 0) return;
                        this.$selectedRow = row;
                    }*/ //TODO: check if make sense to support this
                });
                Object.defineProperty(tblScope, "$selectedRowIndex", {
                    get: function () {
                        return selectedRowIndex;
                    },
                    set: function (value) {
                        if (value == null || value == "") {
                            resetSelectedRow();
                            resetSelectedCell();
                            return;
                        }
                        var rowIndex = parseInt(value);
                        if (!angular.isNumber(rowIndex) || isNaN(rowIndex)) return;
                        
                        var row = dataTable.row(rowIndex);
                        if (row.length == 0) return;
                        this.$selectedRow = row;
                    }
                });
                //#endregion

                //#region Cell
                var selectedCell = null;
                var selectedCellNode = null;
                var selectedCellData = null;
                var selectedCellIndex = null;

                var resetSelectedCell = () => {
                    if (selectedCellNode != null)
                        angular.element(selectedCellNode).removeClass("dt-selected-cell");
                    selectedCell = null;
                    selectedCellData = null;
                    selectedCellIndex = null;
                    selectedCellNode = null;
                };
                var selectCell = cell => {
                    if (selectedCellNode != null)
                        angular.element(selectedCellNode).removeClass("dt-selected-cell");
                    if (cell == null) return;
                    angular.element(cell.node()).addClass("dt-selected-cell");
                };

                Object.defineProperty(tblScope, "$selectedCell", {
                    get: function () {
                        return selectedCell;
                    },
                    set: function (value) {
                        if (value == null || value == "") {
                            resetSelectedCell();
                            return;
                        }
                        if (selectedCell == value) return;
                        selectCell(value);
                        selectedCell = value;
                        selectedCellNode = value.node();
                        selectedCellData = value.data();
                        selectedCellIndex = value.index().column;
                    }
                });
                Object.defineProperty(tblScope, "$selectedCellData", {
                    get: function () {
                        return selectedCellData;
                    }
                    //set not supported
                });
                Object.defineProperty(tblScope, "$selectedCellIndex", {
                    get: function() {
                        return selectedCellIndex;
                    },
                    set: function (value) {
                        if (value == null || value == "") {
                            resetSelectedCell();
                            return;
                        }
                        if (selectedRow == null) return;
                        var cellIndex = parseInt(value);
                        if (!angular.isNumber(cellIndex) || isNaN(cellIndex))  return;
                        
                        var cell = selectedRow.cell(cellIndex);
                        if (cell == null) return;
                        this.$selectedCell = cell;
                    }
                });
                //#endregion


                // respond to click for selecting a row
                $element.on('click', 'tbody td', (e) => {
                    var cell = e.currentTarget;
                    var row = angular.element(cell).parent('tr').get(0);
                    var dtRow = dataTable.row(row);
                    if (dtRow.length == 0) return; //this happens when user click on a child table row
                    tblScope.$selectedRow = dtRow;
                    tblScope.$selectedCell = dtRow.cell(cell);
                    if (!tblScope.$$phase)
                        tblScope.$apply();
                });
                
            });
        }
    ]); 