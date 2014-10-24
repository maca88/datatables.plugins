declare module dt.i18N {
    interface I18NService {
        translate(key: string, params: any): string;
        mergeResources(language: string, resources: any): any;
        setLanguage(language: string): any;
    }
    interface I18NPlugin {
        getI18NService(): I18NService;
    }
    class I18NTablePlugin implements ITablePlugin, I18NPlugin {
        private tableController;
        private dt;
        private $injector;
        private resources;
        private service;
        static globalResources: {};
        static $inject: string[];
        constructor(tableController: TableController, $injector: ng.auto.IInjectorService);
        public getI18NService(): I18NService;
        public getEventListeners(): IEventListener[];
        public name: string;
        static isEnabled(): boolean;
        public initialize(dtSettings: any): void;
        public destroy(): void;
        private setupService();
        private tableCreated(event, api);
        private tableCreating(event);
    }
    class DefaultI18NService implements I18NService {
        private resources;
        private $interpolate;
        private currentLanguage;
        static $inject: string[];
        constructor(resources: any, $interpolate: any);
        public translate(key: string, params: any): string;
        public mergeResources(language: string, resources: any): void;
        public setLanguage(language: string): void;
    }
    class GetTextI18NService implements I18NService {
        private $interpolate;
        private gettextCatalog;
        static $inject: string[];
        constructor(resources: any, $interpolate: any, gettextCatalog: any);
        public translate(key: string, params: any): string;
        public mergeResources(language: string, resources: any): void;
        public setLanguage(language: string): void;
    }
    class AngularTranslateI18Service implements I18NService {
        private resources;
        private $interpolate;
        private $translate;
        static $inject: string[];
        constructor(resources: any, $interpolate: any, $translate: any);
        public translate(key: string, params: any): string;
        public mergeResources(language: string, resources: any): void;
        public setLanguage(language: string): void;
    }
}
