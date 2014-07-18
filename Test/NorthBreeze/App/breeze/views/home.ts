module app.BreezeExamples {
    
    export class HomeController {
        
        private dataservice: any;
        private $scope: any;

        public changedEntities;

        public static $inject = ["$scope", "breezedataservice"];
        constructor($scope, breezedataservice) {
            $scope.vm = this;
            this.$scope = $scope;
            this.dataservice = breezedataservice;
            this.changedEntities = this.dataservice.getChanges();
            this.dataservice.subscribeChanges(this.onEntityChange.bind(this));
        }

        public reset() {
            this.dataservice.rejectChanges();
        }

        public update() {
            this.dataservice.saveChanges();
        }

        public onEntityChange(changeargs: any) {
            this.changedEntities = this.dataservice.getChanges();
        }
    }

}

angular.module("app").controller("BreezeExamples.HomeController", app.BreezeExamples.HomeController);