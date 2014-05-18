///<reference path='../typings/jquery/jquery.d.ts' />
///<reference path='../typings/jquery.dataTables/jquery.dataTables.d.ts' />
///<reference path='../typings/angularjs/angular.d.ts' />
///<reference path='../typings/breeze/breeze.d.ts' />
'use strict';
//#region Extensions
//We have to update the original collection if datatables api is used to manipulate dt collection
// in additon we fire an event before remove/add so that
$.fn.DataTable.Api.registerPlural('rows().remove()', 'row().remove()', function (bindOneWay) {
    var that = this;
    var internal = $.fn.DataTable.ext.internal;
    return this.iterator('row', function (settings, row, thatIdx) {
        if ($.isFunction(settings.oInit.removingRow))
            settings.oInit.removingRow(settings, row, thatIdx);

        if (bindOneWay == null && settings.oInit.data != null) {
            var rowData = settings.aoData[row]._aData;
            settings._rowsRemoved = settings._rowsRemoved || [];
            settings._rowsRemoved.push(rowData);
            settings.oInit.data.splice(row, 1);
        }

        var data = settings.aoData;
        data.splice(row, 1);

        for (var i = 0, ien = data.length; i < ien; i++) {
            if (data[i].nTr !== null) {
                data[i].nTr._DT_RowIndex = i;
            }
        }

        // Remove the target row from the search array
        var displayIndex = $.inArray(row, settings.aiDisplay);

        // Delete from the display arrays
        internal._fnDeleteIndex(settings.aiDisplayMaster, row);
        internal._fnDeleteIndex(settings.aiDisplay, row);
        internal._fnDeleteIndex(that[thatIdx], row, false); // maintain local indexes

        // Check for an 'overflow' they case for displaying the table
        internal._fnLengthOverflow(settings);

        if ($.isFunction(settings.oInit.removedRow))
            settings.oInit.removedRow(settings, row, thatIdx);
    });
});
$.fn.DataTable.Api.register('rows.add()', function (rows, bindOneWay) {
    var internal = $.fn.DataTable.ext.internal;
    var newRows = this.iterator('table', function (settings) {
        var row, i, ien;
        var out = [];

        for (i = 0, ien = rows.length; i < ien; i++) {
            row = rows[i];

            if (row.nodeName && row.nodeName.toUpperCase() === 'TR') {
                out.push(internal._fnAddTr(settings, row)[0]);
            } else {
                out.push(internal._fnAddData(settings, row));
            }

            if (bindOneWay == null && settings.oInit.data != null) {
                settings._rowsInserted = settings._rowsInserted || [];
                settings._rowsInserted.push(row);
                settings.oInit.data.push(row);
            }
        }
        return out;
    });

    // Return an Api.rows() extended instance, so rows().nodes() etc can be used
    var modRows = this.rows(-1);
    modRows.pop();
    modRows.push.apply(modRows, newRows.toArray());

    return modRows;
});
$.fn.DataTable.Api.register('row.add()', function (row, bindOneWay) {
    var internal = $.fn.DataTable.ext.internal;

    // Allow a jQuery object to be passed in - only a single row is added from
    // it though - the first element in the set
    if (row instanceof $ && row.length) {
        row = row[0];
    }

    var rows = this.iterator('table', function (settings) {
        if (bindOneWay == null && settings.oInit.data != null) {
            settings._rowsInserted = settings._rowsInserted || [];
            settings._rowsInserted.push(row);
            settings.oInit.data.push(row);
        }
        if (row.nodeName && row.nodeName.toUpperCase() === 'TR') {
            return internal._fnAddTr(settings, row)[0];
        }
        return internal._fnAddData(settings, row);
    });

    // Return an Api.rows() extended instance, with the newly added row selected
    return this.row(rows[0]);
});

//Getting cell by node or by index
$.fn.DataTable.Api.register('row().cell()', function (column) {
    var rIdx = this.index();
    var cIdx;
    var ctx = this.settings()[0];
    var cells = ctx.aoData[rIdx].anCells;
    if ($.isNumeric(column)) {
        cIdx = parseInt(column);
        if (cIdx >= ctx.aoColumns.length)
            return null;
        return this.table().cell(rIdx, cIdx);
    }

    if (cells == null)
        return null;
    cIdx = cells.indexOf(column); //treat column as Element
    if (cIdx < 0)
        return null;
    return this.table().cell(rIdx, cIdx);
});
$.fn.DataTable.Api.register('gotoLastPage()', function () {
    var info = this.page.info();
    var lastPageIdx = Math.ceil(info.recordsTotal / info.length) - 1;
    if (info.page < lastPageIdx)
        this.page(lastPageIdx);
});

//#endregion
angular.module("dt", []).constant("dtSettings", {
    defaultDtOptions: {},
    dtCellCompilingActions: [],
    dtFillWatchedPropertiesActions: [],
    dtTableCreatingActions: [],
    dtTableCreatedActions: [],
    dtColumnParsingActions: []
}).directive("dtTable", [
    "$compile", "$parse", "$rootScope", "dtSettings",
    function ($compile, $parse, $rootScope, dtSettings) {
        return {
            // Restricted it to A only. Thead elements are only valid inside table tag
            restrict: 'A',
            priority: 10000,
            scope: true,
            link: function (scope, element, attrs) {
                var $element = angular.element(element);
                var dataTable = null;
                var oSettings = null;
                var rowDataPath = attrs.dtRowDataPath || "data";
                var defaultOptions = dtSettings.defaultDtOptions || {};
                var inputOptions = !!attrs.dtOptions ? scope.$eval(attrs.dtOptions) : {};
                var dtOptionsAttrData = !!inputOptions.data ? inputOptions.data : null;
                var dtDataAttrData = !!attrs.dtData ? scope.$eval(attrs.dtData) : null;
                inputOptions.data = null; //we dont want to deep clone data

                //Merge options
                var options = $.extend(true, {}, defaultOptions, inputOptions, { rowDataPath: rowDataPath });

                //Copy the array reference to datatables init options (dt-data has higher priority than data prop from dt-options)
                if (!!dtDataAttrData)
                    options.data = dtDataAttrData;
                else if (!!dtOptionsAttrData)
                    options.data = dtOptionsAttrData;

                if (!!attrs.dtWidth)
                    $element.css('width', attrs.dtWidth);

                var explicitColumns = [];
                angular.forEach(element.find('th'), function (node) {
                    var elem = angular.element(node);
                    var column = {
                        data: elem.attr('dt-data'),
                        title: elem.text(),
                        name: elem.attr('dt-name'),
                        type: elem.attr('dt-type'),
                        className: elem.attr('dt-class'),
                        orderable: elem.attr('dt-orderable') == null ? true : elem.attr('dt-orderable') == "true",
                        searchable: elem.attr('dt-searchable') == null ? true : elem.attr('dt-searchable') == "true",
                        width: elem.attr('dt-width'),
                        expression: elem.attr('dt-expression'),
                        template: elem.attr('dt-template'),
                        defaultContent: elem.attr('dt-def-content')
                    };

                    angular.forEach(dtSettings.dtColumnParsingActions, function (fn) {
                        if (!angular.isFunction(fn))
                            return;
                        fn(elem, column, explicitColumns, options, $element, scope, attrs, $compile, $rootScope);
                    });

                    explicitColumns.push(column);
                });

                //columns def from DOM (have the highest priority)
                if (explicitColumns.length > 0) {
                    options.columns = explicitColumns;
                }

                var columns = options.columns || options.columnDefs;

                angular.forEach(columns, function (col, idx) {
                    if (col.data == null && col.defaultContent == null)
                        col.defaultContent = ""; //we have to set defaultContent otherwise dt will throw an error

                    //for template we will not support sorting and searching
                    if (col.template != null) {
                        col.orderable = false;
                        col.searchable = false;
                        col.type = "html";
                    }

                    if (!!col.expression) {
                        col.expressionFn = $parse(col.expression);
                    }

                    if (col.render == null) {
                        col.render = function (innerData, sSpecific, oData) {
                            switch (sSpecific) {
                                case "display":
                                    return innerData;
                                case "type":
                                case "filter":
                                case "sort":
                                    var colOpts = columns[idx];
                                    if (!!colOpts.expressionFn) {
                                        var arg = {};
                                        arg[rowDataPath] = oData;
                                        return colOpts.expressionFn(arg);
                                    }
                                    return innerData;
                                default:
                                    throw "Unknown sSpecific: " + sSpecific;
                            }
                        };
                    }
                });

                /*
                var origCreatedCell = options.createdCell;
                options.createdCell = function(node: Node, cellData, rowData, iRow: number, celIdx: number) {
                var api = this.api();
                if (oSettings == null)
                oSettings = api.settings()[0];
                
                };*/
                //Wrap custom createdRow
                var origCreatedRow = options.createdRow;
                options.createdRow = function (node, rowData, dataIndex) {
                    var api = this.api();
                    if (oSettings == null)
                        oSettings = api.settings()[0];
                    var oData = oSettings.aoData[dataIndex];
                    var elem = angular.element(node);
                    var rowScope = scope.$new();
                    node._DT_Scope = rowScope;
                    rowScope[rowDataPath] = rowData;

                    //Define property for index so we dont have to take care of modifying it each time a row is deleted
                    Object.defineProperty(rowScope, "$rowIndex", {
                        get: function () {
                            var idx = api.row(node).index();
                            return angular.isNumber(idx) ? idx : null;
                        }
                    });
                    Object.defineProperty(rowScope, "$firstRow", {
                        get: function () {
                            return this.$rowIndex === 0;
                        }
                    });
                    Object.defineProperty(rowScope, "$lastRow", {
                        get: function () {
                            return this.$rowIndex === (api.page.info().recordsTotal - 1);
                        }
                    });
                    Object.defineProperty(rowScope, "$middleRow", {
                        get: function () {
                            return !(this.$first || this.$last);
                        }
                    });
                    Object.defineProperty(rowScope, "$oddRow", {
                        get: function () {
                            return !(this.$even = (this.$rowIndex & 1) === 0);
                        }
                    });
                    angular.forEach(oData.anCells, function (td, idx) {
                        var $td = angular.element(td);
                        var colOpts = oSettings.aoColumns[idx];

                        //Get column index
                        var cellScope = rowScope.$new();
                        td._DT_Scope = cellScope;
                        cellScope.cellNode = td;

                        Object.defineProperty(cellScope, "$cellIndex", {
                            get: function () {
                                return oSettings.aoColumns.indexOf(colOpts);
                            }
                        });

                        if (colOpts.template != null) {
                            var tpl = $(colOpts.template).clone().removeAttr('ng-non-bindable').show();
                            $td.html(tpl);
                        } else if (colOpts.expression != null && angular.isString(colOpts.expression)) {
                            $td.attr('ng-bind', colOpts.expression);
                        } else if (colOpts.data != null) {
                            $td.attr('ng-bind', rowDataPath + '.' + colOpts.data);
                        } else if (colOpts.defaultContent != "") {
                            $td.html(colOpts.defaultContent);
                        }

                        angular.forEach(dtSettings.dtCellCompilingActions, function (fn) {
                            if (!angular.isFunction(fn))
                                return;
                            fn($td, colOpts, cellScope, rowData, rowDataPath, options, $element, scope);
                        });

                        $compile($td)(cellScope); //We have to bind each td because of detached cells.
                    });
                    $compile(elem)(rowScope);
                    if (angular.isFunction(origCreatedRow))
                        origCreatedRow(node, rowData, dataIndex);

                    var propNames = Object.keys(rowData);
                    angular.forEach(oSettings.aoColumns, function (col) {
                        if (col.mData == null || propNames.indexOf(col.mData) >= 0)
                            return;
                        propNames.push(col.mData);
                    });

                    angular.forEach(dtSettings.dtFillWatchedPropertiesActions, function (fn) {
                        if (!angular.isFunction(fn))
                            return;
                        fn(propNames, rowData, options);
                    });

                    //For serverside processing we dont have to invalidate rows (searching/ordering is done by server)
                    if (options.serverSide != true) {
                        angular.forEach(propNames, function (propName) {
                            //If row data is changed we have to invalidate dt row
                            rowScope.$watch(rowDataPath + '.' + propName, function () {
                                api.row(node).invalidate();
                            }, false);
                        });
                    }
                };

                //Wrap custom drawCallback
                var origDrawCallback = options.drawCallback;
                options.drawCallback = function (settings) {
                    if (settings.bInitialised === true && !scope.$$phase)
                        scope.$digest();
                    if (angular.isFunction(origDrawCallback))
                        origDrawCallback(settings);
                };

                angular.forEach(dtSettings.dtTableCreatingActions, function (fn) {
                    if (!angular.isFunction(fn))
                        return;
                    fn($element, options, scope, attrs, $compile, $rootScope);
                });

                // Initialize datatables
                dataTable = $element.DataTable(options);
                oSettings = dataTable.settings()[0];
                oSettings._rowsInserted = oSettings._rowsInserted || [];
                oSettings._rowsRemoved = oSettings._rowsRemoved || [];
                oSettings.oInit.data = oSettings.oInit.aoData = options.data; //set init data to be the same as binding collection

                //Copy the custom column parameters to the aoColumns
                angular.forEach(oSettings.aoColumns, function (oCol, idx) {
                    var origIdx = oCol._ColReorder_iOrigCol;
                    origIdx = origIdx == null ? idx : origIdx;
                    var col = columns[origIdx];
                    angular.forEach(col, function (val, key) {
                        if (!!oCol[key] || val === undefined)
                            return;
                        oCol[key] = val;
                    });
                });

                if (!!attrs.dtTable)
                    scope.$parent[attrs.dtTable] = dataTable;

                angular.forEach(dtSettings.dtTableCreatedActions, function (fn) {
                    if (!angular.isFunction(fn))
                        return;
                    fn(dataTable, $element, options, scope, attrs, $compile, $rootScope);
                });

                if (!attrs.dtData)
                    return;

                var collPath = !!attrs.dtData ? attrs.dtData : (!!inputOptions.data ? attrs.dtOptions + '.data' : null);
                if (collPath == null)
                    return;

                scope.$watchCollection(collPath, function (newValue, oldValue, collScope) {
                    if (!newValue)
                        return;
                    var idx;
                    var rIdx;
                    var rowsAdded = false;
                    var rowsRemoved = false;
                    var added = [];
                    var removed = [];
                    if (oldValue == null || newValue.length > oldValue.length) {
                        //Find added items
                        angular.forEach(newValue, function (val) {
                            if (oldValue == null || -1 === oldValue.indexOf(val))
                                added.push(val);
                        });
                    } else if (newValue.length < oldValue.length) {
                        //Find removed items
                        angular.forEach(oldValue, function (val, key) {
                            idx = newValue.indexOf(val);
                            if (-1 === idx)
                                removed.push({ index: key, value: val });
                        });
                    }

                    //Handle added rows
                    if (added.length > 0) {
                        rowsAdded = true;

                        //Do not add rows that were already been added (by datatables api)
                        idx = 0;
                        while (idx < added.length) {
                            rIdx = oSettings._rowsInserted.indexOf(added[idx]);
                            if (rIdx < 0) {
                                idx++;
                                continue;
                            }
                            added.splice(idx, 1);
                            oSettings._rowsInserted.splice(rIdx, 1);
                        }
                        dataTable.rows.add(added, true);
                    }

                    //Handle removed rows
                    if (removed.length > 0) {
                        rowsRemoved = true;

                        //Do not remove rows that were already been removed (by datatables api)
                        idx = 0;
                        while (idx < removed.length) {
                            rIdx = oSettings._rowsRemoved.indexOf(removed[idx].value);
                            if (rIdx < 0) {
                                idx++;
                                continue;
                            }
                            removed.splice(idx, 1);
                            oSettings._rowsRemoved.splice(rIdx, 1);
                        }

                        //Remove remained rows
                        angular.forEach(removed, function (item) {
                            var row = dataTable.row(item.index);
                            if (row.node() != null) {
                                angular.element(row.node()).scope().$destroy();
                            }
                            row.remove(true);
                        });
                    }

                    if (rowsRemoved || rowsAdded) {
                        if (rowsAdded)
                            dataTable.gotoLastPage(); //We only need to change page when a new item is added and will be shown on an new page
                        dataTable.draw(false);
                    }
                });
            }
        };
    }
]);
//# sourceMappingURL=angular.dataTables.js.map
