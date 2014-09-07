module dt.editable.uiBootstrap {
    
    export class DisplayServicePopoverCellValidationPlugin implements IDisplayServiceCellValidationPlugin {

        public setupColumnTemplate(opts: IColumnTemplateSetupArgs): void {
            var cellValidationAttrs = {
                'ui-popover-cell-errors': '',
                'popover': '',
                'popover-trigger': 'open'
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
                'ui-popover-row-errors': ''
            };
            $.extend(args.attrs, rowValidationAttrs);
        }

        public mergeErrors(errors: ValidationError[]): string {
            return Editable.mergeErrors(errors);
        }
    }
    //Register plugins
    Editable.defaultSettings.services.display.plugins.cellValidation = DisplayServicePopoverCellValidationPlugin;
    Editable.defaultSettings.services.display.plugins.rowValidation = DisplayServicePopoverRowValidationPlugin;

} 

(function (window, document, undefined) {

    angular.module('dt')
        .constant('uiPopoverRowErrorsSettings', {
            popoverOptions: {
                placement: 'bottom'
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
        .directive('uiPopoverRowErrors', ['$compile', '$timeout', 'uiPopoverRowErrorsSettings',
            ($compile, $timeout, uiPopoverRowErrorsSettings) => {
                return {
                    restrict: 'A',
                    compile: (tElement, tAttrs) => { 
                        var popover;
                        var popoverScope;

                        //Post compile
                        return (scope, iElement, iAttrs) => {
                            var rowClass = scope.$rowFormName + 'popover';
                            popover = $('<div />')
                                .attr({
                                    'popover': '',
                                    'popover-trigger': 'open'
                                })
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
                                .attr(<Object>uiPopoverRowErrorsSettings.cell.attrs)
                                .addClass(uiPopoverRowErrorsSettings.cell.className)
                                .append(
                                    popover
                                );
                            var rowNode = $('<tr/>')
                                .attr(<Object>uiPopoverRowErrorsSettings.row.attrs)
                                .addClass(uiPopoverRowErrorsSettings.row.className)
                                .append(colNode);
                            var visible = false;

                            $compile(rowNode)(scope);
                            popoverScope = popover.scope();

                            var applyPlacement = () => {
                                if (popoverScope.tt_isOpen) {
                                    popover.trigger('close').trigger('open');
                                }
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
                                    popoverScope.tt_content = scope.$getRowErrorMessage();
                                    if (!popoverScope.tt_isOpen) {
                                        $timeout(() => {
                                            popoverScope.tt_content = scope.$getRowErrorMessage();
                                            popoverScope.tt_placement = uiPopoverRowErrorsSettings.popoverOptions.placement;
                                            popover.trigger('open');
                                        });
                                    }
                                }
                            });
                        }
                    }
                };
            }
        ])
        .constant('uiPopoverCellErrorsSettings', {
            placement: 'bottom',
        })
        .directive('uiPopoverCellErrors', ['$timeout', 'uiPopoverCellErrorsSettings',
            ($timeout, uiPopoverCellErrorsSettings) => {
                return {
                    restrict: 'A',
                    priority: 100,
                    compile: (tElement, tAttrs) => {
                        var popover;
                        var popoverScope;

                        //Post compile
                        return (scope, iElement, iAttrs) => {
                            popover = iElement;
                            popoverScope = scope;

                            scope.$watchCollection(scope.$rowFormName + "['" + scope.$getInputName() + "'].$error", (newVal) => {
                                var errors = scope.$cellValidate();
                                if (errors.length) {
                                    popoverScope.tt_content = scope.$getCellErrorMessage();
                                    if (!popoverScope.tt_isOpen) {
                                        $timeout(() => {
                                            popoverScope.tt_content = scope.$getCellErrorMessage();
                                            popoverScope.tt_placement = uiPopoverCellErrorsSettings.placement;
                                            popover.trigger('open');
                                            
                                        });
                                    }
                                } else if (popoverScope.tt_isOpen) {
                                    $timeout(() => {
                                        popover.trigger('close');
                                    });
                                }
                            });
                        }
                    }
                };
            }
        ]);

} (window, document, undefined));