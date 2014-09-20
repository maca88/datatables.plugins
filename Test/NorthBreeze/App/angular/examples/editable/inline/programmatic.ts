
angular.module('app', ['dt'])
    .controller('mainController', ($scope) => {

        $scope.grades = [
            { value: 'X1', name: 'X1' },
            { value: 'X2', name: 'X2' },
            { value: 'X3', name: 'X3' },
        ];

        $scope.data = [];
        for (var i = 0; i < 100; i++) {
            $scope.data.push({
                "engine": "Trident" + i,
                "browser": "Internet Explorer 4.0" + i,
                "platform": "Win 95+" + i,
                "version": 4 + i,
                "grade": "X1",
                "date": new Date()
            });
        }

        $scope.options = {
            columns: [
                { data: "engine", title: "Engine", type: "string", editable: {validators: {'required': true} } },
                { data: "browser", title: "Browser", type: "string", editable: { validators: { 'minlength': 3 } } },
                { data: "platform", title: "Platform", type: "string" },
                { data: "version", title: "Version", type: "number" },
                {
                    data: "grade", title: "Grade", type: "string",
                    editable: {
                        type: "select",
                        ngOptions: 'item.value as item.name for item in grades'
                    }
                },
                { data: "date", title: "Date", type: "datetime",  expression: "data.date | date:'short'" },
                {
                    title: "Options", commands: [
                    'edit',
                    {
                        name: 'remove',
                        settings: {
                            visibleWhen: '$rowIndex % 2 == 0',
                            executing: (callback) => {
                                if (confirm('Do you really want to remove the item?'))
                                    callback();
                            }
                        }
                    },
                    'reject'
                ]
                }
            ],
            deferRender: true,
            order: [],
            editable: {
                editor: {
                    type: dt.editable.InlineEditor
                }
            }
        };
    }
    );


