///<reference path='../typings/jquery/jquery.d.ts' />
///<reference path='../typings/jquery.dataTables/jquery.dataTables.d.ts' />
///<reference path='../typings/angularjs/angular.d.ts' />
///<reference path='../typings/breeze/breeze.d.ts' />

'use strict';

angular.module("dt", [])
    .constant("dtSettings", {
        defaultDtOptions: {},
        dtGetColumnIndexFn: null, //Nedded for colReorder plugin
        dtFillWatchedProperties: [],
        dtTableCreatingCallbacks: [],
        dtTableCreatedCallbacks: [],
        dtColumnParsingCallbacks: [],
    })
    .directive("dtTable", ["$compile", "$parse", "dtSettings",
        ($compile, $parse, dtSettings) => {
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

                        angular.forEach(dtSettings.dtColumnParsingCallbacks, fn => {
                            if (!angular.isFunction(fn)) return;
                            fn(elem, column, explicitColumns, options, $element, scope, attrs, $compile);
                        });

                        explicitColumns.push(column);
                    });
                    //columns def from DOM (have the highest priority)
                    if (explicitColumns.length > 0) {
                        options.columns = explicitColumns;
                    }

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
                            col.render = (innerData, sSpecific, oData) => {
                                switch (sSpecific) {
                                case "display":
                                    return innerData; //we will handle what will be displayed in rowCreatedCallback
                                case "type":
                                case "filter":
                                case "sort":
                                    var colOpts = columns[idx];
                                    if (!!colOpts.expressionFn) { //support expression for searching and filtering
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
                    options.createdRow = function (node: Node, rowData: any[], dataIndex: number) {
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
                        $('td', elem).each((idx, td:any) => {
                            var $td = angular.element(td);
                            var colIdx = angular.isFunction(dtSettings.dtGetColumnIndexFn) //Get the right column
                                ? dtSettings.dtGetColumnIndexFn(options, api, columns, idx)
                                : idx;
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

                        var propNames = Object.keys(rowData); //TODO: cache the result
                        angular.forEach(columns, col => {
                            if (col.data == null || propNames.indexOf(col.data) >= 0) return;
                            propNames.push(col.data);
                        });

                        angular.forEach(dtSettings.dtFillWatchedProperties, fn => {
                            if (!angular.isFunction(fn)) return;
                            fn(propNames, rowData, options);
                        });

                        //For serverside processing we dont have to invalidate rows (searching/ordering is done by server) 
                        if (options.serverSide != true) {
                            angular.forEach(propNames, propName => {
                                //If row data is changed we have to invalidate dt row
                                rowScope.$watch(itemName + '.' + propName, () => {
                                    api.row(node).invalidate();
                                }, false);
                            });
                        }
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