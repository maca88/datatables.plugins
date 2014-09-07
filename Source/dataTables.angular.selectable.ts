module dt.selectable {
    
    //#region Selectable plugin

    export class SelectableTablePlugin implements ITablePlugin {

        private table: TableController;
        private dt = {
            api: null,
            settings: null
        };

        public static $inject = ['dtTable'];
        constructor(dtTable: TableController) {
            this.table = dtTable;
        }

        public getEventListeners(): IEventListener[] {
            return [
                {
                    event: TableController.events.tableCreating,
                    fn: this.tableCreating,
                    scope: this
                },
                {
                    event: TableController.events.tableCreated,
                    fn: this.tableCreated,
                    scope: this
                }
            ];
        }

        public name: string = 'selectable';

        public isEnabled(): boolean {
            var opts = this.table.settings.options;
            var settings = opts.tableTools = opts.tableTools || {};
            var selectable = this.table.$attrs.dtSelectable;
            return (opts.dom && opts.dom.indexOf('T') >= 0 && settings.sRowSelect != null && settings.sRowSelect !== 'none')
                || selectable
                || opts.selectable;
        }

        public initialize(dtSettings): void {
            this.dt.settings = dtSettings;
            this.dt.api = dtSettings.oInstance.api();
            dtSettings._DT_SelectedRowsCached = [];

            //TODO: selectable columns


        }

        public destroy(): void {
            this.table = null;
            this.dt = null;
        }

        public tableCreated(api): void {
            this.dt.api = api; //not the same instance???
            Object.defineProperty(api, "selectedRows", {
                get: () => this.dt.settings._DT_SelectedRowsCached || []
            });
        }

        public tableCreating(): void {
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
            settings.fnRowSelected = (nodes: Element[]) => {
                this.resetSelectableCache();
                //We have to digest the parent table scope in order to refresh bindings that are related to datatable instance
                if (!tblScope.$parent.$$phase)
                    tblScope.$parent.$digest();

                //Call the original fn
                if (angular.isFunction(origPostSelected))
                    origPostSelected(nodes);
            };

            var origPostDeselected = settings.fnRowDeselected;
            settings.fnRowDeselected = (nodes: Element[]) => {
                this.resetSelectableCache();
                //We have to digest the parent table scope in order to refresh bindings that are related to datatable instance
                if (!tblScope.$parent.$$phase)
                    tblScope.$parent.$digest();

                //Call the original fn
                if (angular.isFunction(origPostDeselected))
                    origPostDeselected(nodes);
            };

            table.settings.rowsRemoved.push(() => {
                this.resetSelectableCache();
            });
        }

        private resetSelectableCache() {
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
        }
    }

    //Register plugin
    TableController.registerPlugin(SelectableTablePlugin);

    //#endregion

}