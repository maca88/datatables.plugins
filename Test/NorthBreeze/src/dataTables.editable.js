///<reference path='dataTables.editable.breeze.ts' />
///<reference path='dataTables.editable.uiSelect2.ts' />
///<reference path='dataTables.editable.angularStrap.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var dt;
(function (dt) {
    (function (editable) {
        

        //#endregion
        var Editable = (function () {
            function Editable(dtTable, $injector) {
                this.initialized = false;
                this.dt = {
                    api: null,
                    settings: null
                };
                this.table = dtTable;
                this.$injector = $injector;
            }
            Editable.prototype.getEventListeners = function () {
                var _this = this;
                return [
                    {
                        event: dt.TableController.events.cellCompile,
                        scope: function () {
                            return _this.editor;
                        },
                        fn: function () {
                            return _this.editor.cellCompile;
                        }
                    },
                    {
                        event: dt.TableController.events.cellPostLink,
                        scope: function () {
                            return _this.editor;
                        },
                        fn: function () {
                            return _this.editor.cellPostLink;
                        }
                    },
                    {
                        event: dt.TableController.events.cellPreLink,
                        scope: function () {
                            return _this.editor;
                        },
                        fn: function () {
                            return _this.editor.cellPreLink;
                        }
                    },
                    {
                        event: dt.TableController.events.rowCompile,
                        scope: function () {
                            return _this.editor;
                        },
                        fn: function () {
                            return _this.editor.rowCompile;
                        }
                    },
                    {
                        event: dt.TableController.events.rowPostLink,
                        scope: function () {
                            return _this.editor;
                        },
                        fn: function () {
                            return _this.editor.rowPostLink;
                        }
                    },
                    {
                        event: dt.TableController.events.rowPreLink,
                        scope: function () {
                            return _this.editor;
                        },
                        fn: function () {
                            return _this.editor.rowPreLink;
                        }
                    }
                ];
            };

            Editable.prototype.isEnabled = function () {
                return $.isPlainObject(this.table.settings.options.editable);
            };

            Editable.prototype.destroy = function () {
            };

            Editable.prototype.initialize = function (dtSettings) {
                this.settings = $.extend(true, {}, Editable.defaultSettings, dtSettings.oInit.editable);
                this.dt.settings = dtSettings;
                this.dt.api = dtSettings.oInstance.api();
                this.dt.settings.editable = this;
                this.setupServices();
                this.setupEditor();
                this.editor.initialize();
                this.prepareColumnTemplates();
                this.initialized = true;
            };

            Editable.prototype.prepareColumnTemplates = function () {
                var columns = this.dt.settings.aoColumns, col, i, editorSettings = this.getEditorSettings();
                for (i = 0; i < columns.length; i++) {
                    col = columns[i];
                    if (!this.dataService.isColumnEditable(col))
                        continue;

                    //Options that can be modified by the display service
                    var opts = {
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
                        }
                    };
                    opts.editCtrl.attrs.name = col.name || col.mData;

                    this.displayService.setupColumnTemplate(opts);

                    Editable.setNgClass(opts.editCtrlWrapper.ngClass, opts.editCtrlWrapper.attrs);
                    Editable.setNgClass(opts.editCtrl.ngClass, opts.editCtrl.attrs);

                    var columnModelPath = this.dataService.getColumnModelPath(col);

                    var editControl = this.getColumnEditControlTemplate(col).replaceAll(Editable.MODEL_PATH, columnModelPath).replaceAll(Editable.EDIT_CONTROL_ATTRS, Editable.generateHtmlAttributes(opts.editCtrl.attrs)).replaceAll(Editable.EDIT_CONTROL_WRAPPER_ATTRS, Editable.generateHtmlAttributes(opts.editCtrlWrapper.attrs)).replaceAll(Editable.BEFORE_EDIT_CONTROL, opts.editCtrl.contentBefore.join("")).replaceAll(Editable.AFTER_EDIT_CONTROL, opts.editCtrl.contentAfter.join(""));

                    editControl = opts.editCtrlWrapper.contentBefore.join("") + editControl + opts.editCtrlWrapper.contentAfter.join("");

                    var displayControl = this.getColumnDisplayControlTemplate(col);

                    var template = editorSettings.cellTemplate.replaceAll(Editable.EDIT_CONTROL, editControl).replaceAll(Editable.DISPLAY_CONTROL, displayControl);

                    col.cellTemplate = template;
                }
            };

            Editable.generateHtmlAttributes = function (obj) {
                var attrs = '';
                for (var key in obj) {
                    attrs += key + '="' + obj[key] + '" ';
                }
                return attrs;
            };

            Editable.prototype.getColumnDisplayControlTemplate = function (col) {
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
            };

            Editable.prototype.getColumnEditControlTemplate = function (col) {
                var type = Editable.getColumnType(col);
                var displayService = this.displayService;
                if (!type)
                    throw 'Column type must be defined';
                type = type.toLowerCase();
                return displayService.getEditTemplateForType(type, col);
            };

            Editable.setNgClass = function (obj, target) {
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
            };

            Editable.mergeErrors = function (errors) {
                if (!errors)
                    return null;
                var msg = ' ';
                for (var i = 0; i < errors.length; i++) {
                    msg += errors[i].message + '<br />';
                }
                return msg;
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

            Editable.getRowValidators = function (dtSettings) {
                return (dtSettings.oInit.editable || {}).validators;
            };

            Editable.fillRowValidationErrors = function (row, errors) {
                var columns = row.settings()[0].aoColumns;
                var i, cellScope, rowScope;
                var tr = row.node();
                var cells = $('td', tr);
                rowScope = angular.element(tr).scope();
                rowScope.$rowErrors.length = 0;
                var visColIdx = -1;
                var cellsByData = {};
                for (i = 0; i < columns.length; i++) {
                    if (columns[i].bVisible)
                        visColIdx++;
                    cellScope = angular.element(cells[visColIdx]).scope();
                    if (!cellScope.$cellErrors)
                        continue;
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
            };

            Editable.getCell = function (col, row) {
                var columns = row.settings()[0].aoColumns, i;
                var visColIdx = 0;
                for (i = 0; i < columns.length; i++) {
                    if (columns[i].bVisible)
                        visColIdx++;
                    if (columns[i] === col)
                        break;
                }
                return $('td:nth(' + visColIdx + ')', row.node());
            };

            Editable.prototype.getEditorSettings = function () {
                return this.settings.editor.settings;
            };

            Editable.prototype.setupServices = function () {
                this.setupI18Nservice();
                this.setupDisplayService();
                this.setupDataService();
            };

            Editable.prototype.setupI18Nservice = function () {
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
            };

            Editable.prototype.setupEditor = function () {
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
            };

            Editable.prototype.setupDisplayService = function () {
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
            };

            Editable.prototype.setupDataService = function () {
                var dataService = this.settings.services.data;
                var locals = {
                    'settings': dataService.settings,
                    'api': this.dt.api,
                    'i18Service': this.i18NService
                };
                if (!dataService.type) {
                    dataService.type = DefaultDataSerice;
                }
                if (dataService.type == null)
                    throw 'Editable plugins requires a data adapter to be set';

                this.dataService = this.$injector.instantiate(dataService.type, locals);
            };
            Editable.MODEL_PATH = "model_path";
            Editable.EDIT_CONTROL_ATTRS = "edit_control_attrs";
            Editable.EDIT_CONTROL_WRAPPER_ATTRS = "edit_control_wrapper_attrs";
            Editable.EDIT_CONTROL = "edit_control";
            Editable.BEFORE_EDIT_CONTROL = "<before-edit-control></before-edit-control>";
            Editable.AFTER_EDIT_CONTROL = "<after-edit-control></after-edit-control>";
            Editable.DISPLAY_CONTROL = "display_control";

            Editable.defaultEditTemplateWrapper = {
                tagName: 'div',
                className: '',
                attrs: {}
            };

            Editable.defaultEditTemplateControl = {
                tagName: 'input',
                attrs: {
                    type: 'text'
                },
                className: ''
            };

            Editable.defaultTemplate = {
                wrapper: Editable.defaultEditTemplateWrapper,
                control: Editable.defaultEditTemplateControl
            };

            Editable.defaultSettings = {
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
                            createItem: null,
                            validate: null,
                            validators: {}
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
                            style: null,
                            cellValidation: InlineDisplayServiceCellValidationPlugin,
                            rowValidation: InlineDisplayServiceRowValidationPlugin
                        }
                    },
                    i18N: {
                        type: null,
                        settings: {}
                    }
                },
                editor: {
                    type: null,
                    settings: {
                        cellTemplate: '<div ng-if="$isInEditMode()">' + Editable.EDIT_CONTROL + '</div>' + '<div ng-if="$isInEditMode() === false">' + Editable.DISPLAY_CONTROL + '</div>'
                    }
                },
                startCellEditing: null,
                endCellEditing: null,
                formatMessage: function (msg, ctx) {
                    return msg;
                },
                language: {
                    'required': 'The value is required',
                    'minlength': 'Minimum length is {{options}}'
                }
            };

            Editable.$inject = ['dtTable', '$injector'];
            return Editable;
        })();
        editable.Editable = Editable;

        //Register plugin
        dt.TableController.defaultSettings.plugins.push(Editable);

        //We have to use an object instead of a primitive value so that changes will be reflected to the child scopes
        var DisplayMode = (function () {
            function DisplayMode() {
                this.name = DisplayMode.ReadOnly;
            }
            DisplayMode.prototype.setMode = function (modeName) {
                this.name = modeName;
            };

            DisplayMode.ReadOnly = "ReadOnly";
            DisplayMode.Edit = "Edit";
            return DisplayMode;
        })();
        editable.DisplayMode = DisplayMode;

        var ValidationError = (function () {
            function ValidationError(message, validator, property) {
                if (typeof property === "undefined") { property = null; }
                this.message = message;
                this.validator = validator;
                this.property = property ? property : null;
            }
            return ValidationError;
        })();
        editable.ValidationError = ValidationError;

        var Validator = (function () {
            function Validator(name, options, column) {
                if (typeof column === "undefined") { column = null; }
                this.name = name;
                this.options = options;
                this.column = column;
            }
            return Validator;
        })();
        editable.Validator = Validator;

        //#region I18N services
        var DefaultI18NService = (function () {
            function DefaultI18NService(resources, $interpolate) {
                this.resources = resources;
                this.$interpolate = $interpolate;
            }
            DefaultI18NService.prototype.translate = function (key, params) {
                var exp = this.$interpolate(this.resources[key] || 'Missing resource');
                return exp(params || {});
            };
            DefaultI18NService.$inject = ['resources', '$interpolate'];
            return DefaultI18NService;
        })();
        editable.DefaultI18NService = DefaultI18NService;

        var GetTextI18NService = (function () {
            function GetTextI18NService(resources, $interpolate, gettextCatalog) {
                this.resources = resources;
                this.$interpolate = $interpolate;
                this.gettextCatalog = gettextCatalog;
            }
            GetTextI18NService.prototype.translate = function (key, params) {
                var exp = this.$interpolate(this.gettextCatalog.getString(this.resources[key]));
                return exp(params || {});
            };
            GetTextI18NService.$inject = ['resources', '$interpolate', 'gettextCatalog'];
            return GetTextI18NService;
        })();
        editable.GetTextI18NService = GetTextI18NService;

        var AngularTranslateI18Service = (function () {
            function AngularTranslateI18Service(resources, $interpolate, $translate) {
                this.resources = resources;
                this.$interpolate = $interpolate;
                this.$translate = $translate;
            }
            AngularTranslateI18Service.prototype.translate = function (key, params) {
                var exp = this.$interpolate(this.$translate(key));
                return exp(params || {});
            };
            AngularTranslateI18Service.$inject = ['resources', '$interpolate', '$translate'];
            return AngularTranslateI18Service;
        })();
        editable.AngularTranslateI18Service = AngularTranslateI18Service;

        //#endregion
        //#region Data services
        var DefaultDataSerice = (function () {
            function DefaultDataSerice(api, settings, i18Service) {
                this.dt = {
                    settings: null,
                    api: null
                };
                this.dt.api = api;
                this.dt.settings = api.settings()[0];
                this.settings = settings;
                this.i18Service = i18Service;
            }
            DefaultDataSerice.prototype.getColumnModelPath = function (col) {
                var rowDataPath = this.dt.settings.oInit.angular.rowDataPath;
                return col.data ? rowDataPath + '.' + col.data : null;
            };

            DefaultDataSerice.prototype.removeItems = function (items) {
                var removed = [];
                for (var i = 0; i < items.length; i++) {
                    items[i].remove();
                    removed.push(items[i]);
                }
                return removed;
            };

            DefaultDataSerice.prototype.rejectItems = function (items) {
                throw 'Reject is not supported by DefaultDataSerice';
            };

            DefaultDataSerice.prototype.restoreRemovedItems = function () {
                throw 'Restore removed items is not supported by DefaultDataSerice';
            };

            DefaultDataSerice.prototype.createItem = function () {
                if ($.isFunction(this.settings.createItem))
                    return this.settings.createItem();
                var item = {};
                $.each(this.dt.settings.aoColumns, function (i, col) {
                    if ($.type(col.mData) == 'string')
                        item[col.mData] = null;
                });
                return item;
            };

            DefaultDataSerice.prototype.addItem = function (item) {
                this.dt.api.row.add(item);
            };

            DefaultDataSerice.prototype.validateItem = function (row) {
                var _this = this;
                var errors = [];

                //Execute column validators
                var columns = this.getEditableColumns();
                for (var i = 0; i < columns.length; i++) {
                    errors = errors.concat(this.validateItemProperty(columns[i], row));
                }

                var valMap = {};
                angular.forEach(this.settings.validators || {}, function (opts, valName) {
                    valMap[valName] = opts;
                });

                //Execute row validators
                var rowScope = angular.element(row.node()).scope();
                var formController = rowScope.$getRowForm();
                angular.forEach(formController.$error, function (valArr, valName) {
                    angular.forEach(valArr, function (val) {
                        if (val && val.$name)
                            return;
                        var validator = new Validator(valName, valMap[valName] || null);
                        var msg = _this.i18Service.translate(valName, validator);
                        errors.push(new ValidationError(msg, validator));
                    });
                });

                return errors;
            };

            DefaultDataSerice.prototype.validateItemProperty = function (column, row) {
                var _this = this;
                var errors = [];
                var rowScope = angular.element(row.node()).scope();
                var formController = rowScope.$getRowForm();
                var inputCtrl = formController[column.name || column.mData];
                if (!inputCtrl)
                    return errors;
                var valMap = {};
                var colSettings = Editable.getColumnEditableSettings(column) || {};
                if (angular.isObject(colSettings.validators)) {
                    angular.forEach(colSettings.validators, function (opts, valName) {
                        valMap[valName] = opts;
                    });
                }

                angular.forEach(inputCtrl.$error, function (err, valName) {
                    if (!err)
                        return;
                    var validator = new Validator(valName, valMap[valName] || null, column);
                    var msg = _this.i18Service.translate(valName, validator);
                    errors.push(new ValidationError(msg, validator, column.mData));
                });

                return errors;
            };

            DefaultDataSerice.prototype.isColumnEditable = function (column) {
                return (column.editable !== false) && $.type(column.mData) === "string";
            };

            DefaultDataSerice.prototype.getItemPropertyValue = function (column, row) {
                var mDataFn = this.dt.settings.oApi._fnGetObjectDataFn(column.mData);
                var cIdx = this.getColumnCurrentIndex(column);
                return mDataFn(row.data(), 'type', undefined, {
                    settings: this.dt.settings,
                    row: row.index(),
                    col: cIdx
                });
            };

            DefaultDataSerice.prototype.getColumnCurrentIndex = function (column) {
                var columns = this.dt.settings.aoColumns;
                for (var i = 0; i < columns.length; i++) {
                    if (columns === columns[i])
                        return i;
                }
                return -1;
            };

            DefaultDataSerice.prototype.getEditableColumns = function () {
                var editableColumns = [];
                var columns = this.dt.settings.aoColumns;
                for (var i = 0; i < columns.length; i++) {
                    if (this.isColumnEditable(columns[i]))
                        editableColumns.push(columns[i]);
                }
                return editableColumns;
            };
            DefaultDataSerice.$inject = ['api', 'settings', 'i18Service'];
            return DefaultDataSerice;
        })();
        editable.DefaultDataSerice = DefaultDataSerice;

        //#endregion
        var InlineDisplayServiceCellValidationPlugin = (function () {
            function InlineDisplayServiceCellValidationPlugin() {
            }
            InlineDisplayServiceCellValidationPlugin.prototype.setupColumnTemplate = function (args) {
                args.editCtrl.contentAfter.push('<div dt-inline-cell-errors=""></div>');
            };

            InlineDisplayServiceCellValidationPlugin.prototype.mergeErrors = function (errors) {
                return Editable.mergeErrors(errors);
            };
            return InlineDisplayServiceCellValidationPlugin;
        })();
        editable.InlineDisplayServiceCellValidationPlugin = InlineDisplayServiceCellValidationPlugin;

        var InlineDisplayServiceRowValidationPlugin = (function () {
            function InlineDisplayServiceRowValidationPlugin() {
            }
            InlineDisplayServiceRowValidationPlugin.prototype.setupRowTemplate = function (args) {
                args.attrs['dt-inline-row-errors'] = "";
            };

            InlineDisplayServiceRowValidationPlugin.prototype.mergeErrors = function (errors) {
                return Editable.mergeErrors(errors);
            };
            return InlineDisplayServiceRowValidationPlugin;
        })();
        editable.InlineDisplayServiceRowValidationPlugin = InlineDisplayServiceRowValidationPlugin;

        var DefaultDisplayService = (function () {
            function DefaultDisplayService(api, settings, plugins, $injector) {
                this.dt = {
                    settings: null,
                    api: null
                };
                this.pluginTypes = {};
                this.dt.api = api;
                this.dt.settings = api.settings()[0];
                this.settings = settings;
                this.$injector = $injector;
                this.setupPlugins(plugins);
            }
            DefaultDisplayService.prototype.setupPlugins = function (plugins) {
                var _this = this;
                var locals = {
                    displayService: this
                };

                //Setup editType plugins
                angular.forEach(plugins.editTypes, function (pluginType) {
                    var plugin = _this.$injector.instantiate(pluginType, locals);
                    angular.forEach(plugin.getSupportedTypes(), function (type) {
                        _this.pluginTypes[type] = plugin;
                    });
                });

                //Style
                if (plugins.style) {
                    this.stylePlugin = this.$injector.instantiate(plugins.style, locals);
                }

                //Setup validation plugins
                this.cellValidationPlugin = this.$injector.instantiate(plugins.cellValidation, locals);
                this.rowValidationPlugin = this.$injector.instantiate(plugins.rowValidation, locals);
            };

            DefaultDisplayService.prototype.canBlurCell = function (event, cell, col) {
                var type = Editable.getColumnType(col);
                if (this.pluginTypes.hasOwnProperty(type))
                    return this.pluginTypes[type].canBlurCell(event, cell, col);
                return true;
            };

            DefaultDisplayService.prototype.cellPostLink = function (args) {
                var type = Editable.getColumnType(args.column);

                if (this.pluginTypes.hasOwnProperty(type))
                    this.pluginTypes[type].cellPostLink(args);
            };

            DefaultDisplayService.prototype.setupRowTemplate = function (args) {
                var validators = Editable.getRowValidators(this.dt.settings) || {};
                if ($.isPlainObject(validators)) {
                    angular.forEach(validators, function (val, valName) {
                        args.attrs[valName] = val;
                    });
                }
                args.attrs['ng-model'] = args.dataPath;
                this.rowValidationPlugin.setupRowTemplate(args);
                if (this.stylePlugin)
                    this.stylePlugin.setupRowTemplate(args);
            };

            DefaultDisplayService.prototype.selectControl = function (event, cell, col) {
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

            DefaultDisplayService.prototype.getControlClass = function () {
                return this.settings.controlClass;
            };

            DefaultDisplayService.prototype.getControlWrapperClass = function () {
                return this.settings.controlWrapperClass;
            };

            DefaultDisplayService.prototype.getWrappedEditTemplate = function (type, template, content, col, plugin) {
                template = template || {};
                var wrapperOpts = $.isPlainObject(template) ? (template.wrapper || Editable.defaultEditTemplateWrapper) : Editable.defaultEditTemplateWrapper;
                var $wrapper = $('<' + wrapperOpts.tagName + ' />').addClass(this.getControlWrapperClass()).attr(Editable.EDIT_CONTROL_WRAPPER_ATTRS, '').attr((wrapperOpts.attrs || {})).addClass(wrapperOpts.className || '');
                $wrapper.append(Editable.BEFORE_EDIT_CONTROL);
                $wrapper.append(content);
                $wrapper.append(Editable.AFTER_EDIT_CONTROL);
                if ($.isFunction(template.init))
                    template.init.call(this, $wrapper, content, col);

                //before retun we have to remove the ="" that setAttribute add after the edit attribute
                return $wrapper[0].outerHTML.replaceAll(Editable.EDIT_CONTROL_ATTRS + '=""', Editable.EDIT_CONTROL_ATTRS).replaceAll(Editable.EDIT_CONTROL_WRAPPER_ATTRS + '=""', Editable.EDIT_CONTROL_WRAPPER_ATTRS);
            };

            DefaultDisplayService.prototype.getEditTemplateForType = function (type, col) {
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

            DefaultDisplayService.prototype.mergeCellErrors = function (errors) {
                return this.cellValidationPlugin.mergeErrors(errors);
            };

            DefaultDisplayService.prototype.setupColumnTemplate = function (args) {
                var settings = Editable.getColumnEditableSettings(args.column) || {};
                var editCtrlAttrs = args.editCtrl.attrs;
                if ($.isPlainObject(settings.validators)) {
                    angular.forEach(settings.validators, function (val, valName) {
                        editCtrlAttrs[valName] = val;
                    });
                }

                this.cellValidationPlugin.setupColumnTemplate(args);

                if (this.stylePlugin)
                    this.stylePlugin.setupColumnTemplate(args);
            };

            DefaultDisplayService.prototype.mergeRowErrors = function (errors) {
                return this.rowValidationPlugin.mergeErrors(errors);
            };
            DefaultDisplayService.$inject = ['api', 'settings', 'plugins', '$injector'];
            return DefaultDisplayService;
        })();
        editable.DefaultDisplayService = DefaultDisplayService;

        //#region Commands
        //#region Edit
        var BaseEditCommand = (function (_super) {
            __extends(BaseEditCommand, _super);
            function BaseEditCommand(defSettings, settings) {
                _super.call(this, defSettings, settings);
            }
            BaseEditCommand.prototype.execute = function (scope) {
                if (scope.$isInEditMode())
                    scope.$row.save();
                else
                    scope.$row.edit();
            };
            return BaseEditCommand;
        })(dt.BaseCommand);
        editable.BaseEditCommand = BaseEditCommand;

        var EditCommand = (function (_super) {
            __extends(EditCommand, _super);
            function EditCommand(settings) {
                _super.call(this, {
                    //html: 'Edit',
                    attrs: {
                        'ng-bind': "$isInEditMode() === false ? 'Edit' : 'Save'"
                    }
                }, settings);
            }
            EditCommand.alias = 'edit';

            EditCommand.$inject = ['settings'];
            return EditCommand;
        })(BaseEditCommand);
        editable.EditCommand = EditCommand;

        //Register commands
        dt.CommandTablePlugin.registerCommand(EditCommand);

        //#endregion
        //#region Remove
        var BaseRemoveCommand = (function (_super) {
            __extends(BaseRemoveCommand, _super);
            function BaseRemoveCommand(defSettings, settings) {
                _super.call(this, defSettings, settings);
            }
            BaseRemoveCommand.prototype.execute = function (scope) {
                scope.$row.remove();
            };
            return BaseRemoveCommand;
        })(dt.BaseCommand);
        editable.BaseRemoveCommand = BaseRemoveCommand;

        var RemoveCommand = (function (_super) {
            __extends(RemoveCommand, _super);
            function RemoveCommand(settings) {
                _super.call(this, {
                    html: 'Remove'
                }, settings);
            }
            RemoveCommand.alias = 'remove';

            RemoveCommand.$inject = ['settings'];
            return RemoveCommand;
        })(BaseRemoveCommand);
        editable.RemoveCommand = RemoveCommand;

        //Register commands
        dt.CommandTablePlugin.registerCommand(RemoveCommand);

        //#endregion
        //#endregion
        //Abstract
        var BaseEditor = (function () {
            function BaseEditor(api, settings, defaultSettings, displayService, dataService) {
                this.dt = {
                    settings: null,
                    api: null
                };
                this.type = null;
                this.dt.api = api;
                this.dt.settings = api.settings()[0];
                this.dataService = dataService;
                this.displayService = displayService;
                this.settings = $.extend(true, {}, defaultSettings, settings);
            }
            BaseEditor.prototype.initialize = function () {
            };

            BaseEditor.prototype.cellCompile = function (args) {
                if (!this.dataService.isColumnEditable(args.column))
                    return;
                args.html = args.column.cellTemplate;
                delete args.attr['ng-bind'];
            };

            BaseEditor.prototype.cellPreLink = function (args) {
                var _this = this;
                if (!this.dataService.isColumnEditable(args.column))
                    return;
                var scope = args.scope;
                scope.$cellDisplayMode = new DisplayMode();
                scope.$cellErrors = [];
                scope.$getCellErrorMessage = function () {
                    return _this.displayService.mergeCellErrors(scope.$cellErrors);
                };
                scope.$isInEditMode = function () {
                    return scope.$cellDisplayMode.name === DisplayMode.Edit || scope.$rowDisplayMode.name === DisplayMode.Edit;
                };
                scope.$getInputName = function () {
                    return args.column.name || args.column.mData;
                };
                scope.$cellValidate = function () {
                    var errors = _this.dataService.validateItemProperty(args.column, scope.$row);
                    scope.$cellErrors.length = 0;
                    for (var i = 0; i < errors.length; i++) {
                        scope.$cellErrors.push(errors[i]);
                    }
                    return errors;
                };
                scope.$getCellState = function () {
                    return scope.$getRowForm()[args.column.name || args.column.mData];
                };
            };

            BaseEditor.prototype.cellPostLink = function (args) {
                if (!this.dataService.isColumnEditable(args.column))
                    return;
                this.displayService.cellPostLink(args);
            };

            BaseEditor.prototype.rowCompile = function (args) {
                var formName = ('row' + args.hash + 'Form').replace(':', '');
                var attrs = {
                    'ng-form': formName
                };
                var rowSetup = {
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
                $node.attr(rowSetup.attrs);
                $node.addClass(rowSetup.classes.join(' '));
                Editable.setNgClass(rowSetup.ngClass, args.node);
            };

            BaseEditor.prototype.rowPreLink = function (args) {
                var _this = this;
                var scope = args.scope;

                scope.$rowDisplayMode = new DisplayMode();
                scope.$rowErrors = [];
                scope.$getRowErrorMessage = function () {
                    return _this.displayService.mergeRowErrors(scope.$rowErrors);
                };
                scope.$isInEditMode = function () {
                    return scope.$rowDisplayMode.name === DisplayMode.Edit;
                };

                scope.$rowValidate = function () {
                    scope.$rowErrors.length = 0;
                    var row = scope.$row;
                    var errors = _this.dataService.validateItem(row);
                    Editable.fillRowValidationErrors(row, errors);
                    return errors;
                };
                var formName = $(args.node).attr('ng-form');
                scope.$rowFormName = formName;
                scope.$getRowForm = function () {
                    return scope[formName];
                };
            };

            BaseEditor.prototype.rowPostLink = function (args) {
            };

            BaseEditor.prototype.getVisibleColumn = function (index) {
                var columns = this.dt.settings.aoColumns;
                var visIdx = -1;
                for (var i = 0; i < columns.length; i++) {
                    if (columns[i].bVisible)
                        visIdx++;
                    if (visIdx === index)
                        return columns[i];
                }
                return null;
            };

            BaseEditor.prototype.getFirstRowCell = function (row) {
                var columns = this.dt.settings.aoColumns;
                var colIdx = 0;
                var column = null, $cell = null;

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
            };

            BaseEditor.prototype.removeItems = function (items) {
                return this.dataService.removeItems(items);
            };

            BaseEditor.prototype.rejectItems = function (items) {
                return this.dataService.rejectItems(items);
            };

            BaseEditor.prototype.restoreRemovedItems = function () {
                return this.dataService.restoreRemovedItems();
            };

            BaseEditor.prototype.createItem = function () {
                return this.dataService.createItem();
            };

            BaseEditor.prototype.addItem = function (item) {
                return this.dataService.addItem(item);
            };

            BaseEditor.prototype.editRow = function (row) {
            };

            BaseEditor.prototype.saveRow = function (row) {
            };
            return BaseEditor;
        })();
        editable.BaseEditor = BaseEditor;

        var BatchEditor = (function (_super) {
            __extends(BatchEditor, _super);
            function BatchEditor(api, settings, displayService, dataService) {
                _super.call(this, api, settings, BatchEditor.defaultSettings, displayService, dataService);
            }
            BatchEditor.prototype.editRow = function (row) {
                var _this = this;
                var dtRow = this.dt.api.row(row);
                var $tr = angular.element(dtRow.node());
                var rowScope = $tr.scope();
                if (!rowScope)
                    throw 'Row must have a scope';
                var cell = this.getFirstRowCell(dtRow);

                //delay in order if any click event triggered this function
                setTimeout(function () {
                    _this.keys.fnSetPosition(cell.cellNode[0]);
                }, 100);
            };

            BatchEditor.prototype.initialize = function () {
                var _this = this;
                this.keys = new $.fn.dataTable.KeyTable({
                    datatable: this.dt.settings,
                    table: this.dt.settings.nTable,
                    focusEvent: this.settings.editEvent,
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
            };

            BatchEditor.prototype.addItem = function (item) {
                var _this = this;
                _super.prototype.addItem.call(this, item);
                var rIdx = this.dt.settings.aoData.length - 1;

                //we have to delay in order to work correctly - we have to set the position after the digestion and datatables redraw
                setTimeout(function () {
                    _this.keys.fnSetPosition(0, rIdx);
                }, 100);
            };

            BatchEditor.prototype.onCellBluring = function (cell, x, y, event) {
                if (!cell)
                    return true;
                var $cell = angular.element(cell);
                var cellScope = $cell.scope();
                if (!cellScope)
                    throw 'Cell must have a scope';
                var col = this.getVisibleColumn(x);
                if (this.dataService.isColumnEditable(col) && cellScope.$cellDisplayMode.name == DisplayMode.ReadOnly)
                    return true;
                var displayService = this.displayService;
                return displayService.canBlurCell(event, cell, col);
            };

            BatchEditor.prototype.onCellBlur = function (cell, x, y, event) {
                if (!cell)
                    return;
                var $cell = angular.element(cell);
                var cellScope = $cell.scope();
                if (!cellScope)
                    throw 'Cell must have a scope';
                var col = this.getVisibleColumn(x);
                var dataService = this.dataService;
                var displayService = this.displayService;
                if (dataService.isColumnEditable(col) && cellScope.$cellDisplayMode.name == DisplayMode.ReadOnly)
                    return;

                if (!dataService.isColumnEditable(col))
                    return;

                if (cellScope.$cellErrors.length) {
                    displayService.selectControl(event, cell, col);
                } else {
                    cellScope.$cellDisplayMode.setMode(DisplayMode.ReadOnly);
                }
                cellScope.$digest();
            };

            BatchEditor.prototype.onCellFocus = function (cell, x, y, event) {
                if (cell == null)
                    return;
                var dataService = this.dataService;
                var displayService = this.displayService;
                var $cell = angular.element(cell);
                var cellScope = $cell.scope();
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

                if (!dataService.isColumnEditable(col)) {
                    if (event != null && event.type == "click")
                        return;
                    var prev = event != null && ((event.keyCode == 9 && event.shiftKey) || event.keyCode == 37);
                    var cellIndex = prev ? this.dt.api.cell(y, x).prev(true).index() : this.dt.api.cell(y, x).next(true).index();
                    this.keys.fnSetPosition(cellIndex.column, cellIndex.row, event); //TODO: handle invisible columns
                    return;
                }

                this.lastFocusedCell = $cell;

                cellScope.$cellDisplayMode.setMode(DisplayMode.Edit);

                //We have to delay the digest in order to have the display template shown for a while
                //so that KeyTable will not blur as the display template will not be in the dom anymore
                setTimeout(function () {
                    cellScope.$digest();
                    displayService.selectControl(event, $cell, col);
                    cellScope.$broadcast('dt.StartEditCell');
                    cellScope.$emit('dt.StartCellEdit');
                }, 100);
            };
            BatchEditor.defaultSettings = {
                editEvent: 'click'
            };

            BatchEditor.$inject = ['api', 'settings', 'displayService', 'dataService'];
            return BatchEditor;
        })(BaseEditor);
        editable.BatchEditor = BatchEditor;

        var InlineEditor = (function (_super) {
            __extends(InlineEditor, _super);
            function InlineEditor(api, settings, displayService, dataService) {
                _super.call(this, api, settings, InlineEditor.defaultSettings, displayService, dataService);
            }
            InlineEditor.prototype.initialize = function () {
            };

            InlineEditor.prototype.saveRow = function (row) {
                var dtRow = this.dt.api.row(row);
                var $tr = angular.element(dtRow.node());
                var rowScope = $tr.scope();
                if (!rowScope)
                    throw 'Row must have a scope';

                if (!rowScope.$rowValidate().length) {
                    rowScope.$rowDisplayMode.setMode(DisplayMode.ReadOnly);
                }

                if (!rowScope.$$phase)
                    rowScope.$digest();
            };

            InlineEditor.prototype.editRow = function (row) {
                var _this = this;
                var dtRow = this.dt.api.row(row);
                var $tr = angular.element(dtRow.node());
                var rowScope = $tr.scope();
                if (!rowScope)
                    throw 'Row must have a scope';
                rowScope.$rowDisplayMode.setMode(DisplayMode.Edit);

                var cell = this.getFirstRowCell(dtRow);

                if (!rowScope.$$phase)
                    rowScope.$digest();

                //We have to delay so that the controls are drawn
                setTimeout(function () {
                    _this.displayService.selectControl(null, cell.cellNode, cell.column);
                }, 100);
            };
            InlineEditor.defaultSettings = {};

            InlineEditor.$inject = ['api', 'settings', 'displayService', 'dataService'];
            return InlineEditor;
        })(BaseEditor);
        editable.InlineEditor = InlineEditor;

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
    angular.module('dt').constant('dtInlineCellErrorsSettings', {
        error: {
            tagName: 'p',
            className: ''
        }
    }).directive('dtInlineCellErrors', [
        'dtInlineCellErrorsSettings',
        function (dtInlineCellErrorsSettings) {
            return {
                restrict: 'A',
                compile: function (tElement, tAttrs) {
                    angular.element(tElement).append($('<' + dtInlineCellErrorsSettings.error.tagName + '/>').attr({
                        'ng-repeat': 'error in $cellErrors',
                        'ng-bind': 'error.message'
                    }).addClass(dtInlineCellErrorsSettings.error.className));

                    //Post compile
                    return function (scope, iElement, iAttrs) {
                        scope.$watchCollection(scope.$rowFormName + "['" + scope.$getInputName() + "'].$error", function (newVal) {
                            scope.$cellValidate();
                        });
                    };
                }
            };
        }
    ]).constant('dtInlineRowErrorsSettings', {
        row: {
            attrs: {},
            className: ''
        },
        cell: {
            attrs: {},
            className: ''
        },
        error: {
            tagName: 'p',
            className: ''
        }
    }).directive('dtInlineRowErrors', [
        '$compile', 'dtInlineRowErrorsSettings',
        function ($compile, dtInlineRowErrorsSettings) {
            return {
                restrict: 'A',
                compile: function (tElement, tAttrs) {
                    //Post compile
                    return function (scope, iElement, iAttrs) {
                        var colNode = $('<td/>').attr('colspan', 100).attr(dtInlineRowErrorsSettings.cell.attrs).addClass(dtInlineRowErrorsSettings.cell.className).append($('<div />').append($('<' + dtInlineRowErrorsSettings.error.tagName + '/>').attr({
                            'ng-repeat': 'error in $rowErrors',
                            'ng-bind': 'error.message'
                        }).addClass(dtInlineRowErrorsSettings.error.className)));
                        var rowNode = $('<tr/>').attr(dtInlineRowErrorsSettings.row.attrs).addClass(dtInlineRowErrorsSettings.row.className).append(colNode);
                        var visible = false;

                        $compile(rowNode)(scope);
                        scope.$watchCollection('this[$rowFormName].$error', function (newVal) {
                            var errors = scope.$rowValidate();
                            var rowData = scope.$rowData;
                            if (!rowData._details)
                                rowData._details = $([]);
                            var details = rowData._details;
                            if ((errors.length && visible) || (!errors.length && !visible))
                                return;

                            //remove the node
                            if (!errors.length && visible) {
                                angular.forEach(details, function (tr, i) {
                                    if (tr === rowNode[0])
                                        details.splice(i, 1);
                                });
                                visible = false;
                                rowNode.detach();
                            } else if (errors.length && !visible) {
                                details.push(rowNode[0]);
                                visible = true;
                                scope.$row.child.show();
                            }
                        });
                    };
                }
            };
        }
    ]).directive('dtTest', [function () {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, elm, attr, ngModelCtrl) {
                    var name = attr.ngModel;
                    var validator = function (val) {
                        return val === 'test';
                    };
                    ngModelCtrl.$validators.dtTest = function (modelValue) {
                        scope.$watch(name + '.engine', function (newVai) {
                            ngModelCtrl.$setValidity('dtTest', validator(newVai));
                        });
                        return validator(modelValue.engine);
                    };
                }
            };
        }]);

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
            if (!editable.dataService)
                throw 'Editable plugin must have a editor set';
            var editor = editable.editor;
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
            var itemsRemoved = editor.removeItems(itemsToRemove);
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
            if (!editable.dataService)
                throw 'Editable plugin must have a editor set';
            var editor = editable.editor;
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
            var editor = editable.editor;
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
            var editor = editable.editor;
            var settings = editable.settings;
            var api = this.s.dt.oInstance.api();
            var itemsToReject = [];
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
}(window, document, undefined));
//# sourceMappingURL=dataTables.editable.js.map
