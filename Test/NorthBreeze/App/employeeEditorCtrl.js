app.controller('EmployeeEditorCtrl', function ($scope, $window, $location) {

    app.dataservice.getAllEmployees()
        .then(querySucceeded)
        .fail(queryFailed);

    $scope.options = {
        paging: true,
        lengthChange: true,
        searching: true,
        info: true,
        autoWidth: true,
        deferRender: true,
        order: [],
        /*
        rowDetails: {
            icon: {
                openHtml: '<span class="glyphicon glyphicon-plus row-detail-icon"></span>',
                closeHtml: '<span class="glyphicon glyphicon-minus row-detail-icon"></span>',
                'class': 'row-detail-icon',
            }
        },*/
        tableTools: {
            "sRowSelect": "os",
            "sSwfPath": "libs/datatables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
            "aButtons": ["editable_restore_deleted", "editable_delete", "editable_add", "editable_reject", "copy", "pdf", "select_all", "select_none"]
        },
        breezeEditable: {
            collectionProperty: "Orders",
            parentEntity: function() {
                return $scope.employee;
            }
        },
        dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" +
        "T" + //TableTools
        "Y" + //Entity Filter
        //"D" + //RowDetails
        "X" + //BreezeEdiatble
        "C" + //ColVis
        "t" +
		"<'row'<'col-xs-6'i><'col-xs-6'p>>R"

    };

    //#region private functions
    function querySucceeded(data) {
        $scope.employee = data.results[0];
        $scope.$digest();
        $scope.employee.entityAspect.loadNavigationProperty("Orders")
                .then(function (json) {
                    console.log($scope.employee.Orders);
                    $scope.ordersLoaded = true;
                    $scope.$digest();
                })
                .catch(function (error) {
                    throw error;
                });
        app.logger.info("Fetched " + data.results.length + " Orders ");
    }

    function queryFailed(error) {
        logger.error(error.message, "Query failed");
    }
    //#endregion

});