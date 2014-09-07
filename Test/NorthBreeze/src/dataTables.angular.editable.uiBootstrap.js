var dt;
(function (dt) {
    (function (editable) {
        (function (uiBootstrap) {
            var DisplayServicePopoverCellValidationPlugin = (function () {
                function DisplayServicePopoverCellValidationPlugin() {
                }
                DisplayServicePopoverCellValidationPlugin.prototype.setupColumnTemplate = function (opts) {
                    var cellValidationAttrs = {
                        'ui-popover-cell-errors': '',
                        'popover': '',
                        'popover-trigger': 'open'
                    };
                    $.extend(opts.editCtrlWrapper.attrs, cellValidationAttrs);
                };

                DisplayServicePopoverCellValidationPlugin.prototype.mergeErrors = function (errors) {
                    return editable.Editable.mergeErrors(errors);
                };
                return DisplayServicePopoverCellValidationPlugin;
            })();
            uiBootstrap.DisplayServicePopoverCellValidationPlugin = DisplayServicePopoverCellValidationPlugin;

            var DisplayServicePopoverRowValidationPlugin = (function () {
                function DisplayServicePopoverRowValidationPlugin() {
                }
                DisplayServicePopoverRowValidationPlugin.prototype.setupRowTemplate = function (args) {
                    var rowValidationAttrs = {
                        'ui-popover-row-errors': ''
                    };
                    $.extend(args.attrs, rowValidationAttrs);
                };

                DisplayServicePopoverRowValidationPlugin.prototype.mergeErrors = function (errors) {
                    return editable.Editable.mergeErrors(errors);
                };
                return DisplayServicePopoverRowValidationPlugin;
            })();
            uiBootstrap.DisplayServicePopoverRowValidationPlugin = DisplayServicePopoverRowValidationPlugin;

            //Register plugins
            editable.Editable.defaultSettings.services.display.plugins.cellValidation = DisplayServicePopoverCellValidationPlugin;
            editable.Editable.defaultSettings.services.display.plugins.rowValidation = DisplayServicePopoverRowValidationPlugin;
        })(editable.uiBootstrap || (editable.uiBootstrap = {}));
        var uiBootstrap = editable.uiBootstrap;
    })(dt.editable || (dt.editable = {}));
    var editable = dt.editable;
})(dt || (dt = {}));

(function (window, document, undefined) {
    angular.module('dt').constant('uiPopoverRowErrorsSettings', {
        popoverOptions: {
            placement: 'bottom'
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
    }).directive('uiPopoverRowErrors', [
        '$compile', '$timeout', 'uiPopoverRowErrorsSettings',
        function ($compile, $timeout, uiPopoverRowErrorsSettings) {
            return {
                restrict: 'A',
                compile: function (tElement, tAttrs) {
                    var popover;
                    var popoverScope;

                    //Post compile
                    return function (scope, iElement, iAttrs) {
                        var rowClass = scope.$rowFormName + 'popover';
                        popover = $('<div />').attr({
                            'popover': '',
                            'popover-trigger': 'open'
                        }).css('width', '100%').addClass(rowClass);
                        var colNode = $('<td/>').attr('colspan', 100).css({
                            'border-width': 0,
                            'margin': 0,
                            'padding': 0,
                            'height': 0
                        }).attr(uiPopoverRowErrorsSettings.cell.attrs).addClass(uiPopoverRowErrorsSettings.cell.className).append(popover);
                        var rowNode = $('<tr/>').attr(uiPopoverRowErrorsSettings.row.attrs).addClass(uiPopoverRowErrorsSettings.row.className).append(colNode);
                        var visible = false;

                        $compile(rowNode)(scope);
                        popoverScope = popover.scope();

                        var applyPlacement = function () {
                            if (popoverScope.tt_isOpen) {
                                popover.trigger('close').trigger('open');
                            }
                        };
                        scope.$parent.$on('dt.rowExpanded', applyPlacement);
                        scope.$parent.$on('dt.rowCollapsed', applyPlacement);
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
                                popoverScope.tt_content = scope.$getRowErrorMessage();
                                if (!popoverScope.tt_isOpen) {
                                    $timeout(function () {
                                        popoverScope.tt_content = scope.$getRowErrorMessage();
                                        popoverScope.tt_placement = uiPopoverRowErrorsSettings.popoverOptions.placement;
                                        popover.trigger('open');
                                    });
                                }
                            }
                        });
                    };
                }
            };
        }
    ]).constant('uiPopoverCellErrorsSettings', {
        placement: 'bottom'
    }).directive('uiPopoverCellErrors', [
        '$timeout', 'uiPopoverCellErrorsSettings',
        function ($timeout, uiPopoverCellErrorsSettings) {
            return {
                restrict: 'A',
                priority: 100,
                compile: function (tElement, tAttrs) {
                    var popover;
                    var popoverScope;

                    //Post compile
                    return function (scope, iElement, iAttrs) {
                        popover = iElement;
                        popoverScope = scope;

                        scope.$watchCollection(scope.$rowFormName + "['" + scope.$getInputName() + "'].$error", function (newVal) {
                            var errors = scope.$cellValidate();
                            if (errors.length) {
                                popoverScope.tt_content = scope.$getCellErrorMessage();
                                if (!popoverScope.tt_isOpen) {
                                    $timeout(function () {
                                        popoverScope.tt_content = scope.$getCellErrorMessage();
                                        popoverScope.tt_placement = uiPopoverCellErrorsSettings.placement;
                                        popover.trigger('open');
                                    });
                                }
                            } else if (popoverScope.tt_isOpen) {
                                $timeout(function () {
                                    popover.trigger('close');
                                });
                            }
                        });
                    };
                }
            };
        }
    ]);
}(window, document, undefined));
//# sourceMappingURL=dataTables.angular.editable.uiBootstrap.js.map
