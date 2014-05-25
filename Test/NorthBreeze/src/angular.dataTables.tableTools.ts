//tableTools plugin
angular.module("dt")
    .config(["dtSettings", (dtSettings) => {

        var resetCache = function() {
            var cache = [];
            var settings = this.settings()[0];
            var data = settings.aoData;
            var i, iLen;
            for (i = 0, iLen = data.length; i < iLen; i++) {
                if (data[i]._DTTT_selected) {
                    var dtRow = this.row(i);
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

        //We have to remove the selected row/cell if the selected cell will be removed
        dtSettings.dtTableCreatingActions.push(($element, options, scope, attrs, $compile, $rootScope) => {
            if (options.dom == null || options.dom.indexOf("T") < 0) return;
            var tblScope: any = $element.scope();
            if (!options.tableTools)
                options.tableTools = {};

            var settings = options.tableTools;
            var origPostSelected = settings.fnRowSelected;
            settings.fnRowSelected = function (nodes: Element[], src: any) {
                resetCache.call(this.s.dt.oInstance.api());

                //We have to digest the parent table scope in order to refresh bindings that are related to datatable instance
                if (!tblScope.$parent.$$phase)
                    tblScope.$parent.$digest();

                //Call the original fn
                if (angular.isFunction(origPostSelected))
                    origPostSelected(nodes, src);
            };

            var origPostDeselected = settings.fnRowDeselected;
            settings.fnRowDeselected = function (nodes: Element[], src: any) {
                resetCache.call(this.s.dt.oInstance.api());

                //We have to digest the parent table scope in order to refresh bindings that are related to datatable instance
                if (!tblScope.$parent.$$phase)
                    tblScope.$parent.$digest();

                //Call the original fn
                if (angular.isFunction(origPostDeselected))
                    origPostDeselected(nodes, src);
            };

        });

        dtSettings.dtRowsRemovedActions.push(function(items) {
            resetCache.call(this);
        });

        dtSettings.dtTableCreatedActions.push((dataTable, $element, options, scope, attrs, $compile) => {
            if (dataTable.settings()[0].aanFeatures['T'] === undefined) return;

            Object.defineProperty(dataTable, "selectedRows", {
                get: function () {
                    return this.settings()[0]._DT_SelectedRowsCached || [];
                }
            });
        });
}]); 