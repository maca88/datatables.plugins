//fixedColumns plugin
angular.module("dt").config([
    "dtSettings", function (dtSettings) {
        dtSettings.dtTableCreatingActions.push(function ($element, options, scope, attrs, $compile) {
            $element.on('colPinFcDestroying.dt', function (e, colPin) {
            });

            var linkTable = function (table) {
                if (!table)
                    return;
                $('tr>td', table).each(function (i, td) {
                    var $td = $(td);
                    var cellScope = $td.scope();
                    if (!cellScope)
                        return;
                    $compile($td)(cellScope);
                });
            };

            $element.on('colPinFcDraw.dt', function (e, colPin, data) {
                linkTable(data.leftClone.body);
                linkTable(data.rightClone.body);
            });
        });
    }]);
//# sourceMappingURL=angular.dataTables.colPin.js.map
