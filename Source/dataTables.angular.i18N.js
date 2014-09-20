var dt;
(function (dt) {
    (function (i18N) {
        var I18NTablePlugin = (function () {
            function I18NTablePlugin(tableController, $injector) {
                this.dt = {
                    api: null,
                    settings: null
                };
                this.resources = {};
                this.name = 'i18N';
                this.tableController = tableController;
                $.extend(this.resources, I18NTablePlugin.globalResources);
                this.$injector = $injector;
                this.setupService();
            }
            I18NTablePlugin.prototype.getI18NService = function () {
                return this.service;
            };

            I18NTablePlugin.prototype.getEventListeners = function () {
                return [
                    {
                        event: dt.TableController.events.tableCreating,
                        fn: this.tableCreating,
                        scope: this
                    },
                    {
                        event: dt.TableController.events.tableCreated,
                        fn: this.tableCreated,
                        scope: this
                    }
                ];
            };

            I18NTablePlugin.isEnabled = function () {
                return true;
            };

            I18NTablePlugin.prototype.initialize = function (dtSettings) {
            };

            I18NTablePlugin.prototype.destroy = function () {
                this.$injector = null;
                this.service = null;
                this.resources = null;
                this.dt = null;
                this.tableController = null;
            };

            I18NTablePlugin.prototype.setupService = function () {
                var type;
                if (dt.TableController.checkAngularModulePresence('gettext'))
                    type = GetTextI18NService;
                else if (dt.TableController.checkAngularModulePresence('pascalprecht.translate'))
                    type = AngularTranslateI18Service;
                else
                    type = DefaultI18NService;
                this.service = this.$injector.instantiate(type, { resources: this.resources });
            };

            I18NTablePlugin.prototype.tableCreated = function (event, api) {
            };

            I18NTablePlugin.prototype.tableCreating = function (event) {
            };
            I18NTablePlugin.$inject = ['tableController', '$injector'];
            return I18NTablePlugin;
        })();
        i18N.I18NTablePlugin = I18NTablePlugin;

        //Register plugin
        dt.TableController.registerPlugin(I18NTablePlugin.isEnabled, I18NTablePlugin);

        //#region I18N services
        var DefaultI18NService = (function () {
            function DefaultI18NService(resources, $interpolate) {
                this.currentLanguage = 'en';
                this.resources = resources;
                this.$interpolate = $interpolate;
            }
            DefaultI18NService.prototype.translate = function (key, params) {
                var msg = (this.resources[this.currentLanguage] || {})[key] || key;
                var exp = this.$interpolate(msg);
                return exp(params || {});
            };

            DefaultI18NService.prototype.mergeResources = function (language, resources) {
                if (!this.resources[language]) {
                    this.resources[language] = {};
                }
                $.extend(this.resources[language], resources);
            };

            DefaultI18NService.prototype.setLanguage = function (language) {
                this.currentLanguage = language;
            };
            DefaultI18NService.$inject = ['resources', '$interpolate'];
            return DefaultI18NService;
        })();
        i18N.DefaultI18NService = DefaultI18NService;

        var GetTextI18NService = (function () {
            function GetTextI18NService(resources, $interpolate, gettextCatalog) {
                this.$interpolate = $interpolate;
                this.gettextCatalog = gettextCatalog;

                for (var language in resources) {
                    this.gettextCatalog.setStrings(language, resources[language]);
                }
            }
            GetTextI18NService.prototype.translate = function (key, params) {
                var exp = this.$interpolate(this.gettextCatalog.getString(key));
                return exp(params || {});
            };

            GetTextI18NService.prototype.mergeResources = function (language, resources) {
                this.gettextCatalog.setStrings(language, resources);
            };

            GetTextI18NService.prototype.setLanguage = function (language) {
                this.gettextCatalog.setCurrentLanguage(language);
            };
            GetTextI18NService.$inject = ['resources', '$interpolate', 'gettextCatalog'];
            return GetTextI18NService;
        })();
        i18N.GetTextI18NService = GetTextI18NService;

        var AngularTranslateI18Service = (function () {
            function AngularTranslateI18Service(resources, $interpolate, $translate) {
                this.resources = resources;
                this.$interpolate = $interpolate;
                this.$translate = $translate;
            }
            AngularTranslateI18Service.prototype.translate = function (key, params) {
                var lang = this.$translate.use();
                var msg;
                if (this.resources[lang] && this.resources[lang][key])
                    msg = this.resources[lang][key];
                else
                    msg = this.$translate(key);

                var exp = this.$interpolate(msg);
                return exp(params || {});
            };

            AngularTranslateI18Service.prototype.mergeResources = function (language, resources) {
                if (!this.resources[language]) {
                    this.resources[language] = {};
                }
                $.extend(this.resources[language], resources);
            };

            AngularTranslateI18Service.prototype.setLanguage = function (language) {
                this.$translate.use(language);
            };
            AngularTranslateI18Service.$inject = ['resources', '$interpolate', '$translate'];
            return AngularTranslateI18Service;
        })();
        i18N.AngularTranslateI18Service = AngularTranslateI18Service;
    })(dt.i18N || (dt.i18N = {}));
    var i18N = dt.i18N;
})(dt || (dt = {}));

(function (window, document, undefined) {
    if (!dt.TableController.checkAngularModulePresence('pascalprecht.translate') && !dt.TableController.checkAngularModulePresence('gettext')) {
        angular.module('dt').filter('translate', [
            '$rootScope', function ($rootScope) {
                return function (input) {
                    return input;
                };
            }
        ]);
    }
}(window, document, undefined));
//# sourceMappingURL=dataTables.angular.i18N.js.map
