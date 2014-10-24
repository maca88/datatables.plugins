declare module app.BreezeExamples {
    class HomeController {
        private dataservice;
        private $scope;
        public changedEntities: any;
        static $inject: string[];
        constructor($scope: any, breezedataservice: any);
        public reset(): void;
        public update(): void;
        public onEntityChange(changeargs: any): void;
    }
}
