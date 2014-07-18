//Editable plugin
angular.module("dt").config([
    "dtSettings", function (dtSettings) {
        dtSettings.dtTableCreatingActions.push(function ($element, options, scope, attrs, $compile, $rootScope) {
            if (!options.dom || options.dom.indexOf("E") < 0)
                return;

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

        dtSettings.dtCellCompilingActions.push(function ($td, colOpts, cellScope, rowData, rowDataPath, options, oSettings) {
            if (!oSettings.editable)
                return;

            //Only columns that have data specified and that do not have editable set to false will be editable
            if (!colOpts.editable || !colOpts.data || colOpts.template) {
                return;
            }

            //We will not bind data directly to td
            $td.removeAttr("ng-bind");

            //find and create the right editor
            var editCtrl = $("<div />").attr("ng-show", "cellNode._DT_EditMode === true").append($("<div />").addClass("lazy-editor"));

            var viewTmpl = $("<span />");

            if ($.type(colOpts.template) === 'string')
                viewTmpl = $(colOpts.template);
            else if (colOpts.expression != null && angular.isString(colOpts.expression))
                viewTmpl.attr('ng-bind', colOpts.expression);
            else
                viewTmpl.attr("ng-bind", rowDataPath + '.' + colOpts.data);

            var viewCtrl = $("<div />").attr("ng-show", "cellNode._DT_EditMode !== true").append(viewTmpl);

            $td.empty().append(editCtrl, viewCtrl);
        });

        //Manipulate default settings
        dt.Editable.defaultSettings.displayTemplate = function (display, $template, $td) {
            var cellScope = $td.scope();
            switch (display) {
                case 'modal':
                    break;
                case 'popover':
                    break;
                default:
                    var lazyContainer = $(".lazy-editor", $td);
                    if (lazyContainer.length == 0) {
                        $(this.settings.controlSelector, $td).select();
                        break;
                    }
                    lazyContainer.replaceWith($template);
                    this.dt.settings.oInit.angular.$compile($template)(cellScope);
                    break;
            }
            cellScope.$digest();
            $template.select();
        };

        dt.Editable.defaultSettings.hideTemplate = function (display, $template, $td) {
            switch (display) {
                case 'modal':
                    break;
                case 'popover':
                    break;
                default:
                    var cellScope = angular.element($td).scope();
                    $template.popover("destroy");
                    cellScope.$digest();
            }
        };

        var tmplSettings = {
            init: function ($template, item, oColumn) {
                var rowDataPath = this.dt.settings.oInit.rowDataPath;
                $template.attr("ng-model", rowDataPath + "." + oColumn.mData);
            }
        };
        $.each(dt.Editable.defaultSettings.typesTemplate, function (key, val) {
            $.extend(true, val, tmplSettings);
        });
    }]);
//# sourceMappingURL=angular.dataTables.editable.js.map
