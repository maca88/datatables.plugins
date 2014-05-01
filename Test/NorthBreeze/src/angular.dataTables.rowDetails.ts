//RowDetails plugin
angular.module("dt")
    .config([
        "dtSettings", (dtSettings) => {
            dtSettings.dtColumnParsingCallbacks.push((elem, column) => {
                if (elem.attr('dt-row-detail-icon') != null) {
                    column.iconColumn = true;
                    column.orderable = false;
                }
            });
            dtSettings.dtTableCreatingCallbacks.push(($element, options, scope, attrs, $compile) => {
                //#region RowDetails

                var origRowDetailCreated = options.rowDetailCreated;
                options.rowDetailCreated = (row, innerDetails, detailSettings) => {
                    var tplSelector = $element.attr('dt-row-detail-tpl');
                    if (!tplSelector) return;
                    var rowScope = angular.element(row.node()).scope();
                    var tpl = $(tplSelector).clone().removeAttr('ng-non-bindable').show();
                    innerDetails.html(tpl);
                    $compile(row.child())(rowScope);
                    rowScope.$apply();
                    if (angular.isFunction(origRowDetailCreated))
                        origRowDetailCreated(row, innerDetails, detailSettings);
                };
                var origRowDetailClosed = options.rowDetailClosed;
                options.rowDetailClosed = (row) => {
                    var rowScope = angular.element(row.node()).scope();
                    rowScope.$apply();
                    if (angular.isFunction(origRowDetailClosed))
                        origRowDetailClosed(row);
                };

                var origRowDetailOpened = options.rowDetailOpened;
                options.rowDetailOpened = (row) => {
                    var rowScope = angular.element(row.node()).scope();
                    rowScope.$apply();
                    if (angular.isFunction(origRowDetailOpened))
                        origRowDetailOpened(row);
                };

                var origRowDetailDestroying = options.rowDetailDestroying;
                options.rowDetailDestroying = (row) => {
                    //TODO: check if needed to destroy nested dtTables scopes
                    if (angular.isFunction(origRowDetailDestroying))
                        origRowDetailCreated(row);
                };

                //#endregion
            });
        }
    ]); 