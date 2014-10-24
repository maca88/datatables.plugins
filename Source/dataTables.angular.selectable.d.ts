declare module dt.selectable {
    class SelectableTablePlugin implements ITablePlugin {
        private tableController;
        private dt;
        private $timeout;
        private settings;
        static defaultSettings: {
            column: {
                template: string;
                className: string;
                width: string;
                headerTemplate: string;
            };
        };
        static $inject: string[];
        constructor(tableController: ITableController, $timeout: any);
        public getEventListeners(): IEventListener[];
        public name: string;
        static isEnabled(settings: any): boolean;
        public initialize(dtSettings: any): void;
        public destroy(): void;
        public tableCreated(event: ng.IAngularEvent, api: any): void;
        public tableCreating(event: ng.IAngularEvent): void;
        private canChangeSelection(node);
        private rowPreLink(event, args);
        private resetSelectableCache();
    }
}
