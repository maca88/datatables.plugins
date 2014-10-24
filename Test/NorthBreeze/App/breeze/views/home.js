var app;
(function (app) {
    (function (BreezeExamples) {
        var HomeController = (function () {
            function HomeController($scope, breezedataservice) {
                $scope.vm = this;
                this.$scope = $scope;
                this.dataservice = breezedataservice;
                this.changedEntities = this.dataservice.getChanges();
                this.dataservice.subscribeChanges(this.onEntityChange.bind(this));
            }
            HomeController.prototype.reset = function () {
                this.dataservice.rejectChanges();
            };

            HomeController.prototype.update = function () {
                this.dataservice.saveChanges();
            };

            HomeController.prototype.onEntityChange = function (changeargs) {
                this.changedEntities = this.dataservice.getChanges();
            };
            HomeController.$inject = ["$scope", "breezedataservice"];
            return HomeController;
        })();
        BreezeExamples.HomeController = HomeController;
    })(app.BreezeExamples || (app.BreezeExamples = {}));
    var BreezeExamples = app.BreezeExamples;
})(app || (app = {}));

angular.module("app").controller("BreezeExamples.HomeController", app.BreezeExamples.HomeController);
