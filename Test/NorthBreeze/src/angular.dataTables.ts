///<reference path='../typings/jquery/jquery.d.ts' />
///<reference path='../typings/jquery.dataTables/jquery.dataTables.d.ts' />
///<reference path='../typings/angularjs/angular.d.ts' />
///<reference path='../typings/breeze/breeze.d.ts' />
((window, document, undefined) => {
    'use strict';

    //#region Angular - copied from angular source with minor modification

    var uid = ['0', '0', '0'];

    /**
     * A consistent way of creating unique IDs in angular. The ID is a sequence of alpha numeric
     * characters such as '012ABC'. The reason why we are not using simply a number counter is that
     * the number string gets longer over time, and it can also overflow, where as the nextId
     * will grow much slower, it is a string, and it will never overflow.
     *
     * @returns {string} an unique alpha-numeric string
     */
    function nextUid() {
        var index = uid.length;
        var digit;

        while (index) {
            index--;
            digit = uid[index].charCodeAt(0);
            if (digit == 57 /*'9'*/) {
                uid[index] = 'A';
                return uid.join('');
            }
            if (digit == 90 /*'Z'*/) {
                uid[index] = '0';
            } else {
                uid[index] = String.fromCharCode(digit + 1);
                return uid.join('');
            }
        }
        uid.unshift('0');
        return uid.join('');
    }

    /**
     * Computes a hash of an 'obj'. Modified property from $$hashKey to $$dtHash to avoid collisions
     * Hash of a:
     *  string is string
     *  number is number as string
     *  object is either result of calling $$hash function on the object or uniquely generated id,
     *         that is also assigned to the $$hash property of the object.
     *
     * @param obj
     * @returns {string} hash string such that the same input will have the same hash string.
     *         The resulting string key is in 'type:hashKey' format.
     */
    function hashKey(obj) {
        var objType = typeof obj,
            key;

        if (objType == 'object' && obj !== null) {
            if (typeof (key = obj.$$dtHash) == 'function') {
                // must invoke on object to keep the right this
                key = obj.$$dtHash();
            } else if (key === undefined) {
                key = obj.$$dtHash = nextUid();
            }
        } else {
            key = obj;
        }

        return objType + ':' + key;
    };

    //#endregion

    //#region DataTables Extensions
    //We have to update the original collection if datatables api is used to manipulate dt collection 
    // in additon we fire an event before remove/add so that 
    $.fn.DataTable.Api.registerPlural('rows().remove()', 'row().remove()', function(bindOneWay) {
        var that = this;
        var internal = $.fn.DataTable.ext.internal;
        return this.iterator('row', function(settings, row, thatIdx) {
            if ($.isFunction(settings.oInit.removingRow))
                settings.oInit.removingRow(settings, row, thatIdx);

            if (bindOneWay == null && settings.oInit.data != null) { //if no argument is pass update original collection
                var rowData = settings.aoData[row]._aData;
                var hash = hashKey(rowData);
                settings._rowsRemoved = settings._rowsRemoved || {};
                settings._rowsRemoved[hash] = rowData;
                settings.oInit.data.splice(row, 1);
            }

            var data = settings.aoData;
            data.splice(row, 1);

            // Update the _DT_RowIndex parameter on all rows in the table
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
    $.fn.DataTable.Api.register('rows.add()', function(rows, bindOneWay) {
        var internal = $.fn.DataTable.ext.internal;
        var newRows = this.iterator('table', function(settings) {
            var row, i, ien;
            var out = [];

            for (i = 0, ien = rows.length; i < ien; i++) {
                row = rows[i];

                if (row.nodeName && row.nodeName.toUpperCase() === 'TR') {
                    out.push(internal._fnAddTr(settings, row)[0]);
                } else {
                    out.push(internal._fnAddData(settings, row));
                }

                if (bindOneWay == null && settings.oInit.data != null) { //push to model collection and memorize it
                    settings._rowsInserted = settings._rowsInserted || {};
                    var hash = hashKey(row);
                    settings._rowsInserted[hash] = row;
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
    $.fn.DataTable.Api.register('row.add()', function(row, bindOneWay) {
        var internal = $.fn.DataTable.ext.internal;
        // Allow a jQuery object to be passed in - only a single row is added from
        // it though - the first element in the set
        if (row instanceof $ && row.length) {
            row = row[0];
        }

        var rows = this.iterator('table', function(settings) {
            if (bindOneWay == null && settings.oInit.data != null) { //push to model collection and memorize it
                settings._rowsInserted = settings._rowsInserted || {};
                var hash = hashKey(row);
                settings._rowsInserted[hash] = row;
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
    $.fn.DataTable.Api.register('gotoLastPage()', function () {
        var oScroller = this.settings()[0].oScroller;
        var info: any = this.page.info();
        if (oScroller != null) {
            oScroller.fnScrollToRow(info.recordsTotal - 1);
        } else {
            var lastPageIdx = Math.ceil(info.recordsTotal / info.length) - 1;
        if (info.page < lastPageIdx)
            this.page(lastPageIdx);
        }
    });
    $.fn.DataTable.Api.register('digestDisplayedPage()', function() {
        //Digest only rendered rows
        $("#" + this.table().node().id + " > tbody > tr").each(function() {
            var rowScope = angular.element(this).scope();
            rowScope.$digest();
        });
    });
    //#endregion

    angular.module("dt", [])
        .constant("dtSettings", {
            defaultDtOptions: {},
            dtCellCompilingActions: [],
            dtFillWatchedPropertiesActions: [],
            dtTableCreatingActions: [],
            dtTableCreatedActions: [],
            dtColumnParsingActions: [],
            dtRowsAddedActions: [],
            dtRowsRemovedActions: []
        })
        .directive("dtTable", [
            "$compile", "$parse", "$rootScope", "dtSettings",
            ($compile, $parse, $rootScope, dtSettings) => {
                return {
                    restrict: 'A', // Restricted it to A only. Thead elements are only valid inside table tag
                    priority: 1000,
                    scope: true, //whitin new scope
                    link: (scope, element, attrs) => { //postLink
                        var index, block, rowData, length, hash, oData;
                        var $element = angular.element(element);
                        var dataTable: any = null;
                        var oSettings = null;
                        var watchedProperties = [];
                        var watchedPropertiesFilled = false;
                        var dtRowInvalidate = attrs.dtRowInvalidate === "rendered" ? "rendered" : "none"; ///default do not watch rows
                        var dtDrawDigest = !attrs.dtDrawDigest ? true : (attrs.dtDrawDigest == "true");
                        var debug = attrs.dtDebug == "true";
                        var noRowBinding = attrs.dtNoRowBinding == "true";
                        var rowDataPath = attrs.dtRowDataPath || "data";
                        var defaultOptions: any = dtSettings.defaultDtOptions || {};
                        var inputOptions = !!attrs.dtOptions ? scope.$eval(attrs.dtOptions) : {};
                        var dtOptionsAttrData = !!inputOptions.data ? inputOptions.data : null;
                        var dtDataAttrData = !!attrs.dtData ? scope.$eval(attrs.dtData) : null;
                        inputOptions.data = null; //we dont want to deep clone data

                        // Store a list of elements from previous run. This is a hash where key is the item from the
                        // iterator, and the value is objects with following properties.
                        //   - scope: bound scope
                        //   - id: hash of the item.
                        //   - index: position
                        var lastBlockMap = {};

                        //Merge options
                        var options: any = $.extend(true, {}, defaultOptions, inputOptions, { rowDataPath: rowDataPath }); //deep clone with jQuery as angular does not support this feature
                        //Copy the array reference to datatables init options (dt-data has higher priority than data prop from dt-options)
                        if (!!dtDataAttrData)
                            options.data = dtDataAttrData;
                        else if (!!dtOptionsAttrData)
                            options.data = dtOptionsAttrData;
                        var collPath = !!attrs.dtData ? attrs.dtData : (!!inputOptions.data ? attrs.dtOptions + '.data' : null);
                        if (!!attrs.dtWidth)
                            $element.css('width', attrs.dtWidth);

                        var explicitColumns = [];
                        angular.forEach(element.find('th'), (node) => {
                            var elem = angular.element(node);
                            var column: any = {
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

                            angular.forEach(dtSettings.dtColumnParsingActions, fn => {
                                if (!angular.isFunction(fn)) return;
                                fn(elem, column, explicitColumns, options, $element, scope, attrs, $compile, $rootScope);
                            });

                            explicitColumns.push(column);
                        });
                        //columns def from DOM (have the highest priority)
                        if (explicitColumns.length > 0) {
                            options.columns = explicitColumns;
                        }

                        //#region Private functions

                        var fillWatchedProperties = (row) => {
                            if (watchedPropertiesFilled) return; //do it only once
                            //watchedProperties = Object.keys(row);
                            angular.forEach(oSettings.aoColumns, col => { //watch only properties that are binded to the table
                                if (angular.isNumber(col.mData) || !col.mData || watchedProperties.indexOf(col.mData) >= 0) return;
                                watchedProperties.push(col.mData);
                            });

                            angular.forEach(dtSettings.dtFillWatchedPropertiesActions, fn => {
                                if (!angular.isFunction(fn)) return;
                                fn(watchedProperties, row, options);
                            });
                            watchedPropertiesFilled = true;
                        };

                        var createRowWatcher = (rowScope, node) => {
                            var exprWatch = "[" + rowDataPath + ".";
                            exprWatch += watchedProperties.join(", " + rowDataPath + '.') + "]";
                            rowScope.$watchCollection(exprWatch, (newValue: any, oldValue: any) => {
                                if (debug) console.time('$watchCollection row ' + node._DT_RowIndex + ' - ' + exprWatch);
                                if (newValue !== oldValue)
                                    dataTable.row(node).invalidate();
                                if (debug) console.timeEnd('$watchCollection row ' + node._DT_RowIndex + ' - ' + exprWatch);
                            });

                        };

                        //#endregion

                        var columns = options.columns || options.columnDefs;

                        angular.forEach(columns, (col, idx) => {
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
                                col.render = (innerData, sSpecific, rData, meta) => {
                                    switch (sSpecific) {
                                    case "display": //TODO: we have to evaluate even on display mode because of fixedcolumns
                                        return innerData; //we will handle what will be displayed in rowCreatedCallback
                                    case "type":
                                    case "filter":
                                    case "sort":
                                        if (innerData != null) return innerData; //we want to have the row data if we have it
                                        var colOpts = columns[idx];
                                        if (!!colOpts.expressionFn) { //support expression for searching and filtering
                                            var arg = {};
                                            arg[rowDataPath] = rData;
                                            return colOpts.expressionFn(arg);
                                        }
                                        return innerData;
                                    default:
                                        throw "Unknown sSpecific: " + sSpecific;
                                    }
                                };
                            }
                        });

                        //#region CreatedRow

                        //Wrap custom createdRow
                        if (!noRowBinding) {
                            var origCreatedRow = options.createdRow;
                            options.createdRow = function(node: any, rData: any[], dataIndex: number) {
                                if (debug) console.time('createdRow' + dataIndex);
                                if (dataTable == null)
                                    dataTable = this.api();
                                if (oSettings == null)
                                    oSettings = dataTable.settings()[0];
                                oData = oSettings.aoData[dataIndex];
                                var elem = angular.element(node);
                                var rowScope = scope.$new();
                                rowScope[rowDataPath] = rData;
                                hash = hashKey(rData);
                                if (!lastBlockMap.hasOwnProperty(hash))
                                    lastBlockMap[hash] = {id: hash, index: dataIndex};
                                lastBlockMap[hash].scope = rowScope;

                                //Define property for index so we dont have to take care of modifying it each time a row is deleted
                                Object.defineProperty(rowScope, "$rowIndex", {
                                    get: () => {
                                        var idx = node._DT_RowIndex; // dataTable.row(node).index();
                                        return angular.isNumber(idx) ? idx : null;
                                    }
                                });
                                Object.defineProperty(rowScope, "$firstRow", {
                                    get: function() {
                                        return this.$rowIndex === 0;
                                    }
                                });
                                Object.defineProperty(rowScope, "$lastRow", {
                                    get: function() {
                                        return this.$rowIndex === (dataTable.page.info().recordsTotal - 1);
                                    }
                                });
                                Object.defineProperty(rowScope, "$middleRow", {
                                    get: function() {
                                        return !(this.$first || this.$last);
                                    }
                                });
                                Object.defineProperty(rowScope, "$oddRow", {
                                    get: function() {
                                        return !(this.$even = (this.$rowIndex & 1) === 0);
                                    }
                                });
                                angular.forEach(oData.anCells, (td, idx) => {
                                    var $td = angular.element(td);
                                    var colOpts = oSettings.aoColumns[idx];
                                    //Get column index
                                    var cellScope = rowScope.$new();
                                    cellScope.cellNode = td;

                                    Object.defineProperty(cellScope, "$cellIndex", {
                                        get: () => {
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

                                    angular.forEach(dtSettings.dtCellCompilingActions, fn => {
                                        if (!angular.isFunction(fn)) return;
                                        fn($td, colOpts, cellScope, rowData, rowDataPath, options, $element, scope);
                                    });

                                    $compile($td)(cellScope); //We have to bind each td because of detached cells.
                                });
                                $compile(elem)(rowScope);
                                if (angular.isFunction(origCreatedRow))
                                    origCreatedRow(node, rowData, dataIndex);

                                //For serverside processing we dont have to invalidate rows (searching/ordering is done by server) 
                                if (options.serverSide != true && dtRowInvalidate === "rendered") {
                                    if (!watchedPropertiesFilled)
                                        fillWatchedProperties(rowData);
                                    createRowWatcher(rowScope, node);
                                }
                                if (debug) console.timeEnd('createdRow' + dataIndex);
                            };
                        }

                        //#endregion

                        //Wrap custom drawCallback
                        if (!noRowBinding) {
                            var origDrawCallback = options.drawCallback;
                            options.drawCallback = function(settings: any) {
                                if (debug) console.time('drawCallback');
                                if (settings.bInitialised === true && !scope.$$phase && dtDrawDigest) {
                                    if (debug) console.time('digestDisplayedPage');
                                    this.api().digestDisplayedPage();
                                    if (debug) console.timeEnd('digestDisplayedPage');
                                }
                                if (angular.isFunction(origDrawCallback))
                                    origDrawCallback(settings);
                                if (debug) console.timeEnd('drawCallback');
                            }
                        }


                        angular.forEach(dtSettings.dtTableCreatingActions, fn => {
                            if (!angular.isFunction(fn)) return;
                            fn($element, options, scope, attrs, $compile, $rootScope);
                        });

                        // Initialize datatables
                        if (debug) console.time('initDataTable');
                        dataTable = $element.DataTable(options);
                        if (debug) console.timeEnd('initDataTable');
                        oSettings = dataTable.settings()[0];
                        oSettings._rowsInserted = oSettings._rowsInserted || {};
                        oSettings._rowsRemoved = oSettings._rowsRemoved || {};
                        oSettings.oInit.data = oSettings.oInit.aoData = options.data; //set init data to be the same as binding collection - this will be fixed in 1.10.1
                        //Copy the custom column parameters to the aoColumns
                        angular.forEach(oSettings.aoColumns, (oCol, idx) => {
                            var origIdx = oCol._ColReorder_iOrigCol; //take care of reordered columns
                            origIdx = origIdx == null ? idx : origIdx;
                            var col = columns[origIdx];
                            angular.forEach(col, (val, key) => {
                                if (oCol[key] !== undefined || val === undefined) return;
                                oCol[key] = val;
                            });
                        });

                        if (!!attrs.dtTable)
                            scope.$parent[attrs.dtTable] = dataTable;

                        angular.forEach(dtSettings.dtTableCreatedActions, fn => {
                            if (!angular.isFunction(fn)) return;
                            fn(dataTable, $element, options, scope, attrs, $compile, $rootScope);
                        });

                        scope.$on('$destroy', () => {
                            if (debug) console.time("Destroying datatables with id: " + element.id);
                            dataTable.destroy();
                            if (debug) console.timeEnd("Destroying datatables with id: " + element.id);
                        });

                        if (!attrs.dtData || !collPath) return;

                        //We have to add the blocks to the lastBlockMap
                        if (angular.isArray(oSettings.aoData)) {
                            for (var i = 0; i < oSettings.aoData.length; i++) {
                                oData = oSettings.aoData[i];
                                hash = hashKey(oData._aData);
                                if (!lastBlockMap.hasOwnProperty(hash)) //Can be created in rowCreated callback
                                    lastBlockMap[hash] = { id: hash, index: i, scope: null };
                            }
                        }

                        scope.$watchCollection(collPath, (newValue: any) => {
                            if (debug) console.time('$watchCollection - ' + collPath);
                            oSettings.oInit.data = oSettings.oInit.aoData = newValue; //update init data
                            if (!newValue) return;
                            var 
                                key,
                                value,
                                nextBlockMap = {},
                                rowOrder = {},
                                rowsAdded = false,
                                rowsRemoved = false,
                                rowsReordered = false,
                                added = [],
                                removed = [];

                            // locate existing items
                            length = newValue.length;
                            for (index = 0; index < length; index++) {
                                key = index;
                                value = newValue[index];
                                hash = hashKey(value);
                                if (lastBlockMap.hasOwnProperty(hash)) {
                                    block = lastBlockMap[hash];
                                    delete lastBlockMap[hash];
                                    block.index = index;
                                    nextBlockMap[hash] = block;
                                } else if (nextBlockMap.hasOwnProperty(hash)) {
                                    // This is a duplicate and we need to throw an error
                                    throw "Duplicates in a repeater are not allowed. Duplicate key: " + hash;
                                } else {
                                    // new never before seen block
                                    block = { id: hash, index: index, scope: null };
                                    nextBlockMap[hash] = block;
                                    if (!oSettings._rowsInserted.hasOwnProperty(hash))
                                        added.push(value);
                                    else {
                                        delete oSettings._rowsInserted[hash];
                                        rowsAdded = true;
                                    }
                                }
                            }

                            // remove existing items
                            for (hash in lastBlockMap) {
                                block = lastBlockMap[hash];
                                if (!oSettings._rowsRemoved.hasOwnProperty(hash))
                                    removed.push(block);
                                else {
                                    delete oSettings._rowsRemoved[hash];
                                    rowsRemoved = true;
                                }
                            }
                            lastBlockMap = nextBlockMap;

                            if (removed.length > 0) {
                                rowsRemoved = true;
                                index = 0;
                                removed.sort( (a, b) => { return b.index - a.index; }); //We have to sort the indexes because we have to delete rows with the bigger indexes first
                                for (index = 0; index < removed.length; index++) {
                                    value = dataTable.row(removed[index].index);
                                    if (value.node() != null && !noRowBinding) { //deferRender
                                        var rScope = angular.element(value.node()).scope();
                                        if (rScope)
                                            rScope.$destroy();
                                    }
                                    value.remove(true);
                                }
                                angular.forEach(dtSettings.dtRowsRemovedActions, fn => {
                                    if (angular.isFunction(fn))
                                        fn.call(dataTable, removed);
                                });
                            }

                            if (added.length > 0) {
                                rowsAdded = true;
                                var rows = dataTable.rows.add(added, true);
                                angular.forEach(dtSettings.dtRowsAddedActions, fn => {
                                    if (angular.isFunction(fn))
                                        fn.call(dataTable, rows);
                                });
                            }

                            length = newValue.length;
                            if (oSettings.aoData.length !== length)
                                throw "Datatables collection has not the same length as model collection (DT: " + oSettings.aoData.length + " Model: " + length + ")";

                            //Rows swap searching
                            for (index = 0; index < length; index++) {
                                value = newValue[index];
                                rowData = oSettings.aoData[index]._aData;
                                if (value === rowData) continue;
                                var mId = hashKey(value);
                                var dtId = hashKey(rowData);
                                if (rowOrder.hasOwnProperty(mId))
                                    rowOrder[mId].mIndex = index;
                                else if (!rowOrder.hasOwnProperty(dtId))
                                    rowOrder[mId] = { mIndex: index };
                                else
                                    rowOrder[dtId].dtIndex = index;
                            }

                            var rowOrderKeys = Object.keys(rowOrder);
                            if (rowOrderKeys.length > 0) { //We have to reorder datatables rows
                                rowsReordered = true;
                                for (index = 0; index < rowOrderKeys.length; index++) {
                                    value = rowOrder[rowOrderKeys[index]];
                                    var tmp = oSettings.aoData[value.dtIndex];
                                    oSettings.aoData[value.dtIndex] = oSettings.aoData[value.mIndex];
                                    oSettings.aoData[value.mIndex] = tmp;
                                    //Fix row indexes
                                    if (oSettings.aoData[value.dtIndex].nTr)
                                        oSettings.aoData[value.dtIndex].nTr._DT_RowIndex = value.dtIndex;
                                    if (oSettings.aoData[value.mIndex].nTr)
                                        oSettings.aoData[value.mIndex].nTr._DT_RowIndex = value.mIndex;
                                }
                            }

                            if (rowsRemoved || rowsAdded || rowsReordered) {
                                if (rowsAdded) //when adding we want the new items to be displayed
                                    dataTable.gotoLastPage(); //We only need to change page when a new item is added and will be shown on an new page
                                dataTable.draw(false);
                            }
                            if (debug) console.timeEnd('$watchCollection - ' + collPath);
                        });
                    }
                }
            }
        ]);

})(window, document, undefined);