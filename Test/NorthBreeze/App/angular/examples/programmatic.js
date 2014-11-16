angular.module('app', ['dt']).controller('mainController', function ($scope) {
    $scope.options = {
        ajax: '../../../customers.txt',
        debug: true,
        columns: [
            { title: 'Name' },
            { title: 'Position' },
            { title: 'Office' },
            { title: 'Age' },
            { title: 'Start date' },
            { title: 'Salary' },
            { title: 'Name + Age', expression: "data[0] + ' ' + data[3]" }
        ]
    };
});
