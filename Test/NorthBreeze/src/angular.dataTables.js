///<reference path='../typings/jquery/jquery.d.ts' />
///<reference path='../typings/jquery.dataTables/jquery.dataTables.d.ts' />
///<reference path='../typings/angularjs/angular.d.ts' />
///<reference path='../typings/breeze/breeze.d.ts' />
var dt;
(function (dt) {
    var Cell = (function () {
        function Cell(dtRow, dtColumn) {
            this.dt = {
                api: null,
                settings: null
            };
            this.dtRow = dtRow;
            this.dt = dtRow.dt;
            this.dtColumn = dtColumn;
        }
        Cell.prototype.link = function (scope, element) {
            this.$element = angular.element(element);
            var colOpts = this.dtColumn;
            var dtColumns = this.dt.settings.aoColumns;
            var rowDataPath = scope.$$dtTable.settings.rowDataPath;
            this.$scope = scope;
            scope.$$dtCell = this;

            Object.defineProperty(scope, "$cellIndex", {
                get: function () {
                    return dtColumns.indexOf(colOpts);
                }
            });
            if (colOpts.templateHtml != null) {
                this.$element.html(colOpts.templateHtml);
            } else if (colOpts.expression != null && angular.isString(colOpts.expression)) {
                this.$element.attr('ng-bind', colOpts.expression);
            } else if (colOpts.data != null) {
                this.$element.attr('ng-bind', rowDataPath + '.' + colOpts.data);
            } else if (colOpts.defaultContent != "") {
                this.$element.html(colOpts.defaultContent);
            }

            scope.$on('$destroy', this.destroy.bind(this));
        };

        Cell.prototype.destroy = function () {
            this.dtRow = null;
            this.dt = null;
            this.dtRow = null;
            delete this.$scope.$$dtCell;
            delete this.$scope.$cellIndex;
            this.$scope = null;
        };
        return Cell;
    })();
    dt.Cell = Cell;

    var Row = (function () {
        function Row(dtTable, data, index, $compile) {
            this.dt = {
                api: null,
                settings: null
            };
            this.dtTable = dtTable;
            this.dt = dtTable.dt;
            this.data = data;
            this.index = index;
            this.$compile = $compile;
        }
        Row.prototype.link = function (scope, element) {
            var $element = angular.element(element);
            var rowDataPath = this.dtTable.settings.rowDataPath;
            var data = this.data;
            var $compile = this.$compile;
            var i;
            var dtSettings = this.dt.settings;
            this.$scope = scope;
            scope.$$dtRow = this;
            scope[rowDataPath] = data;
            this.defineScopeProperties(scope, element);

            var dtRowData = this.dt.settings.aoData[this.index];
            var rowCells = dtRowData.anCells;

            for (i = 0; i < rowCells.length; i++) {
                var cell = new Cell(this, dtSettings.aoColumns[i]);
                var cellScope = scope.$new();
                cell.link(cellScope, rowCells[i]);

                //dtSettings.oApi._fnCallbackFire(this, 'cellCompiling', null, [cell]);
                $compile($element)(scope); //We have to bind each td because of detached cells.
            }
            scope.$on('$destroy', this.destroy.bind(this));
        };

        Row.prototype.destroy = function () {
            this.dtTable = null;
            this.dt = null;
            this.data = null;
            this.$compile = null;
            delete this.$scope.$$dtRow;
            delete this.$scope.$rowIndex;
            delete this.$scope.$firstRow;
            delete this.$scope.$lastRow;
            delete this.$scope.$middleRow;
            delete this.$scope.$oddRow;
            this.$scope = null;
        };

        Row.prototype.defineScopeProperties = function (scope, element) {
            var api = this.dt.api;

            //Define property for index so we dont have to take care of modifying it each time a row is deleted
            Object.defineProperty(scope, "$rowIndex", {
                get: function () {
                    var idx = element._DT_RowIndex;
                    return angular.isNumber(idx) ? idx : null;
                }
            });
            Object.defineProperty(scope, "$firstRow", {
                get: function () {
                    return this.$rowIndex === 0;
                }
            });
            Object.defineProperty(scope, "$lastRow", {
                get: function () {
                    return this.$rowIndex === (api.page.info().recordsTotal - 1);
                }
            });
            Object.defineProperty(scope, "$middleRow", {
                get: function () {
                    return !(this.$first || this.$last);
                }
            });
            Object.defineProperty(scope, "$oddRow", {
                get: function () {
                    return !(this.$even = (this.$rowIndex & 1) === 0);
                }
            });
        };
        return Row;
    })();
    dt.Row = Row;

    var Table = (function () {
        function Table($parse, $rootScope, $q, $http, $compile, $templateCache, settings) {
            this.dt = {
                api: null,
                settings: null
            };
            this.lastBlockMap = {};
            this.templatesToLoad = [];
            this.watchedProperties = [];
            this.settings = $.extend(true, {}, Table.defaultSettings, settings);
            this.$parse = $parse;
            this.$rootScope = $rootScope;
            this.$compile = $compile;
            this.$templateCache = $templateCache;
            this.link = $.proxy(this.link, this);
        }
        Table.prototype.link = function (scope, element, attrs) {
            var _this = this;
            this.$element = angular.element(element);
            this.$scope = scope;
            this.$attrs = attrs;
            this.$scope.$$dtTable = this;
            this.mergeDomAttributes(attrs, scope, this.$element);

            // Store a list of elements from previous run. This is a hash where key is the item from the
            // iterator, and the value is objects with following properties.
            //   - scope: bound scope
            //   - id: hash of the item.
            //   - index: position
            this.lastBlockMap = {};

            this.mergeDomColumn();

            this.setupColumns();

            if (this.settings.rowBinding)
                this.setupRowBinding();

            angular.forEach(this.settings.tableCreating, function (fn) {
                if (!angular.isFunction(fn))
                    return;
                fn.call(_this, _this.$element, _this.settings.options, scope, attrs);
            });

            this.loadTemplates(this.initialize.bind(this));
        };

        Table.prototype.loadTemplates = function (onSuccess) {
            var _this = this;
            //load missing templates
            if (this.templatesToLoad.length) {
                var promises = [];
                angular.forEach(this.templatesToLoad, function (obj) {
                    promises.push(_this.$http.get(obj.url, { cache: _this.$templateCache }));
                });
                this.$q.all(promises).then(function () {
                    angular.forEach(_this.templatesToLoad, function (obj) {
                        obj.col.templateHtml = _this.$templateCache(obj.url);
                    });
                    onSuccess();
                }, function (err) {
                    throw err;
                });
            } else
                onSuccess();
        };

        Table.prototype.initialize = function () {
            var _this = this;
            this.templatesToLoad.length = 0; //reset

            //Initialize datatables
            var options = this.settings.options;
            var debug = this.settings.debug;
            var scope = this.$scope;
            var attrs = this.$attrs;
            var rData, hash, hashKey = AngularHelper.hashKey;
            if (debug)
                console.time('initDataTable');
            options.angular = {
                $compile: this.$compile,
                $templateCache: this.$templateCache
            };
            var api = this.dt.api = this.$element.DataTable(options);
            if (debug)
                console.timeEnd('initDataTable');
            var dtSettings = this.dt.settings = api.settings()[0];
            dtSettings._rowsInserted = dtSettings._rowsInserted || {};
            dtSettings._rowsRemoved = dtSettings._rowsRemoved || {};
            dtSettings.oInit.data = dtSettings.oInit.aoData = options.data; //set init data to be the same as binding collection - this will be fixed in 1.10.1

            //Copy the custom column parameters to the aoColumns
            angular.forEach(dtSettings.aoColumns, function (oCol, idx) {
                var origIdx = oCol._ColReorder_iOrigCol;
                origIdx = origIdx == null ? idx : origIdx;
                var col = dtSettings.aoColumns[origIdx];
                angular.forEach(col, function (val, key) {
                    if (oCol[key] !== undefined || val === undefined)
                        return;
                    oCol[key] = val;
                });
            });

            if (attrs.dtTable)
                scope.$parent[attrs.dtTable] = api;

            angular.forEach(dtSettings.dtTableCreatedActions, function (fn) {
                if (!angular.isFunction(fn))
                    return;
                fn(api, _this.$element, options, scope, attrs, _this.$compile);
            });

            //We have to add the blocks to the lastBlockMap
            if (angular.isArray(dtSettings.aoData)) {
                for (var i = 0; i < dtSettings.aoData.length; i++) {
                    rData = dtSettings.aoData[i];
                    hash = hashKey(rData._aData);
                    if (!this.lastBlockMap.hasOwnProperty(hash))
                        this.lastBlockMap[hash] = { id: hash, index: i, scope: null };
                }
            }

            scope.$on('$destroy', this.destroy.bind(this));
            if (this.settings.collectionPath)
                scope.$watchCollection(this.settings.collectionPath, this.onCollectionChange.bind(this));
        };

        Table.prototype.onCollectionChange = function (newValue) {
            var _this = this;
            var debug = this.settings.debug, collPath = this.settings.collectionPath, dtSettings = this.dt.settings, settings = this.settings, api = this.dt.api, hashKey = AngularHelper.hashKey, rowBinding = this.settings.rowBinding, index, hash, block, rowData;

            if (debug)
                console.time('$watchCollection - ' + collPath);
            dtSettings.oInit.data = dtSettings.oInit.aoData = newValue; //update init data
            if (!newValue)
                return;
            var key, value, nextBlockMap = {}, rowOrder = {}, rowsAdded = false, rowsRemoved = false, rowsReordered = false, added = [], removed = [];

            // locate existing items
            length = newValue.length;
            for (index = 0; index < length; index++) {
                key = index;
                value = newValue[index];

                hash = hashKey(value);
                if (this.lastBlockMap.hasOwnProperty(hash)) {
                    block = this.lastBlockMap[hash];
                    delete this.lastBlockMap[hash];
                    block.index = index;
                    nextBlockMap[hash] = block;
                } else if (nextBlockMap.hasOwnProperty(hash)) {
                    throw "Duplicates in a repeater are not allowed. Duplicate key: " + hash;
                } else {
                    // new never before seen block
                    block = { id: hash, index: index, scope: null };
                    nextBlockMap[hash] = block;
                    if (!dtSettings._rowsInserted.hasOwnProperty(hash))
                        added.push(value);
                    else {
                        delete dtSettings._rowsInserted[hash];
                        rowsAdded = true;
                    }
                }
            }

            for (hash in this.lastBlockMap) {
                block = this.lastBlockMap[hash];
                if (!dtSettings._rowsRemoved.hasOwnProperty(hash))
                    removed.push(block);
                else {
                    delete dtSettings._rowsRemoved[hash];
                    rowsRemoved = true;
                }
            }
            this.lastBlockMap = nextBlockMap;

            if (removed.length > 0) {
                rowsRemoved = true;
                index = 0;
                removed.sort(function (a, b) {
                    return b.index - a.index;
                }); //We have to sort the indexes because we have to delete rows with the bigger indexes first
                for (index = 0; index < removed.length; index++) {
                    value = api.row(removed[index].index);
                    if (value.node() != null && rowBinding) {
                        var rScope = angular.element(value.node()).scope();
                        if (rScope)
                            rScope.$destroy();
                    }
                    value.remove(true);
                }
                angular.forEach(settings.rowsRemoved, function (fn) {
                    if (angular.isFunction(fn))
                        fn.call(_this, removed);
                });
            }

            if (added.length > 0) {
                rowsAdded = true;
                var rows = api.rows.add(added, true);
                angular.forEach(settings.rowsAdded, function (fn) {
                    if (angular.isFunction(fn))
                        fn.call(_this, rows);
                });
            }

            length = newValue.length;
            if (dtSettings.aoData.length !== length)
                throw "Datatables collection has not the same length as model collection (DT: " + dtSettings.aoData.length + " Model: " + length + ")";

            for (index = 0; index < length; index++) {
                value = newValue[index];
                rowData = dtSettings.aoData[index]._aData;
                if (value === rowData)
                    continue;
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
            if (rowOrderKeys.length > 0) {
                rowsReordered = true;
                for (index = 0; index < rowOrderKeys.length; index++) {
                    value = rowOrder[rowOrderKeys[index]];
                    var tmp = dtSettings.aoData[value.dtIndex];
                    dtSettings.aoData[value.dtIndex] = dtSettings.aoData[value.mIndex];
                    dtSettings.aoData[value.mIndex] = tmp;

                    //Fix row indexes
                    if (dtSettings.aoData[value.dtIndex].nTr)
                        dtSettings.aoData[value.dtIndex].nTr._DT_RowIndex = value.dtIndex;
                    if (dtSettings.aoData[value.mIndex].nTr)
                        dtSettings.aoData[value.mIndex].nTr._DT_RowIndex = value.mIndex;
                }
            }

            if (rowsRemoved || rowsAdded || rowsReordered) {
                if (rowsAdded)
                    api.gotoLastPage(); //We only need to change page when a new item is added and will be shown on an new page
                api.draw(false);
            }
            if (debug)
                console.timeEnd('$watchCollection - ' + collPath);
        };

        Table.prototype.destroy = function () {
            var id = this.dt.settings.sTableId;
            var debug = this.settings.debug;
            if (debug)
                console.time("Destroying datatables with id: " + id);
            this.dt.api.destroy();
            this.dt = null;
            this.settings = null;
            this.$templateCache = null;
            this.$attrs = null;
            this.$q = null;
            this.$http = null;
            this.$compile = null;
            this.$scope = null;
            this.$element = null;
            this.lastBlockMap = null;
            if (debug)
                console.timeEnd("Destroying datatables with id: " + id);
        };

        Table.prototype.setupRowBinding = function () {
            this.origCreatedRow = this.settings.options.createdRow;
            var that = this;
            this.settings.options.createdRow = function (node, rData, dataIndex) {
                that.onRowCreated(this, node, rData, dataIndex);
            };

            if (!that.settings.digestOnDraw)
                return;
            var origDrawCallback = this.settings.options.drawCallback;
            this.settings.options.drawCallback = function (settings) {
                if (that.settings.debug)
                    console.time('drawCallback');
                if (settings.bInitialised === true) {
                    if (that.settings.debug)
                        console.time('digestDisplayedPage');
                    this.api().digestDisplayedPage();
                    if (that.settings.debug)
                        console.timeEnd('digestDisplayedPage');
                }
                if (angular.isFunction(origDrawCallback))
                    origDrawCallback.apply(this, arguments);
                if (that.settings.debug)
                    console.timeEnd('drawCallback');
            };
        };

        //table attributes have the highest priority
        Table.prototype.mergeDomAttributes = function (attrs, scope, $element) {
            this.settings.invalidateRows = attrs.dtInvalidateRows ? attrs.dtInvalidateRows : this.settings.invalidateRows;
            this.settings.digestOnDraw = attrs.dtDigestOnDraw ? (attrs.dtDigestOnDraw == "true") : this.settings.digestOnDraw;
            this.settings.debug = attrs.dtDebug ? (attrs.dtDebug == "true") : this.settings.debug;
            this.settings.rowBinding = attrs.dtRowBinding ? (attrs.dtRowBinding == "true") : this.settings.rowBinding;
            this.settings.rowDataPath = attrs.dtRowDataPath ? attrs.dtRowDataPath : this.settings.rowDataPath;
            this.settings.options = attrs.dtOptions ? scope.$eval(attrs.dtOptions) : this.settings.options;
            this.settings.options.data = attrs.dtData ? scope.$eval(attrs.dtData) : this.settings.options.data;
            this.settings.collectionPath = attrs.dtData ? attrs.dtData : attrs.dtOptions + '.data';
            if (attrs.dtWidth)
                $element.css('width', attrs.dtWidth);
        };

        Table.prototype.onRowCreated = function (context, node, rData, dataIndex) {
            var debug = this.settings.debug;
            if (this.dt.api == null) {
                this.dt.api = context.api();
                this.dt.settings = this.dt.api.context[0];
            }
            if (debug)
                console.time('createdRow' + dataIndex);
            var elem = angular.element(node);
            var hash = AngularHelper.hashKey(rData);

            var row = new Row(this, rData, dataIndex, this.$compile);
            var rowScope = this.$scope.$new();
            row.link(rowScope, node);

            if (!this.lastBlockMap.hasOwnProperty(hash))
                this.lastBlockMap[hash] = { id: hash, index: dataIndex };
            this.lastBlockMap[hash].scope = rowScope;

            this.$compile(elem)(rowScope);

            //For serverside processing we dont have to invalidate rows (searching/ordering is done by the server)
            if (this.settings.options.serverSide != true && this.settings.invalidateRows === "rendered") {
                if (!this.watchedProperties.length)
                    this.fillWatchedProperties(rData);
                this.createRowWatcher(rowScope, node);
            }

            if (angular.isFunction(this.origCreatedRow))
                this.origCreatedRow.apply(context, arguments);

            if (debug)
                console.timeEnd('createdRow' + dataIndex);
        };

        Table.prototype.mergeDomColumn = function () {
            var table = this.$element;
            var explicitColumns = [];
            angular.forEach(angular.element('thead>tr>th', table), function (node) {
                var elem = angular.element(node);
                var column = { title: elem.text() };
                angular.forEach(node.attributes, function (nodeAttr) {
                    if (nodeAttr.name.indexOf("dt-") !== 0)
                        return;
                    var words = nodeAttr.name.substring(3).split('-');
                    var popName = '';
                    angular.forEach(words, function (w) {
                        if (popName.length)
                            popName += w.charAt(0).toUpperCase() + w.slice(1);
                        else
                            popName += w;
                    });
                    column[popName] = elem.attr(nodeAttr.name);
                    if (column[popName] && column[popName].toUpperCase() == 'TRUE')
                        column[popName] = true;
                    else if (column[popName] && column[popName].toUpperCase() == 'FALSE')
                        column[popName] = false;
                });
                explicitColumns.push(column);
            });

            //columns def from DOM (have the highest priority)
            if (explicitColumns.length > 0) {
                this.settings.options.columns = explicitColumns;
            }
        };

        Table.prototype.fillWatchedProperties = function (row) {
            var columns = this.dt.settings.aoColumns;
            for (var i = 0; i < columns.length; i++) {
                var col = columns[i];

                //watch only properties that are binded to the table
                if (angular.isNumber(col.mData) || !col.mData || this.watchedProperties.indexOf(col.mData) >= 0)
                    return;
                this.watchedProperties.push(col.mData);
            }
        };

        Table.prototype.createRowWatcher = function (rowScope, node) {
            var _this = this;
            var rowDataPath = this.settings.rowDataPath;
            var debug = this.settings.debug;
            var exprWatch = "[" + rowDataPath + ".";
            exprWatch += this.watchedProperties.join(", " + rowDataPath + '.') + "]";
            rowScope.$watchCollection(exprWatch, function (newValue, oldValue) {
                if (debug)
                    console.time('$watchCollection row ' + node._DT_RowIndex + ' - ' + exprWatch);
                if (newValue !== oldValue)
                    _this.dt.api.row(node).invalidate();
                if (debug)
                    console.timeEnd('$watchCollection row ' + node._DT_RowIndex + ' - ' + exprWatch);
            });
        };

        Table.prototype.setupColumns = function () {
            var _this = this;
            var columns = this.settings.options.columns;

            angular.forEach(columns, function (col, idx) {
                if (col.data == null && col.defaultContent == null)
                    col.defaultContent = ""; //we have to set defaultContent otherwise dt will throw an error

                //for template we will not support sorting and searching
                if (col.template || col.templateUrl) {
                    col.orderable = false;
                    col.searchable = false;
                    col.type = "html";
                    if (col.template)
                        col.templateHtml = $(col.template).clone().removeAttr('ng-non-bindable').show().html();
                    else {
                        var tmpl = _this.$templateCache.get(col.templateUrl);
                        if (!tmpl)
                            _this.templatesToLoad.push({ col: col, url: col.templateUrl });
                        else
                            col.templateHtml = tmpl;
                    }
                }

                if (!!col.expression) {
                    col.expressionFn = _this.$parse(col.expression);
                }
                if (col.render == null) {
                    col.render = function (innerData, sSpecific, rData, meta) {
                        switch (sSpecific) {
                            case "display":
                                return innerData;
                            case "type":
                            case "filter":
                            case "sort":
                                if (innerData != null)
                                    return innerData;
                                var colOpts = columns[idx];
                                if (!!colOpts.expressionFn) {
                                    var arg = {};
                                    arg[_this.settings.rowDataPath] = rData;
                                    return colOpts.expressionFn(arg);
                                }
                                return innerData;
                            default:
                                throw "Unknown sSpecific: " + sSpecific;
                        }
                    };
                }
            });
        };
        Table.defaultSettings = {
            invalidateRows: 'none',
            digestOnDraw: true,
            debug: false,
            rowBinding: true,
            rowDataPath: 'data',
            options: {},
            collectionPath: null,
            tableCreating: [],
            rowsRemoved: [],
            rowsAdded: []
        };
        return Table;
    })();
    dt.Table = Table;

    var AngularHelper = (function () {
        function AngularHelper() {
        }
        /**
        * A consistent way of creating unique IDs in angular.
        *
        * Using simple numbers allows us to generate 28.6 million unique ids per second for 10 years before
        * we hit number precision issues in JavaScript.
        *
        * Math.pow(2,53) / 60 / 60 / 24 / 365 / 10 = 28.6M
        *
        * @returns {number} an unique alpha-numeric string
        */
        AngularHelper.nextUid = function () {
            return ++AngularHelper.uid;
        };

        /**
        * Computes a hash of an 'obj'.
        * Hash of a:
        *  string is string
        *  number is number as string
        *  object is either result of calling $$dtHash function on the object or uniquely generated id,
        *         that is also assigned to the $$dtHash property of the object.
        *
        * @param obj
        * @returns {string} hash string such that the same input will have the same hash string.
        *         The resulting string key is in 'type:hashKey' format.
        */
        AngularHelper.hashKey = function (obj, nextUidFn) {
            if (typeof nextUidFn === "undefined") { nextUidFn = null; }
            var objType = typeof obj, key;

            if (objType == 'function' || (objType == 'object' && obj !== null)) {
                if (typeof (key = obj.$$dtHash) == 'function') {
                    // must invoke on object to keep the right this
                    key = obj.$$dtHash();
                } else if (key === undefined) {
                    key = obj.$$dtHash = (nextUidFn || AngularHelper.nextUid)();
                }
            } else {
                key = obj;
            }

            return objType + ':' + key;
        };
        AngularHelper.uid = 0;
        return AngularHelper;
    })();
    dt.AngularHelper = AngularHelper;
})(dt || (dt = {}));

(function (window, document, undefined) {
    'use strict';

    //#region DataTables Extensions
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
                var hash = dt.AngularHelper.hashKey(rowData);
                settings._rowsRemoved = settings._rowsRemoved || {};
                settings._rowsRemoved[hash] = rowData;
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
                    settings._rowsInserted = settings._rowsInserted || {};
                    var hash = dt.AngularHelper.hashKey(row);
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
    $.fn.DataTable.Api.register('row.add()', function (row, bindOneWay) {
        var internal = $.fn.DataTable.ext.internal;

        // Allow a jQuery object to be passed in - only a single row is added from
        // it though - the first element in the set
        if (row instanceof $ && row.length) {
            row = row[0];
        }

        var rows = this.iterator('table', function (settings) {
            if (bindOneWay == null && settings.oInit.data != null) {
                settings._rowsInserted = settings._rowsInserted || {};
                var hash = dt.AngularHelper.hashKey(row);
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
        var info = this.page.info();
        if (oScroller != null) {
            oScroller.fnScrollToRow(info.recordsTotal - 1);
        } else {
            var lastPageIdx = Math.ceil(info.recordsTotal / info.length) - 1;
            if (info.page < lastPageIdx)
                this.page(lastPageIdx);
        }
    });
    $.fn.DataTable.Api.register('digestDisplayedPage()', function () {
        //Digest only rendered rows
        $("#" + this.table().node().id + " > tbody > tr").each(function () {
            var rowScope = angular.element(this).scope();
            if (!rowScope.$$phase)
                rowScope.$digest();
        });
    });

    //#endregion
    $.fn.DataTable.models.oSettings.cellCompiling = [];

    angular.module("dt", []).constant("dtSettings", {
        defaultDtOptions: {},
        dtFillWatchedPropertiesActions: [],
        dtTableCreatingActions: [],
        dtTableCreatedActions: [],
        dtColumnParsingActions: [],
        dtRowsAddedActions: [],
        dtRowsRemovedActions: []
    }).directive("dtTable", [
        "$compile", "$parse", "$q", "$http", "$rootScope", "$templateCache", "dtSettings",
        function ($compile, $parse, $q, $http, $rootScope, $templateCache, dtSettings) {
            return {
                restrict: 'A',
                priority: 1000,
                scope: true,
                link: function (scope, element, attrs) {
                    var table = new dt.Table($parse, $rootScope, $q, $http, $compile, $templateCache, {});
                    table.link(scope, element, attrs);
                }
            };
            //return {
            //    restrict: 'A', // Restricted it to A only. Thead elements are only valid inside table tag
            //    priority: 1000,
            //    scope: true, //whitin new scope
            //    link: (scope, element, attrs) => { //postLink
            //        var index, block, rowData, length, hash, oData;
            //        var $element = angular.element(element);
            //        var dataTable: any = null;
            //        var oSettings = null;
            //        var watchedProperties = [];
            //        var watchedPropertiesFilled = false;
            //        var dtRowInvalidate = attrs.dtRowInvalidate === "rendered" ? "rendered" : "none"; ///default do not watch rows
            //        var dtDrawDigest = !attrs.dtDrawDigest ? true : (attrs.dtDrawDigest == "true");
            //        var debug = attrs.dtDebug == "true";
            //        var noRowBinding = attrs.dtNoRowBinding == "true";
            //        var rowDataPath = attrs.dtRowDataPath || "data";
            //        var defaultOptions: any = dtSettings.defaultDtOptions || {};
            //        var inputOptions = !!attrs.dtOptions ? scope.$eval(attrs.dtOptions) : {};
            //        var dtOptionsAttrData = !!inputOptions.data ? inputOptions.data : null;
            //        var dtDataAttrData = !!attrs.dtData ? scope.$eval(attrs.dtData) : null;
            //        inputOptions.data = null; //we dont want to deep clone data
            //        // Store a list of elements from previous run. This is a hash where key is the item from the
            //        // iterator, and the value is objects with following properties.
            //        //   - scope: bound scope
            //        //   - id: hash of the item.
            //        //   - index: position
            //        var lastBlockMap = {};
            //        //Merge options
            //        var options: any = $.extend(true, {}, defaultOptions, inputOptions, { rowDataPath: rowDataPath }); //deep clone with jQuery as angular does not support this feature
            //        //Copy the array reference to datatables init options (dt-data has higher priority than data prop from dt-options)
            //        if (!!dtDataAttrData)
            //            options.data = dtDataAttrData;
            //        else if (!!dtOptionsAttrData)
            //            options.data = dtOptionsAttrData;
            //        var collPath = !!attrs.dtData ? attrs.dtData : (!!inputOptions.data ? attrs.dtOptions + '.data' : null);
            //        if (!!attrs.dtWidth)
            //            $element.css('width', attrs.dtWidth);
            //        var explicitColumns = [];
            //        angular.forEach(angular.element('thead>tr>th', element), (node) => {
            //            var elem = angular.element(node);
            //            var column = { title: elem.text() };
            //            angular.forEach(node.attributes, nodeAttr => {
            //                if (nodeAttr.name.indexOf("dt-") !== 0) return;
            //                var words = nodeAttr.name.substring(3).split('-');
            //                var popName = '';
            //                angular.forEach(words, (w) => {
            //                    if (popName.length)
            //                        popName += w.charAt(0).toUpperCase() + w.slice(1);
            //                    else
            //                        popName += w;
            //                });
            //                column[popName] = elem.attr(nodeAttr.name);
            //                if (column[popName] && column[popName].toUpperCase() == 'TRUE')
            //                    column[popName] = true;
            //                else if (column[popName] && column[popName].toUpperCase() == 'FALSE')
            //                    column[popName] = false;
            //            });
            //            //TODO: Use angular event sistem
            //            angular.forEach(dtSettings.dtColumnParsingActions, fn => {
            //                if (!angular.isFunction(fn)) return;
            //                fn(elem, column, explicitColumns, options, $element, scope, attrs, $compile, $rootScope);
            //            });
            //            explicitColumns.push(column);
            //        });
            //        //columns def from DOM (have the highest priority)
            //        if (explicitColumns.length > 0) {
            //            options.columns = explicitColumns;
            //        }
            //        //#region Private functions
            //        var fillWatchedProperties = (row) => {
            //            if (watchedPropertiesFilled) return; //do it only once
            //            //watchedProperties = Object.keys(row);
            //            angular.forEach(oSettings.aoColumns, col => { //watch only properties that are binded to the table
            //                if (angular.isNumber(col.mData) || !col.mData || watchedProperties.indexOf(col.mData) >= 0) return;
            //                watchedProperties.push(col.mData);
            //            });
            //            angular.forEach(dtSettings.dtFillWatchedPropertiesActions, fn => {
            //                if (!angular.isFunction(fn)) return;
            //                fn(watchedProperties, row, options);
            //            });
            //            watchedPropertiesFilled = true;
            //        };
            //        var createRowWatcher = (rowScope, node) => {
            //            var exprWatch = "[" + rowDataPath + ".";
            //            exprWatch += watchedProperties.join(", " + rowDataPath + '.') + "]";
            //            rowScope.$watchCollection(exprWatch, (newValue: any, oldValue: any) => {
            //                if (debug) console.time('$watchCollection row ' + node._DT_RowIndex + ' - ' + exprWatch);
            //                if (newValue !== oldValue)
            //                    dataTable.row(node).invalidate();
            //                if (debug) console.timeEnd('$watchCollection row ' + node._DT_RowIndex + ' - ' + exprWatch);
            //            });
            //        };
            //        //#endregion
            //        var columns = options.columns;
            //        angular.forEach(columns, (col, idx) => {
            //            if (col.data == null && col.defaultContent == null)
            //                col.defaultContent = ""; //we have to set defaultContent otherwise dt will throw an error
            //            //for template we will not support sorting and searching
            //            if (col.template != null) {
            //                col.orderable = false;
            //                col.searchable = false;
            //                col.type = "html";
            //            }
            //            if (!!col.expression) {
            //                col.expressionFn = $parse(col.expression);
            //            }
            //            if (col.render == null) {
            //                col.render = (innerData, sSpecific, rData, meta) => {
            //                    switch (sSpecific) {
            //                    case "display": //TODO: we have to evaluate even on display mode because of fixedcolumns
            //                        return innerData; //we will handle what will be displayed in rowCreatedCallback
            //                    case "type":
            //                    case "filter":
            //                    case "sort":
            //                        if (innerData != null) return innerData; //we want to have the row data if we have it
            //                        var colOpts = columns[idx];
            //                        if (!!colOpts.expressionFn) { //support expression for searching and filtering
            //                            var arg = {};
            //                            arg[rowDataPath] = rData;
            //                            return colOpts.expressionFn(arg);
            //                        }
            //                        return innerData;
            //                    default:
            //                        throw "Unknown sSpecific: " + sSpecific;
            //                    }
            //                };
            //            }
            //        });
            //        //#region CreatedRow
            //        //Wrap custom createdRow
            //        if (!noRowBinding) {
            //            var origCreatedRow = options.createdRow;
            //            options.createdRow = function(node: any, rData: any[], dataIndex: number) {
            //                if (debug) console.time('createdRow' + dataIndex);
            //                if (dataTable == null)
            //                    dataTable = this.api();
            //                if (oSettings == null)
            //                    oSettings = dataTable.settings()[0];
            //                oData = oSettings.aoData[dataIndex];
            //                var elem = angular.element(node);
            //                var rowScope = scope.$new();
            //                rowScope[rowDataPath] = rData;
            //                hash = hashKey(rData);
            //                if (!lastBlockMap.hasOwnProperty(hash))
            //                    lastBlockMap[hash] = {id: hash, index: dataIndex};
            //                lastBlockMap[hash].scope = rowScope;
            //                //Define property for index so we dont have to take care of modifying it each time a row is deleted
            //                Object.defineProperty(rowScope, "$rowIndex", {
            //                    get: () => {
            //                        var idx = node._DT_RowIndex; // dataTable.row(node).index();
            //                        return angular.isNumber(idx) ? idx : null;
            //                    }
            //                });
            //                Object.defineProperty(rowScope, "$firstRow", {
            //                    get: function() {
            //                        return this.$rowIndex === 0;
            //                    }
            //                });
            //                Object.defineProperty(rowScope, "$lastRow", {
            //                    get: function() {
            //                        return this.$rowIndex === (dataTable.page.info().recordsTotal - 1);
            //                    }
            //                });
            //                Object.defineProperty(rowScope, "$middleRow", {
            //                    get: function() {
            //                        return !(this.$first || this.$last);
            //                    }
            //                });
            //                Object.defineProperty(rowScope, "$oddRow", {
            //                    get: function() {
            //                        return !(this.$even = (this.$rowIndex & 1) === 0);
            //                    }
            //                });
            //                angular.forEach(oData.anCells, (td, idx) => {
            //                    var $td = angular.element(td);
            //                    var colOpts = oSettings.aoColumns[idx];
            //                    //Get column index
            //                    var cellScope = rowScope.$new();
            //                    cellScope.cellNode = td;
            //                    Object.defineProperty(cellScope, "$cellIndex", {
            //                        get: () => {
            //                            return oSettings.aoColumns.indexOf(colOpts);
            //                        }
            //                    });
            //                    if (colOpts.template != null) {
            //                        var tpl = $(colOpts.template).clone().removeAttr('ng-non-bindable').show();
            //                        $td.html(tpl);
            //                    } else if (colOpts.expression != null && angular.isString(colOpts.expression)) {
            //                        $td.attr('ng-bind', colOpts.expression);
            //                    } else if (colOpts.data != null) {
            //                        $td.attr('ng-bind', rowDataPath + '.' + colOpts.data);
            //                    } else if (colOpts.defaultContent != "") {
            //                        $td.html(colOpts.defaultContent);
            //                    }
            //                    oSettings.oApi._fnCallbackFire(oSettings, 'cellCompiling', null, [$td, colOpts, cellScope, rowDataPath, dataIndex]);
            //                    $compile($td)(cellScope); //We have to bind each td because of detached cells.
            //                });
            //                $compile(elem)(rowScope);
            //                if (angular.isFunction(origCreatedRow))
            //                    origCreatedRow.apply(toStaticHTML, arguments);
            //                //For serverside processing we dont have to invalidate rows (searching/ordering is done by the server)
            //                if (options.serverSide != true && dtRowInvalidate === "rendered") {
            //                    if (!watchedPropertiesFilled)
            //                        fillWatchedProperties(rowData);
            //                    createRowWatcher(rowScope, node);
            //                }
            //                if (debug) console.timeEnd('createdRow' + dataIndex);
            //            };
            //        }
            //        //#endregion
            //        //Wrap custom drawCallback
            //        if (!noRowBinding) {
            //            var origDrawCallback = options.drawCallback;
            //            options.drawCallback = function(settings: any) {
            //                if (debug) console.time('drawCallback');
            //                if (settings.bInitialised === true && !scope.$$phase && dtDrawDigest) {
            //                    if (debug) console.time('digestDisplayedPage');
            //                    this.api().digestDisplayedPage();
            //                    if (debug) console.timeEnd('digestDisplayedPage');
            //                }
            //                if (angular.isFunction(origDrawCallback))
            //                    origDrawCallback.apply(this, arguments);
            //                if (debug) console.timeEnd('drawCallback');
            //            }
            //        }
            //        angular.forEach(dtSettings.dtTableCreatingActions, fn => {
            //            if (!angular.isFunction(fn)) return;
            //            fn($element, options, scope, attrs, $compile, $rootScope);
            //        });
            //        // Initialize datatables
            //        if (debug) console.time('initDataTable');
            //        options.angular = { //Save some angular stuff in order to use them by plugins
            //            $compile: $compile,
            //            $templateCache: $templateCache
            //        };
            //        dataTable = $element.DataTable(options);
            //        if (debug) console.timeEnd('initDataTable');
            //        oSettings = dataTable.settings()[0];
            //        oSettings._rowsInserted = oSettings._rowsInserted || {};
            //        oSettings._rowsRemoved = oSettings._rowsRemoved || {};
            //        oSettings.oInit.data = oSettings.oInit.aoData = options.data; //set init data to be the same as binding collection - this will be fixed in 1.10.1
            //        //Copy the custom column parameters to the aoColumns
            //        angular.forEach(oSettings.aoColumns, (oCol, idx) => {
            //            var origIdx = oCol._ColReorder_iOrigCol; //take care of reordered columns
            //            origIdx = origIdx == null ? idx : origIdx;
            //            var col = columns[origIdx];
            //            angular.forEach(col, (val, key) => {
            //                if (oCol[key] !== undefined || val === undefined) return;
            //                oCol[key] = val;
            //            });
            //        });
            //        if (!!attrs.dtTable)
            //            scope.$parent[attrs.dtTable] = dataTable;
            //        angular.forEach(dtSettings.dtTableCreatedActions, fn => {
            //            if (!angular.isFunction(fn)) return;
            //            fn(dataTable, $element, options, scope, attrs, $compile, $rootScope);
            //        });
            //        scope.$on('$destroy', () => {
            //            if (debug) console.time("Destroying datatables with id: " + element.id);
            //            dataTable.destroy();
            //            if (debug) console.timeEnd("Destroying datatables with id: " + element.id);
            //        });
            //        if (!attrs.dtData || !collPath) return;
            //        //We have to add the blocks to the lastBlockMap
            //        if (angular.isArray(oSettings.aoData)) {
            //            for (var i = 0; i < oSettings.aoData.length; i++) {
            //                oData = oSettings.aoData[i];
            //                hash = hashKey(oData._aData);
            //                if (!lastBlockMap.hasOwnProperty(hash)) //Can be created in rowCreated callback
            //                    lastBlockMap[hash] = { id: hash, index: i, scope: null };
            //            }
            //        }
            //        scope.$watchCollection(collPath, (newValue: any) => {
            //            if (debug) console.time('$watchCollection - ' + collPath);
            //            oSettings.oInit.data = oSettings.oInit.aoData = newValue; //update init data
            //            if (!newValue) return;
            //            var
            //                key,
            //                value,
            //                nextBlockMap = {},
            //                rowOrder = {},
            //                rowsAdded = false,
            //                rowsRemoved = false,
            //                rowsReordered = false,
            //                added = [],
            //                removed = [];
            //            // locate existing items
            //            length = newValue.length;
            //            for (index = 0; index < length; index++) {
            //                key = index;
            //                value = newValue[index];
            //                hash = hashKey(value);
            //                if (lastBlockMap.hasOwnProperty(hash)) {
            //                    block = lastBlockMap[hash];
            //                    delete lastBlockMap[hash];
            //                    block.index = index;
            //                    nextBlockMap[hash] = block;
            //                } else if (nextBlockMap.hasOwnProperty(hash)) {
            //                    // This is a duplicate and we need to throw an error
            //                    throw "Duplicates in a repeater are not allowed. Duplicate key: " + hash;
            //                } else {
            //                    // new never before seen block
            //                    block = { id: hash, index: index, scope: null };
            //                    nextBlockMap[hash] = block;
            //                    if (!oSettings._rowsInserted.hasOwnProperty(hash))
            //                        added.push(value);
            //                    else {
            //                        delete oSettings._rowsInserted[hash];
            //                        rowsAdded = true;
            //                    }
            //                }
            //            }
            //            // remove existing items
            //            for (hash in lastBlockMap) {
            //                block = lastBlockMap[hash];
            //                if (!oSettings._rowsRemoved.hasOwnProperty(hash))
            //                    removed.push(block);
            //                else {
            //                    delete oSettings._rowsRemoved[hash];
            //                    rowsRemoved = true;
            //                }
            //            }
            //            lastBlockMap = nextBlockMap;
            //            if (removed.length > 0) {
            //                rowsRemoved = true;
            //                index = 0;
            //                removed.sort( (a, b) => { return b.index - a.index; }); //We have to sort the indexes because we have to delete rows with the bigger indexes first
            //                for (index = 0; index < removed.length; index++) {
            //                    value = dataTable.row(removed[index].index);
            //                    if (value.node() != null && !noRowBinding) { //deferRender
            //                        var rScope = angular.element(value.node()).scope();
            //                        if (rScope)
            //                            rScope.$destroy();
            //                    }
            //                    value.remove(true);
            //                }
            //                angular.forEach(dtSettings.dtRowsRemovedActions, fn => {
            //                    if (angular.isFunction(fn))
            //                        fn.call(dataTable, removed);
            //                });
            //            }
            //            if (added.length > 0) {
            //                rowsAdded = true;
            //                var rows = dataTable.rows.add(added, true);
            //                angular.forEach(dtSettings.dtRowsAddedActions, fn => {
            //                    if (angular.isFunction(fn))
            //                        fn.call(dataTable, rows);
            //                });
            //            }
            //            length = newValue.length;
            //            if (oSettings.aoData.length !== length)
            //                throw "Datatables collection has not the same length as model collection (DT: " + oSettings.aoData.length + " Model: " + length + ")";
            //            //Rows swap searching
            //            for (index = 0; index < length; index++) {
            //                value = newValue[index];
            //                rowData = oSettings.aoData[index]._aData;
            //                if (value === rowData) continue;
            //                var mId = hashKey(value);
            //                var dtId = hashKey(rowData);
            //                if (rowOrder.hasOwnProperty(mId))
            //                    rowOrder[mId].mIndex = index;
            //                else if (!rowOrder.hasOwnProperty(dtId))
            //                    rowOrder[mId] = { mIndex: index };
            //                else
            //                    rowOrder[dtId].dtIndex = index;
            //            }
            //            var rowOrderKeys = Object.keys(rowOrder);
            //            if (rowOrderKeys.length > 0) { //We have to reorder datatables rows
            //                rowsReordered = true;
            //                for (index = 0; index < rowOrderKeys.length; index++) {
            //                    value = rowOrder[rowOrderKeys[index]];
            //                    var tmp = oSettings.aoData[value.dtIndex];
            //                    oSettings.aoData[value.dtIndex] = oSettings.aoData[value.mIndex];
            //                    oSettings.aoData[value.mIndex] = tmp;
            //                    //Fix row indexes
            //                    if (oSettings.aoData[value.dtIndex].nTr)
            //                        oSettings.aoData[value.dtIndex].nTr._DT_RowIndex = value.dtIndex;
            //                    if (oSettings.aoData[value.mIndex].nTr)
            //                        oSettings.aoData[value.mIndex].nTr._DT_RowIndex = value.mIndex;
            //                }
            //            }
            //            if (rowsRemoved || rowsAdded || rowsReordered) {
            //                if (rowsAdded) //when adding we want the new items to be displayed
            //                    dataTable.gotoLastPage(); //We only need to change page when a new item is added and will be shown on an new page
            //                dataTable.draw(false);
            //            }
            //            if (debug) console.timeEnd('$watchCollection - ' + collPath);
            //        });
            //    }
            //}
        }
    ]);
})(window, document, undefined);
//# sourceMappingURL=angular.dataTables.js.map
