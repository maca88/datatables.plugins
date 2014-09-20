module dt.selectable {
    
    //#region Selectable plugin

    export class SelectableTablePlugin implements ITablePlugin {

        private tableController: ITableController;
        private dt = {
            api: null,
            settings: null
        };
        private $timeout;
        private settings;

        public static defaultSettings = {
            column: {
                template: '<input type="checkbox" ng-checked="$selected"/>',
                className: '',
                width: '20px',
                headerTemplate: '<input type="checkbox" ng-model="$table.allRowsSelected" />'
            }
        };

        public static $inject = ['tableController', '$timeout'];
        constructor(tableController: ITableController, $timeout) {
            this.tableController = tableController;
            this.$timeout = $timeout;
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
                },
                {
                    event: TableController.events.rowPreLink,
                    fn: this.rowPreLink,
                    scope: this
                }
            ];
        }

        public name: string = 'selectable';

        public static isEnabled(settings): boolean {
            var ttSettings = settings.tableTools || {};
            var selectable = settings.selectable;
            return (settings.dom && settings.dom.indexOf('T') >= 0 && ttSettings.sRowSelect != null && ttSettings.sRowSelect !== 'none')
                || selectable;
        }

        public initialize(dtSettings): void {
            this.dt.settings = dtSettings;
            this.dt.api = dtSettings.oInstance.api();
            dtSettings._DT_SelectedRowsCached = [];
        }

        public destroy(): void {
            this.tableController = null;
            this.dt = null;
        }

        public tableCreated(event: ng.IAngularEvent, api): void {
            this.dt.api = api; //not the same instance???
            Object.defineProperty(api, "selectedRows", {
                get: () => this.dt.settings._DT_SelectedRowsCached || []
            });

            Object.defineProperty(api, "toggleRowsSelection", {
                get: () => this.dt.api.allRowsSelected = !this.dt.api.allRowsSelected
            });

            Object.defineProperty(api, "allRowsSelected", {
                get: () => this.dt.settings.aoData.length === this.dt.api.selectedRows.length,
                set: (value) => {
                    var tt = this.dt.api.tabletools();
                    if (value)
                        tt.fnSelectAll();
                    else
                        tt.fnSelectNone();
                }
            }); 
        }

        public tableCreating(event: ng.IAngularEvent): void {
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
                        selCol.templateHtml = this.settings.column.template;;
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
            var deselectRows = function() {
                // Mark them as deselected
                for (i = 0, len = deselectingRows.length; i < len; i++) {
                    deselectingRows[i]._DTTT_selected = false;
                    if (deselectingRows[i].nTr) {
                        $(deselectingRows[i].nTr).removeClass(this.classes.select.row);
                    }
                }
                deselectingRows.length = 0;
            };
            settings.fnPreRowSelect = function (e, nodes, select) {
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
                    that.$timeout(() => {
                        if (gotDeselectEvent) {
                            gotDeselectEvent = false;
                            return;
                        }
                        deselectRows.call(this);
                    }, 100);

                    return false;
                }

                if (!e && (!nodes || !nodes.length))
                    return result;

                var target = e ? e.target : nodes[0];
                return that.canChangeSelection(target) === false ? false : result;
            };

            var origPostSelected = settings.fnRowSelected;
            settings.fnRowSelected = function (nodes: Element[]) {
                that.resetSelectableCache();
                //We have to digest the parent table scope in order to refresh bindings that are related to datatable instance
                if (!tblScope.$parent.$$phase)
                    tblScope.$parent.$digest();

                //Call the original fn
                if (angular.isFunction(origPostSelected))
                    origPostSelected.call(this, nodes);
            };

            var origPostDeselected = settings.fnRowDeselected;
            settings.fnRowDeselected = function (nodes: Element[]) {
                that.resetSelectableCache();
                //We have to digest the parent table scope in order to refresh bindings that are related to datatable instance
                if (!tblScope.$parent.$$phase)
                    tblScope.$parent.$digest();

                //Call the original fn
                if (angular.isFunction(origPostDeselected))
                    origPostDeselected.call(this, nodes);
            };

            table.settings.rowsRemoved.push(() => {
                this.resetSelectableCache();
            });
        }


        private canChangeSelection(node) {
            var cell = $(node).closest('td');
            var cellIdx = cell.index();
            var col = null;
            var visCol = 0;
            var columns = this.dt.settings.aoColumns;
            for (var i = 0; i < columns.length; i++) {
                if (!columns[i].bVisible) continue;
                if (visCol === cellIdx) {
                    col = columns[i];
                    break;
                }
                visCol++;
            }
            return (col && col.selectable === false) ? false : true;
        }

        private rowPreLink(event: ng.IAngularEvent, args: IRowPreLinkArgs) {
            Object.defineProperty(args.scope, '$selected', {
                get: function () {
                    return this.$rowData._DTTT_selected;
                }
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
    TableController.registerPlugin(SelectableTablePlugin.isEnabled, SelectableTablePlugin);

    //#endregion

}

(function (window, document, undefined) {

    $.fn.DataTable.Api.register('toggleRowSelection()', function () {
        this.allRowsSelected = !(this.allRowsSelected);
    });

} (window, document, undefined));