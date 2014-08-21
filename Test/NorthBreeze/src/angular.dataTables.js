///<reference path='../typings/jquery/jquery.d.ts' />
///<reference path='../typings/jquery.dataTables/jquery.dataTables.d.ts' />
///<reference path='../typings/angularjs/angular.d.ts' />
///<reference path='../typings/breeze/breeze.d.ts' />
var dt;
(function (dt) {
    

    //#endregion
    var TableController = (function () {
        function TableController($parse, $scope, $element, $attrs, $transclude, $rootScope, $q, $http, $compile, $templateCache, $injector) {
            this.dt = {
                api: null,
                settings: null
            };
            this.lastBlockMap = {};
            this.templatesToLoad = [];
            this.watchedProperties = [];
            this.activePlugins = [];
            //Plugins event listeners
            this.eventListeners = {
                'cellCompile': [],
                'cellPostLink': [],
                'cellPreLink': [],
                'rowCompile': [],
                'rowPostLink': [],
                'rowPreLink': [],
                'tableCreating': [],
                'tableCreated': []
            };
            this.settings = $.extend(true, {}, TableController.defaultSettings, {});
            this.$parse = $parse;
            this.$scope = $scope;
            this.$element = $element;
            this.$attrs = $attrs;
            this.$rootScope = $rootScope;
            this.$compile = $compile;
            this.$injector = $injector;
            this.$templateCache = $templateCache;
        }
        TableController.prototype.setupTable = function () {
            this.mergeDomAttributes();

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

            this.loadTemplates(this.initialize.bind(this));
        };

        TableController.prototype.loadTemplates = function (onSuccess) {
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

        TableController.prototype.triggerEventListeners = function (name, params) {
            var arr = this.eventListeners[name] || [];
            var eventListener;
            for (var i = 0; i < arr.length; i++) {
                eventListener = arr[i];

                //lazy event listener
                if (angular.isFunction(eventListener.scope)) {
                    eventListener.scope = eventListener.scope();
                    eventListener.fn = eventListener.fn();
                }
                eventListener.fn.apply(eventListener.scope, params);
            }
        };

        TableController.prototype.initializePlugins = function (dtSettings) {
            this.dt.settings = dtSettings;
            this.dt.api = dtSettings.oInstance.api();

            //setup table scope properties
            this.setupScope();

            angular.forEach(this.activePlugins, function (plugin) {
                plugin.initialize(dtSettings);
            });
        };

        TableController.prototype.initialize = function () {
            var _this = this;
            this.templatesToLoad.length = 0; //reset

            //Initialize datatables
            var options = this.settings.options;
            var debug = this.settings.debug;
            var scope = this.$scope;
            var attrs = this.$attrs;
            var rData, hash, hashKey = AngularHelper.hashKey;

            options.angular = {
                $compile: this.$compile,
                $templateCache: this.$templateCache,
                $injector: this.$injector,
                rowDataPath: this.settings.rowDataPath,
                initPlugins: $.proxy(this.initializePlugins, this)
            };

            //Enable angular plugins
            options.dom = options.dom ? 'E' + options.dom : 'E' + $.fn.dataTable.defaults.dom;

            var locals = {
                'dtTable': this
            };
            angular.forEach(this.settings.plugins, function (pluginType) {
                var plugin = _this.$injector.instantiate(pluginType, locals);
                if (!plugin.isEnabled())
                    return;
                _this.activePlugins.push(plugin);
                var eventListeners = plugin.getEventListeners();
                if (angular.isArray(eventListeners)) {
                    angular.forEach(eventListeners, function (el) {
                        _this.eventListeners[el.event].push(el);
                    });
                }
            });

            this.triggerEventListeners(TableController.events.tableCreating, []);

            if (debug)
                console.time('initDataTable');
            var api = this.dt.api = this.$element.DataTable(options);
            if (debug)
                console.timeEnd('initDataTable');
            var dtSettings = this.dt.settings = api.settings()[0];

            this.triggerEventListeners(TableController.events.tableCreated, [api]);

            dtSettings._rowsInserted = dtSettings._rowsInserted || {};
            dtSettings._rowsRemoved = dtSettings._rowsRemoved || {};
            dtSettings.oInit.data = options.data; //set init data to be the same as binding collection - this will be fixed in 1.10.1
            dtSettings.getBindingData = function () {
                return _this.$scope.$eval(_this.settings.collectionPath);
            };

            //Copy the custom column parameters to the aoColumns
            angular.forEach(dtSettings.aoColumns, function (oCol, idx) {
                var origIdx = oCol._ColReorder_iOrigCol;
                origIdx = origIdx == null ? idx : origIdx;
                var col = options.columns[origIdx];
                angular.forEach(col, function (val, key) {
                    if (oCol[key] !== undefined || val === undefined)
                        return;
                    oCol[key] = val;
                });
            });

            //Attach to dt events for digestion
            var digestProxy = $.proxy(this.digestDisplayedPage, this, api);
            api.on('column-visibility.dt', digestProxy);

            //ColReorder
            $(dtSettings.oInstance).on('column-reorder.angular', digestProxy);

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

        TableController.prototype.onCollectionChange = function (newValue) {
            var _this = this;
            var debug = this.settings.debug, collPath = this.settings.collectionPath, dtSettings = this.dt.settings, aoData = dtSettings.aoData, settings = this.settings, api = this.dt.api, attrData = this.$attrs.dtData, hashKey = AngularHelper.hashKey, rowBinding = this.settings.rowBinding, index, hash, block, rowData;

            if (debug)
                console.time('$watchCollection - ' + collPath);
            if (!attrData)
                dtSettings.oInit.data = newValue; //update init data
            if (!newValue)
                return;
            var key, value, nextBlockMap = {}, rowOrder = {}, rowsReordered = false, toAdd = [], toRemove = [], added = [], removed = [];

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
                    if (!dtSettings._rowsInserted.hasOwnProperty(hash)) {
                        toAdd.push(value);
                        added.push(value);
                    } else {
                        added.push(dtSettings._rowsInserted[hash]);
                        delete dtSettings._rowsInserted[hash];
                    }
                }
            }

            for (hash in this.lastBlockMap) {
                block = this.lastBlockMap[hash];
                if (!dtSettings._rowsRemoved.hasOwnProperty(hash)) {
                    toRemove.push(block);
                    removed.push(aoData[block.index]._aData);
                } else {
                    removed.push(dtSettings._rowsRemoved[hash]);
                    delete dtSettings._rowsRemoved[hash];
                }
            }
            this.lastBlockMap = nextBlockMap;

            if (toRemove.length > 0) {
                index = 0;
                toRemove.sort(function (a, b) {
                    return b.index - a.index;
                }); //We have to sort the indexes because we have to delete rows with the bigger indexes first
                for (index = 0; index < toRemove.length; index++) {
                    value = api.row(toRemove[index].index);
                    if (value.node() != null && rowBinding) {
                        var rScope = angular.element(value.node()).scope();
                        if (rScope)
                            rScope.$destroy();
                    }
                    value.remove(true);
                }
            }

            if (toAdd.length > 0) {
                api.rows.add(toAdd, true);
            }

            length = newValue.length;
            if (aoData.length !== length)
                throw "Datatables collection has not the same length as model collection (DT: " + aoData.length + " Model: " + length + ")";

            for (index = 0; index < length; index++) {
                value = newValue[index];
                rowData = aoData[index]._aData;
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
                    var tmp = aoData[value.dtIndex];
                    aoData[value.dtIndex] = aoData[value.mIndex];
                    aoData[value.mIndex] = tmp;

                    //Fix row indexes
                    if (aoData[value.dtIndex].nTr)
                        aoData[value.dtIndex].nTr._DT_RowIndex = value.dtIndex;
                    if (aoData[value.mIndex].nTr)
                        aoData[value.mIndex].nTr._DT_RowIndex = value.mIndex;
                }
            }

            if (removed.length) {
                if (debug)
                    console.time('Executing rowsRemoved callbacks. Removed items: ' + removed.length);
                angular.forEach(settings.rowsRemoved, function (fn) {
                    if (angular.isFunction(fn))
                        fn.call(_this, removed);
                });
                if (debug)
                    console.timeEnd('Executing rowsRemoved callbacks. Removed items: ' + removed.length);
            }

            if (added.length) {
                if (debug)
                    console.time('Executing rowsAdded callbacks. Added items: ' + added.length);
                angular.forEach(settings.rowsAdded, function (fn) {
                    if (angular.isFunction(fn))
                        fn.call(_this, added);
                });
                if (debug)
                    console.timeEnd('Executing rowsAdded callbacks. Added items: ' + added.length);
            }

            if (removed.length || added.length || rowsReordered) {
                if (added.length)
                    api.gotoLastPage(); //We only need to change page when a new item is added and will be shown on an new page
                api.draw(false);
            }
            if (debug)
                console.timeEnd('$watchCollection - ' + collPath);
        };

        TableController.prototype.destroy = function () {
            var id = this.dt.settings.sTableId;
            var debug = this.settings.debug;
            if (debug)
                console.time("Destroying datatables with id: " + id);
            $(this.dt.settings.oInstance).off('column-reorder.angular');
            angular.forEach(this.activePlugins, function (plugin) {
                plugin.destroy();
            });
            this.dt.api.destroy();
            this.dt = null;
            this.settings = null;
            this.$templateCache = null;
            this.activePlugins = null;
            this.$attrs = null;
            this.$q = null;
            this.$http = null;
            this.$compile = null;
            this.$injector = null;
            this.$scope.$$dtTable = null;
            this.$scope = null;
            this.$element = null;
            this.lastBlockMap = null;
            if (debug)
                console.timeEnd("Destroying datatables with id: " + id);
        };

        TableController.prototype.setupScope = function () {
            this.$scope.$columns = this.dt.settings.aoColumns;
            this.$scope.$rows = this.dt.settings.aoData;
            this.$scope.$$tableController = this;
        };

        TableController.prototype.setupRowBinding = function () {
            var that = this, settings = this.settings, $compile = this.$compile, debug = this.settings.debug, tableScope = this.$scope, rowDataPath = this.settings.rowDataPath, options = this.settings.options, origCreatedRow = options.createdRow, origDrawCallback = options.drawCallback;
            options.createdRow = function (rowNode, rowData, rowIndex) {
                var columns = that.dt.settings.aoColumns, aoData = that.dt.settings.aoData, dtRowData, rowCells, $rowNode, cellNode, $cellNode, rowScope, column, modelPath, detachedCells = [], hash, rowMeta, cellMeta, i, j;

                if (debug)
                    console.time('createdRow' + rowIndex);
                $rowNode = angular.element(rowNode);
                $rowNode.attr('dt-row', rowIndex); //a child scope will be created

                //$rowNode.data('$$dtTable', that);
                hash = AngularHelper.hashKey(rowData);

                rowMeta = {
                    node: rowNode,
                    data: rowData,
                    rowIndex: rowIndex,
                    hash: hash,
                    dataPath: rowDataPath
                };

                dtRowData = aoData[rowIndex];
                rowCells = dtRowData.anCells;

                for (i = 0; i < rowCells.length; i++) {
                    cellNode = rowCells[i];
                    column = columns[i];

                    //Detached cells must be manualy compiled
                    if (!column.bVisible)
                        detachedCells.push(cellNode);

                    modelPath = column.data ? rowDataPath + '.' + column.data : null, $cellNode = angular.element(cellNode);
                    $cellNode.attr('dt-cell', i); //a child scope will be created

                    cellMeta = {
                        attr: {},
                        html: null,
                        node: cellNode,
                        column: column,
                        cellIndex: i,
                        rowIndex: rowIndex,
                        dataFullPath: modelPath
                    };
                    if (column.templateHtml != null) {
                        cellMeta.html = column.templateHtml;
                    } else if (column.expression != null && angular.isString(column.expression)) {
                        cellMeta.attr['ng-bind'] = column.expression;
                    } else if (column.data != null) {
                        cellMeta.attr['ng-bind'] = modelPath;
                    } else if (column.defaultContent != "") {
                        cellMeta.html = column.defaultContent;
                    }

                    that.triggerEventListeners(TableController.events.cellCompile, [cellMeta]);

                    if (Object.keys(cellMeta.attr).length)
                        $cellNode.attr(cellMeta.attr);
                    if (cellMeta.html)
                        $cellNode.html(cellMeta.html);
                }

                //#endregion
                that.triggerEventListeners(TableController.events.rowCompile, [rowMeta]);

                rowScope = $compile($rowNode)(tableScope).scope();

                for (j = 0; j < detachedCells.length; j++) {
                    $compile(angular.element(detachedCells[j]))(rowScope);
                }

                if (angular.isFunction(origCreatedRow))
                    origCreatedRow.apply(this, arguments);

                if (debug)
                    console.timeEnd('createdRow' + rowIndex);
            };

            if (!settings.digestOnDraw)
                return;
            options.drawCallback = function (dtSettings) {
                if (debug)
                    console.time('drawCallback');
                if (dtSettings.bInitialised === true) {
                    that.digestDisplayedPage(this.api());
                }
                if (angular.isFunction(origDrawCallback))
                    origDrawCallback.apply(this, arguments);
                if (debug)
                    console.timeEnd('drawCallback');
            };
        };

        TableController.prototype.preLinkRow = function (scope, row, attrs) {
            var rowNode = row[0], rowIndex = row[0]._DT_RowIndex, rowData = this.dt.settings.aoData[rowIndex]._aData, hash = AngularHelper.hashKey(rowData), rowDataPath = this.settings.rowDataPath, options = this.settings.options, watchedProperties = this.watchedProperties, settings = this.settings;

            scope[rowDataPath] = rowData;
            this.defineRowScopeProperties(scope, rowNode);

            if (!this.lastBlockMap.hasOwnProperty(hash))
                this.lastBlockMap[hash] = { id: hash, index: rowIndex };
            this.lastBlockMap[hash].scope = scope;

            //For serverside processing we dont have to invalidate rows (searching/ordering is done by the server)
            if (options.serverSide != true && settings.invalidateRows === "rendered") {
                if (!watchedProperties.length)
                    this.fillWatchedProperties(rowData);
                this.createRowWatcher(scope, rowNode);
            }

            var rowOpts = {
                scope: scope,
                node: rowNode,
                data: rowData,
                rowIndex: rowIndex,
                hash: hash,
                dataPath: rowDataPath
            };

            this.triggerEventListeners(TableController.events.rowPreLink, [rowOpts]);
        };

        TableController.prototype.postLinkRow = function (scope, row, attrs) {
            var rowNode = row[0], rowIndex = row[0]._DT_RowIndex, rowData = this.dt.settings.aoData[rowIndex]._aData, hash = AngularHelper.hashKey(rowData), rowDataPath = this.settings.rowDataPath;

            var rowOpts = {
                scope: scope,
                node: rowNode,
                data: rowData,
                rowIndex: rowIndex,
                hash: hash,
                dataPath: rowDataPath
            };

            this.triggerEventListeners(TableController.events.rowPostLink, [rowOpts]);
        };

        TableController.prototype.preLinkCell = function (scope, $cellNode, $rowNode, attrs) {
            var cellNode = $cellNode[0], rowIndex = $rowNode[0]._DT_RowIndex, rowData = this.dt.settings.aoData[rowIndex], cellIndex = rowData.anCells.indexOf(cellNode), columns = this.dt.settings.aoColumns, column = columns[cellIndex];

            scope.$column = column;
            Object.defineProperty(scope, "$cellIndex", {
                get: function () {
                    return columns.indexOf(column);
                }
            });

            var cell = {
                scope: scope,
                node: cellNode,
                column: column,
                cellIndex: cellIndex,
                rowIndex: rowIndex
            };

            this.triggerEventListeners(TableController.events.cellPreLink, [cell]);
        };

        TableController.prototype.postLinkCell = function (scope, $cellNode, $rowNode, attrs) {
            var cellNode = $cellNode[0], rowIndex = $rowNode[0]._DT_RowIndex, rowData = this.dt.settings.aoData[rowIndex], cellIndex = rowData.anCells.indexOf(cellNode), columns = this.dt.settings.aoColumns, column = columns[cellIndex];

            var cell = {
                scope: scope,
                node: cellNode,
                column: column,
                cellIndex: cellIndex,
                rowIndex: rowIndex
            };

            this.triggerEventListeners(TableController.events.cellPostLink, [cell]);
        };

        TableController.prototype.digestDisplayedPage = function (api) {
            if (typeof api === "undefined") { api = null; }
            api = api ? api : this.dt.api;
            var debug = this.settings.debug;
            if (debug)
                console.time('digestDisplayedPage');
            api.digestDisplayedPage();
            if (debug)
                console.timeEnd('digestDisplayedPage');
        };

        //table attributes have the highest priority
        TableController.prototype.mergeDomAttributes = function () {
            var attrs = this.$attrs;
            var scope = this.$scope;
            var $element = this.$element;

            this.settings.invalidateRows = attrs.dtInvalidateRows ? attrs.dtInvalidateRows : this.settings.invalidateRows;
            this.settings.digestOnDraw = attrs.dtDigestOnDraw ? (attrs.dtDigestOnDraw == "true") : this.settings.digestOnDraw;
            this.settings.debug = attrs.dtDebug ? (attrs.dtDebug == "true") : this.settings.debug;
            this.settings.rowBinding = attrs.dtRowBinding ? (attrs.dtRowBinding == "true") : this.settings.rowBinding;
            this.settings.rowDataPath = attrs.dtRowDataPath ? attrs.dtRowDataPath : this.settings.rowDataPath;
            this.settings.options = attrs.dtOptions ? this.cloneOptions(scope.$eval(attrs.dtOptions)) : this.settings.options;

            //this.settings.options.data = attrs.dtData ? scope.$eval(attrs.dtData) : this.settings.options.data;
            this.settings.collectionPath = attrs.dtData ? attrs.dtData : attrs.dtOptions + '.data';

            this.mergeNodeAttributesToObject($element[0], this.settings.options, [
                "dt-table", "dt-data", "dt-width", "dt-invalidate-rows", "dt-debug",
                "dt-digest-on-draw", "dt-row-binding", "dt-options", "dt-row-data-path"
            ]);
            if (attrs.dtWidth)
                $element.css('width', attrs.dtWidth);
        };

        TableController.prototype.cloneOptions = function (options) {
            var data = options.data;
            var clnOptions = $.extend(true, {}, this.settings.options, options);
            clnOptions.data = data;
            return clnOptions;
        };

        TableController.prototype.defineRowScopeProperties = function (scope, element) {
            var _this = this;
            var api = this.dt.api;

            //Define property for index so we dont have to take care of modifying it each time a row is deleted
            Object.defineProperty(scope, "$row", {
                get: function () {
                    var idx = element._DT_RowIndex;
                    return api.row(idx);
                }
            });
            Object.defineProperty(scope, "$rowData", {
                get: function () {
                    var idx = element._DT_RowIndex;
                    return _this.dt.settings.aoData[idx];
                }
            });
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

        TableController.prototype.mergeDomColumn = function () {
            var _this = this;
            var table = this.$element;
            var explicitColumns = [];
            angular.forEach(angular.element('thead>tr>th', table), function (node) {
                var elem = angular.element(node);
                var column = { title: elem.text() };
                _this.mergeNodeAttributesToObject(node, column);
                explicitColumns.push(column);
            });

            //columns def from DOM (have the highest priority)
            if (explicitColumns.length > 0) {
                this.settings.options.columns = explicitColumns;
            }
        };

        TableController.prototype.mergeNodeAttributesToObject = function (node, obj, ignoreAttrs) {
            if (typeof ignoreAttrs === "undefined") { ignoreAttrs = []; }
            var $node = angular.element(node);
            angular.forEach(node.attributes, function (nodeAttr) {
                if (nodeAttr.name.indexOf("dt-") !== 0 || ignoreAttrs.indexOf(nodeAttr.name) >= 0)
                    return;
                var words = nodeAttr.name.substring(3).split('-');
                var popName = '';
                angular.forEach(words, function (w) {
                    if (popName.length)
                        popName += w.charAt(0).toUpperCase() + w.slice(1);
                    else
                        popName += w;
                });
                obj[popName] = $node.attr(nodeAttr.name);
                if (obj[popName] && obj[popName].toUpperCase() == 'TRUE')
                    obj[popName] = true;
                else if (obj[popName] && obj[popName].toUpperCase() == 'FALSE')
                    obj[popName] = false;
            });
        };

        TableController.prototype.fillWatchedProperties = function (row) {
            var columns = this.dt.settings.aoColumns;
            for (var i = 0; i < columns.length; i++) {
                var col = columns[i];

                //watch only properties that are binded to the table
                if (angular.isNumber(col.mData) || !col.mData || this.watchedProperties.indexOf(col.mData) >= 0)
                    continue;
                this.watchedProperties.push(col.mData);
            }
        };

        TableController.prototype.createRowWatcher = function (rowScope, node) {
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

        TableController.prototype.setupColumns = function () {
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
                                if (colOpts.expressionFn) {
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
        TableController.events = {
            cellCompile: 'cellCompile',
            cellPostLink: 'cellPostLink',
            cellPreLink: 'cellPreLink',
            rowCompile: 'rowCompile',
            rowPostLink: 'rowPostLink',
            rowPreLink: 'rowPreLink',
            tableCreating: 'tableCreating',
            tableCreated: 'tableCreated'
        };

        TableController.defaultSettings = {
            invalidateRows: 'none',
            digestOnDraw: true,
            debug: false,
            rowBinding: true,
            rowDataPath: 'data',
            options: {},
            collectionPath: null,
            tableCreating: [],
            tableCreated: [],
            rowsRemoved: [],
            rowsAdded: [],
            plugins: []
        };

        TableController.$inject = ['$parse', '$scope', '$element', '$attrs', '$transclude', '$rootScope', '$q', '$http', '$compile', '$templateCache', '$injector'];
        return TableController;
    })();
    dt.TableController = TableController;

    //#region Selectable plugin
    var SelectableTablePlugin = (function () {
        function SelectableTablePlugin(dtTable) {
            this.dt = {
                api: null,
                settings: null
            };
            this.table = dtTable;
        }
        SelectableTablePlugin.prototype.getEventListeners = function () {
            return [
                {
                    event: TableController.events.tableCreating,
                    fn: this.tableCreating,
                    scope: this
                }
            ];
        };

        SelectableTablePlugin.prototype.isEnabled = function () {
            var opts = this.table.settings.options;
            var settings = opts.tableTools = opts.tableTools || {};
            var selectable = this.table.$attrs.dtSelectable;
            return (opts.dom && opts.dom.indexOf('T') >= 0 && settings.sRowSelect != null && settings.sRowSelect !== 'none') || selectable;
        };

        SelectableTablePlugin.prototype.initialize = function (dtSettings) {
            this.dt.settings = dtSettings;
            this.dt.api = dtSettings.oInstance.api();
            dtSettings._DT_SelectedRowsCached = [];

            //TODO: selectable columns
            Object.defineProperty(this.dt.api, "selectedRows", {
                get: function () {
                    return dtSettings._DT_SelectedRowsCached || [];
                }
            });
        };

        SelectableTablePlugin.prototype.destroy = function () {
            this.table = null;
            this.dt = null;
        };

        SelectableTablePlugin.prototype.tableCreating = function () {
            var _this = this;
            var table = this.table;
            var opts = table.settings.options;
            var selectable = table.$attrs.dtSelectable;
            var settings = opts.tableTools = opts.tableTools || {};
            var tblScope = table.$scope;
            if (!opts.dom)
                opts.dom = 'T' + $.fn.dataTable.defaults;
            else if (opts.dom.indexOf('T') < 0)
                opts.dom = 'T' + opts;

            if (selectable)
                opts.tableTools.sRowSelect = selectable;

            var origPostSelected = settings.fnRowSelected;
            settings.fnRowSelected = function (nodes) {
                _this.resetSelectableCache();

                //We have to digest the parent table scope in order to refresh bindings that are related to datatable instance
                if (!tblScope.$parent.$$phase)
                    tblScope.$parent.$digest();

                //Call the original fn
                if (angular.isFunction(origPostSelected))
                    origPostSelected(nodes);
            };

            var origPostDeselected = settings.fnRowDeselected;
            settings.fnRowDeselected = function (nodes) {
                _this.resetSelectableCache();

                //We have to digest the parent table scope in order to refresh bindings that are related to datatable instance
                if (!tblScope.$parent.$$phase)
                    tblScope.$parent.$digest();

                //Call the original fn
                if (angular.isFunction(origPostDeselected))
                    origPostDeselected(nodes);
            };

            table.settings.rowsRemoved.push(function () {
                _this.resetSelectableCache();
            });
        };

        SelectableTablePlugin.prototype.resetSelectableCache = function () {
            var cache = [];
            var settings = this.dt.settings;
            var data = settings.aoData;
            var i, iLen;
            for (i = 0, iLen = data.length; i < iLen; i++) {
                if (data[i]._DTTT_selected) {
                    var dtRow = this.dt.api.row(i);
                    cache.push({
                        index: i,
                        data: dtRow.data(),
                        node: dtRow.node(),
                        row: dtRow
                    });
                }
            }
            settings._DT_SelectedRowsCached = cache;
        };
        SelectableTablePlugin.$inject = ['dtTable'];
        return SelectableTablePlugin;
    })();
    dt.SelectableTablePlugin = SelectableTablePlugin;

    //Register plugin
    TableController.defaultSettings.plugins.push(SelectableTablePlugin);

    

    var CommandTablePlugin = (function () {
        function CommandTablePlugin(dtTable, $injector) {
            this.dt = {
                api: null,
                settings: null
            };
            this.table = dtTable;
            this.$injector = $injector;
        }
        CommandTablePlugin.registerCommand = function (command) {
            CommandTablePlugin.registeredCommands[command.name] = command;
            if (command.alias)
                CommandTablePlugin.registeredCommands[command.alias] = command;
        };

        //check if there is any column that has the commands property set
        CommandTablePlugin.prototype.isEnabled = function () {
            var _this = this;
            var opts = this.table.settings.options;
            var enabled = false;
            angular.forEach(opts.columns, function (col) {
                if (col.commands === undefined)
                    return;
                if (!angular.isArray(col.commands))
                    throw 'column "' + col.title + '" property commands must be an array';

                var cmds = _this.buildCommands(col.commands);

                col.editable = col.orderable = col.searchable = false;
                col.defaultContent = cmds.template;
                col.$commandScopes = cmds.scopes;
                col.$commandInstances = cmds.instances;
                enabled = true;
            });
            return enabled;
        };

        CommandTablePlugin.prototype.initialize = function (dtSettings) {
            this.dt.settings = dtSettings;
            this.dt.api = dtSettings.oInstance.api();
        };

        CommandTablePlugin.prototype.buildCommands = function (commands) {
            var _this = this;
            var template = '';
            var scopes = {};
            var cmdName;
            var instances = [];
            var settings;
            angular.forEach(commands, function (command) {
                if (angular.isString(command)) {
                    if (!CommandTablePlugin.registeredCommands.hasOwnProperty(command))
                        throw 'Unknown command name: ' + command;
                    command = CommandTablePlugin.registeredCommands[command];
                    cmdName = command.alias || command.name;
                } else if ($.isPlainObject(command)) {
                    cmdName = command.name;
                    settings = command.settings || {};
                    if (CommandTablePlugin.registeredCommands.hasOwnProperty(cmdName)) {
                        command = CommandTablePlugin.registeredCommands[cmdName];
                        cmdName = command.alias || command.name;
                    }
                }

                //we have to convert all char to lowercase in order the bindings to work
                cmdName = cmdName.toLowerCase();

                //anonimus command like: {name: 'custom', template: '...', scope: {...}}
                if (angular.isObject(command)) {
                    template += command.template;
                    scopes[cmdName] = command.scope;
                } else {
                    var locals = { settings: settings || {} };
                    var cmd = _this.$injector.instantiate(command, locals);
                    instances.push(cmd);
                    var cmdScope = scopes[cmdName] = {};
                    var opts = {
                        canExecuteExp: "$commands['" + cmdName + "'].canExecute(this)",
                        executeExp: "$commands['" + cmdName + "'].execute(this)"
                    };
                    template += cmd.getTemplate(opts);
                    cmdScope.canExecute = $.proxy(cmd.canExecute, cmd);
                    cmdScope.execute = $.proxy(cmd.execute, cmd);
                }
            });

            return {
                template: template,
                scopes: scopes,
                instances: instances
            };
        };

        CommandTablePlugin.prototype.getEventListeners = function () {
            return [
                {
                    event: TableController.events.cellPostLink,
                    scope: this,
                    fn: this.onCellPostLink
                }
            ];
        };

        CommandTablePlugin.prototype.destroy = function () {
            this.table = null;
            this.dt = null;
        };

        CommandTablePlugin.prototype.onCellPostLink = function (args) {
            var col = args.column;
            args.scope.$commands = col.$commandScopes;
        };
        CommandTablePlugin.registeredCommands = {};

        CommandTablePlugin.$inject = ['dtTable', '$injector'];
        return CommandTablePlugin;
    })();
    dt.CommandTablePlugin = CommandTablePlugin;

    //Register plugin
    TableController.defaultSettings.plugins.push(CommandTablePlugin);

    var BaseCommand = (function () {
        function BaseCommand(defSettings, settings) {
            this.settings = $.extend(true, {}, BaseCommand.defaultSettings, defSettings, settings);
        }
        BaseCommand.prototype.getTemplate = function (opts) {
            var tmpl = $('<' + this.settings.tagName + '/>').addClass(this.settings.className || '').attr('ng-disabled', "" + opts.canExecuteExp + " === false").attr('ng-class', "{ disabled: " + opts.canExecuteExp + " === false }").attr('ng-click', opts.executeExp).attr(this.settings.attrs || {}).append(this.settings.html);
            var html = $('<div />').append(tmpl).html();
            return html.replaceAll(BaseCommand.EXEC_EXPR, opts.executeExp).replaceAll(BaseCommand.CAN_EXEC_EXPR, opts.canExecuteExp);
        };

        BaseCommand.prototype.canExecute = function (scope) {
            if (angular.isFunction(this.settings.canExecute))
                return this.settings.canExecute.call(this);
            return true;
        };

        BaseCommand.prototype.execute = function (scope) {
        };
        BaseCommand.EXEC_EXPR = "exec_expr";
        BaseCommand.CAN_EXEC_EXPR = "can_exec_expr";

        BaseCommand.defaultSettings = {
            tagName: 'button',
            className: '',
            attrs: {},
            html: '',
            canExecute: null
        };
        return BaseCommand;
    })();
    dt.BaseCommand = BaseCommand;

    //#endregion
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

    function escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    if (String.prototype.replaceAll === undefined) {
        String.prototype.replaceAll = function (find, replace) {
            return this.replace(new RegExp(escapeRegExp(find), 'g'), replace);
        };
    }

    //#region DataTables Extensions
    //We have to update the original collection if datatables api is used to manipulate dt collection
    // in additon we fire an event before remove/add so that
    $.fn.DataTable.Api.registerPlural('rows().remove()', 'row().remove()', function (bindOneWay) {
        var that = this;
        var internal = $.fn.DataTable.ext.internal;
        return this.iterator('row', function (settings, row, thatIdx) {
            if ($.isFunction(settings.oInit.removingRow))
                settings.oInit.removingRow(settings, row, thatIdx);

            var bindingData = settings.getBindingData();
            if (bindOneWay == null && bindingData != null) {
                var rowData = settings.aoData[row]._aData;
                var nTr = settings.aoData[row].nTr;
                if (nTr) {
                    var scope = angular.element(nTr).scope();
                    if (scope)
                        scope.$destroy();
                }
                var hash = dt.AngularHelper.hashKey(rowData);
                settings._rowsRemoved = settings._rowsRemoved || {};
                settings._rowsRemoved[hash] = rowData;
                bindingData.splice(row, 1);
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
            var bindingData = settings.getBindingData();

            for (i = 0, ien = rows.length; i < ien; i++) {
                row = rows[i];

                if (row.nodeName && row.nodeName.toUpperCase() === 'TR') {
                    out.push(internal._fnAddTr(settings, row)[0]);
                } else {
                    out.push(internal._fnAddData(settings, row));
                }

                if (bindOneWay == null && bindingData != null) {
                    settings._rowsInserted = settings._rowsInserted || {};
                    var hash = dt.AngularHelper.hashKey(row);
                    settings._rowsInserted[hash] = row;
                    bindingData.push(row);
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
            var bindingData = settings.getBindingData();

            if (bindOneWay == null && bindingData != null) {
                settings._rowsInserted = settings._rowsInserted || {};
                var hash = dt.AngularHelper.hashKey(row);
                settings._rowsInserted[hash] = row;
                bindingData.push(row);
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
            if (rowScope && !rowScope.$$phase)
                rowScope.$digest();
        });
    });

    //#endregion
    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            var angular = oSettings.oInit.angular;
            angular.initPlugins(oSettings);
            return null;
        },
        "cFeature": "E",
        "sFeature": "AngularPluginSystem"
    });

    angular.module("dt", []).constant("dtSettings", {
        defaultDtOptions: {},
        dtFillWatchedPropertiesActions: [],
        dtTableCreatingActions: [],
        dtTableCreatedActions: [],
        dtColumnParsingActions: [],
        dtRowsAddedActions: [],
        dtRowsRemovedActions: []
    }).service('dt.i18N').controller('dtTableController', dt.TableController).directive("dtRow", [function () {
            return {
                restrict: 'A',
                priority: 1000,
                scope: true,
                compile: function (tElement, tAttrs) {
                    return {
                        pre: function (scope, iElement, iAttrs) {
                            scope.$$tableController.preLinkRow(scope, iElement, iAttrs);
                            //console.log('post row compile');
                        },
                        post: function (scope, iElement, iAttrs) {
                            scope.$$tableController.postLinkRow(scope, iElement, iAttrs);
                            //console.log('post row compile');
                        }
                    };
                    ////Post compile
                    //return (scope, iElement, iAttrs, controller: dt.TableController) => {
                    //    scope.$$tableController.postCompileRow(scope, iElement, iAttrs);
                    //    //console.log('post row compile');
                    //};
                }
            };
        }]).directive("dtCell", [function () {
            return {
                restrict: 'A',
                priority: 1000,
                scope: true,
                compile: function (tElement, tAttrs) {
                    //console.log('cell compile');
                    var row = tElement.parent();

                    return {
                        pre: function (scope, iElement, iAttrs) {
                            scope.$$tableController.preLinkCell(scope, iElement, row, iAttrs);
                        },
                        post: function (scope, iElement, iAttrs) {
                            scope.$$tableController.postLinkCell(scope, iElement, row, iAttrs);
                        }
                    };
                    //Post compile
                    //return (scope, iElement, iAttrs) => {
                    //    //console.log('post cell compile');
                    //    scope.$$tableController.postLinkCell(scope, iElement, row, iAttrs);
                    //};
                }
            };
        }]).directive("dtTable", [function () {
            return {
                restrict: 'A',
                priority: 1000,
                controller: 'dtTableController',
                scope: true,
                link: function (scope, element, attrs, controller) {
                    controller.setupTable();
                }
            };
        }]);
})(window, document, undefined);
//# sourceMappingURL=angular.dataTables.js.map
