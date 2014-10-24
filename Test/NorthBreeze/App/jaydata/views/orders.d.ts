declare module app.JayDataExamples {
    class OrdersController {
        private dataservice;
        private $scope;
        public orders: any[];
        public orderGridOpts: any;
        static $inject: string[];
        constructor($scope: any, jaydataservice: any);
        private initialize();
        private onOrdersLoaded(data);
        public getStateName(state: any): string;
        public setState(itemIdx: any, stateName: any): void;
    }
}
