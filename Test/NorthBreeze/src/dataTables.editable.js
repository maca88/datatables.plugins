var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var dt;
(function (dt) {
    (function (_editable) {
        

        //#endregion
        var Editable = (function () {
            function Editable(api, settings) {
                this.initialized = false;
                this.dt = {
                    api: null,
                    settings: null
                };
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
            Editable.prototype.initialize = function () {
                this.initialized = true;
                this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'editableInitCompleted', 'editableInitCompleted', [this]);
            };

            Editable.prototype.registerCallbacks = function () {
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'cellCompiling', this.onCellCompiling.bind(this), "cellCompiling_Editable");
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'rowCompiling', this.onRowCompiling.bind(this), "rowCompiling_Editable");
            };

            Editable.prototype.onCellCompiling = function (cell) {
                this.editorAdapterInstance.prepareCell(cell);
            };

            Editable.prototype.onRowCompiling = function (row) {
                this.editorAdapterInstance.prepareRow(row);
            };

            Editable.prototype.formatMessage = function (msg, opts) {
                return this.settings.formatMessage.call(this, msg, opts);
            };

            Editable.prototype.getColumnDisplayControlTemplate = function (col) {
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
            };

            Editable.prototype.getColumnEditControlTemplate = function (col) {
                var type = Editable.getColumnType(col);
                var displayAdapter = this.displayAdapterInstance;
                if (!type)
                    throw 'Column type must be defined';
                type = type.toLowerCase();
                return displayAdapter.getEditTemplateForType(type, col);
            };

            Editable.getColumnType = function (col) {
                var editablOpts = col.editable || {};
                return editablOpts.type || col._sManualType || col.sType;
            };

            Editable.checkAngularModulePresence = function (moduleName) {
                try  {
                    angular.module(moduleName);
                    return true;
                } catch (err) {
                    return false;
                }
            };

            Editable.getColumnTemplateSettings = function (col) {
                return $.isPlainObject(col.editable) && $.isPlainObject(col.editable.template) ? col.editable.template : null;
            };

            Editable.getColumnEditableSettings = function (col) {
                return $.isPlainObject(col.editable) ? col.editable : null;
            };

            Editable.prototype.setupAdapters = function () {
                this.setupDataAdapter();
                this.setupDisplayAdapter();
                this.setupEditorAdapter();
            };

            Editable.prototype.setupEditorAdapter = function () {
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
            };

            Editable.prototype.setupDisplayAdapter = function () {
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
            };

            Editable.prototype.setupDataAdapter = function () {
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
            };
            Editable.defaultEditTemplateWrapper = {
                tagName: 'div',
                className: 'form-group',
                attrs: {}
            };

            Editable.defaultTemplate = {
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
                    className: 'form-control'
                }
            };

            Editable.defaultSettings = {
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
                            createItem: null,
                            validate: null
                        }
                    },
                    display: {
                        type: null,
                        settings: {
                            controlWrapperClass: "dt-editable-control-wrapper",
                            controlClass: "dt-editable-control",
                            typesTemplate: {
                                'string': {},
                                'number': {
                                    control: {
                                        attrs: {
                                            type: 'number'
                                        }
                                    }
                                },
                                'select': {
                                    control: {
                                        tagName: 'select'
                                    }
                                },
                                'date': {
                                    control: {
                                        attrs: {
                                            type: 'date'
                                        }
                                    }
                                },
                                'time': {
                                    control: {
                                        attrs: {
                                            type: 'time'
                                        }
                                    }
                                },
                                'dateTime': {
                                    control: {
                                        attrs: {
                                            type: 'datetime-local'
                                        }
                                    }
                                }
                            }
                        },
                        plugins: {
                            editTypes: [],
                            popover: null
                        }
                    },
                    editor: {
                        type: null,
                        settings: {}
                    }
                },
                startCellEditing: null,
                endCellEditing: null,
                formatMessage: function (msg, ctx) {
                    return msg;
                },
                language: {}
            };

            Editable.MODEL_PATH = "MODEL_PATH";
            Editable.EDIT_CONTROL_ATTRS = "EDIT_CONTROL_ATTRS";
            Editable.EDIT_CONTROL_WRAPPER_ATTRS = "EDIT_CONTROL_WRAPPER_ATTRS";
            Editable.EDIT_CONTROL = "EDIT_CONTROL";
            Editable.DISPLAY_CONTROL = "DISPLAY_CONTROL";
            return Editable;
        })();
        _editable.Editable = Editable;

        var ValidationError = (function () {
            function ValidationError(message, validator, property) {
                if (typeof property === "undefined") { property = null; }
                this.message = message;
                this.validator = validator;
                this.property = property;
            }
            return ValidationError;
        })();
        _editable.ValidationError = ValidationError;

        var Validator = (function () {
            function Validator(name, options, column) {
                this.name = name;
                this.options = options;
                this.column = column;
            }
            return Validator;
        })();
        _editable.Validator = Validator;

        var DefaultDataAdapter = (function () {
            function DefaultDataAdapter(editable, api, settings) {
                this.dt = {
                    settings: null,
                    api: null
                };
                this.dt.api = api;
                this.dt.settings = api.settings()[0];
                this.settings = settings;
                this.editable = editable;
            }
            DefaultDataAdapter.prototype.getColumnModelPath = function (col) {
                var rowDataPath = this.dt.settings.oInit.angular.rowDataPath;
                return col.data ? rowDataPath + '.' + col.data : null;
            };

            DefaultDataAdapter.prototype.removeItems = function (items) {
                var removed = [];
                for (var i = 0; i < items.length; i++) {
                    items[i].remove();
                    removed.push(items[i]);
                }
                return removed;
            };

            DefaultDataAdapter.prototype.rejectItems = function (items) {
                throw 'Reject is not supported by DefaultDataAdapter';
            };

            DefaultDataAdapter.prototype.restoreRemovedItems = function () {
                throw 'Restore removed items is not supported by DefaultDataAdapter';
            };

            DefaultDataAdapter.prototype.createItem = function () {
                if ($.isFunction(this.settings.createItem))
                    return this.settings.createItem();
                var item = {};
                $.each(this.dt.settings.aoColumns, function (i, col) {
                    if ($.type(col.mData) == 'string')
                        item[col.mData] = null;
                });
                return item;
            };

            DefaultDataAdapter.prototype.addItem = function (item) {
                this.dt.api.row.add(item);
            };

            DefaultDataAdapter.prototype.validateItem = function (row) {
                var errors = [];
                var columns = this.getEditableColumns();
                for (var i = 0; i < columns.length; i++) {
                    errors = errors.concat(this.validateItemProperty(columns[i], row));
                }
                return errors;
            };

            DefaultDataAdapter.prototype.validateItemProperty = function (column, row) {
                var _this = this;
                var validate = column.editable.validate || this.settings.validate;
                var errors = [];
                var colValue = this.getItemPropertyValue(column, row);
                if (column.editable.validators != null && $.isFunction(validate)) {
                    $.each(column.editable.validators, function (key, val) {
                        var validator = new Validator(key, val, column);
                        var success = validate.call(_this, colValue, validator, row);
                        if (success)
                            return;
                        var msg = _this.editable.formatMessage(_this.editable.settings.language.validators[key] || "Validator message is missing", validator.options);
                        errors.push(new ValidationError(msg, validator, column.mData));
                    });
                }
                return errors;
            };

            DefaultDataAdapter.prototype.isColumnEditable = function (column) {
                return (column.editable !== false) && $.type(column.mData) === "string";
            };

            DefaultDataAdapter.prototype.getItemPropertyValue = function (column, row) {
                var mDataFn = this.dt.settings.oApi._fnGetObjectDataFn(column.mData);
                var cIdx = this.getColumnCurrentIndex(column);
                return mDataFn(row.data(), 'type', undefined, {
                    settings: this.dt.settings,
                    row: row.index(),
                    col: cIdx
                });
            };

            DefaultDataAdapter.prototype.getColumnCurrentIndex = function (column) {
                var columns = this.dt.settings.aoColumns;
                for (var i = 0; i < columns.length; i++) {
                    if (columns === columns[i])
                        return i;
                }
                return -1;
            };

            DefaultDataAdapter.prototype.getEditableColumns = function () {
                var editableColumns = [];
                var columns = this.dt.settings.aoColumns;
                for (var i = 0; i < columns.length; i++) {
                    if (this.isColumnEditable(columns[i]))
                        editableColumns.push(columns[i]);
                }
                return editableColumns;
            };
            return DefaultDataAdapter;
        })();
        _editable.DefaultDataAdapter = DefaultDataAdapter;

        //#region Breeze data adapter
        var BreezeDataAdapter = (function (_super) {
            __extends(BreezeDataAdapter, _super);
            function BreezeDataAdapter(editable, api, settings) {
                _super.call(this, editable, api, settings);
                this.deletedEntities = [];
                if (!$.isFunction(this.settings.createItem))
                    throw "'createItem' setting property must be provided in order to work with BreezeDataAdapter";
            }
            BreezeDataAdapter.prototype.removeItems = function (items) {
                var removed = [];
                for (var i = 0; i < items.length; i++) {
                    var entity = items[i].data();
                    entity.entityAspect.setDeleted();
                    if (entity.entityAspect.entityState === breeze.EntityState.Detached)
                        continue;

                    //TODO: check if is an simple or breeze array if not simple we have to add to the deleted entities
                    this.deletedEntities.push(entity);
                    removed.push(items[i]);
                }
                return removed;
            };

            BreezeDataAdapter.prototype.restoreRemovedItems = function () {
                var restored = [];
                for (var i = 0; i < this.deletedEntities.length; i++) {
                    var entity = this.deletedEntities[i];
                    entity.entityAspect.rejectChanges();
                    restored.push(entity);
                }
                return restored;
            };

            BreezeDataAdapter.prototype.rejectItems = function (items) {
                var rejected = [];
                for (var i = 0; i < items.length; i++) {
                    var entity = items[i].data();
                    entity.entityAspect.rejectChanges();
                    rejected.push(items[i]);
                }
                return rejected;
            };

            BreezeDataAdapter.prototype.validateItemProperty = function (column, row) {
                var errors = _super.prototype.validateItemProperty.call(this, column, row);
                var entity = row.data();
                if (entity.entityType == null || entity.entityAspect == null)
                    throw 'Editing non breeze entities is not supported!';
                return errors.concat(this.validateEntityProperty(column, entity));
            };

            //mData support: prop, prop.subProp.subSubProp, prop[1].subProp
            BreezeDataAdapter.prototype.validateEntityProperty = function (column, entity) {
                var errors = [];
                var currentEntity = entity;
                var arrRegex = /([\w\d]+)\[([\d]+)\]/i;
                var paths = column.mData.split('.');
                for (var i = 0; i < paths.length; i++) {
                    var path = paths[i];
                    if (i == (paths.length - 1)) {
                        if (currentEntity.entityAspect.validateProperty(path))
                            return errors;
                        var entityErrors = currentEntity.entityAspect.getValidationErrors();
                        $.each(entityErrors, function (idx, err) {
                            if (err.propertyName != path)
                                return;
                            errors.push(new ValidationError(err.errorMessage, err.validator, err.propertyName));
                        });
                    }
                    var matches = path.match(arrRegex);
                    currentEntity = (matches) ? currentEntity[matches[1]][parseInt(matches[2])] : currentEntity[path];
                }
                return errors;
            };
            return BreezeDataAdapter;
        })(DefaultDataAdapter);
        _editable.BreezeDataAdapter = BreezeDataAdapter;

        //#endregion
        //#region AngularStrap display adapter plugin
        var AngularStrapDisplayAdapterPlugin = (function () {
            function AngularStrapDisplayAdapterPlugin(displayAdapter) {
                this.displayAdapter = displayAdapter;
            }
            AngularStrapDisplayAdapterPlugin.prototype.selectControl = function (event, cell, col) {
                return false;
            };

            AngularStrapDisplayAdapterPlugin.prototype.prepareCell = function (cell) {
            };

            AngularStrapDisplayAdapterPlugin.prototype.canBlurCell = function (event, cell, col) {
                if (!event)
                    return true;
                if (event.type === 'click') {
                    var picker = $(event.target).closest('div.datepicker,div.timepicker');

                    //check if the picker element was clicked or if the target is not in the body (assume that the picker view changed)
                    if (picker.length || !$(event.target).closest('body').length)
                        return false;
                }
                var type = Editable.getColumnType(col);
                if (type !== 'datetime')
                    return true;

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
            };

            AngularStrapDisplayAdapterPlugin.prototype.getSupportedTypes = function () {
                return ["date", "datetime", "time"];
            };

            AngularStrapDisplayAdapterPlugin.prototype.getEditTemplateForType = function (type, col) {
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
            };

            AngularStrapDisplayAdapterPlugin.prototype.getDateTimeTemplate = function (attrs, opts) {
                var date = this.getDateTemplate(attrs, opts.date || {});
                var time = this.getTimeTemplate(attrs, opts.time || {});
                return angular.element('<div />').append(angular.element('<div />').addClass('form-group').append(date), angular.element('<div />').addClass('form-group').append(time));
            };

            AngularStrapDisplayAdapterPlugin.prototype.getDateTemplate = function (attrs, opts) {
                return angular.element('<input />').attr('size', 8).attr('data-container', 'body').attr(attrs).addClass('form-control').addClass(this.displayAdapter.getControlClass()).addClass(opts.className || '').attr('bs-datepicker', '').attr((opts.attrs || {}));
            };

            AngularStrapDisplayAdapterPlugin.prototype.getTimeTemplate = function (attrs, opts) {
                return angular.element('<input />').attr('size', 5).attr('data-container', 'body').attr(attrs).addClass('form-control').addClass(this.displayAdapter.getControlClass()).addClass(opts.className || '').attr('bs-timepicker', '').attr((opts.attrs || {}));
            };

            AngularStrapDisplayAdapterPlugin.prototype.getPopoverAttributes = function (contentExpr, toggleExpr, placement) {
                if (typeof placement === "undefined") { placement = 'bottom'; }
                return {
                    'bs-popover': '',
                    'data-content': contentExpr,
                    'bs-show': toggleExpr,
                    'data-trigger': 'manual',
                    'data-html': true,
                    'data-placement': placement
                };
            };
            AngularStrapDisplayAdapterPlugin.$inject = ['displayAdapter'];
            return AngularStrapDisplayAdapterPlugin;
        })();
        _editable.AngularStrapDisplayAdapterPlugin = AngularStrapDisplayAdapterPlugin;

        //#endregion
        //#region ui-select2 display adapter plugin
        var UiSelect2DisplayAdapterPlugin = (function () {
            function UiSelect2DisplayAdapterPlugin(displayAdapter) {
                this.displayAdapter = displayAdapter;
            }
            UiSelect2DisplayAdapterPlugin.prototype.getSupportedTypes = function () {
                return ['select'];
            };

            UiSelect2DisplayAdapterPlugin.prototype.selectControl = function (event, cell, col) {
                var select = $('select[ui-select2]', cell);
                if (!select.length)
                    return false;
                setTimeout(function () {
                    return select.select2('open');
                }, 0);
                return true;
            };

            UiSelect2DisplayAdapterPlugin.prototype.canBlurCell = function (event, cell, col) {
                return true;
            };

            UiSelect2DisplayAdapterPlugin.prototype.prepareCell = function (cell) {
                var editable = $.isPlainObject(cell.column.editable) ? cell.column.editable : null;
                if (!editable)
                    return;
                var scope = cell.scope;
                if (editable.options)
                    scope.$options = editable.options;
                if (editable.groups)
                    scope.$groups = editable.groups;
                scope.$settings = editable.settings || {};
            };

            /*
            <select ui-select2 ng-model="select2" data-placeholder="Pick a number">
            <option value=""></option>
            <option ng-repeat="number in range" value="{{number.value}}">{{number.text}}</option>
            </select>
            */
            UiSelect2DisplayAdapterPlugin.prototype.getEditTemplateForType = function (type, col) {
                var opts = Editable.getColumnEditableSettings(col) || {};

                var settings = opts.settings || {};
                var template = opts.template || {};
                template.select = template.select || {};
                template.option = template.option || {};
                template.optgroup = template.optgroup || {};

                var select = $('<select />').attr('ui-select2', '$settings').attr('ng-model', Editable.MODEL_PATH).attr(Editable.EDIT_CONTROL_ATTRS, '').attr((template.select.attrs || {})).addClass(template.select.className || '').addClass(this.displayAdapter.getControlClass());

                //we have to add an empty option
                if (settings.allowClear === true) {
                    select.append($('<option />'));
                }

                if (opts.groups) {
                    select.append($('<optgroup />').attr('ng-repeat', 'group in $groups').attr('label', '{{group.name}}').attr((template.optgroup.attrs || {})).addClass(template.optgroup.className || '').append($('<option />').attr('ng-repeat', 'option in group.options').attr('ng-bind', 'option.text').attr('ng-value', 'option.value').attr((template.option.attrs || {})).addClass(template.option.className || '')));
                } else {
                    select.append($('<option />').attr('ng-repeat', 'option in $options').attr('ng-bind', 'option.text').attr('ng-value', 'option.value').attr((template.option.attrs || {})).addClass(template.option.className || ''));
                }
                return select[0].outerHTML;
            };
            UiSelect2DisplayAdapterPlugin.$inject = ['displayAdapter'];
            return UiSelect2DisplayAdapterPlugin;
        })();
        _editable.UiSelect2DisplayAdapterPlugin = UiSelect2DisplayAdapterPlugin;

        //#endregion
        var DefaultDisplayAdapter = (function () {
            function DefaultDisplayAdapter(editable, api, settings, plugins, $injector) {
                this.dt = {
                    settings: null,
                    api: null
                };
                this.pluginTypes = {};
                this.dt.api = api;
                this.dt.settings = api.settings()[0];
                this.settings = settings;
                this.editable = editable;
                this.$injector = $injector;
                this.setupPlugins(plugins);
            }
            DefaultDisplayAdapter.prototype.setupPlugins = function (plugins) {
                var _this = this;
                var locals = {
                    displayAdapter: this
                };

                //Setup editType plugins
                angular.forEach(plugins.editTypes, function (pluginType) {
                    var plugin = _this.$injector.instantiate(pluginType, locals);
                    angular.forEach(plugin.getSupportedTypes(), function (type) {
                        _this.pluginTypes[type] = plugin;
                    });
                });

                //Setup popover plugin
                this.popoverPlugin = this.$injector.instantiate(plugins.popover, locals);
            };

            DefaultDisplayAdapter.prototype.canBlurCell = function (event, cell, col) {
                var type = Editable.getColumnType(col);
                if (this.pluginTypes.hasOwnProperty(type))
                    return this.pluginTypes[type].canBlurCell(event, cell, col);
                return true;
            };

            DefaultDisplayAdapter.prototype.prepareCell = function (cell) {
                var type = Editable.getColumnType(cell.column);
                if (this.pluginTypes.hasOwnProperty(type))
                    this.pluginTypes[type].prepareCell(cell);
            };

            DefaultDisplayAdapter.prototype.selectControl = function (event, cell, col) {
                var type = Editable.getColumnType(col);

                if (this.pluginTypes.hasOwnProperty(type) && this.pluginTypes[type].selectControl(event, cell, col))
                    return;

                /* Capture shift+tab to match the left arrow key */
                var key = !event ? -2 : ((event.keyCode == 9 && event.shiftKey) ? -1 : event.keyCode);

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
            };

            DefaultDisplayAdapter.prototype.getControlClass = function () {
                return this.settings.controlClass;
            };

            DefaultDisplayAdapter.prototype.getControlWrapperClass = function () {
                return this.settings.controlWrapperClass;
            };

            DefaultDisplayAdapter.prototype.getWrappedEditTemplate = function (type, template, content, col, plugin) {
                template = template || {};
                var wrapperOpts = $.isPlainObject(template) ? (template.wrapper || Editable.defaultEditTemplateWrapper) : Editable.defaultEditTemplateWrapper;
                var $wrapper = $('<' + wrapperOpts.tagName + ' />').addClass(this.getControlWrapperClass()).attr(Editable.EDIT_CONTROL_WRAPPER_ATTRS, '').attr((wrapperOpts.attrs || {})).addClass(wrapperOpts.className || '');

                $wrapper.append(content);

                if ($.isFunction(template.init))
                    template.init.call(this, $wrapper, content, col);

                //before retun we have to remove the ="" that setAttribute add after the edit attribute
                return $wrapper[0].outerHTML.replaceAll(Editable.EDIT_CONTROL_ATTRS.toLowerCase() + '=""', Editable.EDIT_CONTROL_ATTRS).replaceAll(Editable.EDIT_CONTROL_WRAPPER_ATTRS.toLowerCase() + '=""', Editable.EDIT_CONTROL_WRAPPER_ATTRS);
            };

            DefaultDisplayAdapter.prototype.getEditTemplateForType = function (type, col) {
                var template = Editable.getColumnTemplateSettings(col);

                if (!template) {
                    if ($.isFunction(this.settings.typesTemplate[type]))
                        template = this.settings.typesTemplate[type];
                    else if ($.isPlainObject(this.settings.typesTemplate[type]))
                        template = $.extend(true, {}, Editable.defaultTemplate, this.settings.typesTemplate[type]);
                    else
                        template = this.settings.typesTemplate[type];
                }

                if (this.pluginTypes.hasOwnProperty(type)) {
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

                    var $control = $('<' + controlOpts.tagName + ' />').attr(controlAttrs).attr((controlOpts.attrs || {})).addClass(this.getControlClass()).addClass(controlOpts.className || '');

                    return this.getWrappedEditTemplate(type, template, $control, col);
                } else if ($.type(template) === 'string')
                    return template;
                else {
                    throw 'Invalid cell template type';
                }
            };

            DefaultDisplayAdapter.prototype.mergeErrors = function (errors, type) {
                if (!errors)
                    return null;
                var msg = ' ';
                for (var i = 0; i < errors.length; i++) {
                    msg += errors[i].message + '<br />';
                }
                return msg;
            };

            DefaultDisplayAdapter.prototype.getPopoverAttributes = function (contentExpr, toggleExpr, placement) {
                if (typeof placement === "undefined") { placement = 'bottom'; }
                return this.popoverPlugin.getPopoverAttributes(contentExpr, toggleExpr, placement);
            };
            DefaultDisplayAdapter.$inject = ['editable', 'api', 'settings', 'plugins', '$injector'];
            return DefaultDisplayAdapter;
        })();
        _editable.DefaultDisplayAdapter = DefaultDisplayAdapter;

        //Abstract
        var BaseEditorAdapter = (function () {
            function BaseEditorAdapter(editable, api, settings) {
                this.dt = {
                    settings: null,
                    api: null
                };
                this.type = null;
                this.dt.api = api;
                this.dt.settings = api.settings()[0];
                this.settings = settings;
                this.editable = editable;
            }
            Object.defineProperty(BaseEditorAdapter.prototype, "dataAdapter", {
                get: function () {
                    return this.editable.dataAdapterInstance;
                },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(BaseEditorAdapter.prototype, "displayAdapter", {
                get: function () {
                    return this.editable.displayAdapterInstance;
                },
                enumerable: true,
                configurable: true
            });

            BaseEditorAdapter.prototype.initialize = function () {
            };

            BaseEditorAdapter.prototype.prepareCell = function (cell) {
                this.displayAdapter.prepareCell(cell);
            };

            BaseEditorAdapter.prototype.prepareRow = function (row) {
            };

            BaseEditorAdapter.prototype.removeItems = function (items) {
                return this.dataAdapter.removeItems(items);
            };

            BaseEditorAdapter.prototype.rejectItems = function (items) {
                return this.dataAdapter.rejectItems(items);
            };

            BaseEditorAdapter.prototype.restoreRemovedItems = function () {
                return this.dataAdapter.restoreRemovedItems();
            };

            BaseEditorAdapter.prototype.createItem = function () {
                return this.dataAdapter.createItem();
            };

            BaseEditorAdapter.prototype.addItem = function (item) {
                return this.dataAdapter.addItem(item);
            };
            return BaseEditorAdapter;
        })();
        _editable.BaseEditorAdapter = BaseEditorAdapter;

        var BatchEditorAdapter = (function (_super) {
            __extends(BatchEditorAdapter, _super);
            function BatchEditorAdapter(editable, api, settings) {
                _super.call(this, editable, api, settings);
                this.lastEditedCellPos = null;
                this.settings = $.extend(true, {}, BatchEditorAdapter.defaultSettings, this.settings);
            }
            BatchEditorAdapter.prototype.initialize = function () {
                var _this = this;
                this.keys = new $.fn.dataTable.KeyTable({
                    datatable: this.dt.settings,
                    table: this.dt.settings.nTable,
                    form: true
                });
                var $table = $(this.dt.settings.nTable);
                var hiddenInputDiv = $table.next();
                this.dt.api.one('init.dt', function () {
                    $table.parent('div.dataTables_wrapper').prepend(hiddenInputDiv); //when tab press in an input right before the table the first cell in the table will be selected
                });
                $('input', hiddenInputDiv).on('focus', function (e) {
                    if ($.isFunction(_this.settings.tableFocused))
                        _this.settings.tableFocused.call(_this.dt.api, e);
                });
                this.keys.event.focus(null, null, this.onCellFocus.bind(this));
                this.keys.event.blur(null, null, this.onCellBlur.bind(this));
                this.keys.event.bluring(null, null, this.onCellBluring.bind(this));
                this.prepareCellTemplates();
            };

            BatchEditorAdapter.prototype.prepareCellTemplates = function () {
                var columns = this.dt.settings.aoColumns, col, i;
                for (i = 0; i < columns.length; i++) {
                    col = columns[i];
                    if (!this.dataAdapter.isColumnEditable(col))
                        continue;

                    //prepare cell template
                    var popoverAttrs = this.displayAdapter.getPopoverAttributes('{{getErrorMessage()}}', 'errors.length > 0');
                    var wrapperAttrs = ' ';
                    for (var key in popoverAttrs) {
                        wrapperAttrs += key + '="' + popoverAttrs[key] + '" ';
                    }
                    var columnModelPath = this.dataAdapter.getColumnModelPath(col);

                    var editControl = this.editable.getColumnEditControlTemplate(col).replaceAll(Editable.MODEL_PATH, columnModelPath).replaceAll(Editable.EDIT_CONTROL_ATTRS, '').replaceAll(Editable.EDIT_CONTROL_WRAPPER_ATTRS, wrapperAttrs);

                    var displayControl = this.editable.getColumnDisplayControlTemplate(col);

                    var template = this.settings.cellTemplate.replace(Editable.EDIT_CONTROL, editControl).replace(Editable.DISPLAY_CONTROL, displayControl);

                    col.batchCellTemplate = template;
                }
            };

            BatchEditorAdapter.prototype.prepareCell = function (cell) {
                var _this = this;
                if (!this.dataAdapter.isColumnEditable(cell.column))
                    return;
                var scope = cell.scope;
                scope.editMode = false;
                scope.errors = [];
                scope.getErrorMessage = function () {
                    return _this.displayAdapter.mergeErrors(scope.errors, 'popover');
                };
                cell.html = cell.column.batchCellTemplate;
                delete cell.attr['ng-bind'];
                this.displayAdapter.prepareCell(cell);
            };

            BatchEditorAdapter.prototype.prepareRow = function (row) {
            };

            BatchEditorAdapter.prototype.addItem = function (item) {
                var _this = this;
                _super.prototype.addItem.call(this, item);
                var rIdx = this.dt.settings.aoData.length - 1;

                //we have to delay in order to work correctly - we have to set the position after the digestion and datatables redraw
                setTimeout(function () {
                    _this.keys.fnSetPosition(0, rIdx);
                }, 100);
            };

            BatchEditorAdapter.prototype.onCellBluring = function (cell, x, y, event) {
                if (!cell)
                    return true;
                var $cell = angular.element(cell);
                var cellScope = $cell.scope();
                if (!cellScope)
                    throw 'Cell must have a scope';
                if (!cellScope.editMode)
                    return true;
                var displayAdapter = this.displayAdapter;
                var col = this.dt.settings.aoColumns[x];
                return displayAdapter.canBlurCell(event, cell, col);
            };

            BatchEditorAdapter.prototype.onCellBlur = function (cell, x, y, event) {
                if (!cell)
                    return;
                var $cell = angular.element(cell);
                var cellScope = $cell.scope();
                if (!cellScope)
                    throw 'Cell must have a scope';
                if (!cellScope.editMode)
                    return;

                var dataAdapter = this.dataAdapter;
                var displayAdapter = this.displayAdapter;
                var col = this.dt.settings.aoColumns[x];
                var tr = $cell.parent('tr')[0];
                var row = this.dt.api.row(tr);

                if (!dataAdapter.isColumnEditable(col))
                    return;

                var errors = cellScope.errors = dataAdapter.validateItemProperty(col, row);

                if (errors.length) {
                    displayAdapter.selectControl(event, cell, col);
                } else {
                    cellScope.editMode = false;
                }
                cellScope.$digest();
            };

            BatchEditorAdapter.prototype.onCellFocus = function (cell, x, y, event) {
                if (cell == null)
                    return;
                var dataAdapter = this.dataAdapter;
                var displayAdapter = this.displayAdapter;
                var $cell = angular.element(cell);
                var cellScope = $cell.scope();
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

                if (!dataAdapter.isColumnEditable(col)) {
                    if (event != null && event.type == "click")
                        return;
                    var prev = event != null && ((event.keyCode == 9 && event.shiftKey) || event.keyCode == 37);
                    var cellIndex = prev ? this.dt.api.cell(y, x).prev(true).index() : this.dt.api.cell(y, x).next(true).index();
                    this.keys.fnSetPosition(cellIndex.column, cellIndex.row, event); //TODO: handle invisible columns
                    return;
                }

                this.lastFocusedCell = $cell;

                cellScope.editMode = true;

                //We have to delay the digest in order to have the display template shown for a while
                //so that KeyTable will not blur as the display template will not be in the dom anymore
                setTimeout(function () {
                    cellScope.$digest();
                    displayAdapter.selectControl(event, $cell, col);
                    cellScope.$broadcast('dt.StartEditCell');
                    cellScope.$emit('dt.StartCellEdit');
                }, 100);
            };
            BatchEditorAdapter.defaultSettings = {
                cellTemplate: '<div ng-if="editMode">' + Editable.EDIT_CONTROL + '</div><div ng-if="!editMode">' + Editable.DISPLAY_CONTROL + '</div>'
            };

            BatchEditorAdapter.$inject = ['editable', 'api', 'settings'];
            return BatchEditorAdapter;
        })(BaseEditorAdapter);
        _editable.BatchEditorAdapter = BatchEditorAdapter;

        var Position = (function () {
            function Position(x, y) {
                this.x = x;
                this.y = y;
            }
            Position.prototype.compare = function (pos) {
                if (pos.y > this.y)
                    return 1;
                if (pos.y < this.y)
                    return -1;
                if (pos.y == this.y && pos.x == this.x)
                    return 0;
                if (pos.x > this.x)
                    return 1;
                else
                    return 0;
            };
            return Position;
        })();
    })(dt.editable || (dt.editable = {}));
    var editable = dt.editable;
})(dt || (dt = {}));

(function (window, document, undefined) {
    function escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    if (String.prototype.replaceAll === undefined) {
        String.prototype.replaceAll = function (find, replace) {
            return this.replace(new RegExp(escapeRegExp(find), 'g'), replace);
        };
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
            if (cIdx >= ctx.aoColumns.length)
                return null;
            return this.table().cell(rIdx, cIdx);
        }

        if (cells == null)
            return null;
        cIdx = cells.indexOf(column); //treat column as Element
        if (cIdx < 0)
            return null;
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
            } else if ((currY + 1) < oSettings.aoData.length) {
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
            } else if ((currY - 1) > -1) {
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
            var editorAdapter = editable.editorAdapterInstance;
            var settings = editable.settings;
            var api = this.s.dt.oInstance.api();
            var itemsToRemove = [];
            var data = this.s.dt.aoData;
            var i;
            for (i = (data.length - 1); i >= 0; i--) {
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
            if (idx < 0 && !itemsRemoved.length)
                return;
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
            var editorAdapter = editable.editorAdapterInstance;
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
            var editorAdapter = editable.editorAdapterInstance;
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
            var editorAdapter = editable.editorAdapterInstance;
            var settings = editable.settings;
            var api = this.s.dt.oInstance.api();
            var itemsToReject = [];
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
        "fnInit": function (oSettings) {
            var api = oSettings.oInstance.api();
            var editable = new dt.editable.Editable(api, oSettings.oInit.editable);
            if (oSettings._bInitComplete)
                editable.initialize();
            else
                api.one('init.dt', function () {
                    editable.initialize();
                });

            return null;
        },
        "cFeature": "E",
        "sFeature": "Editable"
    });
}(window, document, undefined));
//# sourceMappingURL=dataTables.editable.js.map
