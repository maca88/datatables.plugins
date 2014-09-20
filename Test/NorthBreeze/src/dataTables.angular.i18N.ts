module dt.i18N {
    
    export interface I18NService {
        translate(key: string, params: any): string;
        mergeResources(language: string, resources: any);
        setLanguage(language: string);
    }

    export interface I18NPlugin {
        getI18NService(): I18NService;
    }

    export class I18NTablePlugin implements ITablePlugin, I18NPlugin {
        
        private tableController: ITableController;
        private dt = {
            api: null,
            settings: null
        };
        private $injector;
        private resources: any = {};
        private service: I18NService;

        public static globalResources: {
            
        };

        public static $inject = ['tableController', '$injector'];
        constructor(tableController: TableController, $injector: ng.auto.IInjectorService) {
            this.tableController = tableController;
            $.extend(this.resources, I18NTablePlugin.globalResources);
            this.$injector = $injector;
            this.setupService();
        }

        public getI18NService(): I18NService {
            return this.service;
        }

        public getEventListeners(): IEventListener[] {
            return [
                {
                    event: TableController.events.tableCreating,
                    fn: this.tableCreating,
                    scope: this
                },
                {
                    event: TableController.events.tableCreated,
                    fn: this.tableCreated,
                    scope: this
                }
            ];
        }

        public name: string = 'i18N';

        public static isEnabled(): boolean {
            return true;
        }

        public initialize(dtSettings): void {
            
        }

        public destroy() {
            this.$injector = null;
            this.service = null;
            this.resources = null;
            this.dt = null;
            this.tableController = null;
        }

        private setupService() {
            var type;
            if (TableController.checkAngularModulePresence('gettext'))
                type = GetTextI18NService;
            else if (TableController.checkAngularModulePresence('pascalprecht.translate'))
                type = AngularTranslateI18Service;
            else
                type = DefaultI18NService;
            this.service = this.$injector.instantiate(type, { resources: this.resources });
        }


        private tableCreated(event: ng.IAngularEvent, api): void {
        }

        private tableCreating(event: ng.IAngularEvent): void {
        }
    }

    //Register plugin
    TableController.registerPlugin(I18NTablePlugin.isEnabled, I18NTablePlugin);


    //#region I18N services

    export class DefaultI18NService implements I18NService {

        private resources;
        private $interpolate;
        private currentLanguage = 'en';

        public static $inject = ['resources', '$interpolate'];
        constructor(resources, $interpolate) {
            this.resources = resources;
            this.$interpolate = $interpolate;
        }

        public translate(key: string, params: any): string {
            var msg = (this.resources[this.currentLanguage] || {})[key] || key;
            var exp = this.$interpolate(msg);
            return exp(params || {});
        }

        public mergeResources(language: string, resources: any) {
            if (!this.resources[language]) {
                this.resources[language] = {};
            }
            $.extend(this.resources[language], resources);
        }

        public setLanguage(language: string) {
            this.currentLanguage = language;
        }
    }

    export class GetTextI18NService implements I18NService {

        private $interpolate;
        private gettextCatalog;

        public static $inject = ['resources', '$interpolate', 'gettextCatalog'];
        constructor(resources, $interpolate, gettextCatalog) {
            this.$interpolate = $interpolate;
            this.gettextCatalog = gettextCatalog;

            for (var language in resources) {
                this.gettextCatalog.setStrings(language, resources[language]);
            }
        }

        public translate(key: string, params: any): string {
            var exp = this.$interpolate(this.gettextCatalog.getString(key));
            return exp(params || {});
        }

        public mergeResources(language: string, resources: any) {
            this.gettextCatalog.setStrings(language, resources);
        }

        public setLanguage(language: string) {
            this.gettextCatalog.setCurrentLanguage(language);
        }
    }

    export class AngularTranslateI18Service implements I18NService {

        private resources;
        private $interpolate;
        private $translate;

        public static $inject = ['resources', '$interpolate', '$translate'];
        constructor(resources, $interpolate, $translate) {
            this.resources = resources;
            this.$interpolate = $interpolate;
            this.$translate = $translate;
        }

        public translate(key: string, params: any): string {
            var lang = this.$translate.use();
            var msg;
            if (this.resources[lang] && this.resources[lang][key])
                msg = this.resources[lang][key];
            else
                msg = this.$translate(key);

            var exp = this.$interpolate(msg);
            return exp(params || {});
        }

        public mergeResources(language: string, resources: any) {
            if (!this.resources[language]) {
                this.resources[language] = {};
            }
            $.extend(this.resources[language], resources);
        }

        public setLanguage(language: string) {
            this.$translate.use(language);
        }
    }

    //#endregion

}

(function(window, document, undefined) {

    if (
        !dt.TableController.checkAngularModulePresence('pascalprecht.translate') &&
        !dt.TableController.checkAngularModulePresence('gettext')
    ) {
        angular.module('dt')
            .filter('translate', [
                '$rootScope', ($rootScope) => {
                    return (input) => {
                        return input;
                    };
                }
            ]);
    }

    
}(window, document, undefined));