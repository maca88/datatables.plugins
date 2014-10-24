declare module dt {
    interface IEntityFilterAdapter {
        getStateName(item: any): string;
    }
    class BreezeEntityFilterAdapter implements IEntityFilterAdapter {
        public getStateName(item: any): string;
    }
    class JayDataEntityFilterAdapter implements IEntityFilterAdapter {
        public getStateName(item: any): string;
    }
    class EntityFilter {
        static defaultSettings: {
            selectedState: string;
            adapter: any;
            states: {
                'default': {
                    'filter': string[];
                };
                'all': {
                    'filter': any[];
                };
                'added': {
                    'filter': string[];
                };
                'modified': {
                    'filter': string[];
                };
                'unchanged': {
                    'filter': string[];
                };
                'edited': {
                    'filter': string[];
                };
                'detached': {
                    'filter': string[];
                };
                'deleted': {
                    'filter': string[];
                };
            };
            dom: {
                containerClass: string;
                selectClass: string;
            };
            language: {
                'entityFilter': string;
                'default': string;
                'all': string;
                'added': string;
                'modified': string;
                'unchanged': string;
                'edited': string;
                'detached': string;
                'deleted': string;
            };
        };
        public settings: any;
        public initialized: boolean;
        public dt: {
            api: any;
            settings: any;
        };
        public dom: {
            select: any;
            container: any;
        };
        public currentFilter: any;
        private adapterInstance;
        constructor(api: any, settings: any);
        public initialize(): void;
        private setupAdapter();
        private createDomElements();
        private setCurrentFilter();
        static indexOfFor: (arr: any[], item: any) => number;
        private registerCallbacks();
    }
}
