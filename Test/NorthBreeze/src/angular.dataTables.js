'use strict';
angular.module("dt", []).constant("dtSettings", {
    defaultDtOptions: {},
    dtTableCreatingCallbacks: [],
    dtTableCreatedCallbacks: [],
    dtColumnParsingCallbacks: []
}).directive("dtTable", [
    "$compile", "dtSettings",
    function ($compile, dtSettings) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var $element = angular.element(element);
                var dataTable = null;
                var itemName = attrs.dtItemName || "item";
                var defaultOptions = dtSettings.defaultDtOptions || {};

                var gotoLastPage = function (dt) {
                    var info = dataTable.page.info();
                    var lastPageIdx = Math.ceil(info.recordsTotal / info.length) - 1;
                    if (info.page < lastPageIdx)
                        dt.page(lastPageIdx);
                };

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
                        render: elem.attr('dt-render'),
                        expression: elem.attr('dt-expression'),
                        defaultContent: elem.attr('dt-def-content') || elem.attr('dt-template') || ''
                    };

                    angular.forEach(dtSettings.dtColumnParsingCallbacks, function (fn) {
                        if (!angular.isFunction(fn))
                            return;
                        fn(elem, column, explicitColumns, options, $element, scope, attrs, $compile);
                    });

                    explicitColumns.push(column);
                });
                if (explicitColumns.length > 0) {
                    options.columns = explicitColumns;
                }

                var columns = options.columns || options.columnDefs;

                var origCreatedRow = options.createdRow;
                options.createdRow = function (node, rowData, dataIndex) {
                    var elem = angular.element(node);
                    var rowScope = scope.$new();
                    rowScope[itemName] = rowData;

                    Object.defineProperty(rowScope, "$index", {
                        get: function () {
                            return dataTable.row(node).index();
                        }
                    });
                    Object.defineProperty(rowScope, "$first", {
                        get: function () {
                            return this.$index === 0;
                        }
                    });
                    Object.defineProperty(rowScope, "$last", {
                        get: function () {
                            return this.$index === (dataTable.page.info().recordsTotal - 1);
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
                        var colOpts = columns[idx];
                        if (colOpts.data == null) {
                            if (colOpts.defaultContent != null && $(colOpts.defaultContent).length > 0) {
                                var tpl = $(colOpts.defaultContent);
                                if (tpl.length > 0)
                                    $td.html($(colOpts.defaultContent).clone().removeAttr('ng-non-bindable').show());
                                else
                                    $td.html(colOpts.defaultContent);
                            }
                            if (colOpts.expression != null && angular.isString(colOpts.expression))
                                $td.attr('ng-bind', colOpts.expression);
                            return;
                        }
                        $td.attr('ng-bind', itemName + '.' + colOpts.data);
                    });

                    $compile(elem)(rowScope);
                    if (angular.isFunction(origCreatedRow))
                        origCreatedRow(node, rowData, dataIndex);
                };

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
                        angular.forEach(newValue, function (val) {
                            if (-1 === oldValue.indexOf(val))
                                added.push(val);
                        });
                    } else if (newValue.length < oldValue.length) {
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
