var dt;
(function (dt) {
    (function (editable) {
        (function (angularStrap) {
            var Editable = dt.editable.Editable;

            //#region AngularStrap display adapter plugin
            var DisplayServicePopoverCellValidationPlugin = (function () {
                function DisplayServicePopoverCellValidationPlugin() {
                }
                DisplayServicePopoverCellValidationPlugin.prototype.setupColumnTemplate = function (opts) {
                    var cellValidationAttrs = {
                        'as-popover-cell-errors': ''
                    };
                    $.extend(opts.editCtrlWrapper.attrs, cellValidationAttrs);
                };

                DisplayServicePopoverCellValidationPlugin.prototype.mergeErrors = function (errors) {
                    return Editable.mergeErrors(errors);
                };
                return DisplayServicePopoverCellValidationPlugin;
            })();
            angularStrap.DisplayServicePopoverCellValidationPlugin = DisplayServicePopoverCellValidationPlugin;

            var DisplayServicePopoverRowValidationPlugin = (function () {
                function DisplayServicePopoverRowValidationPlugin() {
                }
                DisplayServicePopoverRowValidationPlugin.prototype.setupRowTemplate = function (args) {
                    var rowValidationAttrs = {
                        'as-popover-row-errors': ''
                    };
                    $.extend(args.attrs, rowValidationAttrs);
                };

                DisplayServicePopoverRowValidationPlugin.prototype.mergeErrors = function (errors) {
                    return Editable.mergeErrors(errors);
                };
                return DisplayServicePopoverRowValidationPlugin;
            })();
            angularStrap.DisplayServicePopoverRowValidationPlugin = DisplayServicePopoverRowValidationPlugin;

            var DisplayServiceEditTypePlugin = (function () {
                function DisplayServiceEditTypePlugin(displayService) {
                    this.displayService = displayService;
                }
                DisplayServiceEditTypePlugin.prototype.selectControl = function (event, cell, col) {
                    return false;
                };

                DisplayServiceEditTypePlugin.prototype.cellPostLink = function (args) {
                };

                DisplayServiceEditTypePlugin.prototype.canBlurCell = function (event, cell, col) {
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

                DisplayServiceEditTypePlugin.prototype.getSupportedTypes = function () {
                    return ["date", "datetime", "time"];
                };

                DisplayServiceEditTypePlugin.prototype.getEditTemplateForType = function (type, col) {
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

                DisplayServiceEditTypePlugin.prototype.getDateTimeTemplate = function (attrs, opts) {
                    var date = this.getDateTemplate(attrs, opts.date || {});
                    var time = this.getTimeTemplate(attrs, opts.time || {});
                    return angular.element('<div />').append(angular.element('<div />').addClass('form-group').append(date), angular.element('<div />').addClass('form-group').append(time));
                };

                DisplayServiceEditTypePlugin.prototype.getDateTemplate = function (attrs, opts) {
                    return angular.element('<input />').attr('size', 8).attr('data-container', 'body').attr(attrs).addClass('form-control').addClass(this.displayService.getControlClass()).addClass(opts.className || '').attr('bs-datepicker', '').attr((opts.attrs || {}));
                };

                DisplayServiceEditTypePlugin.prototype.getTimeTemplate = function (attrs, opts) {
                    return angular.element('<input />').attr('size', 5).attr('data-container', 'body').attr(attrs).addClass('form-control').addClass(this.displayService.getControlClass()).addClass(opts.className || '').attr('bs-timepicker', '').attr((opts.attrs || {}));
                };
                DisplayServiceEditTypePlugin.$inject = ['displayService'];
                return DisplayServiceEditTypePlugin;
            })();
            angularStrap.DisplayServiceEditTypePlugin = DisplayServiceEditTypePlugin;

            //Register plugins
            Editable.defaultSettings.services.display.plugins.cellValidation = DisplayServicePopoverCellValidationPlugin;
            Editable.defaultSettings.services.display.plugins.rowValidation = DisplayServicePopoverRowValidationPlugin;
            Editable.defaultSettings.services.display.plugins.editTypes.push(DisplayServiceEditTypePlugin);
        })(editable.angularStrap || (editable.angularStrap = {}));
        var angularStrap = editable.angularStrap;
    })(dt.editable || (dt.editable = {}));
    var editable = dt.editable;
})(dt || (dt = {}));

(function (window, document, undefined) {
    angular.module('dt').factory('asPopoverFactory', [
        '$popover', '$sce', '$window', function ($popover, $sce, $window) {
            var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;

            var createPopover = function (iElement, scope, options, message) {
                var popover = null;
                var popoverScope = scope.$new();
                options = $.extend({
                    scope: popoverScope,
                    html: true
                }, options);
                popoverScope.content = $sce.trustAsHtml(message);
                requestAnimationFrame(function () {
                    popover && popover.$applyPlacement();
                    popover.show();
                });
                popover = $popover(iElement, options);

                // Garbage collection
                popoverScope.$on('$destroy', function () {
                    if (popover)
                        popover.destroy();
                    options = null;
                    popover = null;
                    popoverScope = null;
                });
                return {
                    popover: popover,
                    scope: popoverScope,
                    options: options
                };
            };
            return {
                createPopover: createPopover
            };
        }]).constant('asPopoverRowErrorsSettings', {
        popoverOptions: {
            placement: 'bottom',
            trigger: 'manual'
        },
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
    }).directive('asPopoverRowErrors', [
        '$compile', '$timeout', 'asPopoverFactory', 'asPopoverRowErrorsSettings',
        function ($compile, $timeout, asPopoverFactory, asPopoverRowErrorsSettings) {
            return {
                restrict: 'A',
                compile: function (tElement, tAttrs) {
                    var popover = null;

                    //Post compile
                    return function (scope, iElement, iAttrs) {
                        var rowClass = scope.$rowFormName + 'popover';
                        var popoverDiv = $('<div />').css('width', '100%').addClass(rowClass);
                        var colNode = $('<td/>').attr('colspan', 100).css({
                            'border-width': 0,
                            'margin': 0,
                            'padding': 0,
                            'height': 0
                        }).attr(asPopoverRowErrorsSettings.cell.attrs).addClass(asPopoverRowErrorsSettings.cell.className).append(popoverDiv);
                        var rowNode = $('<tr/>').attr(asPopoverRowErrorsSettings.row.attrs).addClass(asPopoverRowErrorsSettings.row.className).append(colNode);
                        var visible = false;
                        var options = $.extend({}, asPopoverRowErrorsSettings.popoverOptions);
                        $compile(rowNode)(scope);
                        scope.$watchCollection("$rowData._details", function (newVal) {
                            console.log('wwww');
                            if (popover)
                                $timeout(popover.popover.$applyPlacement, 500);
                        });
                        scope.$watchCollection(scope.$rowFormName + ".$error", function (newVal) {
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
                                if (!popover)
                                    popover = asPopoverFactory.createPopover(popoverDiv, scope, options, scope.$getRowErrorMessage());
                            }
                        });
                    };
                }
            };
        }
    ]).constant('asPopoverCellErrorsSettings', {
        placement: 'bottom',
        trigger: 'manual'
    }).directive('asPopoverCellErrors', [
        'asPopoverFactory', 'asPopoverCellErrorsSettings',
        function (asPopoverFactory, asPopoverCellErrorsSettings) {
            return {
                restrict: 'A',
                compile: function (tElement, tAttrs) {
                    var popover = null;

                    //Post compile
                    return function (scope, iElement, iAttrs) {
                        scope.$watchCollection(scope.$rowFormName + "['" + scope.$getInputName() + "'].$error", function (newVal) {
                            var errors = scope.$cellValidate();
                            if (popover)
                                popover.scope.$destroy();
                            if (errors.length) {
                                popover = asPopoverFactory.createPopover(iElement, scope, asPopoverCellErrorsSettings, scope.$getCellErrorMessage());
                            }
                        });
                    };
                }
            };
        }
    ]);
}(window, document, undefined));
//# sourceMappingURL=dataTables.editable.angularStrap.js.map
