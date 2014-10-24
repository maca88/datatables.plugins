declare module app.BreezeExamples {
    class OrdersController {
        private dataservice;
        private $scope;
        public orders: any[];
        public orderGridOpts: any;
        static $inject: string[];
        constructor($scope: any, breezedataservice: any);
        private initialize();
        private onOrdersLoaded(data);
        public setState(itemIdx: any, stateName: any): void;
    }
}
