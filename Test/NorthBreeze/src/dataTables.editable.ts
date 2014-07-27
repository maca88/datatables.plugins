module dt.editable {

    //#region interfaces

    export interface IDataAdapter {
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

    export interface IDisplayAdapter {
        mergeErrors(errors: ValidationError[], type): string;
        getPopoverAttributes(contentExpr, toggleExpr, animation?, placement?);
        selectControl(event, cell, col): void;
        getEditTemplateForType(type, col): string;
        getControlClass(): string;
        getControlWrapperClass(): string;
        prepareCell(cell): void;
        canBlurCell(event, cell, col): boolean;
    }

    export interface IDisplayAdapterEditTypePlugin {
        getSupportedTypes(): string[];
        getEditTemplateForType(type, col): string;
        selectControl(event, cell, col): boolean;
        canBlurCell(event, cell, col): boolean;
        prepareCell(cell): void;
    }

    export interface IDisplayAdapterPopoverPlugin {
        getPopoverAttributes(contentExpr, toggleExpr, animation?, placement?);
    }

    export interface IEditorAdapter {
        initialize(): void;

        prepareCell(cell): void;

        prepareRow(row): void;

        removeItems(items: any[]): any[];
        rejectItems(items: any[]): any[];
        restoreRemovedItems(): any[];
        createItem(): any;
        addItem(item): void;

    }

    //#endregion

    export class Editable {

        public static defaultEditTemplateWrapper = {
            tagName: 'div',
            className: 'form-group',
            attrs: {}
        }

        public static defaultTemplate = {
            wrapper: {
                tagName: 'div',
                className: 'form-group',
                attrs: {}
            },
            control: {
                tagName: 'input',
                attrs: {
                    type: 'text'
                },
                className: 'form-control',
            }

            

            //events: {
            //    'keydown': (e) => {
            //        switch (e.keyCode) {
            //            case 38: /* up arrow */
            //            case 40: /* down arrow */
            //            case 37: /* left arrow */
            //            case 39: /* right arrow */
            //                e.stopPropagation(); //not supported
            //                break;
            //        }
            //    }
            //}
        } 

        public static defaultSettings = {
            tableFocused: null,
            itemAdded: null,
            itemsRemoved: null,
            itemsRejected: null,
            itemsRestored: null,
            itemCreated: null,

            startEditing: null,

            adapters: {
                data: {
                    type: null,
                    settings: {
                        createItem: null, //needed when using breeze or jaydata adapter
                        validate: null //needed for default adapter
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
                        popover: null
                    },
                },
                editor: {
                    type: null,
                    settings: {}
                }
            },

            startCellEditing: null,
            endCellEditing: null,
            formatMessage: (msg, ctx) => msg,
            language: {
            },
            
        }

        //constant
        public static MODEL_PATH = "MODEL_PATH";
        public static EDIT_CONTROL_ATTRS = "EDIT_CONTROL_ATTRS";
        public static EDIT_CONTROL_WRAPPER_ATTRS = "EDIT_CONTROL_WRAPPER_ATTRS";
        public static EDIT_CONTROL = "EDIT_CONTROL";
        public static DISPLAY_CONTROL = "DISPLAY_CONTROL";

        public settings;
        public initialized: boolean = false;
        public dt = {
            api: null,
            settings: null
        };
        private $injector: ng.auto.IInjectorService;

        public editorAdapterInstance: IEditorAdapter;
        public dataAdapterInstance: IDataAdapter;
        public displayAdapterInstance: IDisplayAdapter;

        constructor(api, settings) {
            this.settings = $.extend(true, {}, Editable.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.$injector = angular.injector();
            this.dt.settings.editable = this;
            if (angular === undefined)
                throw 'Angular must be included for Editable plugin to work';
            this.registerCallbacks();
            this.setupAdapters();
            this.editorAdapterInstance.initialize();

        }

        public initialize() {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'editableInitCompleted', 'editableInitCompleted', [this]);
        }

        private registerCallbacks() {
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'cellCompiling', this.onCellCompiling.bind(this), "cellCompiling_Editable");
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'rowCompiling', this.onRowCompiling.bind(this), "rowCompiling_Editable");
        }

        private onCellCompiling(cell) {
            this.editorAdapterInstance.prepareCell(cell);
        }

        private onRowCompiling(row) {
            this.editorAdapterInstance.prepareRow(row);
        }

        public formatMessage(msg, opts): string {
            return this.settings.formatMessage.call(this, msg, opts);
        }

        public getColumnDisplayControlTemplate(col): string {
            if (col.templateHtml != null) {
                return col.templateHtml;
            } else if (col.expression != null && angular.isString(col.expression)) {
                return '<span ng-bind="' + col.expression + '"></span>';
            } else if (col.data != null) {
                var modelPath = this.dataAdapterInstance.getColumnModelPath(col);
                return '<span ng-bind="' + modelPath + '"></span>';
            } else if (col.defaultContent != "") {
                return col.defaultContent;
            }
            return null;
        }

        public getColumnEditControlTemplate(col): any {
            var type = Editable.getColumnType(col);
            var displayAdapter = this.displayAdapterInstance;
            if (!type)
                throw 'Column type must be defined';
            type = type.toLowerCase();
            return displayAdapter.getEditTemplateForType(type, col);
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

        private setupAdapters() {
            this.setupDataAdapter();
            this.setupDisplayAdapter();
            this.setupEditorAdapter();
        }

        private setupEditorAdapter() {
            var editorAdapter = this.settings.adapters.editor;
            var locals = {
                'settings': editorAdapter.settings,
                'api': this.dt.api,
                'editable': this
            };
            if (!editorAdapter.type) {
                editorAdapter.type = BatchEditorAdapter;
            }
            this.editorAdapterInstance = this.$injector.instantiate(editorAdapter.type, locals);
        }

        private setupDisplayAdapter() {
            var displayAdapter = this.settings.adapters.display;
            var locals = {
                'settings': displayAdapter.settings,
                'api': this.dt.api,
                'editable': this,
                'plugins': displayAdapter.plugins
            };
            if (!displayAdapter.type) 
                displayAdapter.type = DefaultDisplayAdapter;
            if (Editable.checkAngularModulePresence('mgcrea.ngStrap')) {
                displayAdapter.plugins.editTypes.push(AngularStrapDisplayAdapterPlugin);
                displayAdapter.plugins.popover = AngularStrapDisplayAdapterPlugin;
            }
            if (Editable.checkAngularModulePresence('ui.select2')) {
                displayAdapter.plugins.editTypes.push(UiSelect2DisplayAdapterPlugin);
            }
            //Instantiate the display adapter with the angular DI
            this.displayAdapterInstance = this.$injector.instantiate(displayAdapter.type, locals);
        }

        private setupDataAdapter() {
            var dataAdapter = this.settings.adapters.data;
            if (!dataAdapter.type) {
                if (breeze != null && $data != null)
                    dataAdapter.type = DefaultDataAdapter;
                else if (breeze != null)
                    dataAdapter.type = BreezeDataAdapter;
                else if ($data != null)
                    dataAdapter.type = null; //TODO
                else
                    dataAdapter.type = DefaultDataAdapter;
            }
            if (dataAdapter.type == null)
                throw 'Editable plugins requires a data adapter to be set';
            this.dataAdapterInstance = new dataAdapter.type(this, this.dt.api, dataAdapter.settings);
        }

    }

    export class ValidationError {
        public property: string;
        public message: string;
        public validator: Validator;

        constructor(message: string, validator: Validator, property: string = null) {
            this.message = message;
            this.validator = validator;
            this.property = property;
        }
    }

    export class Validator {
        public name: string;
        public options: any;
        public column: any;

        constructor(name, options, column) {
            this.name = name;
            this.options = options;
            this.column = column;
        }

    }

    export class DefaultDataAdapter implements IDataAdapter {
         
        public dt = {
            settings: null,
            api: null
        }
        public settings;
        public editable: Editable;

        constructor(editable, api, settings) {
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
            this.editable = editable;
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
            throw 'Reject is not supported by DefaultDataAdapter';
        }

        public restoreRemovedItems(): any[] {
            throw 'Restore removed items is not supported by DefaultDataAdapter';
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
            var columns = this.getEditableColumns();
            for (var i = 0; i < columns.length; i++) {
                errors = errors.concat(this.validateItemProperty(columns[i], row));
            }
            return errors;
        }

        public validateItemProperty(column, row): ValidationError[] {
            var validate = column.editable.validate || this.settings.validate;
            var errors: ValidationError[] = [];
            var colValue = this.getItemPropertyValue(column, row);
            if (column.editable.validators != null && $.isFunction(validate)) {
                $.each(column.editable.validators, (key, val) => {
                    var validator = new Validator(key, val, column);
                    var success = validate.call(this, colValue, validator, row);
                    if (success) return;
                    var msg = this.editable.formatMessage(this.editable.settings.language.validators[key] || "Validator message is missing", validator.options);
                    errors.push(new ValidationError(msg, validator, column.mData));
                });
            }
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

    //#region Breeze data adapter

    export class BreezeDataAdapter extends DefaultDataAdapter {
        private deletedEntities = [];

        constructor(editable, api, settings) {
            super(editable, api, settings);
            if (!$.isFunction(this.settings.createItem))
                throw "'createItem' setting property must be provided in order to work with BreezeDataAdapter";
        }

        public removeItems(items: any[]): any[] {
            var removed = [];
            for (var i = 0; i < items.length; i++) {
                var entity = items[i].data();
                entity.entityAspect.setDeleted();
                if (entity.entityAspect.entityState === breeze.EntityState.Detached) continue;
                //TODO: check if is an simple or breeze array if not simple we have to add to the deleted entities
                this.deletedEntities.push(entity);
                removed.push(items[i]);
            }
            return removed;
        }

        public restoreRemovedItems(): any[] {
            var restored = [];
            for (var i = 0; i < this.deletedEntities.length; i++) {
                var entity = this.deletedEntities[i];
                entity.entityAspect.rejectChanges();
                restored.push(entity);
            }
            return restored;
        }

        public rejectItems(items: any[]): any[] {
            var rejected = [];
            for (var i = 0; i < items.length; i++) {
                var entity = items[i].data();
                entity.entityAspect.rejectChanges();
                rejected.push(items[i]);
            }
            return rejected;
        }

        public validateItemProperty(column, row): ValidationError[] {
            var errors: ValidationError[] = super.validateItemProperty(column, row);
            var entity = row.data();
            if (entity.entityType == null || entity.entityAspect == null)
                throw 'Editing non breeze entities is not supported!';
            return errors.concat(this.validateEntityProperty(column, entity));
        }

        //mData support: prop, prop.subProp.subSubProp, prop[1].subProp
        private validateEntityProperty(column, entity) {
            var errors: ValidationError[] = [];
            var currentEntity = entity;
            var arrRegex = /([\w\d]+)\[([\d]+)\]/i;
            var paths = column.mData.split('.');
            for (var i = 0; i < paths.length; i++) {
                var path = paths[i];
                if (i == (paths.length - 1)) { //last iteration
                    if (currentEntity.entityAspect.validateProperty(path))
                        return errors;
                    var entityErrors = currentEntity.entityAspect.getValidationErrors();
                    $.each(entityErrors, (idx, err) => {
                        if (err.propertyName != path) return;
                        errors.push(new ValidationError(err.errorMessage, err.validator, err.propertyName));
                    });
                }
                var matches = path.match(arrRegex);
                currentEntity = (matches)
                ? currentEntity[matches[1]][parseInt(matches[2])]
                : currentEntity[path];
            }
            return errors;
        }
    }

    //#endregion

    //#region AngularStrap display adapter plugin

    export class AngularStrapDisplayAdapterPlugin implements
        IDisplayAdapterEditTypePlugin, IDisplayAdapterPopoverPlugin {

        public displayAdapter: IDisplayAdapter;

        public static $inject = ['displayAdapter'];
        constructor(displayAdapter) {
            this.displayAdapter = displayAdapter;
        }

        public selectControl(event, cell, col): boolean {
            return false;
        }

        public prepareCell(cell): void {
        }

        public canBlurCell(event: any, cell, col): boolean {
            if (!event) return true;
            if (event.type === 'click') {
                var picker = $(event.target).closest('div.datepicker,div.timepicker');
                //check if the picker element was clicked or if the target is not in the body (assume that the picker view changed)
                if (picker.length || !$(event.target).closest('body').length) return false;
            }
            var type = Editable.getColumnType(col);
            if (type !== 'datetime') return true;

            var $target = $(event.target);

            /* Capture shift+tab to match the left arrow key */
            var key = (event.keyCode == 9 && event.shiftKey) ? -1 : event.keyCode;

            //Tab or right arrow
            if ((key === 9 || key === 39) && $target.attr('bs-datepicker') !== undefined) {
                $target.trigger('blur').trigger('mouseleave');
                $('input[bs-timepicker]', $(event.target).parent().next()).focus().click();
                return false;
            }
            //Shit+tab or left arrow
            if ((key === -1 || key === 37) && $target.attr('bs-timepicker') !== undefined) {
                $target.trigger('blur').trigger('mouseleave');
                $('input[bs-datepicker]', $(event.target).parent().prev()).focus().click();
                return false;
            }
            return true;
        }

        public getSupportedTypes(): string[] {
            return ["date", "datetime", "time"];
        }

        public getEditTemplateForType(type, col): string {
            var opts = Editable.getColumnTemplateSettings(col) || {};
            var $template;
            var attrs = {
                'ng-model': Editable.MODEL_PATH,
                'type': 'text'
            };
            attrs[Editable.EDIT_CONTROL_ATTRS] = '';

            switch (type) {
                case 'date':
                    $template = this.getDateTemplate(attrs, opts);
                    break;
                case 'time':
                    $template = this.getTimeTemplate(attrs, opts);
                    break;
                case 'datetime':
                    $template = this.getDateTimeTemplate(attrs, opts);
                    break;
                default:
                    return null;
            }

            if ($.isFunction(opts.init))
                opts.init.call(this, $template, type, opts);

            var template = type !== 'datetime' ? $template[0].outerHTML : $template.html();
            return template;
        }

        private getDateTimeTemplate(attrs, opts) {
            var date = this.getDateTemplate(attrs, opts.date || {});
            var time = this.getTimeTemplate(attrs, opts.time || {});
            return angular.element('<div />')
                .append(
                angular.element('<div />')
                    .addClass('form-group')
                    .append(date),
                angular.element('<div />')
                    .addClass('form-group')
                    .append(time)
                );
        }

        private getDateTemplate(attrs: Object, opts) {
            return angular.element('<input />')
                .attr('size', 8)
                .attr('data-container', 'body')
                .attr(attrs)
                .addClass('form-control')
                .addClass(this.displayAdapter.getControlClass())
                .addClass(opts.className || '')
                .attr('bs-datepicker', '')
                .attr(<Object>(opts.attrs || {}));
        }

        private getTimeTemplate(attrs: Object, opts) {
            return angular.element('<input />')
                .attr('size', 5)
                .attr('data-container', 'body')
                .attr(attrs)
                .addClass('form-control')
                .addClass(this.displayAdapter.getControlClass())
                .addClass(opts.className || '')
                .attr('bs-timepicker', '')
                .attr(<Object>(opts.attrs || {}));
        }

        public getPopoverAttributes(contentExpr, toggleExpr, placement = 'bottom') {
            return {
                'bs-popover': '',
                'data-content': contentExpr,
                'bs-show': toggleExpr,
                'data-trigger': 'manual',
                'data-html': true,
                'data-placement': placement,
            };
        }
    }
        
    //#endregion

    //#region ui-select2 display adapter plugin

    export class UiSelect2DisplayAdapterPlugin implements IDisplayAdapterEditTypePlugin {

        public displayAdapter: IDisplayAdapter;

        public static $inject = ['displayAdapter'];
        constructor(displayAdapter) {
            this.displayAdapter = displayAdapter;
        }

        public getSupportedTypes(): string[] {
            return ['select'];
        }

        public selectControl(event, cell, col): boolean {
            var select:any = $('select[ui-select2]', cell);
            if (!select.length) return false;
            setTimeout(() => select.select2('open'), 0);
            return true;
        }

        public canBlurCell(event, cell, col): boolean {
            return true;
        }

        public prepareCell(cell): void {
            var editable = $.isPlainObject(cell.column.editable) ? cell.column.editable : null;
            if (!editable) return;
            var scope = cell.scope;
            if(editable.options)
                scope.$options = editable.options;
            if (editable.groups)
                scope.$groups = editable.groups;
            scope.$settings = editable.settings || {};
        }

        /*
            <select ui-select2 ng-model="select2" data-placeholder="Pick a number">
                <option value=""></option>
                <option ng-repeat="number in range" value="{{number.value}}">{{number.text}}</option>
            </select>
         */
        public getEditTemplateForType(type, col): string {
            var opts = Editable.getColumnEditableSettings(col) || {}; //TODO: default settings   

            var settings = opts.settings || {};
            var template = opts.template || {};
            template.select = template.select || {};
            template.option = template.option || {};
            template.optgroup = template.optgroup || {};

            var select = $('<select />')
                .attr('ui-select2', '$settings')
                .attr('ng-model', Editable.MODEL_PATH)
                .attr(Editable.EDIT_CONTROL_ATTRS, '')
                .attr(<Object>(template.select.attrs || {}))
                .addClass(template.select.className || '')
                .addClass(this.displayAdapter.getControlClass());

            //we have to add an empty option
            if (settings.allowClear === true) {
                select.append($('<option />'));
            }

            if (opts.groups) {
                select.append(
                    $('<optgroup />')
                    .attr('ng-repeat', 'group in $groups')
                    .attr('label', '{{group.name}}')
                    .attr(<Object>(template.optgroup.attrs || {}))
                    .addClass(template.optgroup.className || '')
                    .append(
                        $('<option />')
                        .attr('ng-repeat', 'option in group.options')
                        .attr('ng-bind', 'option.text')
                        .attr('ng-value', 'option.value')
                        .attr(<Object>(template.option.attrs || {}))
                        .addClass(template.option.className || '')
                    ));
            } else {
                select.append(
                    $('<option />')
                        .attr('ng-repeat', 'option in $options')
                        .attr('ng-bind', 'option.text')
                        .attr('ng-value', 'option.value')
                        .attr(<Object>(template.option.attrs || {}))
                        .addClass(template.option.className || '')
                    );
            }
            return select[0].outerHTML;
        }
    }

    //#endregion

    export class DefaultDisplayAdapter implements IDisplayAdapter {
        public dt = {
            settings: null,
            api: null
        }
        public settings;
        public editable: Editable;
        public pluginTypes = {};
        public popoverPlugin: IDisplayAdapterPopoverPlugin;

        private $injector: ng.auto.IInjectorService;

        public static $inject = ['editable', 'api', 'settings', 'plugins', '$injector']
        constructor(editable, api, settings, plugins, $injector) {
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
            this.editable = editable;
            this.$injector = $injector;
            this.setupPlugins(plugins);
        }

        private setupPlugins(plugins) {
            var locals = {
                displayAdapter: this
            };

            //Setup editType plugins
            angular.forEach(plugins.editTypes, pluginType => {
                var plugin: IDisplayAdapterEditTypePlugin = this.$injector.instantiate(pluginType, locals);
                angular.forEach(plugin.getSupportedTypes(), type => {
                    this.pluginTypes[type] = plugin;
                });
            });

            //Setup popover plugin
            this.popoverPlugin = this.$injector.instantiate(plugins.popover, locals);
        }

        public canBlurCell(event, cell, col): boolean {
            var type = Editable.getColumnType(col);
            if (this.pluginTypes.hasOwnProperty(type))
                return this.pluginTypes[type].canBlurCell(event, cell, col);
            return true;
        }

        public prepareCell(cell): void {
            var type = Editable.getColumnType(cell.column);
            if (this.pluginTypes.hasOwnProperty(type))
                this.pluginTypes[type].prepareCell(cell);
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

        private getWrappedEditTemplate(type, template, content, col, plugin?: IDisplayAdapterEditTypePlugin) {
            template = template || {};
            var wrapperOpts = $.isPlainObject(template) ? (template.wrapper || Editable.defaultEditTemplateWrapper) : Editable.defaultEditTemplateWrapper;
            var $wrapper: any = $('<' + wrapperOpts.tagName + ' />')
                .addClass(this.getControlWrapperClass())
                .attr(Editable.EDIT_CONTROL_WRAPPER_ATTRS, '')
                .attr(<Object>(wrapperOpts.attrs || {}))
                .addClass(wrapperOpts.className || '');

            $wrapper.append(content);

            if ($.isFunction(template.init))
                template.init.call(this, $wrapper, content, col);

            //before retun we have to remove the ="" that setAttribute add after the edit attribute
            return $wrapper[0].outerHTML
                .replaceAll(Editable.EDIT_CONTROL_ATTRS.toLowerCase() + '=""', Editable.EDIT_CONTROL_ATTRS)
                .replaceAll(Editable.EDIT_CONTROL_WRAPPER_ATTRS.toLowerCase() + '=""', Editable.EDIT_CONTROL_WRAPPER_ATTRS);
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

        public mergeErrors(errors: ValidationError[], type): string {
            if (!errors) return null;
            var msg = ' '; //the default mesasge must be evaluated to true as the angularstrap check it at init
            for (var i = 0; i < errors.length; i++) {
                msg += errors[i].message + '<br />';
            }
            return msg;
        }

        public getPopoverAttributes(contentExpr, toggleExpr, placement = 'bottom') {
            return this.popoverPlugin.getPopoverAttributes(contentExpr, toggleExpr, placement);
        }
    }

    //Abstract
    export class BaseEditorAdapter implements IEditorAdapter {
        public dt = {
            settings: null,
            api: null
        }
        public type = null;
        public settings;
        public editable: Editable;

        constructor(editable, api, settings) {
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
            this.editable = editable;
        }

        public get dataAdapter(): IDataAdapter {
            return this.editable.dataAdapterInstance;
        }

        public get displayAdapter(): IDisplayAdapter {
            return this.editable.displayAdapterInstance;
        }

        public initialize(): void {

        }

        public prepareCell(cell): void {
            this.displayAdapter.prepareCell(cell);
        }

        public prepareRow(row): void {

        }

        public removeItems(items: any[]): any[] {
            return this.dataAdapter.removeItems(items);
        }

        public rejectItems(items: any[]): any[] {
            return this.dataAdapter.rejectItems(items);
        }

        public restoreRemovedItems(): any[] {
            return this.dataAdapter.restoreRemovedItems();
        }

        public createItem(): any {
            return this.dataAdapter.createItem();
        }

        public addItem(item): void {
            return this.dataAdapter.addItem(item);
        }

    }

    export class BatchEditorAdapter extends BaseEditorAdapter {
        private lastEditedCellPos: Position = null;
        private lastFocusedCell;
        public keys;

        public static defaultSettings = {
            cellTemplate: '<div ng-if="editMode">' + Editable.EDIT_CONTROL + '</div><div ng-if="!editMode">' + Editable.DISPLAY_CONTROL + '</div>'
        };

        public static $inject = ['editable', 'api', 'settings'];
        constructor(editable, api, settings) {
            super(editable, api, settings);
            this.settings = $.extend(true, {}, BatchEditorAdapter.defaultSettings, this.settings);
        }

        public initialize(): void {
            this.keys = new $.fn.dataTable.KeyTable({
                datatable: this.dt.settings,
                table: this.dt.settings.nTable,
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
            this.prepareCellTemplates();
        }

        private prepareCellTemplates() {
            var columns = this.dt.settings.aoColumns, col, i;
            for (i = 0; i < columns.length; i++) {
                col = columns[i];
                if (!this.dataAdapter.isColumnEditable(col)) continue;

                //prepare cell template
                var popoverAttrs = this.displayAdapter.getPopoverAttributes('{{getErrorMessage()}}', 'errors.length > 0');
                var wrapperAttrs = ' ';
                for (var key in popoverAttrs) {
                    wrapperAttrs += key + '="' + popoverAttrs[key] + '" ';
                }
                var columnModelPath = this.dataAdapter.getColumnModelPath(col);

                var editControl = this.editable.getColumnEditControlTemplate(col)
                    .replaceAll(Editable.MODEL_PATH, columnModelPath)
                    .replaceAll(Editable.EDIT_CONTROL_ATTRS, '') //TODO
                    .replaceAll(Editable.EDIT_CONTROL_WRAPPER_ATTRS, wrapperAttrs);

                var displayControl = this.editable.getColumnDisplayControlTemplate(col);

                var template = this.settings.cellTemplate
                    .replace(Editable.EDIT_CONTROL, editControl)
                    .replace(Editable.DISPLAY_CONTROL, displayControl);

                col.batchCellTemplate = template;
            }
        }

        public prepareCell(cell): void {
            if (!this.dataAdapter.isColumnEditable(cell.column)) return;
            var scope = cell.scope;
            scope.editMode = false;
            scope.errors = [];
            scope.getErrorMessage = () => {
                return this.displayAdapter.mergeErrors(scope.errors, 'popover');
            }
            cell.html = cell.column.batchCellTemplate;
            delete cell.attr['ng-bind'];
            this.displayAdapter.prepareCell(cell);
        }

        public prepareRow(row): void {
        }

        public addItem(item): void {
            super.addItem(item);
            var rIdx = this.dt.settings.aoData.length - 1;
            //we have to delay in order to work correctly - we have to set the position after the digestion and datatables redraw
            setTimeout(() => {
                this.keys.fnSetPosition(0, rIdx);
            }, 100);
        }

        private onCellBluring(cell, x, y, event) {
            if (!cell) return true;
            var $cell = angular.element(cell);
            var cellScope: any = $cell.scope();
            if (!cellScope)
                throw 'Cell must have a scope';
            if (!cellScope.editMode) return true;
            var displayAdapter = this.displayAdapter;
            var col = this.dt.settings.aoColumns[x];
            return displayAdapter.canBlurCell(event, cell, col);
        }

        private onCellBlur(cell, x, y, event) {
            if (!cell) return;
            var $cell = angular.element(cell);
            var cellScope: any = $cell.scope();
            if (!cellScope)
                throw 'Cell must have a scope';
            if (!cellScope.editMode) return;

            var dataAdapter = this.dataAdapter;
            var displayAdapter = this.displayAdapter;
            var col = this.dt.settings.aoColumns[x];
            var tr: any = $cell.parent('tr')[0];
            var row = this.dt.api.row(tr);

            if (!dataAdapter.isColumnEditable(col)) return;

            var errors = cellScope.errors = dataAdapter.validateItemProperty(col, row);

            if (errors.length) {
                displayAdapter.selectControl(event, cell, col);
            } else {
                cellScope.editMode = false;
            }
            cellScope.$digest();
        }

        private onCellFocus(cell, x, y, event) {
            if (cell == null) return;
            var dataAdapter = this.dataAdapter;
            var displayAdapter = this.displayAdapter;
            var $cell = angular.element(cell);
            var cellScope: any = $cell.scope();
            if (!cellScope)
                throw 'Cell must have a scope';

            var col = this.dt.settings.aoColumns[x];

            if (cellScope.editMode) {
                displayAdapter.selectControl(event, $cell, col);
                return;
            }

            //check if the previous cell has no errors
            if (this.lastFocusedCell) {
                var prevScope = this.lastFocusedCell.scope();
                if (prevScope.errors.length) {
                    this.keys.fnSetPosition(this.lastFocusedCell[0], event);
                    return;
                }
            }

            if (!dataAdapter.isColumnEditable(col)) { //if the cell is not editable, get the next editable one
                if (event != null && event.type == "click") return;
                var prev = event != null && ((event.keyCode == 9 && event.shiftKey) || event.keyCode == 37); //if shift+tab or left arrow was pressed
                var cellIndex = prev
                    ? this.dt.api.cell(y, x).prev(true).index()
                    : this.dt.api.cell(y, x).next(true).index();
                this.keys.fnSetPosition(cellIndex.column, cellIndex.row, event); //TODO: handle invisible columns
                return;
            }

            this.lastFocusedCell = $cell;

            cellScope.editMode = true;

            //We have to delay the digest in order to have the display template shown for a while 
            //so that KeyTable will not blur as the display template will not be in the dom anymore
            setTimeout(() => {
                cellScope.$digest();
                displayAdapter.selectControl(event, $cell, col);
                cellScope.$broadcast('dt.StartEditCell');
                cellScope.$emit('dt.StartCellEdit');
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

    function escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    if ((<any>String).prototype.replaceAll === undefined) {
        (<any>String).prototype.replaceAll = function (find, replace) {
            return this.replace(new RegExp(escapeRegExp(find), 'g'), replace);
        }
    }

    //Register events
    $.fn.DataTable.models.oSettings.editableInitCompleted = [];

    //#region Extensions
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
            if (!editable.dataAdapterInstance)
                throw 'Editable plugin must have a editorAdapter set';
            var editorAdapter: dt.editable.IEditorAdapter = editable.editorAdapterInstance;
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
            var itemsRemoved = editorAdapter.removeItems(itemsToRemove);
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
            if (!editable.dataAdapterInstance)
                throw 'Editable plugin must have a editorAdapter set';
            var editorAdapter: dt.editable.IEditorAdapter = editable.editorAdapterInstance;
            var settings = editable.settings;
            var restoredItems = editorAdapter.restoreRemovedItems();
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
            if (!editable.dataAdapterInstance)
                throw 'Editable plugin must have a editorAdapter set';
            var editorAdapter: dt.editable.IEditorAdapter = editable.editorAdapterInstance;
            var settings = editable.settings;

            var item = editorAdapter.createItem();
            if ($.isFunction(settings.itemCreated))
                settings.itemCreated.call(editable, item);

            editorAdapter.addItem(item);

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
            if (!editable.dataAdapterInstance)
                throw 'Editable plugin must have a editorAdapter set';
            var editorAdapter: dt.editable.IEditorAdapter = editable.editorAdapterInstance;
            var settings = editable.settings;
            var api = this.s.dt.oInstance.api();
            var itemsToReject= [];
            var data = this.s.dt.aoData;
            var i;
            for (i = (data.length - 1); i >= 0; i--) {
                if (data[i]._DTTT_selected)
                    itemsToReject.push(api.row(i));
            }
            var itemsRejected = editorAdapter.rejectItems(itemsToReject);
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

    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            var api = oSettings.oInstance.api();
            var editable = new dt.editable.Editable(api, oSettings.oInit.editable);
            if (oSettings._bInitComplete)
                editable.initialize();
            else
                api.one('init.dt', () => { editable.initialize(); });

            return null;
        },
        "cFeature": "E",
        "sFeature": "Editable"
    });

} (window, document, undefined));