//RowDetails plugin
angular.module("dt")
    .config([
        "dtSettings", (dtSettings) => {
            dtSettings.dtColumnParsingActions.push((elem, column) => {
                if (elem.attr('dt-row-detail-icon') != null) {
                    column.iconColumn = true;
                }
            });
            dtSettings.dtTableCreatingActions.push(($element, options, scope, attrs, $compile) => {
                if (!options.rowDetails) return;
                var rdSettings = options.rowDetails;
                //#region RowDetails

                var columns = options.columns || options.columnDefs;
                //Icon column is not orderable
                angular.forEach(columns, (col) => {
                    if (!col.iconColumn) return;
                    col.orderable = false;
                    col.searchable = false;
                    col.type = "html";
                });

                var origCreated = rdSettings.created;
                rdSettings.created = function(row, innerDetails) {
                    var rowScope = angular.element(row.node()).scope();
                    $compile(row.child())(rowScope);
                    rowScope.$digest();
                    if (angular.isFunction(origCreated))
                        origCreated.call(this, row, innerDetails);
                };
                var origClosed = rdSettings.closed;
                options.rowDetailClosed = function(row, icon) {
                    var rowScope = angular.element(row.node()).scope();
                    rowScope.$digest();
                    if (angular.isFunction(origClosed))
                        origClosed.call(this, row, icon);
                };

                var origOpened = rdSettings.opened;
                options.rowDetailOpened = function (row, icon) {
                    var rowScope = angular.element(row.node()).scope();
                    rowScope.$digest();
                    if (angular.isFunction(origOpened))
                        origOpened(this, row, icon);
                };

                //#endregion
            });
        }
    ]); 