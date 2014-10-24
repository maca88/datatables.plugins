declare module app.AngularExamples {
    class BrowsersController {
        public $scope: any;
        private idx;
        private eIdx;
        public options: any;
        public subItemOptions: {};
        public data: any[];
        public versions: any;
        public versionGroups: any;
        static $inject: string[];
        constructor($scope: any);
        private initialize();
        public getNewItem(): {
            "engine": string;
            "browser": string;
            "platform": string;
            "version": number;
            "date": Date;
            "grade": string;
        };
        public addItem(): void;
        public addItemViaDt(): void;
        public removeItem(index: any): void;
        public swapItems(): void;
        public swapItemsFromTo(x: any, y: any): void;
        public editRandomItem(): void;
        public editItem(item: any): void;
        public removeItemViaDt(item: any): void;
        public canRemoveItem(): boolean;
    }
}
