app.controller('PerformanceCtrl', function ($scope, $window, $location) {

    console.time('generateData');
    var numItems = 50000;
    var data = [];
    for (var i = 0 ; i < 50000 ; i++) {
        data.push([i, i, i, i, i]);
    }
    console.timeEnd('generateData');

    $scope.options = {
        deferRender: true,
        dom: "TfrtiS",
        scrollY: 200,
        scrollCollapse: true,
        tableTools: {
            "sRowSelect": "os",
            "sSwfPath": "libs/datatables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
            "aButtons": ["copy", "pdf", "select_all", "select_none"]
        },
    };

    $scope.data = data;

    $scope.addItem = function () {
        numItems++;
        $scope.data.push([numItems, numItems, numItems, numItems, numItems]);
    };

    $scope.removeItem = function (items) {
        angular.forEach(items.sort(function(a, b) { return b.index - a.index; }), function(item) {
            $scope.data.splice(item.index, 1);
        });
    }

});