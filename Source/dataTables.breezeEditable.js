var dt;
(function (dt) {
    var BreezeEditable = (function () {
        function BreezeEditable(api, settings) {
            this.initialized = false;
            this.dt = {
                api: null,
                settings: null
            };
            var entityType = settings.entityType;
            var entityManager = settings.entityManager;
            var parentEntity = settings.parentEntity;
            delete settings['entityType'];
            delete settings['entityManager'];
            delete settings['parentEntity'];
            this.settings = $.extend(true, {}, BreezeEditable.defaultSettings, settings);
            this.settings.entityType = entityType;
            this.settings.entityManager = entityManager;
            this.settings.parentEntity = parentEntity;

            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.breezeEditable = this;
            this.keys = new $.fn.dataTable.KeyTable({
                datatable: api.settings()[0],
                table: this.dt.settings.nTable,
                form: true
            });
            this.registerCallbacks();
        }
        BreezeEditable.prototype.initialize = function () {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'breezeEditableInitCompleted', 'breezeEditableInitCompleted', [this]);
        };

        BreezeEditable.prototype.registerCallbacks = function () {
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

        BreezeEditable.prototype.onCellBlur = function (td, x, y) {
            if (td == null || td._DT_EditMode === false || td._DT_EditableEnabled === false)
                return;
            var $td = $(td);
            var tr = $td.parent('tr').get(0);
            var row = this.dt.api.row(tr);
            var oColumn = this.dt.settings.aoColumns[x];
            var entity = row.data();

            if (entity.entityType == null || entity.entityAspect == null)
                throw 'Editing for non breeze entities is not supported!';
            if ($.isNumeric(oColumn.mData) || oColumn.editable == false) {
                return;
            }
            var prop = entity.entityType.getProperty(oColumn.mData);
            if (prop == null)
                throw 'Property ' + oColumn.mData + "does not exists!";

            if (!entity.entityAspect.validateProperty(oColumn.mData)) {
                tr._DT_CellWithError = td;
                var errors = entity.entityAspect.getValidationErrors();
                var errMsgs = [];
                $.each(errors, function (idx, err) {
                    if (err.propertyName != oColumn.mData)
                        return;
                    errMsgs.push(err.errorMessage);
                });
                var ctrl = $(this.settings.editorControlSelector, $td);
                ctrl.popover({
                    html: true,
                    content: errMsgs.join("<br/>"),
                    trigger: 'manual',
                    placement: 'auto bottom'
                });
                ctrl.popover('show');
                ctrl.select();
            } else {
                if (tr._DT_CellWithError == td)
                    tr._DT_CellWithError = null;

                var editorCtrl = $(this.settings.editorControlSelector, $td);
                if ($.isFunction(this.settings.endCellEditing) && !this.settings.endCellEditing.call(this, td, entity, editorCtrl, prop, x, y))
                    return;

                td._DT_EditMode = false;
                editorCtrl.popover('destroy');
                $td.html(entity[oColumn.mData]);
            }
        };

        BreezeEditable.prototype.onCellFocus = function (td, x, y, event) {
            if (td == null || td._DT_EditableEnabled === false)
                return;
            if (td._DT_EditMode === true) {
                $(this.settings.editorControlSelector, td).select();
            }
            var $td = $(td);
            var tr = $td.parent('tr').get(0);
            if (tr._DT_CellWithError != null && tr._DT_CellWithError !== td) {
                this.keys.fnSetPosition(tr._DT_CellWithError);
                return;
            }
            var row = this.dt.api.row(tr);
            var oColumn = this.dt.settings.aoColumns[x];
            var entity = row.data();
            if (entity.entityType == null)
                throw 'Editing for non breeze entities is not supported!';
            if ($.isNumeric(oColumn.mData) || oColumn.editable == false) {
                if (event != null && event.type == "click")
                    return;
                var prev = event != null && ((event.keyCode == 9 && event.shiftKey) || event.keyCode == 37);
                var cellIndex = prev ? this.dt.api.cell(y, x).prev(true).index() : this.dt.api.cell(y, x).next(true).index();
                this.keys.fnSetPosition(cellIndex.column, cellIndex.row); //TODO: handle invisible columns
                return;
            }

            var prop = entity.entityType.getProperty(oColumn.mData);
            if (prop == null)
                throw 'Property ' + oColumn.mData + "does not exists!";
            var editorFn = this.settings.typesTemplate[prop.dataType.name];

            if ($.isFunction(this.settings.startCellEditing) && !this.settings.startCellEditing.call(this, td, entity, editorFn, prop, x, y))
                return;

            $td.html(editorFn(prop, entity, true));
            td._DT_EditMode = true;
        };

        BreezeEditable.inputFnFactory = function (type, attrs, valConverter) {
            if (typeof attrs === "undefined") { attrs = null; }
            if (typeof valConverter === "undefined") { valConverter = null; }
            return function (prop, entity, manualBinding) {
                var ctrl = $('<input />').attr({
                    'type': type,
                    'value': $.isFunction(valConverter) ? valConverter(entity[prop.name]) : entity[prop.name]
                }).attr((attrs || {})).addClass("form-control dt-editor-control").on('keydown', function (e) {
                    switch (e.keyCode) {
                        case 38:
                        case 40:
                        case 37:
                        case 39:
                            e.stopPropagation(); //not supported
                            break;
                    }
                });
                if (manualBinding)
                    ctrl.on('keyup', function (e) {
                        entity[prop.name] = $(e.target).val();
                    });
                return ctrl;
            };
        };
        BreezeEditable.defaultSettings = {
            entityType: null,
            parentEntity: null,
            collectionProperty: null,
            entityManager: null,
            typesTemplate: {
                String: BreezeEditable.inputFnFactory("text"),
                Int64: BreezeEditable.inputFnFactory("number"),
                Int32: BreezeEditable.inputFnFactory("number"),
                Int16: BreezeEditable.inputFnFactory("number"),
                Byte: BreezeEditable.inputFnFactory("text"),
                Decimal: BreezeEditable.inputFnFactory("number", { "step": "any" }),
                Double: BreezeEditable.inputFnFactory("number", { "step": "any" }),
                Single: BreezeEditable.inputFnFactory("text"),
                DateTime: BreezeEditable.inputFnFactory("datetime-local", null, function (val) {
                    return val != null ? val.toISOString().substr(0, 19) : null;
                }),
                DateTimeOffset: BreezeEditable.inputFnFactory("datetime-local", function (val) {
                    return val != null ? val.toISOString().substr(0, 19) : null;
                }),
                Time: BreezeEditable.inputFnFactory("time"),
                Boolean: BreezeEditable.inputFnFactory("checkbox"),
                Guid: BreezeEditable.inputFnFactory("text"),
                Binary: BreezeEditable.inputFnFactory("text"),
                Undefined: BreezeEditable.inputFnFactory("text")
            },
            editorControlSelector: ".dt-editor-control",
            startCellEditing: null,
            endCellEditing: null,
            tableFocused: null,
            entityAddded: null,
            entitiesRejected: null,
            entitiesDeleted: null,
            entitiesRestored: null
        };
        return BreezeEditable;
    })();
    dt.BreezeEditable = BreezeEditable;
})(dt || (dt = {}));

(function (window, document, undefined) {
    //Register events
    $.fn.DataTable.models.oSettings.breezeEditableInitCompleted = [];

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

    TableTools.buttons.editable_reject = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Reject",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.breezeEditable)
                throw 'BreezeEditable plugin must be initialized';
            var settings = this.s.dt.breezeEditable.settings;
            var entities = this.fnGetSelectedData();
            $.each(entities, function (i, entity) {
                if (entity.entityAspect == null)
                    throw 'Table items must be breeze entities';
                entity.entityAspect.rejectChanges();
            });
            if ($.isFunction(settings.entitiesRejected))
                settings.entitiesRejected.call(this, entities);
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

    TableTools.buttons.editable_restore_deleted = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Restore deleted",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.breezeEditable)
                throw 'BreezeEditable plugin must be initialized';
            var settings = this.s.dt.breezeEditable.settings;
            settings.deletedEntities = settings.deletedEntities || [];
            if (!$.isArray(settings.deletedEntities))
                return;
            $.each(settings.deletedEntities, function (i, entity) {
                if (entity.entityAspect == null)
                    throw 'Table items must be breeze entities';
                entity.entityAspect.rejectChanges();
            });
            if ($.isFunction(settings.entitiesRestored))
                settings.entitiesRestored.call(this, settings.deletedEntities);
            settings.deletedEntities = []; //reset the list
            $(nButton).addClass(this.classes.buttons.disabled);
        },
        "fnInit": function (nButton, oConfig) {
            $(nButton).addClass(this.classes.buttons.disabled);
        }
    });

    TableTools.buttons.editable_delete = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Delete",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.breezeEditable)
                throw 'BreezeEditable plugin must be initialized';
            var settings = this.s.dt.breezeEditable.settings;
            settings.deletedEntities = settings.deletedEntities || [];
            var entities = this.fnGetSelectedData();
            $.each(entities, function (i, entity) {
                if (entity.entityAspect == null)
                    throw 'Table items must be breeze entities';
                entity.entityAspect.setDeleted();
                if (entity.entityAspect.entityState === breeze.EntityState.Detached)
                    return;
                settings.deletedEntities.push(entity);
            });
            if ($.isFunction(settings.entitiesDeleted))
                settings.entitiesDeleted.call(this, entities);

            if (settings.deletedEntities.length == 0)
                return;

            //If the restore deleted button is present enable it
            var idx = this.s.buttonSet.indexOf("editable_restore_deleted");
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

    TableTools.buttons.editable_add = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Add",
        "fnClick": function (nButton, oConfig) {
            if (!this.s.dt.breezeEditable)
                throw 'BreezeEditable plugin must be initialized';
            var settings = this.s.dt.breezeEditable.settings;
            var manager, item;
            var entity = settings.parentEntity;
            if (entity) {
                if ($.isFunction(entity))
                    entity = entity();
                if (settings.collectionProperty == null)
                    throw 'Collection property must be set!';
                if (entity.entityAspect == null)
                    throw 'Parent entity must be a breeze entity';
                var colPropertyType = entity.entityType.getProperty(settings.collectionProperty);
                if (colPropertyType == null)
                    throw 'Collection property ' + settings.collectionProperty + ' does not exist!';
                manager = entity.entityAspect.entityManager || settings.entityManager;
                if (manager == null)
                    throw 'Parent entity is not attached to an entity manager!';
                item = manager.createEntity(colPropertyType.entityType.shortName);
                entity[settings.collectionProperty].push(item);
            } else if (settings.entityType) {
                manager = settings.entityManager;
                if (manager == null)
                    throw 'Entity manager must be set!';
                item = manager.createEntity(settings.entityType);
                this.s.dt.oInstance.api().row.add(item);
            } else {
                throw 'entityType or parentEntity must be set';
            }

            if ($.isFunction(settings.entityAddded))
                settings.entityAddded.call(this, item);
        },
        "fnInit": function (nButton, oConfig) {
            //$(nButton).addClass(this.classes.buttons.disabled);
        }
    });

    //#endregion
    $.fn.DataTable.Api.prototype.breezeEditable = function (settings) {
        var breezeEditable = new dt.BreezeEditable(this, settings);
        if (this.settings()[0].bInitialized)
            breezeEditable.initialize();
        else
            this.one('init.dt', function () {
                breezeEditable.initialize();
            });

        return null;
    };

    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().breezeEditable(oSettings.oInit.breezeEditable);
        },
        "cFeature": "E",
        "sFeature": "BreezeEditable"
    });
}(window, document, undefined));
//# sourceMappingURL=dataTables.breezeEditable.js.map
