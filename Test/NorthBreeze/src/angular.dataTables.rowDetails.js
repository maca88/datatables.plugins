//RowDetails plugin
angular.module("dt").config([
    "dtSettings", function (dtSettings) {
        dtSettings.dtColumnParsingCallbacks.push(function (elem, column) {
            if (elem.attr('dt-row-detail-icon') != null) {
                column.iconColumn = true;
            }
        });
        dtSettings.dtTableCreatingCallbacks.push(function ($element, options, scope, attrs, $compile) {
            //#region RowDetails
            var columns = options.columns || options.columnDefs;

            //Icon column is not orderable
            angular.forEach(columns, function (col) {
                if (!col.iconColumn)
                    return;
                col.orderable = false;
                col.searchable = false;
                col.type = "html";
            });

            var origRowDetailCreated = options.rowDetailCreated;
            options.rowDetailCreated = function (row, innerDetails, detailSettings) {
                var tplSelector = $element.attr('dt-row-detail-tpl');
                if (!tplSelector)
                    return;
                var rowScope = angular.element(row.node()).scope();
                var tpl = $(tplSelector).clone().removeAttr('ng-non-bindable').show();
                innerDetails.html(tpl);
                $compile(row.child())(rowScope);
                rowScope.$apply();
                if (angular.isFunction(origRowDetailCreated))
                    origRowDetailCreated(row, innerDetails, detailSettings);
            };
            var origRowDetailClosed = options.rowDetailClosed;
            options.rowDetailClosed = function (row) {
                var rowScope = angular.element(row.node()).scope();
                rowScope.$apply();
                if (angular.isFunction(origRowDetailClosed))
                    origRowDetailClosed(row);
            };

            var origRowDetailOpened = options.rowDetailOpened;
            options.rowDetailOpened = function (row) {
                var rowScope = angular.element(row.node()).scope();
                rowScope.$apply();
                if (angular.isFunction(origRowDetailOpened))
                    origRowDetailOpened(row);
            };

            var origRowDetailDestroying = options.rowDetailDestroying;
            options.rowDetailDestroying = function (row) {
                //TODO: check if needed to destroy nested dtTables scopes
                if (angular.isFunction(origRowDetailDestroying))
                    origRowDetailCreated(row);
            };
            //#endregion
        });
    }
]);
//# sourceMappingURL=angular.dataTables.rowDetails.js.map
