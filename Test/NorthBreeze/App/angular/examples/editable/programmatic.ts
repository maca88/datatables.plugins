
angular.module('app', ['dt'])
    .controller('mainController', ($scope) => {

        $scope.data = [];
        for (var i = 0; i < 100; i++) {
            $scope.data.push({
                "engine": "Trident" + i,
                "browser": "Internet Explorer 4.0" + i,
                "platform": "Win 95+" + i,
                "version": 4 + i,
                "grade": "X" + i,
                "date": new Date()
            });
        }

        $scope.options = {
            columns: [
                { data: "engine", title: "Engine", type: "string" },
                { data: "browser", title: "Browser", type: "string" },
                { data: "platform", title: "Platform", type: "string" },
                { data: "version", title: "Version", type: "number" },
                { data: "grade", title: "Grade", type: "string" },
                { data: "date", title: "Date", type: "datetime",  expression: "data.date | date:'short'" },
                { title: "Options", commands: [
                    {
                        name: 'remove',
                        settings: {
                            visibleWhen: '$rowIndex % 2 == 0',
                            executing: (callback) => {
                                if (prompt('Do you really want to remove the item?'))
                                    callback();
                            }
                        }
                    },
                    'reject'
                ]
                }
            ],
            order: [],
            editable: true
        };
    }
    );


