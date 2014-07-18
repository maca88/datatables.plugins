//Editable plugin
angular.module("dt")
    .config(["dtSettings", (dtSettings) => {

        dtSettings.dtTableCreatingActions.push(($element, options, scope, attrs, $compile, $rootScope) => {
            if (!options.dom || options.dom.indexOf("L") < 0) return;

            options.breezeEditable = options.breezeEditable || {}; 

            options.breezeEditable.startCellEditing = function (td, entity, editorFn, prop, x, y) {
                var cellScope: any = angular.element(td).scope();
                td._DT_EditMode = true;
                cellScope.$digest();
                var lazyContainer = $(".lazy-editor", td);
                if (lazyContainer.length == 0) {
                    $(this.settings.editorControlSelector, td).select();
                    return false;
                } //Already initialized 
                var editor = editorFn(prop, entity, false);
                editor.attr("ng-model", options.rowDataPath + "." + prop.name);
                lazyContainer.replaceWith(editor);
                $compile(editor)(cellScope);
                editor.select();
                return false; //do not execute the default behaviour
            };

            options.breezeEditable.endCellEditing = (td, entity, editorCtrl, prop, x, y) => {
                var cellScope: any = angular.element(td).scope();
                editorCtrl.popover("destroy");
                td._DT_EditMode = false;
                cellScope.$digest();
                return false;
            };

            options.breezeEditable.entityAddded = function (entity) {
                var $table = angular.element(this.dt.settings.nTable);
                var tblScope = $table.scope();
                if (!tblScope.$$phase)
                    tblScope.$digest();
                var keys = this.keys;
                if (keys == null) return;
                var rIdx = this.dt.settings.aoData.length - 1;
               // var row = this.s.dt.aoData[];

                //we have to delay in order to work correctly 
                setTimeout(() => {
                    keys.fnSetPosition(0, rIdx);
                }, 100);
            };

            options.breezeEditable.entitiesRejected = function (entities) {
                var $table = angular.element(this.dt.settings.nTable);
                var tblScope = $table.scope();
                if (!tblScope.$$phase)
                    tblScope.$digest();
            };

            options.breezeEditable.entitiesDeleted = function (entities) {
                var $table = angular.element(this.dt.settings.nTable);
                var tblScope = $table.scope();
                if (!tblScope.$$phase)
                    tblScope.$digest();
            };

            options.breezeEditable.entitiesRestored = function (entities) {
                var $table = angular.element(this.dt.settings.nTable);
                var tblScope = $table.scope();
                if (!tblScope.$$phase)
                    tblScope.$digest();
            };
        });

        dtSettings.dtCellCompilingActions.push(($td, colOpts, cellScope, rowData, rowDataPath, oSettings) => {
            if (!oSettings.breezeEditable) return;

            //Only columns that have data specified and that do not have editable set to false will be editable
            if (colOpts.editable === false || !colOpts.data) {
                return;
            }
            //We will not bind data directly to td
            $td.removeAttr("ng-bind");

            //find and create the right editor
            var editCtrl = $("<div />")
                .attr("ng-show", "cellNode._DT_EditMode === true")
                .append(
                    $("<div />")
                    .addClass("lazy-editor") //We will initialize the editor control when needed for performance reasons
                );


            var viewTmpl = $("<span />");

            if (colOpts.template != null) 
                viewTmpl = $(colOpts.template).clone().removeAttr('ng-non-bindable').show();
            else if (colOpts.expression != null && angular.isString(colOpts.expression)) 
                viewTmpl.attr('ng-bind', colOpts.expression);
            else  
                viewTmpl.attr("ng-bind", rowDataPath + '.' + colOpts.data);
            
            var viewCtrl = $("<div />")
                .attr("ng-show", "cellNode._DT_EditMode !== true")
                .append(viewTmpl);

            $td.empty().append(editCtrl, viewCtrl);
        });
}]); 