var app = angular.module('app', ['dt']);


app.controller('IndexController', function ($scope, $window, $location) {

    function getUrlParameter(sParam)
    {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) 
        {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) 
            {
                return sParameterName[1];
            }
        }
    };

    var idx = 0;
    var itemCount = !!getUrlParameter('itemcount') ? parseInt(getUrlParameter('itemcount')) : 100;
    $scope.addItem = function() {
        $scope.data.push(
            {
                "engine": "Trident" + idx,
                "browser": "Internet Explorer 4.0" + idx,
                "platform": "Win 95+" + idx,
                "version": "4" + idx,
                "grade": "X" + idx
            }
        );
        idx++;
    };

    $scope.removeItem = function (rowIndex) {
        $scope.data.splice(rowIndex, 1);
    };

    $scope.canRemoveItem = function () {
        var rowIndex = parseInt($scope.rowIndex);
        return angular.isNumber(rowIndex) && rowIndex < $scope.data.length;
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
            { data: "engine" },
            { data: "browser" },
            { data: "platform" },
            { data: "version" },
            { data: "grade" }
        ],
        rowDetails: {
            icon: {
                openHtml: '<span class="glyphicon glyphicon-plus row-detail-icon"></span>',
                closeHtml: '<span class="glyphicon glyphicon-minus row-detail-icon"></span>',
                'class': 'row-detail-icon',
            }
        },
        dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" +
        "D" + //RowDetails
        "C" + //ColVis
        "t" +
		"<'row'<'col-xs-6'i><'col-xs-6'p>>R"
        
    };
});