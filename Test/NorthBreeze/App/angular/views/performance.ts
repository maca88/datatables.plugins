module app.AngularExamples {
    
    export class PerformanceController {
        public $scope: any;

        private numItems: number = 50000;
        public options;
        public data = [];

        public static $inject = ["$scope"];
        constructor($scope) {
            $scope.vm = this;
            this.$scope = $scope;
            this.initialize();
        }

        private initialize() {
            console.time('generateData');
            for (var i = 0; i < this.numItems; i++) {
                this.data.push([i, i, i, i, i]);
            }
            console.timeEnd('generateData');

            this.options = {
                deferRender: true,
                dom: "TfrtiSJ",
                scrollY: 200,
                scrollCollapse: true,
                stateSave: true,
                //scrollX: true,
                tableTools: {
                    "sRowSelect": "os",
                    "sSwfPath": "libs/datatables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
                    "aButtons": []
                },
            };
        }

        public addItem() {
            this.numItems++;
            this.data.push([this.numItems, this.numItems, this.numItems, this.numItems, this.numItems]);
        }

        public removeItem(items) {
            (<any>window).angular.forEach(items.sort((a, b) => { return b.index - a.index; }), (item) => {
                this.data.splice(item.index, 1);
            });
        }
    }
}

angular.module("app").controller("AngularExamples.PerformanceController", app.AngularExamples.PerformanceController);