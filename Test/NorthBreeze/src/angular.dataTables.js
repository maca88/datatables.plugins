///<reference path='../typings/jquery/jquery.d.ts' />
///<reference path='../typings/jquery.dataTables/jquery.dataTables.d.ts' />
///<reference path='../typings/angularjs/angular.d.ts' />
///<reference path='../typings/breeze/breeze.d.ts' />
'use strict';
angular.module("dt", []).constant("dtSettings", {
    defaultDtOptions: {},
    dtGetColumnIndexFn: null,
    dtFillWatchedProperties: [],
    dtTableCreatingCallbacks: [],
    dtTableCreatedCallbacks: [],
    dtColumnParsingCallbacks: []
}).directive("dtTable", [
    "$compile", "$parse", "dtSettings",
    function ($compile, $parse, dtSettings) {
        return {
            // Restricted it to A only. Thead elements are only valid inside table tag
            restrict: 'A',
            link: function (scope, element, attrs) {
                var $element = angular.element(element);
                var dataTable = null;
                var itemName = attrs.dtItemName || "item";
                var defaultOptions = dtSettings.defaultDtOptions || {};

                //We only need to change page when a new item is added and will be shown on an new page
                var gotoLastPage = function (dt) {
                    var info = dataTable.page.info();
                    var lastPageIdx = Math.ceil(info.recordsTotal / info.length) - 1;
                    if (info.page < lastPageIdx)
                        dt.page(lastPageIdx);
                };

                //Merge options
                var options = angular.extend({}, defaultOptions, scope.$eval(attrs.dtOptions), (attrs.dtData != null ? { data: scope.$eval(attrs.dtData) } : {}));

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

                    angular.forEach(dtSettings.dtColumnParsingCallbacks, function (fn) {
                        if (!angular.isFunction(fn))
                            return;
                        fn(elem, column, explicitColumns, options, $element, scope, attrs, $compile);
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
                                    var colOpts = angular.isFunction(dtSettings.dtGetColumnIndexFn) ? columns[dtSettings.dtGetColumnIndexFn(options, dataTable, columns, idx)] : columns[idx];
                                    if (!!colOpts.expressionFn) {
                                        var arg = {};
                                        arg[itemName] = oData;
                                        return colOpts.expressionFn(arg);
                                    }
                                    return innerData;
                                default:
                                    throw "Unknown sSpecific: " + sSpecific;
                            }
                        };
                    }
                });

                //Wrap custom createdRow
                var origCreatedRow = options.createdRow;
                options.createdRow = function (node, rowData, dataIndex) {
                    var api = this.api();

                    //var aoColumns = api.settings()[0].aoColumns;
                    var elem = angular.element(node);
                    var rowScope = scope.$new();
                    rowScope[itemName] = rowData;

                    //Define property for index so we dont have to take care of modifying it each time a row is deleted
                    Object.defineProperty(rowScope, "$index", {
                        get: function () {
                            return api.row(node).index();
                        }
                    });
                    Object.defineProperty(rowScope, "$first", {
                        get: function () {
                            return this.$index === 0;
                        }
                    });
                    Object.defineProperty(rowScope, "$last", {
                        get: function () {
                            return this.$index === (api.page.info().recordsTotal - 1);
                        }
                    });
                    Object.defineProperty(rowScope, "$middle", {
                        get: function () {
                            return !(this.$first || this.$last);
                        }
                    });
                    Object.defineProperty(rowScope, "$odd", {
                        get: function () {
                            return !(this.$even = (this.$index & 1) === 0);
                        }
                    });
                    $('td', elem).each(function (idx, td) {
                        var $td = angular.element(td);
                        var colIdx = angular.isFunction(dtSettings.dtGetColumnIndexFn) ? dtSettings.dtGetColumnIndexFn(options, api, columns, idx) : idx;
                        var colOpts = columns[colIdx];

                        //var oColumn = aoColumns[colIdx];
                        if (colOpts.data != null) {
                            $td.attr('ng-bind', itemName + '.' + colOpts.data);
                            return;
                        }
                        if (colOpts.template != null) {
                            var tpl = $(colOpts.template).clone().removeAttr('ng-non-bindable').show();
                            $td.html(tpl);
                            return;
                        }
                        if (colOpts.expression != null && angular.isString(colOpts.expression)) {
                            $td.attr('ng-bind', colOpts.expression);
                            return;
                        }
                        if (colOpts.defaultContent != "")
                            $td.html(colOpts.defaultContent);
                    });
                    $compile(elem)(rowScope);

                    if (angular.isFunction(origCreatedRow))
                        origCreatedRow(node, rowData, dataIndex);

                    var propNames = Object.keys(rowData);

                    angular.forEach(dtSettings.dtFillWatchedProperties, function (fn) {
                        if (!angular.isFunction(fn))
                            return;
                        fn(propNames, rowData, options);
                    });

                    //For serverside processing we dont have to invalidate rows (searching/ordering is done by server)
                    if (options.serverSide != true) {
                        angular.forEach(propNames, function (propName) {
                            //If row data is changed we have to invalidate dt row
                            rowScope.$watch(itemName + '.' + propName, function () {
                                api.row(node).invalidate();
                            }, false);
                        });
                    }
                };

                //Wrap custom drawCallback
                var origDrawCallback = options.drawCallback;
                options.drawCallback = function (settings) {
                    var tblScope = $element.scope();
                    if (settings.bInitialised === true && !tblScope.$$phase)
                        tblScope.$apply();
                    if (angular.isFunction(origDrawCallback))
                        origDrawCallback(settings);
                };

                angular.forEach(dtSettings.dtTableCreatingCallbacks, function (fn) {
                    if (!angular.isFunction(fn))
                        return;
                    fn($element, options, scope, attrs, $compile);
                });

                // Initialize datatables
                dataTable = $element.DataTable(options);

                if (!!attrs.dtTable)
                    scope[attrs.dtTable] = dataTable;

                angular.forEach(dtSettings.dtTableCreatedCallbacks, function (fn) {
                    if (!angular.isFunction(fn))
                        return;
                    fn(dataTable, $element, options, scope, attrs, $compile);
                });

                if (!attrs.dtData)
                    return;

                scope.$watchCollection(attrs.dtData, function (newValue, oldValue, collScope) {
                    if (!newValue)
                        return;
                    var added = [];
                    var removed = [];
                    if (newValue.length > oldValue.length) {
                        //Find added items
                        angular.forEach(newValue, function (val) {
                            if (-1 === oldValue.indexOf(val))
                                added.push(val);
                        });
                    } else if (newValue.length < oldValue.length) {
                        //Find removed items
                        angular.forEach(oldValue, function (val, key) {
                            var idx = newValue.indexOf(val);
                            if (-1 === idx)
                                removed.push({ index: key, value: val });
                        });
                    }
                    if (added.length > 0)
                        dataTable.rows.add(added);

                    angular.forEach(removed, function (item) {
                        var row = dataTable.row(item.index);
                        if (row.node() != null) {
                            angular.element(row.node()).scope().$destroy();
                        }
                        row.remove();
                    });
                    if (removed.length > 0 || added.length > 0) {
                        if (added.length > 0)
                            gotoLastPage(dataTable);
                        dataTable.draw(false);
                    }
                });
            }
        };
    }
]);
//# sourceMappingURL=angular.dataTables.js.map
