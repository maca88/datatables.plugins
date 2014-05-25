app.controller('BrowserCtrl', function ($scope, $window, $location) {

    function getUrlParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
        return null;
    };

    var idx = 0;
    var itemCount = !!getUrlParameter('itemcount') ? parseInt(getUrlParameter('itemcount')) : 1000;
    var getNewItem = function () {
        var item = {
            "engine": "Trident" + idx,
            "browser": "Internet Explorer 4.0" + idx,
            "platform": "Win 95+" + idx,
            "version": "4" + idx,
            "grade": "X" + idx
        };
        idx++;
        return item;
    };

    $scope.addItem = function () {
        $scope.data.push(getNewItem());
    };

    $scope.addItemViaDt = function() {
        $scope.dtTable.row.add(getNewItem());
    };

    $scope.removeItem = function (index) {
        $scope.data.splice(index, 1);
    };

    $scope.swapItems = function () {
        $scope.swapItemsFromTo(0, 1);
    };

    $scope.swapItemsFromTo = function (x, y) {
        var b = $scope.data[x];
        $scope.data[x] = $scope.data[y];
        $scope.data[y] = b;
    };

    var eIdx = 30;
    $scope.editRandomItem = function () {
        $scope.data[eIdx].engine = "1" + $scope.data[eIdx].engine;
        $scope.dtTable.row(eIdx).invalidate(); //manual invalidation for items that has not been rendered yet
        eIdx++;
    };

    $scope.editItem = function (item) {
        $scope.data[item.index].engine = "1" + $scope.data[item.index].engine;
    };

    $scope.removeItemViaDt = function (item) {
        $scope.dtTable.row(item.index).remove();
    };

    $scope.canRemoveItem = function () {
        return $scope.dtTable.selectedRows.length > 0;
    }


    var data = [];
    for (var i = 0; i < itemCount; i++) {

        var subItems = [];

        for (var j = 0; j < i; j++) {
            subItems.push({
                prop1: "test" + j
            });
        }
        data.push({
            "engine": "Trident" + i,
            "browser": "Internet Explorer 4.0" + i,
            "platform": "Win 95+" + i,
            "version": "4" + i,
            "grade": "X" + i,
            "subItems": subItems
        });


    }
    $scope.data = data;

    $scope.subItemOptions = {}

    $scope.options = {
        stateSave: false,
        paging: true,
        lengthChange: true,
        searching: true,
        info: true,
        autoWidth: true,
        deferRender: true,
        order: [],
        lengthMenu: [
            [10, 25, 50, 100, 200, -1],
            [10, 25, 50, 100, 200, "All"]
        ],
        columns: [
            { iconColumn: true },
            { data: "engine", title: "Engine", className: "text-right" },
            { data: "browser", title: "Browser" },
            { data: "platform", title: "Platform" },
            { data: "version", title: "Version" },
            { data: "grade", title: "Grade" },
            { template: "#options-tpl" }
        ],
        rowDetails: {
            icon: {
                openHtml: '<span class="glyphicon glyphicon-plus row-detail-icon"></span>',
                closeHtml: '<span class="glyphicon glyphicon-minus row-detail-icon"></span>',
                'class': 'row-detail-icon',
            }
        },
        tableTools: {
            "sRowSelect": "os",
            "sSwfPath": "libs/datatables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
            "aButtons": ["copy", "pdf", "select_all", "select_none"]
        },
        dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" +
        "T" + //TableTools
        "D" + //RowDetails
        "C" + //ColVis
        "t" +
		"<'row'<'col-xs-6'i><'col-xs-6'p>>R"

    };
});