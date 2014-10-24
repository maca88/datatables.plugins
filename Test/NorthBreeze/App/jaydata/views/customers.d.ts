declare module app.JayDataExamples {
    class CustomerController {
        static $inject: string[];
        public dataservice: any;
        private $scope;
        public customerOrdersGridOpts: {};
        public customerGridOpts: any;
        constructor($scope: any, jaydataservice: any);
        private initialize();
        public getStateName(state: any): string;
        public reset(customer: any): void;
        public update(customer: any): void;
    }
}
