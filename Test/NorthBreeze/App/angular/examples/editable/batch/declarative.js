angular.module('app', ['dt']).controller('mainController', function ($scope) {
    $scope.grades = [
        { value: 'X1', name: 'X1' },
        { value: 'X2', name: 'X2' },
        { value: 'X3', name: 'X3' }
    ];

    $scope.data = [];
    for (var i = 0; i < 100; i++) {
        $scope.data.push({
            "engine": "Trident" + i,
            "browser": "Internet Explorer 4.0" + i,
            "platform": "Win 95+" + i,
            "version": 4 + i,
            "grade": 'X1',
            "date": new Date()
        });
    }

    $scope.removeCommandSettings = {
        visibleWhen: '$rowIndex % 2 == 0',
        executing: function (callback) {
            if (confirm('Do you really want to remove the item?'))
                callback();
        }
    };
});
