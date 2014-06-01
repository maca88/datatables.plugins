(function (window, document, undefined) {

    var inputFnFactory = function(type, attrs, valConverter) {
        return function(prop, entity, manualBinding) {
            var ctrl = $('<input />').attr({
                    'type': type,
                    'value': $.isFunction(valConverter) ? valConverter(entity[prop.name]) : entity[prop.name]
                })
                .attr(attrs || {})
                .addClass("form-control dt-editor-control")
                .on('keydown', function (e) {
                    switch (e.keyCode) {
                        case 38: /* up arrow */
                        case 40: /* down arrow */
                        case 37: /* left arrow */
                        case 39: /* right arrow */
                            e.stopPropagation(); //not supported
                            break;
                        
                    }
                });
            if(manualBinding)
                ctrl.on('keyup', function (e) {
                    entity[prop.name] = $(this).val();
                });
            return ctrl;
        }
    };

    var defaultSettings = {
        parentEntity: null, //breeze.Entity, the parent entity
        collectionProperty: null, //string, the name of the collection that will be editable within entity
        //entityManager: null, //breeze.EntityManager, the entityManager that will be used, not required if the parent entity already contains it
        typesTemplate: {
            String: inputFnFactory("text"),
            Int64: inputFnFactory("number"),
            Int32: inputFnFactory("number"),
            Int16: inputFnFactory("number"),
            Byte: inputFnFactory("text"),
            Decimal: inputFnFactory("number", {"step": "any"}),
            Double: inputFnFactory("number", { "step": "any" }),
            Single: inputFnFactory("text"),
            DateTime: inputFnFactory("datetime-local", null, function (val) { return val != null ? val.toISOString().substr(0, 19) : null; }),
            DateTimeOffset: inputFnFactory("datetime-local", function (val) { return val != null ? val.toISOString().substr(0, 19) : null; }),
            Time: inputFnFactory("time"),
            Boolean: inputFnFactory("checkbox"),
            Guid: inputFnFactory("text"),
            Binary: inputFnFactory("text"),
            Undefined: inputFnFactory("text"),
        },
        editorControlSelector: ".dt-editor-control",
        startCellEditing: null,// function(td, x, y, oData, oColumn) 
        endCellEditing: null,
        tableFocused: null,
        entityAddded: null,
        entitiesRejected: null,
        entitiesDeleted: null,
        entitiesRestored: null
    };

    //#region Extensions

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

    TableTools.buttons.editable_reject = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Reject",
        "fnClick": function (nButton, oConfig) {
            var settings = this.s.dt.breezeEditable || {};
            var entities = this.fnGetSelectedData();
            $.each(entities, function(idx, entity) {
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
    }),

    TableTools.buttons.editable_restore_deleted = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Restore deleted",
        "fnClick": function (nButton, oConfig) {
            var settings = this.s.dt.breezeEditable || {};
            settings.deletedEntities = settings.deletedEntities || [];
            if (!$.isArray(settings.deletedEntities)) return;
            $.each(settings.deletedEntities, function (idx, entity) {
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
    }),

    TableTools.buttons.editable_delete = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Delete",
        "fnClick": function (nButton, oConfig) {
            if (this.s.dt.breezeEditable == null)
                this.s.dt.breezeEditable = {};
            var settings = this.s.dt.breezeEditable;
            settings.deletedEntities = settings.deletedEntities || [];
            var entities = this.fnGetSelectedData();
            $.each(entities, function (idx, entity) {
                if (entity.entityAspect == null)
                    throw 'Table items must be breeze entities';
                entity.entityAspect.setDeleted();
                settings.deletedEntities.push(entity);
            });
            if ($.isFunction(settings.entitiesDeleted))
                settings.entitiesDeleted.call(this, entities);

            if (settings.deletedEntities.length == 0) return;
            //If the restore deleted button is present enable it
            var idx = this.s.buttonSet.indexOf("editable_restore_deleted");
            if (idx < 0) return;
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
    }),

    TableTools.buttons.editable_add = $.extend({}, TableTools.buttonBase, {
        "sButtonText": "Add",
        "fnClick": function (nButton, oConfig) {
            var settings = this.s.dt.breezeEditable || {};
            var entity = settings.parentEntity;
            if ($.isFunction(entity))
                entity = entity();
            if (entity == null)
                throw 'Parent entity must be set!';
            if (settings.collectionProperty == null)
                throw 'Collection property must be set!';
            if (entity.entityAspect == null)
                throw 'Parent entity must be a breeze entity';
            var colPropertyType = entity.entityType.getProperty(settings.collectionProperty);
            if (colPropertyType == null)
                throw 'Collection property ' + settings.collectionProperty + ' does not exist!';
            var manager = entity.entityAspect.entityManager;
            if (manager == null)
                throw 'Parent entity is not attached to an entity manager!';
            var item = manager.createEntity(colPropertyType.entityType.shortName);
            entity[settings.collectionProperty].push(item);
            if ($.isFunction(settings.entityAddded))
                settings.entityAddded.call(this, item);
        },
        "fnInit": function (nButton, oConfig) {
            //$(nButton).addClass(this.classes.buttons.disabled);
        }
    }),

    //#endregion

    $.fn.DataTable.breezeEditable = {
        
        getSettings: function(settings) {
            return $.extend(true, {}, defaultSettings, settings);
        },

        defaults: defaultSettings
    };


    $.fn.DataTable.Api.prototype.breezeEditable = function (settings) {
        var oSettings = this.settings()[0];
        settings = $.extend(true, {}, defaultSettings, settings);
        var api = oSettings.oInstance.api();
        oSettings.breezeEditable = settings; //save the merged settings in order to use them in the button events
        var tableNode = api.table().node();
        var $tableNode = $(tableNode);
        var keys = new $.fn.dataTable.KeyTable({
            datatable: api.settings()[0],
            table: tableNode,
            form: true
        });
        oSettings.KeyTable = keys;
        var hiddenInputDiv = $tableNode.next(); //form option create this node

        $tableNode.on('init.dt', function() {
            $tableNode.parent('div.dataTables_wrapper').prepend(hiddenInputDiv); //when tab press in an input right before the table the first cell in the table will be selected
        });

        $('input', hiddenInputDiv).on('focus', function (e) { //When table get focus
            if ($.isFunction(settings.tableFocused))
                settings.tableFocused.call(api, e);
        });


        keys.event.focus(null, null, function (td, x, y, event) {
            if (td == null || td._DT_EditableEnabled === false) return;
            if (td._DT_EditMode === true) {
                $(settings.editorControlSelector, td).select();
            }
            var $td = $(td);
            var tr = $td.parent('tr').get(0);
            if (tr._DT_CellWithError != null && tr._DT_CellWithError !== td) {
                keys.fnSetPosition(tr._DT_CellWithError);
                return;
            }
            var row = api.row(tr);
            var oColumn = oSettings.aoColumns[x];
            var entity = row.data();
            if (entity.entityType == null)
                throw 'Editing for non breeze entities is not supported!';
            if ($.isNumeric(oColumn.mData) || oColumn.editable == false) { //if the cell is not editable, get the next editable one
                if (event != null && event.type == "click") return;
                var prev = event != null && ((event.keyCode == 9 && event.shiftKey) || event.keyCode == 37); //if shift+tab or left arrow was pressed
                var cellIndex = prev 
                    ? api.cell(y, x).prev(true).index()
                    : api.cell(y, x).next(true).index();
                keys.fnSetPosition(cellIndex.column, cellIndex.row); //TODO: handle invisible columns
                return;
            }
            
            var prop = entity.entityType.getProperty(oColumn.mData);
            if (prop == null)
                throw 'Property ' + oColumn.mData + "does not exists!";
            var editorFn = settings.typesTemplate[prop.dataType.name];

            if ($.isFunction(settings.startCellEditing) && !settings.startCellEditing(td, entity, editorFn, prop, x, y, oSettings, settings))
                return;

            $td.html(editorFn(prop, entity, true));
            td._DT_EditMode = true;
        });
        
        keys.event.blur(null, null, function (td, x, y) {
            if (td == null || td._DT_EditMode === false || td._DT_EditableEnabled === false) return;
            var $td = $(td);
            var tr = $td.parent('tr').get(0);
            var row = api.row(tr);
            var oColumn = oSettings.aoColumns[x];
            var entity = row.data();

            if (entity.entityType == null || entity.entityAspect == null)
                throw 'Editing for non breeze entities is not supported!';
            if ($.isNumeric(oColumn.mData) || oColumn.editable == false) { //if the cell is not editable, get the next editable one
                return;
            }
            var prop = entity.entityType.getProperty(oColumn.mData);
            if (prop == null)
                throw 'Property ' + oColumn.mData + "does not exists!";

            

            if (!entity.entityAspect.validateProperty(oColumn.mData)) {
                tr._DT_CellWithError = td;
                var errors = entity.entityAspect.getValidationErrors();
                var errMsgs = [];
                $.each(errors, function(idx, err) {
                    if (err.propertyName != oColumn.mData) return;
                    errMsgs.push(err.errorMessage);
                });
                var ctrl = $(settings.editorControlSelector, $td);
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

                var editorCtrl = $(settings.editorControlSelector, $td);
                if ($.isFunction(settings.endCellEditing) && !settings.endCellEditing(td, entity, editorCtrl, prop, x, y, oSettings, settings))
                    return;

                td._DT_EditMode = false;
                editorCtrl.popover('destroy');
                $td.html(entity[oColumn.mData]);
            }
        });
    };

    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().breezeEditable(oSettings.oInit.breezeEditable);
        },
        "cFeature": "E",
        "sFeature": "BreezeEditable"
    });

}(window, document));