declare module app.BreezeExamples {
    class EmployeeController {
        private dataservice;
        private $scope;
        public employee: any;
        public options: any;
        public ordersLoaded: any;
        static $inject: string[];
        constructor($scope: any, dataservice: any);
        private initialize();
        private onEmployeesLoaded(data);
        public rejectChanges(): void;
        public saveChanges(): void;
    }
}
