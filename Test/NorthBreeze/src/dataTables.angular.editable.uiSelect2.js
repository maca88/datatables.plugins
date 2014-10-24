var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var dt;
(function (dt) {
    (function (_editable) {
        (function (uiSelect2) {
            var Editable = dt.editable.Editable;

            //#region ui-select2 display adapter plugin
            var DisplayServiceEditTypePlugin = (function () {
                function DisplayServiceEditTypePlugin(displayService) {
                    this.displayService = displayService;
                }
                DisplayServiceEditTypePlugin.prototype.getSupportedTypes = function () {
                    return ['select'];
                };

                DisplayServiceEditTypePlugin.prototype.dispose = function () {
                    this.displayService = null;
                };

                DisplayServiceEditTypePlugin.prototype.selectControl = function (event, cell, col) {
                    var select = $('select[ui-select2]', cell);
                    if (!select.length)
                        return false;
                    setTimeout(function () {
                        return select.select2('open');
                    }, 0);
                    return true;
                };

                DisplayServiceEditTypePlugin.prototype.canBlurCell = function (event, cell, col) {
                    return true;
                };

                DisplayServiceEditTypePlugin.prototype.cellPostLink = function (args) {
                    var editable = $.isPlainObject(args.column.editable) ? args.column.editable : null;
                    if (!editable)
                        return;
                    var scope = args.scope;
                    if (editable.options)
                        scope.$options = editable.options;
                    if (editable.groups)
                        scope.$groups = editable.groups;
                    scope.$settings = editable.settings || {};
                };

                /*
                <select ui-select2 ng-model="select2" data-placeholder="Pick a number">
                <option value=""></option>
                <option ng-repeat="number in range" value="{{number.value}}">{{number.text}}</option>
                </select>
                */
                DisplayServiceEditTypePlugin.prototype.getEditTemplateForType = function (type, col) {
                    var opts = Editable.getColumnEditableSettings(col) || {};

                    var settings = opts.settings || {};
                    var template = opts.template || {};
                    template.input = template.input || {};
                    template.select = template.select || {};
                    template.option = template.option || {};
                    template.optgroup = template.optgroup || {};

                    if (opts.asInput) {
                        return $('<input />').attr('ui-select2', '$settings').attr('ng-model', Editable.MODEL_PATH).attr(Editable.EDIT_CONTROL_ATTRS, '').attr((template.input.attrs || {})).addClass(template.input.className || '').addClass(this.displayService.getControlClass())[0].outerHTML;
                    }

                    var select = $('<select />').attr('ui-select2', '$settings').attr('ng-model', Editable.MODEL_PATH).attr(Editable.EDIT_CONTROL_ATTRS, '').attr((template.select.attrs || {})).addClass(template.select.className || '').addClass(this.displayService.getControlClass());

                    if (opts.ngOptions) {
                        select.attr('ng-options', opts.ngOptions);
                    }

                    //we have to add an empty option
                    if (settings.allowClear === true) {
                        select.append($('<option />'));
                    }

                    if (opts.groups) {
                        select.append($('<optgroup />').attr('ng-repeat', 'group in $groups').attr('label', '{{group.name}}').attr((template.optgroup.attrs || {})).addClass(template.optgroup.className || '').append($('<option />').attr('ng-repeat', 'option in group.options').attr('ng-bind', 'option.text').attr('ng-value', 'option.id').attr((template.option.attrs || {})).addClass(template.option.className || '')));
                    } else {
                        select.append($('<option />').attr('ng-repeat', 'option in $options').attr('ng-bind', 'option.text').attr('ng-value', 'option.id').attr((template.option.attrs || {})).addClass(template.option.className || ''));
                    }
                    return select[0].outerHTML;
                };
                DisplayServiceEditTypePlugin.$inject = ['displayService'];
                return DisplayServiceEditTypePlugin;
            })();
            uiSelect2.DisplayServiceEditTypePlugin = DisplayServiceEditTypePlugin;

            //Register plugins
            Editable.defaultSettings.services.display.plugins.editTypes.push(DisplayServiceEditTypePlugin);

            var ColumnAttributeProcessor = (function (_super) {
                __extends(ColumnAttributeProcessor, _super);
                function ColumnAttributeProcessor() {
                    _super.call(this, ['select2', 'asInput', 'select2Settings', 'select2Groups']);
                }
                ColumnAttributeProcessor.prototype.process = function (column, attrName, attrVal, $node) {
                    var editable, template, attrs, input;
                    if (!Editable.isColumnEditable($node))
                        return;
                    if (!angular.isObject(column.editable))
                        column.editable = {};
                    editable = column.editable;
                    template = editable.template = editable.template || {};
                    input = template.input = template.input || {};
                    attrs = input.attrs = input.attrs || {};

                    switch (attrName) {
                        case 'select2':
                            attrs['ui-select2'] = attrVal;
                            break;
                        case 'asInput':
                            template.asInput = true;
                            break;
                        case 'select2Settings':
                            editable.settings = attrVal;
                            break;
                        case 'select2Groups':
                            editable.groups = attrVal;
                            break;
                    }
                };
                return ColumnAttributeProcessor;
            })(dt.BaseAttributeProcessor);
            uiSelect2.ColumnAttributeProcessor = ColumnAttributeProcessor;

            //Register column attribute processor
            dt.TableController.registerColumnAttrProcessor(new ColumnAttributeProcessor());
        })(_editable.uiSelect2 || (_editable.uiSelect2 = {}));
        var uiSelect2 = _editable.uiSelect2;
    })(dt.editable || (dt.editable = {}));
    var editable = dt.editable;
})(dt || (dt = {}));
