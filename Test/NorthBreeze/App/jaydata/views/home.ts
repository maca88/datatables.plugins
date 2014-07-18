module app.JayDataExamples {
    
    export class HomeController {
        
        private dataservice: any;
        private $scope: any;

        public trackedEntities;

        public static $inject = ["$scope", "jaydataservice"];
        constructor($scope, jaydataservice) {
            $scope.vm = this;
            this.$scope = $scope;
            this.dataservice = jaydataservice;
            this.trackedEntities = this.dataservice.stateManager.trackedEntities;
        }

        public reset() {
            angular.forEach(this.getChangedEntities(), entity => {
                //entity.resetChanges();
                entity.refresh().then(() => {
                    entity.entityState = (<any>$data).EntityState.Unchanged;
                    if (!this.$scope.$$phase) this.$scope.$apply();
                });
            });
        }

        public getStateName(state) {
            switch (state) {
                case (<any>$data).EntityState.Detached:
                    return 'Detached';
                case (<any>$data).EntityState.Unchanged:
                    return 'Unchanged';
                case (<any>$data).EntityState.Added:
                    return 'Added';
                case (<any>$data).EntityState.Modified:
                    return 'Modified';
                case (<any>$data).EntityState.Deleted:
                    return 'Deleted';
                default:
                    return 'NotTracked';
            }
        }

        public getChangedEntities() {
            var changed = [];
            angular.forEach(this.trackedEntities, track => {
                if (track.data.entityState &&
                    track.data.entityState !== (<any>$data).EntityState.Unchanged &&
                    track.data.entityState !== (<any>$data).EntityState.Detached)
                    changed.push(track.data);
                
            });
            return changed;
        }

        public getPropertyErrors(entity, property) {
            var pErrors = [];
            var eType = entity.getType();
            var mDef = eType.getMemberDefinition(property);
            angular.forEach(entity.ValidationErrors, err => {
                if (err.PropertyDefinition != mDef) return;
                pErrors.push(err);
            });
            return pErrors;
        }

        public getEntityKey(entity) {
            var eType = entity.getType();
            var key = {};
            angular.forEach(eType.getFieldNames(), m => {
                var mDef = eType.getMemberDefinition(m);
                if (mDef.key !== true) return;
                key[m] = entity[m];
            });
            return key;
        }

        public update() {
            this.dataservice.saveChanges();
        }

    }

}

angular.module("app").controller("JayDataExamples.HomeController", app.JayDataExamples.HomeController);