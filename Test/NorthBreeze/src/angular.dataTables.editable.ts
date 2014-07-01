//Editable plugin
angular.module("dt")
    .config(["dtSettings", (dtSettings) => {

        dtSettings.dtColumnParsingActions.push((elem, column) => {
            if (elem.attr('dt-editable') == null) return;
            column.editable = elem.attr('dt-editable') == "true";
        });

        dtSettings.dtTableCreatingActions.push(($element, options, scope, attrs, $compile, $rootScope) => {
            if (!options.dom || options.dom.indexOf("E") < 0) return;

            options.editable = options.editable || {}; 

            options.editable.itemAdded = function (entity) {
                var $table = angular.element(this.dt.settings.nTable);
                var tblScope = $table.scope();
                if (!tblScope.$$phase)
                    tblScope.$digest();
            };


            options.editable.itemDeleted = function (entities) {
                var $table = angular.element(this.dt.settings.nTable);
                var tblScope = $table.scope();
                if (!tblScope.$$phase)
                    tblScope.$digest();
            };

        });

        dtSettings.dtCellCompilingActions.push(($td, colOpts, cellScope, rowData, rowDataPath, options, oSettings) => {
            if (!oSettings.editable) return;

            //Only columns that have data specified and that do not have editable set to false will be editable
            if (!colOpts.editable || !colOpts.data || colOpts.template) {
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

            if ($.type(colOpts.template) === 'string') 
                viewTmpl = $(colOpts.template);
            else if (colOpts.expression != null && angular.isString(colOpts.expression)) 
                viewTmpl.attr('ng-bind', colOpts.expression);
            else  
                viewTmpl.attr("ng-bind", rowDataPath + '.' + colOpts.data);
            
            var viewCtrl = $("<div />")
                .attr("ng-show", "cellNode._DT_EditMode !== true")
                .append(viewTmpl);

            $td.empty().append(editCtrl, viewCtrl);
        });



        //Manipulate default settings

        dt.Editable.defaultSettings.displayTemplate = function (display, $template, $td) {
            var cellScope: any = $td.scope();
            switch (display) {
                case 'modal':
                    break; //TODO
                case 'popover':
                    break; //TODO
                default: //Inline
                    var lazyContainer = $(".lazy-editor", $td);
                    if (lazyContainer.length == 0) { //Already initialized 
                        $(this.settings.controlSelector, $td).select();
                        break;
                    }
                    lazyContainer.replaceWith($template);
                    this.dt.settings.angular.$compile($template)(cellScope);
                    break;
            }
            cellScope.$digest();
            $template.select();
        };

        dt.Editable.defaultSettings.hideTemplate = function (display, $template, $td) {
            switch (display) {
                case 'modal':
                    break; //TODO
                case 'popover':
                    break; //TODO
                default: //Inline
                    var cellScope: any = angular.element($td).scope();
                    $template.popover("destroy");
                    cellScope.$digest();
            }
        };

        var tmplSettings = {
            init: function($template, item, oColumn) {
                var rowDataPath = this.dt.settings.oInit.rowDataPath;
                $template.attr("ng-model", rowDataPath + "." + oColumn.mData);
            }

        }
        $.each(dt.Editable.defaultSettings.typesTemplate, (key, val) => {
            $.extend(true, val, tmplSettings);
        });

}]); 

 


