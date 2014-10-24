/// <reference path="dataTables.angular.editable.breeze.d.ts" />
/// <reference path="dataTables.angular.editable.uiSelect2.d.ts" />
/// <reference path="dataTables.angular.editable.angularStrap.d.ts" />
declare module dt.editable {
    interface IEditCtrlWrapper {
        contentBefore: any[];
        contentAfter: any[];
        attrs: any;
        ngClass: any;
    }
    interface IEditCtrl {
        contentBefore: any[];
        contentAfter: any[];
        attrs: any;
        ngClass: any;
    }
    interface IColumnTemplateSetupArgs {
        column: any;
        editCtrlWrapper: IEditCtrlWrapper;
        editCtrl: IEditCtrl;
    }
    interface IRowTemplateSetupArgs {
        formName: string;
        attrs: any;
        classes: string[];
        ngClass: any;
        hash: string;
        rowIndex: number;
        dataPath: number;
    }
    interface IDataService {
        getColumnModelPath(col: any): string;
        removeItems(items: any[]): any[];
        rejectItems(items: any[]): any[];
        restoreRemovedItems(): any[];
        createItem(): any;
        addItem(item: any): void;
        validateItemProperty(column: any, row: any): ValidationError[];
        validateItem(row: any): ValidationError[];
        getItemPropertyValue(column: any, row: any): any;
    }
    interface IDisplayService {
        cellPostLink(args: ICellPostLinkArgs): void;
        setupColumnTemplate(args: IColumnTemplateSetupArgs): void;
        mergeCellErrors(errors: ValidationError[]): string;
        setupRowTemplate(args: IRowTemplateSetupArgs): void;
        mergeRowErrors(errors: ValidationError[]): string;
        selectControl(event: any, cell: any, col: any): void;
        getEditTemplateForType(type: any, col: any): string;
        getControlClass(): string;
        getControlWrapperClass(): string;
        canBlurCell(event: any, cell: any, col: any): boolean;
        dispose(): void;
    }
    interface IDisplayServiceEditTypePlugin {
        getSupportedTypes(): string[];
        getEditTemplateForType(type: any, col: any): string;
        selectControl(event: any, cell: any, col: any): boolean;
        canBlurCell(event: any, cell: any, col: any): boolean;
        cellPostLink(args: ICellPostLinkArgs): void;
        dispose(): void;
    }
    interface IDisplayServiceCellValidationPlugin {
        setupColumnTemplate(args: IColumnTemplateSetupArgs): void;
        mergeErrors(errors: ValidationError[]): string;
    }
    interface IDisplayServiceRowValidationPlugin {
        setupRowTemplate(args: IRowTemplateSetupArgs): void;
        mergeErrors(errors: ValidationError[]): string;
    }
    interface IDisplayServiceStylePlugin {
        setupColumnTemplate(args: IColumnTemplateSetupArgs): void;
        setupRowTemplate(args: IRowTemplateSetupArgs): void;
    }
    interface IEditor {
        initialize(): void;
        removeItems(items: any[]): any[];
        rejectItems(items: any[]): any[];
        restoreRemovedItems(): any[];
        createItem(): any;
        addItem(item: any): void;
        editRow(row: number): void;
        saveRow(row: number): void;
        rejectRow(row: number): void;
        cellCompile(event: ng.IAngularEvent, args: ICellCompileArgs): any;
        cellPostLink(event: ng.IAngularEvent, args: ICellPostLinkArgs): any;
        cellPreLink(event: ng.IAngularEvent, args: ICellPreLinkArgs): any;
        rowCompile(event: ng.IAngularEvent, args: IRowCompileArgs): any;
        rowPostLink(event: ng.IAngularEvent, args: IRowPostLinkArgs): any;
        rowPreLink(event: ng.IAngularEvent, args: IRowPreLinkArgs): any;
    }
    interface ISettings {
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
    interface ISettingsService {
    }
    interface ISettingsDataService {
        type: any;
        settings: any;
    }
    class Editable implements ITablePlugin {
        static MODEL_PATH: string;
        static EDIT_CONTROL_ATTRS: string;
        static EDIT_CONTROL_WRAPPER_ATTRS: string;
        static EDIT_CONTROL: string;
        static BEFORE_EDIT_CONTROL: string;
        static AFTER_EDIT_CONTROL: string;
        static DISPLAY_CONTROL: string;
        static defaultEditTemplateWrapper: {
            tagName: string;
            className: string;
            attrs: {};
        };
        static defaultEditTemplateControl: {
            tagName: string;
            attrs: {
                type: string;
            };
            className: string;
        };
        static defaultTemplate: {
            wrapper: {
                tagName: string;
                className: string;
                attrs: {};
            };
            control: {
                tagName: string;
                attrs: {
                    type: string;
                };
                className: string;
            };
        };
        static defaultSettings: ISettings;
        public settings: any;
        public initialized: boolean;
        public dt: {
            api: any;
            settings: any;
        };
        private $injector;
        private tableController;
        private i18NPlugin;
        public editor: IEditor;
        public dataService: IDataService;
        public displayService: IDisplayService;
        public i18NService: i18N.I18NService;
        static $inject: string[];
        constructor(tableController: TableController, i18N: i18N.I18NPlugin, $injector: ng.auto.IInjectorService);
        public getEventListeners(): IEventListener[];
        public name: string;
        static isEnabled(settings: any): boolean;
        public destroy(): void;
        public initialize(dtSettings: any): void;
        private setupColumns();
        private processTableAttribute(event, options, propName, propVal, $node);
        private processColumnAttribute(event, column, propName, propVal, $node);
        private prepareColumnTemplates();
        static generateHtmlAttributes(obj: any): string;
        static isColumnEditable(column: any): boolean;
        public getColumnDisplayControlTemplate(col: any): string;
        public getColumnEditControlTemplate(col: any): any;
        static setNgClass(obj: any, target: any): void;
        static mergeErrors(errors: ValidationError[]): string;
        static getColumnType(col: any): any;
        static getColumnTemplateSettings(col: any): any;
        static getColumnEditableSettings(col: any): any;
        static fillRowValidationErrors(row: any, errors: ValidationError[]): void;
        static getCell(col: any, row: any): JQuery;
        private getEditorSettings();
        private setupI18NService();
        private setupEditor();
        private setupDisplayService();
        private setupDataService();
    }
    class ColumnAttributeProcessor extends BaseAttributeProcessor implements IColumnAttributeProcessor {
        constructor();
        public process(column: any, attrName: string, attrVal: any, $node: JQuery): void;
    }
    class TableAttributeProcessor extends BaseAttributeProcessor implements ITableAttributeProcessor {
        constructor();
        public process(options: any, attrName: string, attrVal: any, $node: JQuery): void;
    }
    class DisplayMode {
        public name: string;
        constructor();
        public setMode(modeName: string): void;
        static ReadOnly: string;
        static Edit: string;
    }
    class ValidationError {
        public property: string;
        public message: string;
        public validator: Validator;
        constructor(message: string, validator: Validator, property?: string);
    }
    class Validator {
        public name: string;
        public options: any;
        public column: any;
        constructor(name: any, options: any, column?: any);
    }
    class DefaultDataSerice implements IDataService {
        public removedItems: any[];
        public dt: {
            settings: any;
            api: any;
        };
        public settings: any;
        public i18NService: i18N.I18NService;
        static $inject: string[];
        constructor(api: any, settings: any, i18NService: any);
        public getColumnModelPath(col: any): string;
        public removeItems(items: any[]): any[];
        public rejectItems(items: any[]): any[];
        public restoreRemovedItems(): any[];
        public createItem(): any;
        public addItem(item: any): void;
        public validateItem(row: any): ValidationError[];
        public validateItemProperty(column: any, row: any): ValidationError[];
        public getItemPropertyValue(column: any, row: any): any;
        public getColumnCurrentIndex(column: any): number;
        public getEditableColumns(): any[];
        public onBlocksCreated(event: ng.IAngularEvent, blocks: IBlock[]): void;
    }
    class InlineDisplayServiceCellValidationPlugin implements IDisplayServiceCellValidationPlugin {
        public setupColumnTemplate(args: IColumnTemplateSetupArgs): void;
        public mergeErrors(errors: ValidationError[]): string;
    }
    class InlineDisplayServiceRowValidationPlugin implements IDisplayServiceRowValidationPlugin {
        public setupRowTemplate(args: IRowTemplateSetupArgs): void;
        public mergeErrors(errors: ValidationError[]): string;
    }
    class DefaultDisplayService implements IDisplayService {
        public settings: any;
        public pluginTypes: {};
        public stylePlugin: IDisplayServiceStylePlugin;
        public cellValidationPlugin: IDisplayServiceCellValidationPlugin;
        public rowValidationPlugin: IDisplayServiceRowValidationPlugin;
        private $injector;
        private tableController;
        static $inject: string[];
        constructor(tableController: any, settings: any, plugins: any, $injector: any);
        private setupPlugins(plugins);
        public canBlurCell(event: any, cell: any, col: any): boolean;
        public cellPostLink(args: ICellPostLinkArgs): void;
        public setupRowTemplate(args: IRowTemplateSetupArgs): void;
        public selectControl(event: any, cell: any, col: any): void;
        public getControlClass(): string;
        public getControlWrapperClass(): string;
        public dispose(): void;
        private getWrappedEditTemplate(type, template, content, col, plugin?);
        public getEditTemplateForType(type: any, col: any): string;
        public mergeCellErrors(errors: ValidationError[]): string;
        public setupColumnTemplate(args: IColumnTemplateSetupArgs): void;
        public mergeRowErrors(errors: ValidationError[]): string;
    }
    class BaseEditCommand extends command.BaseCommand {
        constructor(defSettings: any, settings: any);
        public execute(scope: any): void;
    }
    class EditCommand extends BaseEditCommand {
        static alias: string;
        static $inject: string[];
        constructor(settings: any);
    }
    class BaseRemoveCommand extends command.BaseCommand {
        constructor(defSettings: any, settings: any);
        public execute(scope: any): void;
    }
    class RemoveCommand extends BaseRemoveCommand {
        static alias: string;
        static $inject: string[];
        constructor(settings: any);
    }
    class BaseRejectCommand extends command.BaseCommand {
        constructor(defSettings: any, settings: any);
        public execute(scope: any): void;
    }
    class RejectCommand extends BaseRejectCommand {
        static alias: string;
        static $inject: string[];
        constructor(settings: any);
    }
    class BaseEditor implements IEditor {
        public dt: {
            settings: any;
            api: any;
        };
        public type: any;
        public settings: any;
        public dataService: IDataService;
        public displayService: IDisplayService;
        constructor(api: any, settings: any, defaultSettings: any, displayService: IDisplayService, dataService: IDataService);
        public initialize(): void;
        public cellCompile(event: ng.IAngularEvent, args: ICellCompileArgs): void;
        public cellPreLink(event: ng.IAngularEvent, args: ICellPreLinkArgs): void;
        public cellPostLink(event: ng.IAngularEvent, args: ICellPostLinkArgs): void;
        public rowCompile(event: ng.IAngularEvent, args: IRowCompileArgs): void;
        public rowPreLink(event: ng.IAngularEvent, args: IRowPreLinkArgs): void;
        public rowPostLink(event: ng.IAngularEvent, args: IRowPostLinkArgs): void;
        public getVisibleColumn(index: any): any;
        public getFirstRowCell(row: any): {
            cellIndex: number;
            column: any;
            cellNode: any;
        };
        public removeItems(items: any[]): any[];
        public rejectItems(items: any[]): any[];
        public restoreRemovedItems(): any[];
        public createItem(): any;
        public addItem(item: any): void;
        public editRow(row: number): void;
        public rejectRow(row: number): void;
        public saveRow(row: number): void;
    }
    class BatchEditor extends BaseEditor {
        private lastFocusedCell;
        private keys;
        static defaultSettings: {
            editEvent: string;
        };
        static $inject: string[];
        constructor(api: any, settings: any, displayService: any, dataService: any);
        public editRow(row: number): void;
        public initialize(): void;
        public addItem(item: any): void;
        public onCellBluring(cell: any, x: any, y: any, event: any): boolean;
        public onCellBlur(cell: any, x: any, y: any, event: any): void;
        public onCellFocus(cell: any, x: any, y: any, event: any): void;
    }
    class InlineEditor extends BaseEditor {
        private lastFocusedCell;
        private keys;
        static defaultSettings: {};
        static $inject: string[];
        constructor(api: any, settings: any, displayService: any, dataService: any);
        public initialize(): void;
        public saveRow(row: number): void;
        public editRow(row: number): void;
    }
}
