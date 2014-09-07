var dt;
(function (dt) {
    (function (_selectable) {
        //#region Selectable plugin
        var SelectableTablePlugin = (function () {
            function SelectableTablePlugin(dtTable) {
                this.dt = {
                    api: null,
                    settings: null
                };
                this.name = 'selectable';
                this.table = dtTable;
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
                    }
                ];
            };

            SelectableTablePlugin.prototype.isEnabled = function () {
                var opts = this.table.settings.options;
                var settings = opts.tableTools = opts.tableTools || {};
                var selectable = this.table.$attrs.dtSelectable;
                return (opts.dom && opts.dom.indexOf('T') >= 0 && settings.sRowSelect != null && settings.sRowSelect !== 'none') || selectable || opts.selectable;
            };

            SelectableTablePlugin.prototype.initialize = function (dtSettings) {
                this.dt.settings = dtSettings;
                this.dt.api = dtSettings.oInstance.api();
                dtSettings._DT_SelectedRowsCached = [];
                //TODO: selectable columns
            };

            SelectableTablePlugin.prototype.destroy = function () {
                this.table = null;
                this.dt = null;
            };

            SelectableTablePlugin.prototype.tableCreated = function (api) {
                var _this = this;
                this.dt.api = api; //not the same instance???
                Object.defineProperty(api, "selectedRows", {
                    get: function () {
                        return _this.dt.settings._DT_SelectedRowsCached || [];
                    }
                });
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
        _selectable.SelectableTablePlugin = SelectableTablePlugin;

        //Register plugin
        dt.TableController.registerPlugin(SelectableTablePlugin);
    })(dt.selectable || (dt.selectable = {}));
    var selectable = dt.selectable;
})(dt || (dt = {}));
//# sourceMappingURL=dataTables.angular.selectable.js.map
