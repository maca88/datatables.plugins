angular.module("dt").config([
    "dtSettings", function (dtSettings) {
        dtSettings.dtColumnParsingCallbacks.push(function (elem, column) {
            if (elem.attr('dt-row-detail-icon') != null) {
                column.iconColumn = true;
                column.orderable = false;
            }
        });
        dtSettings.dtTableCreatingCallbacks.push(function ($element, options, scope, attrs, $compile) {
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
                if (angular.isFunction(origRowDetailDestroying))
                    origRowDetailCreated(row);
            };
        });
    }
]);
