var app;
(function (app) {
    (function (JayDataExamples) {
        var HomeController = (function () {
            function HomeController($scope, jaydataservice) {
                $scope.vm = this;
                this.$scope = $scope;
                this.dataservice = jaydataservice;
                this.trackedEntities = this.dataservice.stateManager.trackedEntities;
            }
            HomeController.prototype.reset = function () {
                var _this = this;
                angular.forEach(this.getChangedEntities(), function (entity) {
                    //entity.resetChanges();
                    entity.refresh().then(function () {
                        entity.entityState = $data.EntityState.Unchanged;
                        if (!_this.$scope.$$phase)
                            _this.$scope.$apply();
                    });
                });
            };

            HomeController.prototype.getStateName = function (state) {
                switch (state) {
                    case $data.EntityState.Detached:
                        return 'Detached';
                    case $data.EntityState.Unchanged:
                        return 'Unchanged';
                    case $data.EntityState.Added:
                        return 'Added';
                    case $data.EntityState.Modified:
                        return 'Modified';
                    case $data.EntityState.Deleted:
                        return 'Deleted';
                    default:
                        return 'NotTracked';
                }
            };

            HomeController.prototype.getChangedEntities = function () {
                var changed = [];
                angular.forEach(this.trackedEntities, function (track) {
                    if (track.data.entityState && track.data.entityState !== $data.EntityState.Unchanged && track.data.entityState !== $data.EntityState.Detached)
                        changed.push(track.data);
                });
                return changed;
            };

            HomeController.prototype.getPropertyErrors = function (entity, property) {
                var pErrors = [];
                var eType = entity.getType();
                var mDef = eType.getMemberDefinition(property);
                angular.forEach(entity.ValidationErrors, function (err) {
                    if (err.PropertyDefinition != mDef)
                        return;
                    pErrors.push(err);
                });
                return pErrors;
            };

            HomeController.prototype.getEntityKey = function (entity) {
                var eType = entity.getType();
                var key = {};
                angular.forEach(eType.getFieldNames(), function (m) {
                    var mDef = eType.getMemberDefinition(m);
                    if (mDef.key !== true)
                        return;
                    key[m] = entity[m];
                });
                return key;
            };

            HomeController.prototype.update = function () {
                this.dataservice.saveChanges();
            };
            HomeController.$inject = ["$scope", "jaydataservice"];
            return HomeController;
        })();
        JayDataExamples.HomeController = HomeController;
    })(app.JayDataExamples || (app.JayDataExamples = {}));
    var JayDataExamples = app.JayDataExamples;
})(app || (app = {}));

angular.module("app").controller("JayDataExamples.HomeController", app.JayDataExamples.HomeController);
