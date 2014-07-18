var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var dt;
(function (dt) {
    var EditableValidationError = (function () {
        function EditableValidationError(message, validator, property) {
            if (typeof property === "undefined") { property = null; }
            this.message = message;
            this.validator = validator;
            this.property = property;
        }
        return EditableValidationError;
    })();
    dt.EditableValidationError = EditableValidationError;

    var EditableValidator = (function () {
        function EditableValidator(name, options, column) {
            this.name = name;
            this.options = options;
            this.column = column;
        }
        return EditableValidator;
    })();
    dt.EditableValidator = EditableValidator;

    var DefaultEditableDataAdapter = (function () {
        function DefaultEditableDataAdapter(api, settings) {
            this.dt = {
                settings: null,
                api: null
            };
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
            this.editable = settings.editable;
        }
        DefaultEditableDataAdapter.prototype.removeItems = function (items) {
            var removed = [];
            for (var i = 0; i < items.length; i++) {
                items[i].remove();
                removed.push(items[i]);
            }
            return removed;
        };

        DefaultEditableDataAdapter.prototype.rejectItems = function (items) {
            throw 'Reject is not supported by DefaultEditableDataAdapter';
        };

        DefaultEditableDataAdapter.prototype.restoreRemovedItems = function () {
            throw 'Restore removed items is not supported by DefaultEditableDataAdapter';
        };

        DefaultEditableDataAdapter.prototype.createItem = function () {
            var item = {};
            $.each(this.dt.settings.aoColumns, function (i, col) {
                if ($.type(col.mData) == 'string')
                    item[col.mData] = null;
            });
            return item;
        };

        DefaultEditableDataAdapter.prototype.addItem = function (item) {
            this.dt.api.row.add(item);
        };

        DefaultEditableDataAdapter.prototype.validateItem = function (row) {
            var errors = [];
            var columns = this.getEditableColumns();
            for (var i = 0; i < columns.length; i++) {
                errors = errors.concat(this.validateItemProperty(columns[i], row));
            }
            return errors;
        };

        DefaultEditableDataAdapter.prototype.validateItemProperty = function (column, row) {
            var _this = this;
            var validate = column.editable.validate || this.settings.validate;
            var errors = [];
            var colValue = this.getItemPropertyValue(column, row);
            if (column.editable.validators != null && $.isFunction(validate)) {
                $.each(column.editable.validators, function (key, val) {
                    var validator = new EditableValidator(key, val, column);
                    var success = validate.call(_this, colValue, validator, row);
                    if (success)
                        return;
                    var msg = _this.editable.formatMessage(_this.editable.settings.language.validators[key] || "Validator message is missing", validator.options);
                    errors.push(new EditableValidationError(msg, validator, column.mData));
                });
            }
            return errors;
        };

        DefaultEditableDataAdapter.prototype.isColumnEditable = function (column) {
            return (column.editable === undefined || column.editable === true) && $.type(column.mData) === "string";
        };

        DefaultEditableDataAdapter.prototype.getItemPropertyValue = function (column, row) {
            var mDataFn = this.dt.settings.oApi._fnGetObjectDataFn(column.mData);
            var cIdx = this.getColumnCurrentIndex(column);
            return mDataFn(row.data(), 'type', undefined, {
                settings: this.dt.settings,
                row: row.index(),
                col: cIdx
            });
        };

        DefaultEditableDataAdapter.prototype.getColumnCurrentIndex = function (column) {
            var columns = this.dt.settings.aoColumns;
            for (var i = 0; i < columns.length; i++) {
                if (columns === columns[i])
                    return i;
            }
            return -1;
        };

        DefaultEditableDataAdapter.prototype.getEditableColumns = function () {
            var editableColumns = [];
            var columns = this.dt.settings.aoColumns;
            for (var i = 0; i < columns.length; i++) {
                if (this.isColumnEditable(columns[i]))
                    editableColumns.push(columns[i]);
            }
            return editableColumns;
        };
        return DefaultEditableDataAdapter;
    })();
    dt.DefaultEditableDataAdapter = DefaultEditableDataAdapter;

    var BreezeEditableDataAdapter = (function (_super) {
        __extends(BreezeEditableDataAdapter, _super);
        function BreezeEditableDataAdapter(api, settings) {
            _super.call(this, api, settings);
            this.deletedEntities = [];
            if (!$.isFunction(this.settings.createEntity))
                throw "'createEntity' setting property must be provided in order to work with BreezeEditableDataAdapter";
        }
        BreezeEditableDataAdapter.prototype.removeItems = function (items) {
            var removed = [];
            for (var i = 0; i < items.length; i++) {
                var entity = items[i].data();
                entity.entityAspect.setDeleted();
                if (entity.entityAspect.entityState === breeze.EntityState.Detached)
                    continue;

                //TODO: check if is an simple or breeze array if simple then remove from the araay manually
                this.deletedEntities.push(entity);
                removed.push(items[i]);
            }
            return removed;
        };

        BreezeEditableDataAdapter.prototype.restoreRemovedItems = function () {
            var restored = [];
            for (var i = 0; i < this.deletedEntities.length; i++) {
                var entity = this.deletedEntities[i];
                entity.entityAspect.rejectChanges();
                restored.push(entity);
            }
            return restored;
        };

        BreezeEditableDataAdapter.prototype.rejectItems = function (items) {
            var rejected = [];
            for (var i = 0; i < items.length; i++) {
                var entity = items[i].data();
                entity.entityAspect.rejectChanges();
                rejected.push(items[i]);
            }
            return rejected;
        };

        BreezeEditableDataAdapter.prototype.createItem = function () {
            return this.settings.createEntity();
        };

        BreezeEditableDataAdapter.prototype.addItem = function (item) {
            this.dt.api.row.add(item);
        };

        BreezeEditableDataAdapter.prototype.validateItemProperty = function (column, row) {
            var errors = _super.prototype.validateItemProperty.call(this, column, row);
            var entity = row.data();
            if (entity.entityType == null || entity.entityAspect == null)
                throw 'Editing non breeze entities is not supported!';
            return errors.concat(this.validateEntityProperty(column, entity));
        };

        //mData support: prop, prop.subProp.subSubProp, prop[1].subProp
        BreezeEditableDataAdapter.prototype.validateEntityProperty = function (column, entity) {
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
                        errors.push(new EditableValidationError(err.errorMessage, err.validator, err.propertyName));
                    });
                }
                var matches = path.match(arrRegex);
                currentEntity = (matches) ? currentEntity[matches[1]][parseInt(matches[2])] : currentEntity[path];
            }
            return errors;
        };
        return BreezeEditableDataAdapter;
    })(DefaultEditableDataAdapter);
    dt.BreezeEditableDataAdapter = BreezeEditableDataAdapter;

    var BootstrapEditableDisplayAdapter = (function () {
        function BootstrapEditableDisplayAdapter() {
        }
        BootstrapEditableDisplayAdapter.prototype.selectControl = function (control) {
            control.select();
        };

        BootstrapEditableDisplayAdapter.prototype.displayErrors = function (type, editor, content) {
            switch (type) {
                case 'modal':
                    break;
                case 'popover':
                    break;
                case 'tooltip':
                    break;
                case 'details':
                    break;
                default:
                    throw 'Unsupported editor type: ' + type;
            }
        };

        BootstrapEditableDisplayAdapter.prototype.displayEditor = function (type, template, container) {
            switch (type) {
                case 'batch':
                case 'inline':
                    container.empty();
                    container.append(template);
                    break;
                case 'popover':
                    break;
                case 'popup':
                    break;
                case 'details':
                    break;
                default:
                    throw 'Unsupported editor type: ' + type;
            }
        };
        return BootstrapEditableDisplayAdapter;
    })();
    dt.BootstrapEditableDisplayAdapter = BootstrapEditableDisplayAdapter;

    //Abstract
    var BaseEditableEditorAdapter = (function () {
        function BaseEditableEditorAdapter(api, settings) {
            this.dt = {
                settings: null,
                api: null
            };
            this.type = null;
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
            this.editable = settings.editable;
        }
        BaseEditableEditorAdapter.prototype.initialize = function () {
        };

        BaseEditableEditorAdapter.prototype.show = function (editorTempalate, container, callback) {
        };

        BaseEditableEditorAdapter.prototype.hide = function (editorTempalate, callback) {
        };
        return BaseEditableEditorAdapter;
    })();
    dt.BaseEditableEditorAdapter = BaseEditableEditorAdapter;

    var BatchEditableEditorAdapter = (function (_super) {
        __extends(BatchEditableEditorAdapter, _super);
        function BatchEditableEditorAdapter(api, settings) {
            _super.call(this, api, settings);
            this.lastEditedCellPos = null;
        }
        BatchEditableEditorAdapter.prototype.initialize = function () {
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
        };

        BatchEditableEditorAdapter.prototype.show = function (editorTempalate, container, callback) {
            container.empty();
            container.append(editorTempalate);
        };

        BatchEditableEditorAdapter.prototype.hide = function (editorTempalate, callback) {
        };

        BatchEditableEditorAdapter.prototype.onCellBlur = function (td, x, y) {
            if (td == null || td._DT_EditMode === false)
                return;
            var displayAdapter = this.editable.displayAdapterInstance;
            var dataAdapter = this.editable.dataAdapterInstance;
            var $td = angular.element(td);
            var scope = $td.scope();
            if (!scope)
                throw 'Cell must have a scope';
            var tr = $td.parent('tr')[0];
            var row = this.dt.api.row(tr);
            var oColumn = this.dt.settings.aoColumns[x];
            var ctrl = $(this.settings.controlSelector, $td);

            if (!dataAdapter.isColumnEditable(oColumn))
                return;

            var errors = dataAdapter.validateItemProperty(oColumn, row);

            if (errors.length) {
                tr._DT_CellWithError = td;
                var errorsHtml = this.editable.settings.mergeErrors.call(this, errors);
                this.settings.showErrors.call(this, ctrl, errorsHtml);
                displayAdapter.selectControl(ctrl);
            } else {
                if (tr._DT_CellWithError == td)
                    tr._DT_CellWithError = null;
                this.lastEditedCellPos = new Position(x, y);

                var endEditing = oColumn.editable.endEditing || this.settings.endEditing;

                if ($.isFunction(endEditing) && !endEditing.call(this, row, oColumn, x, y))
                    return;

                if ($.isFunction(this.settings.removeErrors))
                    this.settings.removeErrors.call(this, ctrl);

                td._DT_EditMode = false;
                var display = oColumn.editable.display || 'inline';
                this.settings.hideTemplate.call(this, display, td._DT_EditTemplate, $td);
            }
        };

        BatchEditableEditorAdapter.prototype.onCellFocus = function (cell, x, y, event) {
            if (cell == null)
                return;
            var displayAdapter = this.editable.displayAdapterInstance;
            var dataAdapter = this.editable.dataAdapterInstance;

            var $cell = angular.element(cell);
            var cellScope = $cell.scope();
            if (!cellScope)
                throw 'Cell must have a scope';

            var rowNode = $cell.parent('tr').get(0);
            if (rowNode._DT_CellWithError != null && rowNode._DT_CellWithError !== cell) {
                this.keys.fnSetPosition(rowNode._DT_CellWithError);
                return;
            }
            var row = this.dt.api.row(rowNode);
            var oColumn = this.dt.settings.aoColumns[x];

            if (!oColumn.editable) {
                if (event != null && event.type == "click")
                    return;
                var prev = event != null && ((event.keyCode == 9 && event.shiftKey) || event.keyCode == 37);
                var cellIndex = prev ? this.dt.api.cell(y, x).prev(true).index() : this.dt.api.cell(y, x).next(true).index();
                this.keys.fnSetPosition(cellIndex.column, cellIndex.row); //TODO: handle invisible columns
                return;
            }
            /*
            var colValue = dataAdapter.get
            var $template = this.editable.getColumnTemplate(oColumn, colValue);
            if (!td._DT_EditTemplate) {
            $template =
            td._DT_EditTemplate = $template;
            } else
            $template = td._DT_EditTemplate;
            
            this.editable.triggerStartEditing(oColumn, td, row, $template);
            
            td._DT_EditMode = true;
            this.display( $template, $td);*/
        };
        return BatchEditableEditorAdapter;
    })(BaseEditableEditorAdapter);
    dt.BatchEditableEditorAdapter = BatchEditableEditorAdapter;

    var Editable = (function () {
        function Editable(api, settings) {
            this.initialized = false;
            this.dt = {
                api: null,
                settings: null
            };
            this.deletedEntities = [];
            this.settings = $.extend(true, {}, Editable.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.editable = this;
            if (angular === undefined)
                throw 'Angular must be included for Editable plugin to work';

            this.setupAdapters();
        }
        Editable.prototype.initialize = function () {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'editableInitCompleted', 'editableInitCompleted', [this]);
        };

        Editable.prototype.triggerEvent = function (eventName) {
        };

        Editable.prototype.triggerStartEditing = function (oColumn, cell, row, template) {
            var startEditing = oColumn.editable.startEditing || this.settings.startEditing;
            if ($.isFunction(startEditing))
                startEditing.call(this, cell, row, template, oColumn);
        };

        Editable.prototype.formatMessage = function (msg, opts) {
            return this.settings.formatMessage.call(this, msg, opts);
        };

        Editable.prototype.getColumnTemplate = function (oColumn, colValue) {
            var $template;
            var type = oColumn._sManualType || oColumn.editable.type;
            if (!type)
                throw 'Column type must be defined';
            var template = oColumn.editable.template;
            if (!template) {
                if ($.isFunction(this.settings.typesTemplate[type]))
                    template = this.settings.typesTemplate[type];
                else if ($.isPlainObject(this.settings.typesTemplate[type]))
                    template = $.extend(true, {}, dt.Editable.defaultTemplate, this.settings.typesTemplate[type]);
                else
                    template = this.settings.typesTemplate[type];
            }
            if ($.isFunction(template))
                $template = template.call(this, item, oColumn);
            else if ($.isPlainObject(template)) {
                $template = $('<' + template.tag + ' />').attr({
                    'type': template.type,
                    'value': $.isFunction(template.valueConverter) ? template.valueConverter.call(this, colValue) : colValue
                }).attr((template.attrs || {})).addClass("dt-editable-control").addClass(template.className);
                $.each(template.events, function (key, val) {
                    if (!$.isFunction(val))
                        return;
                    $template.on(key, function (e) {
                        return val.call(e.target, e, item, oColumn.mData, template);
                    });
                });
                if ($.isFunction(template.init))
                    template.init.call(this, $template, item, oColumn);
            } else if ($.type(template) === 'string')
                $template = $(template);
            else {
                throw 'Invalid cell template type';
            }
            return $template;
        };

        Editable.prototype.setupAdapters = function () {
            this.setupDataAdapter();
        };

        Editable.prototype.setupDataAdapter = function () {
            if (!this.settings.dataAdapter) {
                if (breeze != null && $data != null)
                    this.settings.dataAdapter = DefaultEditableDataAdapter;
                else if (breeze != null)
                    this.settings.dataAdapter = BreezeEditableDataAdapter;
                else if ($data != null)
                    this.settings.dataAdapter = null; //TODO
                else
                    this.settings.dataAdapter = DefaultEditableDataAdapter;
            }
            this.dataAdapterInstance = new this.settings.dataAdapter(this.dt.api, this.settings);
        };
        Editable.defaultTemplate = {
            tag: 'input',
            getValue: function (ctrl) {
                return $(ctrl).val();
            },
            setValue: function (ctrl, val) {
                return $(ctrl).val(val);
            },
            type: 'text',
            className: 'form-control',
            events: {
                'keydown': function (e) {
                    switch (e.keyCode) {
                        case 38:
                        case 40:
                        case 37:
                        case 39:
                            e.stopPropagation(); //not supported
                            break;
                    }
                }
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
                        createEntity: null,
                        validate: null
                    }
                },
                display: {
                    type: null,
                    settings: {
                        controlSelector: ".dt-editable-control"
                    }
                },
                ui: {
                    type: null,
                    settings: {}
                }
            },
            dataAdapter: null,
            displayAdapter: null,
            createEntity: null,
            controlSelector: ".dt-editable-control",
            startCellEditing: null,
            endCellEditing: null,
            formatMessage: function (msg, ctx) {
                return msg;
            },
            hideTemplate: function (display, $template, $td, colValue) {
                switch (display) {
                    case 'modal':
                        break;
                    case 'popover':
                        break;
                    default:
                        $td.html(colValue);
                        break;
                }
                $template.select();
            },
            displayTemplate: function (display, $template, $td) {
                switch (display) {
                    case 'modal':
                        break;
                    case 'popover':
                        break;
                    default:
                        $td.empty();
                        $td.append($template);
                        break;
                }
                $template.select();
            },
            mergeErrors: function (errors) {
                return errors.join("<br/>");
            },
            showErrors: function (ctrl, errHtml) {
                ctrl.popover({
                    html: true,
                    content: errHtml,
                    trigger: 'manual',
                    placement: 'auto bottom'
                });
                ctrl.popover('show');
            },
            removeErrors: function (ctrl) {
                ctrl.popover('destroy');
            },
            language: {},
            typesTemplate: {
                'string': {},
                'number': {
                    type: 'number',
                    getValue: function (ctrl) {
                        return ctrl.valueAsNumber;
                    },
                    setValue: function (ctrl, val) {
                        ctrl.valueAsNumber = val;
                    }
                },
                'date': {
                    type: 'date',
                    getValue: function (ctrl) {
                        return ctrl.valueAsDate;
                    },
                    setValue: function (ctrl, val) {
                        ctrl.valueAsDate = val;
                    }
                },
                'time': {
                    type: 'time'
                },
                'dateTime': {
                    type: 'datetime-local'
                }
            }
        };
        return Editable;
    })();
    dt.Editable = Editable;

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
})(dt || (dt = {}));

(function (window, document, undefined) {
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

    TableTools.buttons.editable_remove = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Remove",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.editable)
                throw 'Editable plugin must be initialized';
            var editable = this.s.dt.editable;
            if (!editable.dataAdapterInstance)
                throw 'Editable plugin must have a dataAdapter set';
            var dataAdapter = editable.dataAdapterInstance;
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
            var itemsRemoved = dataAdapter.removeItems(itemsToRemove);
            if ($.isFunction(settings.itemsRemoved))
                settings.itemsRemoved.call(editable, itemsRemoved);

            //If the restore deleted button is present enable it
            var idx = this.s.buttonSet.indexOf("editable_restore_removed");
            if (idx < 0)
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

    TableTools.buttons.editable_restore_removed = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Restore removed",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.editable)
                throw 'Editable plugin must be initialized';
            var editable = this.s.dt.editable;
            if (!editable.dataAdapterInstance)
                throw 'Editable plugin must have a dataAdapter set';
            var dataAdapter = editable.dataAdapterInstance;
            var settings = editable.settings;
            var restoredItems = dataAdapter.restoreRemovedItems();
            if ($.isFunction(settings.itemsRestored))
                settings.itemsRestored.call(editable, restoredItems);
            $(nButton).addClass(this.classes.buttons.disabled);
        },
        "fnInit": function (nButton, oConfig) {
            $(nButton).addClass(this.classes.buttons.disabled);
        }
    });

    TableTools.buttons.editable_add = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Add",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.editable)
                throw 'Editable plugin must be initialized';
            var editable = this.s.dt.editable;
            if (!editable.dataAdapterInstance)
                throw 'Editable plugin must have a dataAdapter set';
            var dataAdapter = editable.dataAdapterInstance;
            var settings = editable.settings;

            var item = dataAdapter.createItem();
            if ($.isFunction(settings.itemCreated))
                settings.itemCreated.call(editable, item);

            dataAdapter.addItem(item);

            if ($.isFunction(settings.itemAdded))
                settings.itemAdded.call(editable, item);

            //TODO:
            var rIdx = this.s.dt.aoData.length - 1;

            //we have to delay in order to work correctly
            setTimeout(function () {
                editable.keys.fnSetPosition(0, rIdx);
            }, 100);
        },
        "fnInit": function (nButton, oConfig) {
            //$(nButton).addClass(this.classes.buttons.disabled);
        }
    });

    TableTools.buttons.editable_reject = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Reject",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.editable)
                throw 'Editable plugin must be initialized';
            var editable = this.s.dt.editable;
            if (!editable.dataAdapterInstance)
                throw 'Editable plugin must have a dataAdapter set';
            var dataAdapter = editable.dataAdapterInstance;
            var settings = editable.settings;
            var api = this.s.dt.oInstance.api();
            var itemsToReject = [];
            var data = this.s.dt.aoData;
            var i;
            for (i = (data.length - 1); i >= 0; i--) {
                if (data[i]._DTTT_selected)
                    itemsToReject.push(api.row(i));
            }
            var itemsRejected = dataAdapter.rejectItems(itemsToReject);
            if ($.isFunction(settings.itemsRejected))
                settings.itemsRejected.call(editable, itemsRejected);
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
    $.fn.DataTable.Api.register('editable.init()', function (settings) {
        var editable = new dt.Editable(this, settings);
        if (this.settings()[0]._bInitComplete)
            editable.initialize();
        else
            this.one('init.dt', function () {
                editable.initialize();
            });

        return null;
    });

    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().editable.init(oSettings.oInit.editable);
        },
        "cFeature": "E",
        "sFeature": "Editable"
    });
}(window, document, undefined));
//# sourceMappingURL=dataTables.editable.js.map
