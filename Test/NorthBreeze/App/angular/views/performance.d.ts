declare module app.AngularExamples {
    class PerformanceController {
        public $scope: any;
        private numItems;
        public options: any;
        public data: any[];
        static $inject: string[];
        constructor($scope: any);
        private initialize();
        public addItem(): void;
        public removeItem(items: any): void;
    }
}
