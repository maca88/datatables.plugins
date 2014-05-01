///<reference path='../typings/jquery/jquery.d.ts' />
///<reference path='../typings/jquery.dataTables/jquery.dataTables.d.ts' />
///<reference path='../typings/angularjs/angular.d.ts' />
///<reference path='../typings/breeze/breeze.d.ts' />

'use strict';

angular.module("dt", [])
    .constant("dtSettings", {
        defaultDtOptions: {},
        dtTableCreatingCallbacks: [],
        dtTableCreatedCallbacks: [],
        dtColumnParsingCallbacks: [],
    })
    .directive("dtTable", ["$compile", "dtSettings",
        ($compile, dtSettings) => {
            return {
                // Restricted it to A only. Thead elements are only valid inside table tag
                restrict: 'A',

                link: (scope, element, attrs) => {
                    var $element = angular.element(element);
                    var dataTable: any = null;
                    var itemName = attrs.dtItemName || "item";
                    var defaultOptions: any = dtSettings.defaultDtOptions || {};
                    //We only need to change page when a new item is added and will be shown on an new page
                    var gotoLastPage = (dt) => {
                        var info: any = dataTable.page.info();
                        var lastPageIdx = Math.ceil(info.recordsTotal / info.length) - 1;
                        if (info.page < lastPageIdx)
                            dt.page(lastPageIdx);
                    };
                    //Merge options
                    var options: any = angular.extend({}, defaultOptions, scope.$eval(attrs.dtOptions), (attrs.dtData != null ? { data: scope.$eval(attrs.dtData) } : {}));

                    if (!!attrs.dtWidth)
                        $element.css('width', attrs.dtWidth);

                    //columns def from DOM (have the highest priority)
                    var explicitColumns = [];

                    angular.forEach(element.find('th'), (node) => {
                        var elem = angular.element(node);
                        var column: any = {
                            data: elem.attr('dt-data'),
                            title: elem.text(),
                            name: elem.attr('dt-name'),
                            render: elem.attr('dt-render'),
                            expression: elem.attr('dt-expression'),
                            defaultContent: elem.attr('dt-def-content') || elem.attr('dt-template') || '',
                        };

                        angular.forEach(dtSettings.dtColumnParsingCallbacks, fn => {
                            if (!angular.isFunction(fn)) return;
                            fn(elem, column, explicitColumns, options, $element, scope, attrs, $compile);
                        });

                        explicitColumns.push(column);
                    });
                    if (explicitColumns.length > 0) {
                        options.columns = explicitColumns;
                    }

                    var columns = options.columns || options.columnDefs;

                    //Wrap custom createdRow
                    var origCreatedRow = options.createdRow;
                    options.createdRow = (node: Node, rowData: any[], dataIndex: number) => {
                        var elem = angular.element(node);
                        var rowScope = scope.$new();
                        rowScope[itemName] = rowData;
                        //Define property for index so we dont have to take care of modifying it each time a row is deleted
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
                        $('td', elem).each((idx, td) => {
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
                
                    //Wrap custom drawCallback
                    var origDrawCallback = options.drawCallback;
                    options.drawCallback = (settings: any) => {
                        var tblScope = $element.scope();
                        if (settings.bInitialised === true && !tblScope.$$phase)
                            tblScope.$apply();
                        if (angular.isFunction(origDrawCallback))
                            origDrawCallback(settings);
                    }

                    angular.forEach(dtSettings.dtTableCreatingCallbacks, fn => {
                        if (!angular.isFunction(fn)) return;
                        fn($element, options, scope, attrs, $compile);
                    });

                    // Initialize datatables
                    dataTable = $element.DataTable(options);

                    if (!!attrs.dtTable)
                        scope[attrs.dtTable] = dataTable;

                    angular.forEach(dtSettings.dtTableCreatedCallbacks, fn => {
                        if (!angular.isFunction(fn)) return;
                        fn(dataTable, $element, options, scope, attrs, $compile);
                    });


                    if (!attrs.dtData) return;

                    scope.$watchCollection(attrs.dtData, (newValue: any, oldValue: any, collScope: ng.IScope) => {
                        if (!newValue) return;
                        var added = [];
                        var removed = [];
                        if (newValue.length > oldValue.length) {
                            //Find added items
                            angular.forEach(newValue, (val) => {
                                if (-1 === oldValue.indexOf(val)) 
                                    added.push(val);
                            });
                        }
                        else if (newValue.length < oldValue.length) {
                            //Find removed items
                            angular.forEach(oldValue, (val, key) => {
                                var idx = newValue.indexOf(val);
                                if (-1 === idx) 
                                    removed.push({ index: key, value: val});
                            });
                        }
                        if (added.length > 0)
                            dataTable.rows.add(added);

                        angular.forEach(removed, (item) => {
                            var row = dataTable.row(item.index);
                            if (row.node() != null) { //deferRender
                                angular.element(row.node()).scope().$destroy();
                            }
                            row.remove();
                        });
                        if (removed.length > 0 || added.length > 0) {
                            if (added.length > 0) //when adding item we want the item to be displayed
                                gotoLastPage(dataTable);
                            dataTable.draw(false);
                        }
                    });
                }
            }
        }
    ]);