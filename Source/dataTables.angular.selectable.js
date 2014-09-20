var dt;
(function (dt) {
    (function (_selectable) {
        //#region Selectable plugin
        var SelectableTablePlugin = (function () {
            function SelectableTablePlugin(tableController, $timeout) {
                this.dt = {
                    api: null,
                    settings: null
                };
                this.name = 'selectable';
                this.tableController = tableController;
                this.$timeout = $timeout;
            }
            SelectableTablePlugin.prototype.getEventListeners = function () {
                return [
                    {
                        event: dt.TableController.events.tableCreating,
                        fn: this.tableCreating,
                        scope: this
                    },
                    {
                        event: dt.TableController.events.tableCreated,
                        fn: this.tableCreated,
                        scope: this
                    },
                    {
                        event: dt.TableController.events.rowPreLink,
                        fn: this.rowPreLink,
                        scope: this
                    }
                ];
            };

            SelectableTablePlugin.isEnabled = function (settings) {
                var ttSettings = settings.tableTools || {};
                var selectable = settings.selectable;
                return (settings.dom && settings.dom.indexOf('T') >= 0 && ttSettings.sRowSelect != null && ttSettings.sRowSelect !== 'none') || selectable;
            };

            SelectableTablePlugin.prototype.initialize = function (dtSettings) {
                this.dt.settings = dtSettings;
                this.dt.api = dtSettings.oInstance.api();
                dtSettings._DT_SelectedRowsCached = [];
            };

            SelectableTablePlugin.prototype.destroy = function () {
                this.tableController = null;
                this.dt = null;
            };

            SelectableTablePlugin.prototype.tableCreated = function (event, api) {
                var _this = this;
                this.dt.api = api; //not the same instance???
                Object.defineProperty(api, "selectedRows", {
                    get: function () {
                        return _this.dt.settings._DT_SelectedRowsCached || [];
                    }
                });

                Object.defineProperty(api, "toggleRowsSelection", {
                    get: function () {
                        return _this.dt.api.allRowsSelected = !_this.dt.api.allRowsSelected;
                    }
                });

                Object.defineProperty(api, "allRowsSelected", {
                    get: function () {
                        return _this.dt.settings.aoData.length === _this.dt.api.selectedRows.length;
                    },
                    set: function (value) {
                        var tt = _this.dt.api.tabletools();
                        if (value)
                            tt.fnSelectAll();
                        else
                            tt.fnSelectNone();
                    }
                });
            };

            SelectableTablePlugin.prototype.tableCreating = function (event) {
                var _this = this;
                var that = this;
                var i, len;
                var table = this.tableController;
                var opts = table.settings.options;
                var selectable = table.$attrs.dtSelectable;
                var settings = opts.tableTools = opts.tableTools || {};
                var tblScope = table.$scope;

                this.settings = $.extend({}, SelectableTablePlugin.defaultSettings, angular.isObject(opts.selectable) ? opts.selectable : {});

                if (!opts.dom)
                    opts.dom = 'T' + $.fn.dataTable.defaults.dom;
                else if (opts.dom.indexOf('T') < 0)
                    opts.dom = 'T' + opts.dom;

                if (selectable)
                    opts.tableTools.sRowSelect = selectable;

                //Search for selectable column
                var selCol = null;
                for (i = 0; i < opts.columns.length; i++) {
                    if (opts.columns[i].selectableColumn === true) {
                        selCol = opts.columns[i];
                        selCol.orderable = false;
                        selCol.searchable = false;
                        if (!selCol.width)
                            selCol.width = this.settings.column.width;
                        if (!selCol.className)
                            selCol.className = this.settings.column.className;
                        if (!selCol.title)
                            selCol.title = this.settings.column.headerTemplate;
                        selCol.type = "html";
                        if (!selCol.templateHtml)
                            selCol.templateHtml = this.settings.column.template;
                        ;
                    }
                }

                //If a selectable column exist make all other columns as non selectable if there is not explicitly set
                if (selCol) {
                    for (i = 0; i < opts.columns.length; i++) {
                        if (opts.columns[i] !== selCol && opts.columns[i].selectable === undefined)
                            opts.columns[i].selectable = false;
                    }
                }

                var origPreSelected = settings.fnPreRowSelect;
                var deselectingRows = [];
                var gotDeselectEvent = false;
                var deselectRows = function () {
                    for (i = 0, len = deselectingRows.length; i < len; i++) {
                        deselectingRows[i]._DTTT_selected = false;
                        if (deselectingRows[i].nTr) {
                            $(deselectingRows[i].nTr).removeClass(this.classes.select.row);
                        }
                    }
                    deselectingRows.length = 0;
                };
                settings.fnPreRowSelect = function (e, nodes, select) {
                    var _this = this;
                    var result = true;

                    //Call the original fn
                    if (angular.isFunction(origPreSelected))
                        result = origPreSelected.call(this, e, nodes);

                    //we got the event that triggered the deselection
                    if (e && nodes && nodes.length && deselectingRows.length && select) {
                        gotDeselectEvent = true;
                        if (that.canChangeSelection(e.target))
                            deselectRows.call(this);
                    }

                    //deselecting all rows - as we dont have the event to check where the user clicked save the deselected nodes and wait for the next call
                    //check after a while if the fnPreRowSelect was called, if not delseect the rows manually (this will happen when fnSelectNone is manually called)
                    if (e === undefined && !select) {
                        deselectingRows.length = 0;
                        var data = this.s.dt.aoData;
                        for (i = 0, len = data.length; i < len; i++) {
                            if (data[i]._DTTT_selected)
                                deselectingRows.push(data[i]);
                        }
                        that.$timeout(function () {
                            if (gotDeselectEvent) {
                                gotDeselectEvent = false;
                                return;
                            }
                            deselectRows.call(_this);
                        }, 100);

                        return false;
                    }

                    if (!e && (!nodes || !nodes.length))
                        return result;

                    var target = e ? e.target : nodes[0];
                    return that.canChangeSelection(target) === false ? false : result;
                };

                var origPostSelected = settings.fnRowSelected;
                settings.fnRowSelected = function (nodes) {
                    that.resetSelectableCache();

                    //We have to digest the parent table scope in order to refresh bindings that are related to datatable instance
                    if (!tblScope.$parent.$$phase)
                        tblScope.$parent.$digest();

                    //Call the original fn
                    if (angular.isFunction(origPostSelected))
                        origPostSelected.call(this, nodes);
                };

                var origPostDeselected = settings.fnRowDeselected;
                settings.fnRowDeselected = function (nodes) {
                    that.resetSelectableCache();

                    //We have to digest the parent table scope in order to refresh bindings that are related to datatable instance
                    if (!tblScope.$parent.$$phase)
                        tblScope.$parent.$digest();

                    //Call the original fn
                    if (angular.isFunction(origPostDeselected))
                        origPostDeselected.call(this, nodes);
                };

                table.settings.rowsRemoved.push(function () {
                    _this.resetSelectableCache();
                });
            };

            SelectableTablePlugin.prototype.canChangeSelection = function (node) {
                var cell = $(node).closest('td');
                var cellIdx = cell.index();
                var col = null;
                var visCol = 0;
                var columns = this.dt.settings.aoColumns;
                for (var i = 0; i < columns.length; i++) {
                    if (!columns[i].bVisible)
                        continue;
                    if (visCol === cellIdx) {
                        col = columns[i];
                        break;
                    }
                    visCol++;
                }
                return (col && col.selectable === false) ? false : true;
            };

            SelectableTablePlugin.prototype.rowPreLink = function (event, args) {
                Object.defineProperty(args.scope, '$selected', {
                    get: function () {
                        return this.$rowData._DTTT_selected;
                    }
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
            SelectableTablePlugin.defaultSettings = {
                column: {
                    template: '<input type="checkbox" ng-checked="$selected"/>',
                    className: '',
                    width: '20px',
                    headerTemplate: '<input type="checkbox" ng-model="$table.allRowsSelected" />'
                }
            };

            SelectableTablePlugin.$inject = ['tableController', '$timeout'];
            return SelectableTablePlugin;
        })();
        _selectable.SelectableTablePlugin = SelectableTablePlugin;

        //Register plugin
        dt.TableController.registerPlugin(SelectableTablePlugin.isEnabled, SelectableTablePlugin);
    })(dt.selectable || (dt.selectable = {}));
    var selectable = dt.selectable;
})(dt || (dt = {}));

(function (window, document, undefined) {
    $.fn.DataTable.Api.register('toggleRowSelection()', function () {
        this.allRowsSelected = !(this.allRowsSelected);
    });
}(window, document, undefined));
//# sourceMappingURL=dataTables.angular.selectable.js.map
