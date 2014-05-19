app.controller('PerformanceCtrl', function ($scope, $window, $location) {

    console.time('generateData');
    var data = [];
    for (var i = 0 ; i < 50000 ; i++) {
        data.push([i, i, i, i, i]);
    }
    console.timeEnd('generateData');

    $scope.options = {
        data: data,
        deferRender: true,
        dom: "frtiS",
        scrollY: 200,
        scrollCollapse: true,
    };
    /*
    console.time('DataTableWoAngular');
    $('#example').DataTable({
        data: data,
        deferRender: true,
        dom: "frtiS",
        scrollY: 200,
        scrollCollapse: true
    });
    console.timeEnd('DataTableWoAngular');
    */
});