declare module dt {
    interface IRowDetailsBindingAdapter {
        rowCreated(row: any, rowDetails: any): void;
        rowExpanded(row: any, rowDetails: any, iconCell: any): void;
        rowCollapsed(row: any, rowDetails: any, iconCell: any): void;
        destroyDetails(details: any): void;
        cacheTemplate(url: string, template: string): void;
        getTemplate(url: string): string;
    }
    class AngularRowDetailsAdapter implements IRowDetailsBindingAdapter {
        private dt;
        private settings;
        private $templateCache;
        constructor(api: any, settings: any);
        public rowCreated(row: any, rowDetails: any): void;
        public rowExpanded(row: any, rowDetails: any, iconCell: any): void;
        public rowCollapsed(row: any, rowDetails: any, iconCell: any): void;
        public cacheTemplate(url: string, template: string): void;
        public getTemplate(url: string): string;
        public destroyDetails(details: any): void;
    }
    class RowDetails {
        static defaultSettings: {
            animation: string;
            icon: {
                className: string;
                closeHtml: string;
                openHtml: string;
                loadingHtml: string;
                defaultHtml: string;
                hasIcon: (row: any) => boolean;
            };
            cell: {
                className: string;
            };
            behavior: string;
            destroyOnClose: boolean;
            buttonPanel: {
                attrs: {};
                classes: any[];
            };
            buttons: {
                expandAll: {
                    visible: boolean;
                    tagName: string;
                    html: any;
                    attrs: {};
                    classes: any[];
                    click: (e: any) => void;
                };
                collapseAll: {
                    visible: boolean;
                    tagName: string;
                    html: any;
                    attrs: {};
                    classes: any[];
                    click: (e: any) => void;
                };
            };
            row: {
                expandClass: string;
                collapseClass: string;
            };
            expandRow: {
                trClass: string;
                tdClass: string;
            };
            rowCreated: any;
            rowExpanded: any;
            rowDestroying: any;
            rowCollapsed: any;
            bindingAdapter: any;
            template: any;
            language: {
                'collapseAll': string;
                'expandAll': string;
            };
        };
        static templates: {};
        public settings: any;
        public dt: any;
        public destroying: boolean;
        public initialized: boolean;
        public dom: any;
        public events: string[];
        public bindingAdapterInstance: IRowDetailsBindingAdapter;
        public lastOpenedRow: any;
        constructor(api: any, settings: any);
        static intergateWithBootstrap(): void;
        static animateElement(elem: any, animation: any, action: any, completeAction?: any): void;
        private setupAdapters();
        private setupEvents();
        private setupBindingAdapter();
        private createDomElements();
        private setupButtons();
        public getFeatureElement(): any;
        public getTemplate(url: any): string;
        public hasTemplate(url: any): boolean;
        public cacheTemplate(url: any, template: any): void;
        private registerCallbacks();
        public initialize(): void;
    }
}
