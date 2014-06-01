//Editable plugin
angular.module("dt").config([
    "dtSettings", function (dtSettings) {
        var editableSettings = $.fn.DataTable.breezeEditable.defaults;

        dtSettings.dtColumnParsingActions.push(function (elem, column) {
            if (elem.attr('dt-editable') == null)
                return;
            column.editable = elem.attr('dt-editable') == "true";
        });

        dtSettings.dtTableCreatingActions.push(function ($element, options, scope, attrs, $compile, $rootScope) {
            if (!options.dom || options.dom.indexOf("E") < 0)
                return;

            options.breezeEditable = options.breezeEditable || {};

            options.breezeEditable.startCellEditing = function (td, entity, editorFn, prop, x, y, oSettings, settings) {
                var cellScope = angular.element(td).scope();
                td._DT_EditMode = true;
                cellScope.$digest();
                var lazyContainer = $(".lazy-editor", td);
                if (lazyContainer.length == 0) {
                    $(settings.editorControlSelector, td).select();
                    return false;
                }
                var editor = editorFn(prop, entity, false);
                editor.attr("ng-model", options.rowDataPath + "." + prop.name);
                lazyContainer.replaceWith(editor);
                $compile(editor)(cellScope);
                editor.select();
                return false;
            };

            options.breezeEditable.endCellEditing = function (td, entity, editorCtrl, prop, x, y, oSettings, settings) {
                var cellScope = angular.element(td).scope();
                editorCtrl.popover("destroy");
                td._DT_EditMode = false;
                cellScope.$digest();
                return false;
            };

            options.breezeEditable.entityAddded = function (entity) {
                var $table = angular.element(this.s.dt.nTable);
                var tblScope = $table.scope();
                if (!tblScope.$$phase)
                    tblScope.$digest();
                var keys = this.s.dt.KeyTable;
                if (keys == null)
                    return;
                var rIdx = this.s.dt.aoData.length - 1;

                // var row = this.s.dt.aoData[];
                //we have to delay in orrder to work correctly
                setTimeout(function () {
                    keys.fnSetPosition(0, rIdx);
                }, 100);
            };

            options.breezeEditable.entitiesRejected = function (entities) {
                var $table = angular.element(this.s.dt.nTable);
                var tblScope = $table.scope();
                if (!tblScope.$$phase)
                    tblScope.$digest();
            };

            options.breezeEditable.entitiesDeleted = function (entities) {
                var $table = angular.element(this.s.dt.nTable);
                var tblScope = $table.scope();
                if (!tblScope.$$phase)
                    tblScope.$digest();
            };

            options.breezeEditable.entitiesRestored = function (entities) {
                var $table = angular.element(this.s.dt.nTable);
                var tblScope = $table.scope();
                if (!tblScope.$$phase)
                    tblScope.$digest();
            };

            editableSettings = $.fn.DataTable.breezeEditable.getSettings(options.breezeEditable || {});
        });

        dtSettings.dtCellCompilingActions.push(function ($td, colOpts, cellScope, rowData, rowDataPath, options, $element, scope) {
            if (!options.dom || options.dom.indexOf("E") < 0)
                return;

            //Only columns that have data specified and that do not have editable set to false will be editable
            if (colOpts.editable === false || !colOpts.data) {
                return;
            }

            //We will not bind data directly to td
            $td.removeAttr("ng-bind");

            //find and create the right editor
            var editCtrl = $("<div />").attr("ng-show", "cellNode._DT_EditMode === true").append($("<div />").addClass("lazy-editor"));

            var viewTmpl = $("<span />");

            if (colOpts.template != null)
                viewTmpl = $(colOpts.template).clone().removeAttr('ng-non-bindable').show();
            else if (colOpts.expression != null && angular.isString(colOpts.expression))
                viewTmpl.attr('ng-bind', colOpts.expression);
            else
                viewTmpl.attr("ng-bind", rowDataPath + '.' + colOpts.data);

            var viewCtrl = $("<div />").attr("ng-show", "cellNode._DT_EditMode !== true").append(viewTmpl);

            $td.empty().append(editCtrl, viewCtrl);
        });
    }]);
//# sourceMappingURL=angular.dataTables.breezeEditable.js.map
