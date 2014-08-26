///<reference path='dataTables.editable.breeze.ts' />
///<reference path='dataTables.editable.uiSelect2.ts' />
///<reference path='dataTables.editable.angularStrap.ts' />

module dt.editable {

    //#region interfaces

    export interface IEditCtrlWrapper {
        contentBefore: any[];
        contentAfter: any[];
        attrs: any;
        ngClass: any;
    }

    export interface IEditCtrl {
        contentBefore: any[];
        contentAfter: any[];
        attrs: any;
        ngClass: any;
    }

    export interface IColumnTemplateSetupArgs {
        column: any;
        editCtrlWrapper: IEditCtrlWrapper;
        editCtrl: IEditCtrl;
    }

    export interface IRowTemplateSetupArgs {
        formName: string;
        attrs: any;
        classes: string[];
        ngClass: any;
        hash: string;
        rowIndex: number;
        dataPath: number;
    }

    export interface IDataService {
        getColumnModelPath(col): string;
        removeItems(items: any[]): any[];
        rejectItems(items: any[]): any[];
        restoreRemovedItems(): any[];
        createItem(): any;
        addItem(item): void;
        validateItemProperty(column, row): ValidationError[];
        validateItem(row): ValidationError[]
        isColumnEditable(column): boolean;
        getItemPropertyValue(column, row): any;
    }

    export interface IDisplayService {
        
        cellPostLink(args: dt.ICellPostLinkArgs): void;
        setupColumnTemplate(args: IColumnTemplateSetupArgs): void;
        mergeCellErrors(errors: ValidationError[]): string;


        setupRowTemplate(args: IRowTemplateSetupArgs): void;

        mergeRowErrors(errors: ValidationError[]): string;

        selectControl(event, cell, col): void;
        getEditTemplateForType(type, col): string;
        getControlClass(): string;
        getControlWrapperClass(): string;
        
        canBlurCell(event, cell, col): boolean;
    }

    export interface I18NService {
        translate(key: string, params: any): string;
    }

    export interface IDisplayServiceEditTypePlugin {
        getSupportedTypes(): string[];
        getEditTemplateForType(type, col): string;
        selectControl(event, cell, col): boolean;
        canBlurCell(event, cell, col): boolean;
        cellPostLink(args: dt.ICellPostLinkArgs): void;
    }

    export interface IDisplayServiceCellValidationPlugin {
        setupColumnTemplate(args: IColumnTemplateSetupArgs): void;
        mergeErrors(errors: ValidationError[]): string;
    }

    export interface IDisplayServiceRowValidationPlugin {
        setupRowTemplate(args: IRowTemplateSetupArgs): void;
        mergeErrors(errors: ValidationError[]): string;
    }


    export interface IDisplayServiceStylePlugin {
        setupColumnTemplate(args: IColumnTemplateSetupArgs): void;
        setupRowTemplate(args: IRowTemplateSetupArgs): void;
    }

    export interface IEditor {
        initialize(): void;

        removeItems(items: any[]): any[];
        rejectItems(items: any[]): any[];
        restoreRemovedItems(): any[];
        createItem(): any;
        addItem(item): void;

        editRow(row: number): void;
        saveRow(row: number): void;

        cellCompile(args: dt.ICellCompileArgs);
        cellPostLink(args: dt.ICellPostLinkArgs);
        cellPreLink(args: dt.ICellPreLinkArgs);

        rowCompile(args: dt.IRowCompileArgs)
        rowPostLink(args: dt.IRowPostLinkArgs);
        rowPreLink(args: dt.IRowPreLinkArgs);
    }

    export interface ISettings {
        tableFocused: Function;
        itemAdded: Function;
        itemsRemoved: Function;
        itemsRejected: Function;
        itemsRestored: Function;
        itemCreated: Function;
        startEditing: Function;
        services: any;
        editor: any;
    }

    export interface ISettingsService {
    }

    export interface ISettingsDataService {
        type: any;
        settings: any;
    }

    //#endregion

    export class Editable implements ITablePlugin {

        //constants
        public static MODEL_PATH = "model_path";
        public static EDIT_CONTROL_ATTRS = "edit_control_attrs";
        public static EDIT_CONTROL_WRAPPER_ATTRS = "edit_control_wrapper_attrs";
        public static EDIT_CONTROL = "edit_control";
        public static BEFORE_EDIT_CONTROL = "<before-edit-control></before-edit-control>";
        public static AFTER_EDIT_CONTROL = "<after-edit-control></after-edit-control>";
        public static DISPLAY_CONTROL = "display_control";

        public static defaultEditTemplateWrapper = {
            tagName: 'div',
            className: '',
            attrs: {}
        }

        public static defaultEditTemplateControl = {
            tagName: 'input',
            attrs: {
                type: 'text'
            },
            className: '',
        }

        public static defaultTemplate = {
            wrapper: Editable.defaultEditTemplateWrapper,
            control: Editable.defaultEditTemplateControl
        } 

        public static defaultSettings: ISettings = {
            tableFocused: null,
            itemAdded: null,
            itemsRemoved: null,
            itemsRejected: null,
            itemsRestored: null,
            itemCreated: null,

            startEditing: null,

            services: {
                data: {
                    type: null,
                    settings: {
                        createItem: null, //needed when using breeze or jaydata adapter
                        validate: null, //needed for default adapter
                        validators: {}, //row validators
                    }
                },
                display: {
                    type: null,
                    settings: {
                        controlWrapperClass: "dt-editable-control-wrapper",
                        controlClass: "dt-editable-control", //batch, inline
                        typesTemplate: { //fallback templates
                            'string': {
                            },
                            'number': {
                                control: {
                                    attrs: {
                                        type: 'number',
                                    }
                                }
                            },
                            'select': {
                                control: {
                                    tagName: 'select',
                                }
                            },
                            'date': {
                                control: {
                                    attrs: {
                                        type: 'date',
                                    }
                                }
                            },
                            'time': {
                                control: {
                                    attrs: {
                                        type: 'time',
                                    }
                                }
                            },
                            'dateTime': {
                                control: {
                                    attrs: {
                                        type: 'datetime-local',
                                    }
                                }
                            },
                        }
                    },
                    plugins: {
                        editTypes: [],
                        style: null,
                        cellValidation: InlineDisplayServiceCellValidationPlugin,
                        rowValidation: InlineDisplayServiceRowValidationPlugin,
                    },
                },
                i18N: {
                    type: null,
                    settings: {}
                }
                
            },
            
            editor: {
                type: null,
                settings: {
                    cellTemplate:
                        '<div ng-if="$isInEditMode()">' + Editable.EDIT_CONTROL + '</div>' +
                        '<div ng-if="$isInEditMode() === false">' + Editable.DISPLAY_CONTROL + '</div>'
                }
            },

            startCellEditing: null,
            endCellEditing: null,
            formatMessage: (msg, ctx) => msg,
            language: {
                'required': 'The value is required',
                'minlength': 'Minimum length is {{options}}'
            },
            
        }

        public settings;
        public initialized: boolean = false;
        public dt = {
            api: null,
            settings: null
        };
        private $injector: ng.auto.IInjectorService;
        private table: dt.TableController;

        public editor: IEditor;
        public dataService: IDataService;
        public displayService: IDisplayService;
        public i18NService: I18NService;

        public static $inject = ['dtTable', '$injector'];
        constructor(dtTable: TableController, $injector: ng.auto.IInjectorService) {
            this.table = dtTable;
            this.$injector = $injector;
        }

        public getEventListeners(): IEventListener[] {
            return [
                {
                    event: dt.TableController.events.cellCompile,
                    scope: () => this.editor,
                    fn: () => this.editor.cellCompile
                },
                {
                    event: dt.TableController.events.cellPostLink,
                    scope: () => this.editor,
                    fn: () => this.editor.cellPostLink
                },
                {
                    event: dt.TableController.events.cellPreLink,
                    scope: () => this.editor,
                    fn: () => this.editor.cellPreLink
                },
                {
                    event: dt.TableController.events.rowCompile,
                    scope: () => this.editor,
                    fn: () => this.editor.rowCompile
                },
                {
                    event: dt.TableController.events.rowPostLink,
                    scope: () => this.editor,
                    fn: () => this.editor.rowPostLink
                },
                {
                    event: dt.TableController.events.rowPreLink,
                    scope: () => this.editor,
                    fn: () => this.editor.rowPreLink
                }
            ];
        }

        public isEnabled(): boolean {
            return $.isPlainObject(this.table.settings.options.editable);
        }

        public destroy(): void {

        }

        public initialize(dtSettings) {
            this.settings = $.extend(true, {}, Editable.defaultSettings, dtSettings.oInit.editable);
            this.dt.settings = dtSettings;
            this.dt.api = dtSettings.oInstance.api();
            this.dt.settings.editable = this;
            this.setupServices();
            this.setupEditor();
            this.editor.initialize();
            this.prepareColumnTemplates();
            this.initialized = true;
        }

        private prepareColumnTemplates() {
            var columns = this.dt.settings.aoColumns, col, i,
                editorSettings = this.getEditorSettings();
            for (i = 0; i < columns.length; i++) {
                col = columns[i];
                if (!this.dataService.isColumnEditable(col)) continue;

                //Options that can be modified by the display service
                var opts: IColumnTemplateSetupArgs = {
                    column: col,
                    editCtrlWrapper: {
                        contentBefore: [],
                        contentAfter: [],
                        attrs: {},
                        ngClass: {}
                    },
                    editCtrl: {
                        contentBefore: [],
                        contentAfter: [],
                        attrs: {},
                        ngClass: {}
                    },
                };
                opts.editCtrl.attrs.name = col.name || col.mData;

                this.displayService.setupColumnTemplate(opts);

                Editable.setNgClass(opts.editCtrlWrapper.ngClass, opts.editCtrlWrapper.attrs);
                Editable.setNgClass(opts.editCtrl.ngClass, opts.editCtrl.attrs);

                var columnModelPath = this.dataService.getColumnModelPath(col);

                var editControl = this.getColumnEditControlTemplate(col)
                    .replaceAll(Editable.MODEL_PATH, columnModelPath)
                    .replaceAll(Editable.EDIT_CONTROL_ATTRS, Editable.generateHtmlAttributes(opts.editCtrl.attrs))
                    .replaceAll(Editable.EDIT_CONTROL_WRAPPER_ATTRS, Editable.generateHtmlAttributes(opts.editCtrlWrapper.attrs))
                    .replaceAll(Editable.BEFORE_EDIT_CONTROL, opts.editCtrl.contentBefore.join(""))
                    .replaceAll(Editable.AFTER_EDIT_CONTROL, opts.editCtrl.contentAfter.join(""));

                editControl = opts.editCtrlWrapper.contentBefore.join("") + editControl + opts.editCtrlWrapper.contentAfter.join("");

                var displayControl = this.getColumnDisplayControlTemplate(col);

                var template = editorSettings.cellTemplate
                    .replaceAll(Editable.EDIT_CONTROL, editControl)
                    .replaceAll(Editable.DISPLAY_CONTROL, displayControl);

                col.cellTemplate = template;
            }
        }

        public static generateHtmlAttributes(obj): string {
            var attrs = '';
            for (var key in obj) {
                attrs += key + '="' + obj[key] + '" ';
            }
            return attrs;
        }

        public getColumnDisplayControlTemplate(col): string {
            if (col.templateHtml != null) {
                return col.templateHtml;
            } else if (col.expression != null && angular.isString(col.expression)) {
                return '<span ng-bind="' + col.expression + '"></span>';
            } else if (col.data != null) {
                var modelPath = this.dataService.getColumnModelPath(col);
                return '<span ng-bind="' + modelPath + '"></span>';
            } else if (col.defaultContent != "") {
                return col.defaultContent;
            }
            return null;
        }

        public getColumnEditControlTemplate(col): any {
            var type = Editable.getColumnType(col);
            var displayService = this.displayService;
            if (!type)
                throw 'Column type must be defined';
            type = type.toLowerCase();
            return displayService.getEditTemplateForType(type, col);
        }

        public static setNgClass(obj, target) {
            //build ngClass
            if (Object.keys(obj).length) {
                var ngClassStr = '{ ';
                for (var key in obj) {
                    ngClassStr += "'" + key + "': " + obj[key] + ', ';
                }
                ngClassStr += '}';
                if ($.isPlainObject(target))
                    target["ng-class"] = ngClassStr;
                else
                    $(target).attr('ng-class', ngClassStr);
            }
        }

        public static mergeErrors(errors: ValidationError[]): string {
            if (!errors) return null;
            var msg = ' '; //the default mesasge must be evaluated to true as the angularstrap check it at init
            for (var i = 0; i < errors.length; i++) {
                msg += errors[i].message + '<br />';
            }
            return msg;
        }

        public static getColumnType(col) {
            var editablOpts = col.editable || {};
            return editablOpts.type || col._sManualType || col.sType;
        }

        public static checkAngularModulePresence(moduleName) {
            try {
                angular.module(moduleName);
                return true;
            } catch (err) {
                return false;
            }
        }

        public static getColumnTemplateSettings(col): any {
            return $.isPlainObject(col.editable) && $.isPlainObject(col.editable.template) ? col.editable.template : null;
        }

        public static getColumnEditableSettings(col): any {
            return $.isPlainObject(col.editable) ? col.editable : null;
        }

        public static getRowValidators(dtSettings) {
            return (dtSettings.oInit.editable || {}).validators;
        }

        public static fillRowValidationErrors(row, errors: ValidationError[]) {
            var columns = row.settings()[0].aoColumns;
            var i, cellScope: any, rowScope: any;
            var tr = row.node();
            var cells = $('td', tr);
            rowScope = angular.element(tr).scope();
            rowScope.$rowErrors.length = 0;
            var visColIdx = -1;
            var cellsByData = {};
            for (i=0; i < columns.length; i++) {
                if (columns[i].bVisible)
                    visColIdx++;
                cellScope = angular.element(cells[visColIdx]).scope();
                if (!cellScope.$cellErrors) continue; //not editable
                cellsByData[columns[i].mData] = cellScope;
                cellScope.$cellErrors.length = 0;
            }

            for (i = 0; i < errors.length; i++) {
                if (!cellsByData.hasOwnProperty(errors[i].property)) {
                    rowScope.$rowErrors.push(errors[i]);
                } else {
                    cellScope = cellsByData[errors[i].property];
                    cellScope.$cellErrors.push(errors[i]);
                }
            }
        }

        public static getCell(col, row): JQuery {
            var columns = row.settings()[0].aoColumns, i;
            var visColIdx = 0;
            for (i = 0; i < columns.length; i++) {
                if (columns[i].bVisible)
                    visColIdx++;
                if (columns[i] === col)
                    break;
            }
            return $('td:nth(' + visColIdx + ')', row.node());
        }

        private getEditorSettings() {
            return this.settings.editor.settings;
        }

        private setupServices() {
            this.setupI18Nservice();
            this.setupDisplayService();
            this.setupDataService();
        }

        private setupI18Nservice() {
            var i18NService = this.settings.services.i18N;
            var locals = {
                'resources': this.settings.language
            };
            if (!i18NService.type) {
                if (Editable.checkAngularModulePresence('pascalprecht.translate'))
                    i18NService.type = AngularTranslateI18Service;
                else if (Editable.checkAngularModulePresence('gettext'))
                    i18NService.type = GetTextI18NService;
                else
                    i18NService.type = DefaultI18NService;
            }
            this.i18NService = this.$injector.instantiate(i18NService.type, locals);
        }

        private setupEditor() {
            var editor = this.settings.editor;
            var locals = {
                'settings': editor.settings,
                'api': this.dt.api,
                'displayService': this.displayService, 
                'dataService': this.dataService
            };
            if (!editor.type) {
                editor.type = BatchEditor;
            }
            this.editor = this.$injector.instantiate(editor.type, locals);
        }

        private setupDisplayService() {
            var displayService = this.settings.services.display;
            var locals = {
                'settings': displayService.settings,
                'api': this.dt.api,
                'plugins': displayService.plugins,
                'i18Service': this.i18NService
            };
            if (!displayService.type) 
                displayService.type = DefaultDisplayService;
            //Instantiate the display adapter with the angular DI
            this.displayService = this.$injector.instantiate(displayService.type, locals);
        }

        private setupDataService() {
            var dataService = this.settings.services.data;
            var locals = {
                'settings': dataService.settings,
                'api': this.dt.api,
                'i18Service': this.i18NService,
                //'displayService': this.displayService
            };
            if (!dataService.type) {
                dataService.type = DefaultDataSerice;
            }
            if (dataService.type == null)
                throw 'Editable plugins requires a data adapter to be set';

            this.dataService = this.$injector.instantiate(dataService.type, locals);
        }

    }

    //Register plugin
    TableController.defaultSettings.plugins.push(Editable);

    //We have to use an object instead of a primitive value so that changes will be reflected to the child scopes
    export class DisplayMode {

        public name: string;

        constructor() {
            this.name = DisplayMode.ReadOnly;
        }

        public setMode(modeName: string) {
            this.name = modeName;
        }

        public static ReadOnly: string = "ReadOnly";
        public static Edit: string = "Edit";
        
    }

    export class ValidationError {
        public property: string;
        public message: string;
        public validator: Validator;

        constructor(message: string, validator: Validator, property: string = null) {
            this.message = message;
            this.validator = validator;
            this.property = property ? property : null;
        }
    }

    export class Validator {
        public name: string;
        public options: any;
        public column: any;

        constructor(name, options, column = null) {
            this.name = name;
            this.options = options;
            this.column = column;
        }

    }

    //#region I18N services

    export class DefaultI18NService implements I18NService {

        private resources;
        private $interpolate;

        public static $inject = ['resources', '$interpolate'];
        constructor(resources, $interpolate) {
            this.resources = resources;
            this.$interpolate = $interpolate;
        }

        public translate(key: string, params: any): string {
            var exp = this.$interpolate(this.resources[key] || 'Missing resource');
            return exp(params || {});
        }
    }

    export class GetTextI18NService implements I18NService {

        private resources;
        private $interpolate;
        private gettextCatalog;

        public static $inject = ['resources', '$interpolate', 'gettextCatalog'];
        constructor(resources, $interpolate, gettextCatalog) {
            this.resources = resources;
            this.$interpolate = $interpolate;
            this.gettextCatalog = gettextCatalog;
        }

        public translate(key: string, params: any): string {
            var exp = this.$interpolate(this.gettextCatalog.getString(this.resources[key]));
            return exp(params || {});
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
            var exp = this.$interpolate(this.$translate(key));
            return exp(params || {});
        }
    }

    //#endregion

    //#region Data services

    export class DefaultDataSerice implements IDataService {
         
        public dt = {
            settings: null,
            api: null
        }
        public settings;
        public i18Service: I18NService;

        public static $inject = ['api', 'settings', 'i18Service']
        constructor(api, settings, i18Service) {
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
            this.i18Service = i18Service;
        }

        public getColumnModelPath(col): string {
            var rowDataPath = this.dt.settings.oInit.angular.rowDataPath;
            return col.data ? rowDataPath + '.' + col.data : null;
        }

        public removeItems(items: any[]): any[] {
            var removed = [];
            for (var i = 0; i < items.length; i++) {
                items[i].remove();
                removed.push(items[i]);
            }
            return removed;
        }

        public rejectItems(items: any[]): any[] {
            throw 'Reject is not supported by DefaultDataSerice';
        }

        public restoreRemovedItems(): any[] {
            throw 'Restore removed items is not supported by DefaultDataSerice';
        }

        public createItem(): any {
            if ($.isFunction(this.settings.createItem))
                return this.settings.createItem();
            var item = {};
            $.each(this.dt.settings.aoColumns, (i, col) => {
                if ($.type(col.mData) == 'string')
                    item[col.mData] = null;
            });
            return item;
        }

        public addItem(item): void {
            this.dt.api.row.add(item);
        }

        public validateItem(row): ValidationError[] {
            var errors: ValidationError[] = [];
            //Execute column validators
            var columns = this.getEditableColumns();
            for (var i = 0; i < columns.length; i++) {
                errors = errors.concat(this.validateItemProperty(columns[i], row));
            }

            var valMap = {};
            angular.forEach(this.settings.validators || {}, (opts, valName) => {
                valMap[valName] = opts;
            });

            //Execute row validators
            var rowScope: any = angular.element(row.node()).scope();
            var formController = rowScope.$getRowForm();
            angular.forEach(formController.$error, (valArr, valName) => {
                angular.forEach(valArr, (val) => {
                    if (val && val.$name) return; //column error
                var validator = new Validator(valName, valMap[valName] || null);
                var msg = this.i18Service.translate(valName, validator);
                errors.push(new ValidationError(msg, validator));
                });
            });

            return errors;
        }

        public validateItemProperty(column, row): ValidationError[]{
            var errors: ValidationError[] = [];
            var rowScope: any = angular.element(row.node()).scope();
            var formController = rowScope.$getRowForm();
            var inputCtrl = formController[column.name || column.mData];
            if (!inputCtrl) return errors;
            var valMap = {};
            var colSettings = Editable.getColumnEditableSettings(column) || {};
            if (angular.isObject(colSettings.validators)) {
                angular.forEach(colSettings.validators, (opts, valName) => {
                    valMap[valName] = opts;
                });
            }

            angular.forEach(inputCtrl.$error, (err, valName) => {
                if (!err) return; //no errors
                var validator = new Validator(valName, valMap[valName] || null, column);
                var msg = this.i18Service.translate(valName, validator);
                errors.push(new ValidationError(msg, validator, column.mData));
            });

            return errors;
        }

        public isColumnEditable(column): boolean {
            return (column.editable !== false) && $.type(column.mData) === "string";
        }

        public getItemPropertyValue(column, row): any {
            var mDataFn = this.dt.settings.oApi._fnGetObjectDataFn(column.mData);
            var cIdx = this.getColumnCurrentIndex(column);
            return mDataFn(row.data(), 'type', undefined, {
                settings: this.dt.settings,
                row: row.index(),
                col: cIdx
            });
        }

        public getColumnCurrentIndex(column): number {
            var columns = this.dt.settings.aoColumns;
            for (var i = 0; i < columns.length; i++) {
                if (columns === columns[i]) return i;
            }
            return -1;
        }

        public getEditableColumns(): any[] {
            var editableColumns = [];
            var columns = this.dt.settings.aoColumns;
            for (var i = 0; i < columns.length; i++) {
                if (this.isColumnEditable(columns[i]))
                    editableColumns.push(columns[i]);
            }
            return editableColumns;
        }
    }

    //#endregion


    export class InlineDisplayServiceCellValidationPlugin implements IDisplayServiceCellValidationPlugin {

        public setupColumnTemplate(args: IColumnTemplateSetupArgs): void {
            args.editCtrl.contentAfter.push('<div dt-inline-cell-errors=""></div>');
        }

        public mergeErrors(errors: ValidationError[]): string {
            return Editable.mergeErrors(errors);
        }
    }

    export class InlineDisplayServiceRowValidationPlugin implements IDisplayServiceRowValidationPlugin {

        public setupRowTemplate(args: IRowTemplateSetupArgs): void {
            args.attrs['dt-inline-row-errors'] = "";
        }

        public mergeErrors(errors: ValidationError[]): string {
            return Editable.mergeErrors(errors);
        }
    }

    export class DefaultDisplayService implements IDisplayService {
        public dt = {
            settings: null,
            api: null
        }
        public settings;
        public pluginTypes = {};

        public stylePlugin: IDisplayServiceStylePlugin;
        public cellValidationPlugin: IDisplayServiceCellValidationPlugin;
        public rowValidationPlugin: IDisplayServiceRowValidationPlugin;

        private $injector: ng.auto.IInjectorService;

        public static $inject = ['api', 'settings', 'plugins', '$injector']
        constructor(api, settings, plugins, $injector) {
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
            this.$injector = $injector;
            this.setupPlugins(plugins);
        }

        private setupPlugins(plugins) {
            var locals = {
                displayService: this
            };

            //Setup editType plugins
            angular.forEach(plugins.editTypes, pluginType => {
                var plugin: IDisplayServiceEditTypePlugin = this.$injector.instantiate(pluginType, locals);
                angular.forEach(plugin.getSupportedTypes(), type => {
                    this.pluginTypes[type] = plugin;
                });
            });

            //Style
            if (plugins.style) {
                this.stylePlugin = this.$injector.instantiate(plugins.style, locals);
            }

            //Setup validation plugins
            this.cellValidationPlugin = this.$injector.instantiate(plugins.cellValidation, locals);
            this.rowValidationPlugin = this.$injector.instantiate(plugins.rowValidation, locals);
        }

        public canBlurCell(event, cell, col): boolean {
            var type = Editable.getColumnType(col);
            if (this.pluginTypes.hasOwnProperty(type))
                return this.pluginTypes[type].canBlurCell(event, cell, col);
            return true;
        }

        public cellPostLink(args: dt.ICellPostLinkArgs): void {
            var type = Editable.getColumnType(args.column);

            if (this.pluginTypes.hasOwnProperty(type))
                this.pluginTypes[type].cellPostLink(args);
        }

        public setupRowTemplate(args: IRowTemplateSetupArgs): void {
            var validators = Editable.getRowValidators(this.dt.settings) || {};
            if ($.isPlainObject(validators)) {
                angular.forEach(validators, (val, valName) => {
                    args.attrs[valName] = val;
                });
            }
            args.attrs['ng-model'] = args.dataPath;
            this.rowValidationPlugin.setupRowTemplate(args);
            if (this.stylePlugin)
                this.stylePlugin.setupRowTemplate(args);
        }

        public selectControl(event, cell, col): void {
            var type = Editable.getColumnType(col);

            if (this.pluginTypes.hasOwnProperty(type) && this.pluginTypes[type].selectControl(event, cell, col))
                return;  
            
            /* Capture shift+tab to match the left arrow key */
            var key = !event
                ? -2 :
                ((event.keyCode == 9 && event.shiftKey)
                    ? -1
                : event.keyCode);

            var ctrls = angular.element('.' + this.settings.controlClass, cell);
            var ctrl;
            //Shit+tab or left arrow
            if (key === -1 || key === 37) {
                ctrl = ctrls.last();
            } else {
                ctrl = ctrls.first();
            }

            ctrl.focus();
            ctrl.select();
        }

        public getControlClass(): string {
            return this.settings.controlClass;
        }

        public getControlWrapperClass(): string {
            return this.settings.controlWrapperClass;
        }

        private getWrappedEditTemplate(type, template, content, col, plugin?: IDisplayServiceEditTypePlugin) {
            template = template || {};
            var wrapperOpts = $.isPlainObject(template) ? (template.wrapper || Editable.defaultEditTemplateWrapper) : Editable.defaultEditTemplateWrapper;
            var $wrapper: any = $('<' + wrapperOpts.tagName + ' />')
                .addClass(this.getControlWrapperClass())
                .attr(Editable.EDIT_CONTROL_WRAPPER_ATTRS, '')
                .attr(<Object>(wrapperOpts.attrs || {}))
                .addClass(wrapperOpts.className || '');
            $wrapper.append(Editable.BEFORE_EDIT_CONTROL);
            $wrapper.append(content);
            $wrapper.append(Editable.AFTER_EDIT_CONTROL);
            if ($.isFunction(template.init))
                template.init.call(this, $wrapper, content, col);

            //before retun we have to remove the ="" that setAttribute add after the edit attribute
            return $wrapper[0].outerHTML
                .replaceAll(Editable.EDIT_CONTROL_ATTRS + '=""', Editable.EDIT_CONTROL_ATTRS)
                .replaceAll(Editable.EDIT_CONTROL_WRAPPER_ATTRS + '=""', Editable.EDIT_CONTROL_WRAPPER_ATTRS);
        }

        public getEditTemplateForType(type, col): string {
            var template = Editable.getColumnTemplateSettings(col);

            if (!template) {
                if ($.isFunction(this.settings.typesTemplate[type]))
                    template = this.settings.typesTemplate[type];
                else if ($.isPlainObject(this.settings.typesTemplate[type]))
                    template = $.extend(true, {}, Editable.defaultTemplate, this.settings.typesTemplate[type]);
                else
                    template = this.settings.typesTemplate[type];
            }

            if (this.pluginTypes.hasOwnProperty(type)) { //if a plugin is found that support the given type let the plugin make the template
                var ctrlTemplate = this.pluginTypes[type].getEditTemplateForType(type, col);
                return this.getWrappedEditTemplate(type, template, ctrlTemplate, col, this.pluginTypes[type]);
            } 

            if ($.isFunction(template))
                return template.call(this, col);
            else if ($.isPlainObject(template)) {
                template = $.extend(true, {}, Editable.defaultTemplate, template);
                var controlOpts = template.control;
                var controlAttrs = {
                    'ng-model': Editable.MODEL_PATH
                };
                controlAttrs[Editable.EDIT_CONTROL_ATTRS] = '';

                var $control = $('<' + controlOpts.tagName + ' />')
                    .attr(controlAttrs)
                    .attr(<Object>(controlOpts.attrs || {}))
                    .addClass(this.getControlClass()) //needed for focusing
                    .addClass(controlOpts.className || '');

                return this.getWrappedEditTemplate(type, template, $control, col);

            } else if ($.type(template) === 'string')
                return template;
            else {
                throw 'Invalid cell template type';
            }
        }

        public mergeCellErrors(errors: ValidationError[]): string {
            return this.cellValidationPlugin.mergeErrors(errors);
        }

        public setupColumnTemplate(args: IColumnTemplateSetupArgs) {
            var settings = Editable.getColumnEditableSettings(args.column) || {};
            var editCtrlAttrs = args.editCtrl.attrs;
            if ($.isPlainObject(settings.validators)) {
                angular.forEach(settings.validators, (val, valName) => {
                    editCtrlAttrs[valName] = val;
                });
            }

            this.cellValidationPlugin.setupColumnTemplate(args);

            if (this.stylePlugin)
                this.stylePlugin.setupColumnTemplate(args);
        }

        public mergeRowErrors(errors: ValidationError[]): string {
            return this.rowValidationPlugin.mergeErrors(errors);
        }
    }

    //#region Commands

    //#region Edit

    export class BaseEditCommand extends dt.BaseCommand {

        constructor(defSettings, settings) {
            super(defSettings, settings);
        }

        public execute(scope) {
            if (scope.$isInEditMode())
                scope.$row.save();
            else
                scope.$row.edit();
        }
    }

    export class EditCommand extends BaseEditCommand {
        public static alias = 'edit';

        public static $inject = ['settings']
        constructor(settings) {
            super({
                //html: 'Edit',
                attrs: {
                    'ng-bind': "$isInEditMode() === false ? 'Edit' : 'Save'"
                }
            }, settings);
        }
    }

    //Register commands
    dt.CommandTablePlugin.registerCommand(EditCommand);

    //#endregion

    //#region Remove

    export class BaseRemoveCommand extends dt.BaseCommand {

        constructor(defSettings, settings) {
            super(defSettings, settings);
        }

        public execute(scope) {
            scope.$row.remove();
        }
    }

    export class RemoveCommand extends BaseRemoveCommand {
        public static alias = 'remove';

        public static $inject = ['settings']
        constructor(settings) {
            super({
                html: 'Remove',
            }, settings);
        }

    }

    //Register commands
    dt.CommandTablePlugin.registerCommand(RemoveCommand);

    //#endregion

    //#endregion

    //Abstract
    export class BaseEditor implements IEditor {
        public dt = {
            settings: null,
            api: null
        }
        public type = null;
        public settings;
        public dataService: IDataService;
        public displayService: IDisplayService;

        constructor(api, settings, defaultSettings, displayService:IDisplayService, dataService: IDataService) {
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.dataService = dataService;
            this.displayService = displayService;
            this.settings = $.extend(true, {}, defaultSettings, settings);
        }

        public initialize(): void {

        }

        public cellCompile(args: dt.ICellCompileArgs) {
            if (!this.dataService.isColumnEditable(args.column)) return;
            args.html = args.column.cellTemplate;
            delete args.attr['ng-bind'];
        }

        public cellPreLink(args: dt.ICellPreLinkArgs) {
            if (!this.dataService.isColumnEditable(args.column)) return;
            var scope = args.scope;
            scope.$cellDisplayMode = new DisplayMode();
            scope.$cellErrors = [];
            scope.$getCellErrorMessage = () => {
                return this.displayService.mergeCellErrors(scope.$cellErrors);
            };
            scope.$isInEditMode = () => {
                return scope.$cellDisplayMode.name === DisplayMode.Edit ||
                    scope.$rowDisplayMode.name === DisplayMode.Edit;
            };
            scope.$getInputName = () => {
                return args.column.name || args.column.mData;
            };
            scope.$cellValidate = () => {
                var errors = this.dataService.validateItemProperty(args.column, scope.$row);
                scope.$cellErrors.length = 0;
                for (var i = 0; i < errors.length; i++) {
                    scope.$cellErrors.push(errors[i]);
                }
                return errors;
            };
            scope.$getCellState = () => {
                return scope.$getRowForm()[args.column.name || args.column.mData];
            };
        }

        public cellPostLink(args: dt.ICellPostLinkArgs) {
            if (!this.dataService.isColumnEditable(args.column)) return;
            this.displayService.cellPostLink(args);
        }

        public rowCompile(args: dt.IRowCompileArgs) {
            var formName = ('row' + args.hash + 'Form').replace(':', '');
            var attrs = {
                'ng-form': formName,
            };
            var rowSetup: IRowTemplateSetupArgs = {
                index: args.rowIndex,
                hash: args.hash,
                attrs: attrs,
                classes: [],
                ngClass: {},
                formName: formName,
                rowIndex: args.rowIndex,
                dataPath: args.dataPath
            };

            this.displayService.setupRowTemplate(rowSetup);

            var $node = $(args.node);
            $node.attr(<Object>rowSetup.attrs);
            $node.addClass(rowSetup.classes.join(' '));
            Editable.setNgClass(rowSetup.ngClass, args.node);
        }

        public rowPreLink(args: dt.IRowPreLinkArgs) {
            var scope = args.scope;
            
            scope.$rowDisplayMode = new DisplayMode();
            scope.$rowErrors = [];
            scope.$getRowErrorMessage = () => {
                return this.displayService.mergeRowErrors(scope.$rowErrors);
            };
            scope.$isInEditMode = () => { return scope.$rowDisplayMode.name === DisplayMode.Edit; };

            scope.$rowValidate = () => {
                scope.$rowErrors.length = 0;
                var row = scope.$row;
                var errors = this.dataService.validateItem(row);
                Editable.fillRowValidationErrors(row, errors);
                return errors;
            };
            var formName = $(args.node).attr('ng-form');
            scope.$rowFormName = formName;
            scope.$getRowForm = () => {
                return scope[formName];
            }
        }

        public rowPostLink(args: dt.IRowPostLinkArgs) {
            
        }

        public getVisibleColumn(index) {
            var columns = this.dt.settings.aoColumns;
            var visIdx = -1;
            for (var i = 0; i < columns.length; i++) {
                if (columns[i].bVisible)
                    visIdx++;
                if (visIdx === index) return columns[i];
            }
            return null;
        }

        public getFirstRowCell(row) {
            var columns = this.dt.settings.aoColumns;
            var colIdx = 0;
            var column = null, $cell = null;
            //Get the fist cell that is editable and visible
            for (var i = 0; i < columns.length; i++) {
                if (columns[i].bVisible) {
                    if (this.dataService.isColumnEditable(columns[i])) {
                        $cell = $('td', row.node()).eq(colIdx);
                        column = columns[i];
                        break;
                    }
                    colIdx++;
                }
            }
            return {
                cellIndex: colIdx,
                column: column,
                cellNode: $cell
            };
        }

        public removeItems(items: any[]): any[] {
            return this.dataService.removeItems(items);
        }

        public rejectItems(items: any[]): any[] {
            return this.dataService.rejectItems(items);
        }

        public restoreRemovedItems(): any[] {
            return this.dataService.restoreRemovedItems();
        }

        public createItem(): any {
            return this.dataService.createItem();
        }

        public addItem(item): void {
            return this.dataService.addItem(item);
        }

        public editRow(row: number): void {
            
        }

        public saveRow(row: number): void {
        }

    }

    export class BatchEditor extends BaseEditor {
        private lastFocusedCell;
        private keys;

        public static defaultSettings= {
            editEvent: 'click'
        };

        public static $inject = ['api', 'settings', 'displayService', 'dataService'];
        constructor(api, settings, displayService, dataService) {
            super(api, settings, BatchEditor.defaultSettings, displayService, dataService);
        }

        public editRow(row: number): void {
            var dtRow = this.dt.api.row(row);
            var $tr = angular.element(dtRow.node());
            var rowScope: any = $tr.scope();
            if (!rowScope)
                throw 'Row must have a scope';
            var cell = this.getFirstRowCell(dtRow);
            //delay in order if any click event triggered this function
            setTimeout(() => {
                this.keys.fnSetPosition(cell.cellNode[0]);
            }, 100);
        }

        public initialize(): void {
            this.keys = new $.fn.dataTable.KeyTable({
                datatable: this.dt.settings,
                table: this.dt.settings.nTable,
                focusEvent: this.settings.editEvent,
                form: true
            });
            var $table = $(this.dt.settings.nTable);
            var hiddenInputDiv = $table.next(); //form option create this node
            this.dt.api.one('init.dt', () => {
                $table.parent('div.dataTables_wrapper').prepend(hiddenInputDiv); //when tab press in an input right before the table the first cell in the table will be selected
            });
            $('input', hiddenInputDiv).on('focus', (e) => { //When table get focus
                if ($.isFunction(this.settings.tableFocused))
                    this.settings.tableFocused.call(this.dt.api, e);
            });
            this.keys.event.focus(null, null, this.onCellFocus.bind(this));
            this.keys.event.blur(null, null, this.onCellBlur.bind(this));
            this.keys.event.bluring(null, null, this.onCellBluring.bind(this));
        }

        public addItem(item): void {
            super.addItem(item);
            var rIdx = this.dt.settings.aoData.length - 1;
            //we have to delay in order to work correctly - we have to set the position after the digestion and datatables redraw
            setTimeout(() => {
                this.keys.fnSetPosition(0, rIdx);
            }, 100);
        }

        public onCellBluring(cell, x, y, event) {
            if (!cell) return true;
            var $cell = angular.element(cell);
            var cellScope: any = $cell.scope();
            if (!cellScope)
                throw 'Cell must have a scope';
            var col = this.getVisibleColumn(x);
            if (this.dataService.isColumnEditable(col) && cellScope.$cellDisplayMode.name == DisplayMode.ReadOnly) return true;
            var displayService = this.displayService;
            return displayService.canBlurCell(event, cell, col);
        }

        public onCellBlur(cell, x, y, event) {
            if (!cell) return;
            var $cell = angular.element(cell);
            var cellScope: any = $cell.scope();
            if (!cellScope)
                throw 'Cell must have a scope';
            var col = this.getVisibleColumn(x);
            var dataService = this.dataService;
            var displayService = this.displayService;
            if (dataService.isColumnEditable(col) && cellScope.$cellDisplayMode.name == DisplayMode.ReadOnly) return;

            if (!dataService.isColumnEditable(col)) return;

            if (cellScope.$cellErrors.length) {
                displayService.selectControl(event, cell, col);
            } else {
                cellScope.$cellDisplayMode.setMode(DisplayMode.ReadOnly);
            }
            cellScope.$digest();
        }

        public onCellFocus(cell, x, y, event) {
            if (cell == null) return;
            var dataService = this.dataService;
            var displayService = this.displayService;
            var $cell = angular.element(cell);
            var cellScope: any = $cell.scope();
            if (!cellScope)
                throw 'Cell must have a scope';

            var col = this.getVisibleColumn(x);

            if (dataService.isColumnEditable(col) && cellScope.$cellDisplayMode.name == DisplayMode.Edit) {
                displayService.selectControl(event, $cell, col);
                return;
            }

            //check if the previous cell has no errors
            if (this.lastFocusedCell) {
                var prevScope = this.lastFocusedCell.scope();
                if (prevScope.$cellErrors.length) {
                    this.keys.fnSetPosition(this.lastFocusedCell[0], null, event);
                    return;
                }
            }

            if (!dataService.isColumnEditable(col)) { //if the cell is not editable, get the next editable one
                if (event != null && event.type == "click") return;
                var prev = event != null && ((event.keyCode == 9 && event.shiftKey) || event.keyCode == 37); //if shift+tab or left arrow was pressed
                var cellIndex = prev
                    ? this.dt.api.cell(y, x).prev(true).index()
                    : this.dt.api.cell(y, x).next(true).index();
                this.keys.fnSetPosition(cellIndex.column, cellIndex.row, event); //TODO: handle invisible columns
                return;
            }

            this.lastFocusedCell = $cell;

            cellScope.$cellDisplayMode.setMode(DisplayMode.Edit);
            
            //We have to delay the digest in order to have the display template shown for a while 
            //so that KeyTable will not blur as the display template will not be in the dom anymore
            setTimeout(() => {
                cellScope.$digest();
                displayService.selectControl(event, $cell, col);
                cellScope.$broadcast('dt.StartEditCell');
                cellScope.$emit('dt.StartCellEdit');
            }, 100);

        }
    }

    export class InlineEditor extends BaseEditor {

        private lastFocusedCell;
        private keys;

        public static defaultSettings = {
            
        };

        public static $inject = ['api', 'settings', 'displayService', 'dataService'];
        constructor(api, settings, displayService, dataService) {
            super(api, settings, InlineEditor.defaultSettings, displayService, dataService);
        }

        public initialize(): void {
        }

        public saveRow(row: number): void {
            var dtRow = this.dt.api.row(row);
            var $tr = angular.element(dtRow.node());
            var rowScope: any = $tr.scope();
            if (!rowScope)
                throw 'Row must have a scope';

            if (!rowScope.$rowValidate().length) {
                rowScope.$rowDisplayMode.setMode(DisplayMode.ReadOnly);
            }
                
            if (!rowScope.$$phase)
                rowScope.$digest();
        }

        public editRow(row: number): void {
            var dtRow = this.dt.api.row(row);
            var $tr = angular.element(dtRow.node());
            var rowScope: any = $tr.scope();
            if (!rowScope)
                throw 'Row must have a scope';
            rowScope.$rowDisplayMode.setMode(DisplayMode.Edit);

            var cell = this.getFirstRowCell(dtRow);

            if (!rowScope.$$phase)
                rowScope.$digest();

            //We have to delay so that the controls are drawn
            setTimeout(() => {
                this.displayService.selectControl(null, cell.cellNode, cell.column);
            }, 100);
        }
    }

    class Position {

        public x: number;
        public y: number;

        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
        }

        public compare(pos: Position): number {
            if (pos.y > this.y) return 1;
            if (pos.y < this.y) return -1;
            if (pos.y == this.y && pos.x == this.x) return 0;
            if (pos.x > this.x)
                return 1;
            else
                return 0;
        }
    }
}

(function (window, document, undefined) {

    angular.module('dt')
        .constant('dtInlineCellErrorsSettings', {
            error: {
                tagName: 'p',
                className: ''
            }
        })
        .directive('dtInlineCellErrors', ['dtInlineCellErrorsSettings',
            (dtInlineCellErrorsSettings) => {
                return {
                    restrict: 'A',
                    compile: (tElement, tAttrs) => {
                        angular.element(tElement)
                            .append(
                                $('<' + dtInlineCellErrorsSettings.error.tagName + '/>')
                                .attr({
                                    'ng-repeat': 'error in $cellErrors',
                                    'ng-bind': 'error.message',
                                })
                                .addClass(dtInlineCellErrorsSettings.error.className)
                            );
                        //Post compile
                        return (scope, iElement, iAttrs) => {
                            scope.$watchCollection(scope.$rowFormName + "['" + scope.$getInputName() + "'].$error", (newVal) => {
                                scope.$cellValidate();
                            });
                        }
                    }
                };
            }
        ])

        .constant('dtInlineRowErrorsSettings', {
            row: {
                attrs: {},
                className: '',
            },
            cell: {
                attrs: {},
                className: ''
            },
            error: {
                tagName: 'p',
                className: ''
            }
        })
        .directive('dtInlineRowErrors', ['$compile', 'dtInlineRowErrorsSettings',
            ($compile, dtInlineRowErrorsSettings) => {
                return {
                    restrict: 'A',
                    compile: (tElement, tAttrs) => {
                        //Post compile
                        return (scope, iElement, iAttrs) => {
                            var colNode = $('<td/>')
                                .attr('colspan', 100)
                                .attr(<Object>dtInlineRowErrorsSettings.cell.attrs)
                                .addClass(dtInlineRowErrorsSettings.cell.className)
                                .append(
                                $('<div />')
                                    .append(
                                    $('<' + dtInlineRowErrorsSettings.error.tagName + '/>')
                                        .attr({
                                            'ng-repeat': 'error in $rowErrors',
                                            'ng-bind': 'error.message',
                                        })
                                        .addClass(dtInlineRowErrorsSettings.error.className)
                                    )
                                );
                            var rowNode = $('<tr/>')
                                .attr(<Object>dtInlineRowErrorsSettings.row.attrs)
                                .addClass(dtInlineRowErrorsSettings.row.className)
                                .append(colNode);
                            var visible = false;

                            $compile(rowNode)(scope);
                            scope.$watchCollection(scope.$rowFormName + '.$error', (newVal) => {
                                var errors = scope.$rowValidate();
                                var rowData = scope.$rowData;
                                if (!rowData._details)
                                    rowData._details = $([]);
                                var details = rowData._details;
                                if ((errors.length && visible) || (!errors.length && !visible)) return;
                                //remove the node
                                if (!errors.length && visible) {
                                    angular.forEach(details, (tr, i) => {
                                        if (tr === rowNode[0])
                                            details.splice(i, 1);
                                    });
                                    visible = false;
                                    rowNode.detach();
                                }
                                else if (errors.length && !visible) {
                                    details.push(rowNode[0]);
                                    visible = true;
                                    scope.$row.child.show();
                                }
                            });
                        };
                    }
                }
            }
        ])


        .directive('dtTest', [() => {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: (scope, elm, attr, ngModelCtrl) => {
                    var name = attr.ngModel;
                    var validator = (val) => {
                        return val === 'test';
                    };
                    ngModelCtrl.$validators.dtTest = (modelValue) => {
                        scope.$watch(name + '.engine', (newVai) => {
                            ngModelCtrl.$setValidity('dtTest', validator(newVai));
                        });
                        return validator(modelValue.engine);
                    };
                }
            };
        }])

    ;


    //#region Extensions

    $.fn.DataTable.Api.register('row().edit()', function () {
        var ctx = this.settings()[0];
        ctx.editable.editor.editRow(this.index());
    });
    $.fn.DataTable.Api.register('row().save()', function () {
        var ctx = this.settings()[0];
        ctx.editable.editor.saveRow(this.index());
    });

    $.fn.DataTable.Api.register('row().cell()', function (column) {
        var rIdx = this.index();
        var cIdx;
        var ctx = this.settings()[0];
        var cells = ctx.aoData[rIdx].anCells;
        if ($.isNumeric(column)) {
            cIdx = parseInt(column);
            if (cIdx >= ctx.aoColumns.length) return null;
            return this.table().cell(rIdx, cIdx);
        }

        if (cells == null) return null;
        cIdx = cells.indexOf(column); //treat column as Element
        if (cIdx < 0) return null;
        return this.table().cell(rIdx, cIdx);
    });
    $.fn.DataTable.Api.register('cell().next()', function (editable) {
        var oSettings = this.settings()[0];
        var index = this.index();

        var currX = index.column;
        var currY = index.row;
        var complete = false;

        while (!complete) {
            //Try to go to the right column
            if ((currX + 1) < oSettings.aoColumns.length) {
                if (!editable || (oSettings.aoColumns[(currX + 1)].editable !== false && !!oSettings.aoColumns[(currX + 1)].mData)) {
                    complete = true;
                }
                currX++;
            }
            //Try to go to the next row
            else if ((currY + 1) < oSettings.aoData.length) {
                currX = -1;
                currY++;
            } else
                complete = true;
        }
        return this.table().cell(currY, currX);
    });
    $.fn.DataTable.Api.register('cell().prev()', function (editable) {
        var oSettings = this.settings()[0];
        var index = this.index();

        var currX = index.column;
        var currY = index.row;
        var complete = false;

        while (!complete) {
            //Try to go to the left column
            if ((currX - 1) > -1) {
                if (!editable || (oSettings.aoColumns[(currX - 1)].editable !== false && !!oSettings.aoColumns[(currX - 1)].mData)) {
                    complete = true;
                }
                currX--;
            }
            //Try to go to the prev row
            else if ((currY - 1) > -1) {
                currX = oSettings.aoColumns.length - 1;
                currY--;
            } else
                complete = true;
        }
        return this.table().cell(currY, currX);
    });
    //#endregion

    //#region TableTools buttons

    var TableTools = $.fn.DataTable.TableTools;

    //#region editable_remove
    TableTools.buttons.editable_remove = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Remove",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.editable)
                throw 'Editable plugin must be initialized';
            var editable = this.s.dt.editable;
            if (!editable.dataService)
                throw 'Editable plugin must have a editor set';
            var editor: dt.editable.IEditor = editable.editor;
            var settings = editable.settings;
            var api = this.s.dt.oInstance.api();
            var itemsToRemove = [];
            var data = this.s.dt.aoData;
            var i;
            for (i = (data.length-1); i >= 0; i--) {
                if (data[i]._DTTT_selected) {
                    itemsToRemove.push(api.row(i));
                }
            }
            var itemsRemoved = editor.removeItems(itemsToRemove);
            if ($.isFunction(settings.itemsRemoved))
                settings.itemsRemoved.call(editable, itemsRemoved);

            var scope = angular.element(this.s.dt.nTable).scope();
            if (scope && !scope.$$phase)
                scope.$apply();

            //If the restore deleted button is present enable it
            var idx = this.s.buttonSet.indexOf("editable_restore_removed");
            if (idx < 0 && !itemsRemoved.length) return;
            $(this.s.tags.button, this.dom.container).eq(idx).removeClass(this.classes.buttons.disabled);
        },
        "fnSelect": function (nButton, oConfig) {
            if (this.fnGetSelected().length !== 0) {
                $(nButton).removeClass(this.classes.buttons.disabled);
            } else {
                $(nButton).addClass(this.classes.buttons.disabled);
            }
        },
        "fnInit": function (nButton, oConfig) {
            $(nButton).addClass(this.classes.buttons.disabled);
        }
    });
    //#endregion

    //#region editable_restore_removed
    TableTools.buttons.editable_restore_removed = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Restore removed",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.editable)
                throw 'Editable plugin must be initialized';
            var editable = this.s.dt.editable;
            if (!editable.dataService)
                throw 'Editable plugin must have a editor set';
            var editor: dt.editable.IEditor = editable.editor;
            var settings = editable.settings;
            var restoredItems = editor.restoreRemovedItems();
            if ($.isFunction(settings.itemsRestored))
                settings.itemsRestored.call(editable, restoredItems);
            $(nButton).addClass(this.classes.buttons.disabled);
            
            var scope = angular.element(this.s.dt.nTable).scope();
            if (scope && !scope.$$phase)
                scope.$apply();
        },
        "fnInit": function (nButton, oConfig) {
            $(nButton).addClass(this.classes.buttons.disabled);
        }
    });
    //#endregion

    //#region editable_add
    TableTools.buttons.editable_add = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Add",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.editable)
                throw 'Editable plugin must be initialized';
            var editable = this.s.dt.editable;
            if (!editable.dataService)
                throw 'Editable plugin must have a editor set';
            var editor: dt.editable.IEditor = editable.editor;
            var settings = editable.settings;

            var item = editor.createItem();
            if ($.isFunction(settings.itemCreated))
                settings.itemCreated.call(editable, item);

            editor.addItem(item);

            if ($.isFunction(settings.itemAdded))
                settings.itemAdded.call(editable, item);

            var scope = angular.element(this.s.dt.nTable).scope();
            if (scope && !scope.$$phase)
                scope.$apply();
        },
        "fnInit": function (nButton, oConfig) {
            //$(nButton).addClass(this.classes.buttons.disabled);
        }
    });
    //#endregion

    //#region editable_reject
    TableTools.buttons.editable_reject = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Reject",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.editable)
                throw 'Editable plugin must be initialized';
            var editable = this.s.dt.editable;
            if (!editable.dataService)
                throw 'Editable plugin must have a editor set';
            var editor: dt.editable.IEditor = editable.editor;
            var settings = editable.settings;
            var api = this.s.dt.oInstance.api();
            var itemsToReject= [];
            var data = this.s.dt.aoData;
            var i;
            for (i = (data.length - 1); i >= 0; i--) {
                if (data[i]._DTTT_selected)
                    itemsToReject.push(api.row(i));
            }
            var itemsRejected = editor.rejectItems(itemsToReject);
            if ($.isFunction(settings.itemsRejected))
                settings.itemsRejected.call(editable, itemsRejected);

            var scope = angular.element(this.s.dt.nTable).scope();
            if (scope && !scope.$$phase)
                scope.$apply();
        },
        "fnSelect": function (nButton, oConfig) {
            if (this.fnGetSelected().length !== 0) {
                $(nButton).removeClass(this.classes.buttons.disabled);
            } else {
                $(nButton).addClass(this.classes.buttons.disabled);
            }
        },
        "fnInit": function (nButton, oConfig) {
            $(nButton).addClass(this.classes.buttons.disabled);
        }
    });
    //#endregion

    //#endregion

} (window, document, undefined));