declare module app.JayDataExamples {
    class HomeController {
        private dataservice;
        private $scope;
        public trackedEntities: any;
        static $inject: string[];
        constructor($scope: any, jaydataservice: any);
        public reset(): void;
        public getStateName(state: any): string;
        public getChangedEntities(): any[];
        public getPropertyErrors(entity: any, property: any): any[];
        public getEntityKey(entity: any): {};
        public update(): void;
    }
}
