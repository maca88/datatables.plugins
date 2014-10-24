declare module app.BreezeExamples {
    class CustomerController {
        static $inject: string[];
        public dataservice: any;
        private $scope;
        public customerOrdersGridOpts: {};
        public customerGridOpts: any;
        constructor($scope: any, breezedataservice: any);
        private initialize();
        public reset(customer: any): void;
        public update(customer: any): void;
    }
}
