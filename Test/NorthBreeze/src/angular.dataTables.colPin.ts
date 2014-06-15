//fixedColumns plugin
angular.module("dt")
    .config(["dtSettings", (dtSettings) => {

        dtSettings.dtTableCreatingActions.push(($element, options, scope, attrs, $compile) => {

            $element.on('colPinFcDestroying.dt', (e, colPin) => {
            });

            var linkTable = (table) => {
                if (!table) return;
                $('tr>td', table).each((i, td) => {
                    var $td = $(td);
                    var cellScope = (<any>$td).scope();
                    if (!cellScope) return;
                    $compile($td)(cellScope);
                });
            };

            $element.on('colPinFcDraw.dt', (e, colPin, data) => {
                linkTable(data.leftClone.body);
                linkTable(data.rightClone.body);
            });
        });
}]);