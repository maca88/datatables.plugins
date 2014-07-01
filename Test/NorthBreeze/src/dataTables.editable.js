var dt;
(function (dt) {
    var Editable = (function () {
        function Editable(api, settings) {
            this.initialized = false;
            this.dt = {
                api: null,
                settings: null
            };
            this.deletedEntities = [];
            this.lastEditedCellPos = null;
            this.settings = $.extend(true, {}, Editable.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.editable = this;
            this.keys = new $.fn.dataTable.KeyTable({
                datatable: api.settings()[0],
                table: this.dt.settings.nTable,
                form: true
            });
            this.registerCallbacks();
        }
        Editable.prototype.initialize = function () {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'editableInitCompleted', 'editableInitCompleted', [this]);
        };

        Editable.prototype.registerCallbacks = function () {
            var _this = this;
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

        Editable.prototype.onCellBlur = function (td, x, y) {
            var _this = this;
            if (td == null || td._DT_EditMode === false)
                return;
            var $td = $(td);
            var tr = $td.parent('tr').get(0);
            var row = this.dt.api.row(tr);
            var oColumn = this.dt.settings.aoColumns[x];
            var item = row.data();
            var colValue = item[oColumn.mData];
            var ctrl = $(this.settings.controlSelector, $td);

            if (!oColumn.editable)
                return;

            var validate = oColumn.editable.validate || this.settings.validate;
            var errors = [];
            if (oColumn.editable.validators != null && $.isFunction(validate)) {
                $.each(oColumn.editable.validators, function (key, val) {
                    var validator = new Validator(key, val, oColumn);
                    var success = validate.call(_this, colValue, validator, row);
                    if (!success)
                        errors.push(_this.settings.formatMessage.call(_this, (_this.settings.language.validators[key] || "Validator message is missing"), validator.options));
                });
            }

            if (errors.length) {
                tr._DT_CellWithError = td;
                var errorsHtml = this.settings.mergeErrors.call(this, errors);
                this.settings.showErrors.call(this, ctrl, errorsHtml);
                ctrl.select();
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
                this.settings.hideTemplate.call(this, display, td._DT_EditTemplate, $td, colValue);
            }
        };

        Editable.prototype.onCellFocus = function (td, x, y, event) {
            if (td == null)
                return;
            if (td._DT_EditMode === true) {
                $(this.settings.controlSelector, td).select();
            }

            var $td = $(td);
            var tr = $td.parent('tr').get(0);
            if (tr._DT_CellWithError != null && tr._DT_CellWithError !== td) {
                this.keys.fnSetPosition(tr._DT_CellWithError);
                return;
            }
            var row = this.dt.api.row(tr);
            var oColumn = this.dt.settings.aoColumns[x];
            var item = row.data();
            var colValue = item[oColumn.mData];

            if (!oColumn.editable) {
                if (event != null && event.type == "click")
                    return;
                var prev = event != null && ((event.keyCode == 9 && event.shiftKey) || event.keyCode == 37);
                var cellIndex = prev ? this.dt.api.cell(y, x).prev(true).index() : this.dt.api.cell(y, x).next(true).index();
                this.keys.fnSetPosition(cellIndex.column, cellIndex.row); //TODO: handle invisible columns
                return;
            }

            var type = oColumn._sManualType || oColumn.editable.type;
            if (!type)
                throw 'Column type must be defined';
            var template = oColumn.editable.template || $.extend(true, {}, dt.Editable.defaultTemplate, this.settings.typesTemplate[type]);
            var $template = null;

            if (!td._DT_EditTemplate) {
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
                td._DT_EditTemplate = $template;
            } else
                $template = td._DT_EditTemplate;

            var startEditing = oColumn.editable.startEditing || this.settings.startEditing;
            if ($.isFunction(startEditing))
                startEditing.call(this, td, item, $template, oColumn.mData, x, y);

            var display = oColumn.editable.display || 'inline';

            td._DT_EditMode = true;
            this.settings.displayTemplate.call(this, display, $template, $td);
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
            controlSelector: ".dt-editable-control",
            startCellEditing: null,
            endCellEditing: null,
            tableFocused: null,
            itemAdded: null,
            itemDeleted: null,
            createItem: null,
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
            language: {
                validators: {}
            },
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

    var Validator = (function () {
        function Validator(name, options, column) {
            this.name = name;
            this.options = options;
            this.column = column;
        }
        return Validator;
    })();

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

    TableTools.buttons.editable_delete = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Delete",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.editable)
                throw 'Editable plugin must be initialized';
            var editable = this.s.dt.editable;
            var settings = editable.settings;
            var api = this.s.dt.oInstance.api();
            var entities = [];
            var data = this.s.dt.aoData;
            var i;

            for (i = (data.length - 1); i >= 0; i--) {
                if (data[i]._DTTT_selected) {
                    entities.push(this.s.dt.oInstance.fnGetData(i));
                    api.row(i).remove();
                }
            }
            if ($.isFunction(settings.itemDeleted))
                settings.itemDeleted.call(editable, entities);
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

    TableTools.buttons.editable_add = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Add",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.editable)
                throw 'Editable plugin must be initialized';
            var editable = this.s.dt.editable;
            var settings = editable.settings;
            var api = this.s.dt.oInstance.api();
            var item;
            if ($.isFunction(settings.createItem))
                item = settings.createItem.call(editable);
            else {
                item = {};
                $.each(this.s.dt.aoColumns, function (i, col) {
                    if ($.type(col.mData) == 'string')
                        item[col.mData] = null;
                });
            }
            this.s.dt.oInstance.api().row.add(item);

            if ($.isFunction(settings.itemAdded))
                settings.itemAdded.call(editable, item);

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

    //#endregion
    $.fn.DataTable.Api.prototype.editable = function (settings) {
        var editable = new dt.Editable(this, settings);
        if (this.settings()[0]._bInitComplete)
            editable.initialize();
        else
            this.one('init.dt', function () {
                editable.initialize();
            });

        return null;
    };

    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().editable(oSettings.oInit.editable);
        },
        "cFeature": "E",
        "sFeature": "Editable"
    });
}(window, document, undefined));
//# sourceMappingURL=dataTables.editable.js.map
