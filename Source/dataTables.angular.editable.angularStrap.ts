module dt.editable.angularStrap {
    
    var Editable = dt.editable.Editable;

    //#region AngularStrap display adapter plugin

    export class DisplayServicePopoverCellValidationPlugin implements IDisplayServiceCellValidationPlugin {

        public setupColumnTemplate(opts: IColumnTemplateSetupArgs): void {
            var cellValidationAttrs = {
                'as-popover-cell-errors': ''
            };
            $.extend(opts.editCtrlWrapper.attrs, cellValidationAttrs);
        }

        public mergeErrors(errors: ValidationError[]): string {
            return Editable.mergeErrors(errors);
        }

    }

    export class DisplayServicePopoverRowValidationPlugin implements IDisplayServiceRowValidationPlugin {

        public setupRowTemplate(args: IRowTemplateSetupArgs): void {
            var rowValidationAttrs = { 
                'as-popover-row-errors': ''
            };
            $.extend(args.attrs, rowValidationAttrs);
        }

        public mergeErrors(errors: ValidationError[]): string {
            return Editable.mergeErrors(errors);
        }

    }

    export class DisplayServiceEditTypePlugin implements IDisplayServiceEditTypePlugin {

        public displayService: IDisplayService;

        public static $inject = ['displayService'];
        constructor(displayService) {
            this.displayService = displayService;
        }

        public selectControl(event, cell, col): boolean {
            return false;
        }

        public cellPostLink(args: dt.ICellPostLinkArgs) {
        }

        public canBlurCell(event: any, cell, col): boolean {
            if (!event) return true;
            if (event.type === 'click') {
                var picker = $(event.target).closest('div.datepicker,div.timepicker');
                //check if the picker element was clicked or if the target is not in the body (assume that the picker view changed)
                if (picker.length || !$(event.target).closest('body').length) return false;
            }
            var type = Editable.getColumnType(col);
            if (type !== 'datetime') return true;

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
        }

        public getSupportedTypes(): string[] {
            return ["date", "datetime", "time"];
        }

        public getEditTemplateForType(type, col): string {
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
        }

        private getDateTimeTemplate(attrs, opts) {
            var date = this.getDateTemplate(attrs, opts.date || {});
            var time = this.getTimeTemplate(attrs, opts.time || {});
            return angular.element('<div />')
                .append(
                angular.element('<div />')
                    .addClass('form-group')
                    .append(date),
                angular.element('<div />')
                    .addClass('form-group')
                    .append(time)
                );
        }

        private getDateTemplate(attrs: Object, opts) {
            return angular.element('<input />')
                .attr('size', 8)
                .attr('data-container', 'body')
                .attr(attrs)
                .addClass('form-control')
                .addClass(this.displayService.getControlClass())
                .addClass(opts.className || '')
                .attr('bs-datepicker', '')
                .attr(<Object>(opts.attrs || {}));
        }

        private getTimeTemplate(attrs: Object, opts) {
            return angular.element('<input />')
                .attr('size', 5)
                .attr('data-container', 'body')
                .attr(attrs)
                .addClass('form-control')
                .addClass(this.displayService.getControlClass())
                .addClass(opts.className || '')
                .attr('bs-timepicker', '')
                .attr(<Object>(opts.attrs || {}));
        }

    }
        
    //Register plugins
    Editable.defaultSettings.services.display.plugins.cellValidation = DisplayServicePopoverCellValidationPlugin;
    Editable.defaultSettings.services.display.plugins.rowValidation = DisplayServicePopoverRowValidationPlugin;
    Editable.defaultSettings.services.display.plugins.editTypes.push(DisplayServiceEditTypePlugin);

    //#endregion

} 

(function (window, document, undefined) {

    angular.module('dt')
        .factory('asPopoverFactory', ['$popover', '$sce', '$window', ($popover, $sce, $window) => {
            var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;
            
            var createPopover = (iElement, scope, options, message) => {
                var popover = null;
                var popoverScope = scope.$new();
                options = $.extend({
                    scope: popoverScope,
                    html: true
                }, options);
                popoverScope.content = $sce.trustAsHtml(message);
                requestAnimationFrame(() => {
                    popover && popover.$applyPlacement();
                    popover.show();
                });
                popover = $popover(iElement, options);
                // Garbage collection
                popoverScope.$on('$destroy', () => {
                    if (popover) popover.destroy();
                    options = null;
                    popover = null;
                    popoverScope = null;
                });
                return {
                    popover: popover,
                    scope: popoverScope,
                    options: options
                };
            }
            return {
                createPopover: createPopover
            };
        }])
        .constant('asPopoverRowErrorsSettings', {
            popoverOptions: {
                placement: 'bottom',
                trigger: 'manual'
            },
            row: {
                attrs: {},
                className: '',
            },
            cell: {
                attrs: {},
                className: ''
            },
            error: {
                tagName: 'p',
                className: ''
            }
        })
        .directive('asPopoverRowErrors', ['$compile', '$timeout', 'asPopoverFactory', 'asPopoverRowErrorsSettings',
            ($compile, $timeout, asPopoverFactory, asPopoverRowErrorsSettings) => {
                return {
                    restrict: 'A',
                    compile: (tElement, tAttrs) => {
                        var popover = null;
                        //Post compile
                        return (scope, iElement, iAttrs) => {
                            var rowClass = scope.$rowFormName + 'popover';
                            var popoverDiv = $('<div />')
                                //.attr({
                                //    'bs-popover': '',
                                //    'data-content': '{{$getRowErrorMessage()}}',
                                //    'data-trigger': 'manual',
                                //    //'data-container': '.' + rowClass
                                //})
                                .css('width', '100%')
                                .addClass(rowClass);
                            var colNode = $('<td/>')
                                .attr('colspan', 100)
                                .css({
                                    'border-width': 0,
                                    'margin': 0,
                                    'padding': 0,
                                    'height': 0
                                })
                                .attr(<Object>asPopoverRowErrorsSettings.cell.attrs)
                                .addClass(asPopoverRowErrorsSettings.cell.className)
                                .append(
                                    popoverDiv
                                );
                            var rowNode = $('<tr/>')
                                .attr(<Object>asPopoverRowErrorsSettings.row.attrs)
                                .addClass(asPopoverRowErrorsSettings.row.className)
                                .append(colNode);
                            var visible = false;
                            var options = $.extend({}, asPopoverRowErrorsSettings.popoverOptions);
                            $compile(rowNode)(scope);
                            var applyPlacement = () => {
                                if (popover)
                                    popover.popover.$applyPlacement();
                            };
                            scope.$parent.$on('dt.rowExpanded', applyPlacement);
                            scope.$parent.$on('dt.rowCollapsed', applyPlacement);
                            scope.$watchCollection(scope.$rowFormName + ".$error", (newVal) => {
                                var errors = scope.$rowValidate();
                                var rowData = scope.$rowData;
                                if (!rowData._details)
                                    rowData._details = $([]);
                                var details = rowData._details;
                                if ((errors.length && visible) || (!errors.length && !visible)) return;
                                //remove the node
                                if (!errors.length && visible) {
                                    angular.forEach(details, (tr, i) => {
                                        if (tr === rowNode[0])
                                            details.splice(i, 1);
                                    });
                                    visible = false;
                                    rowNode.detach();
                                }
                                else if (errors.length && !visible) {
                                    details.push(rowNode[0]);
                                    visible = true;
                                    scope.$row.child.show();
                                    if (!popover)
                                        popover = asPopoverFactory.createPopover(popoverDiv, scope, options, scope.$getRowErrorMessage());
                                }
                            });
                        }
                    }
                };
            }
        ])
        .constant('asPopoverCellErrorsSettings', {
            placement: 'bottom',
            trigger: 'manual'
        })
        .directive('asPopoverCellErrors', ['asPopoverFactory', 'asPopoverCellErrorsSettings',
            (asPopoverFactory, asPopoverCellErrorsSettings) => {
                return {
                    restrict: 'A',
                    compile: (tElement, tAttrs) => {
                        var popover = null;

                        //Post compile
                        return (scope, iElement, iAttrs) => {

                            scope.$watchCollection(scope.$rowFormName + "['" + scope.$getInputName() + "'].$error", (newVal) => {
                                var errors = scope.$cellValidate();
                                if (popover)
                                    popover.scope.$destroy();
                                if (errors.length) {
                                    popover = asPopoverFactory.createPopover(iElement, scope, asPopoverCellErrorsSettings, scope.$getCellErrorMessage());
                                }    
                            });
                        }
                    }
                };
            }
        ]);

} (window, document, undefined));