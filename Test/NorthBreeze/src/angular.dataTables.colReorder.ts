//ColReorder plugin
angular.module("dt")
    .config([
        "dtSettings", (dtSettings) => {

            dtSettings.dtGetColumnIndexFuncs.push((options, dataTable, columns, idx) => {
                if (dataTable == null) {
                    var order = (options.colReorder || {})['order'];
                    return order == null ? idx : order[idx];
                }
                var aoColumns = dataTable.settings()[0].aoColumns;
                var origIdx = aoColumns[idx]._ColReorder_iOrigCol;
                return origIdx == null ? idx : origIdx; //origIdx is null when ColReorder plugin is not active
            });
        }
    ]);  