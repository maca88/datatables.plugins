var dt;
(function (dt) {
    (function (_editable) {
        (function (datetimepicker) {
            var DisplayServiceEditTypePlugin = (function () {
                function DisplayServiceEditTypePlugin(displayService, $timeout, $locale) {
                    this.displayService = displayService;
                    this.$timeout = $timeout;
                    this.$locale = $locale;
                }
                DisplayServiceEditTypePlugin.prototype.selectControl = function (event, cell, col) {
                    return false;
                };

                DisplayServiceEditTypePlugin.prototype.cellPostLink = function (args) {
                    if (!_editable.Editable.isColumnEditable(args.column))
                        return;
                    var editable = _editable.Editable.getColumnEditableSettings(args.column) || {};
                    var scope = args.scope;
                    if (editable.options)
                        scope.$options = editable.options;
                    var type = _editable.Editable.getColumnType(args.column);
                    var format;
                    switch (type) {
                        case 'date':
                            format = this.$locale.DATETIME_FORMATS.shortDate;
                            break;
                        case 'time':
                            format = this.$locale.DATETIME_FORMATS.shortTime;
                            break;
                        default:
                            format = this.$locale.DATETIME_FORMATS.short;
                            break;
                    }
                    scope.$format = format;
                    //todo watch $locale for changes
                };

                DisplayServiceEditTypePlugin.prototype.canBlurCell = function (event, cell, col) {
                    return true;
                };

                DisplayServiceEditTypePlugin.prototype.getSupportedTypes = function () {
                    return ["date", "datetime", "time"];
                };

                DisplayServiceEditTypePlugin.prototype.dispose = function () {
                };

                DisplayServiceEditTypePlugin.prototype.getEditTemplateForType = function (type, col) {
                    var opts = _editable.Editable.getColumnEditableSettings(col) || {};
                    var tmplSettings = _editable.Editable.getColumnTemplateSettings(col) || {};

                    var $template = $('<input />').attr({
                        'ng-model': _editable.Editable.MODEL_PATH,
                        'datetimepicker-popup': '{{$format}}',
                        'type': 'text',
                        'close-text': '{{\'Close\' | translate}}',
                        'clear-text': '{{\'Clear\' | translate}}',
                        'current-text': '{{\'Current\' | translate}}',
                        'open-on-focus': 'true'
                    }).attr(_editable.Editable.EDIT_CONTROL_ATTRS, '').addClass('form-control').addClass(this.displayService.getControlClass()).addClass(tmplSettings.className || '').attr((tmplSettings.attrs || {}));

                    if (opts.options)
                        $template.attr('datepicker-options', '$options');

                    if ($.isFunction(opts.init))
                        opts.init.call(this, $template, type, opts);

                    var template = $template[0].outerHTML;
                    return template;
                };
                DisplayServiceEditTypePlugin.$inject = ['displayService', '$timeout', '$locale'];
                return DisplayServiceEditTypePlugin;
            })();
            datetimepicker.DisplayServiceEditTypePlugin = DisplayServiceEditTypePlugin;

            //Register plugins
            _editable.Editable.defaultSettings.services.display.plugins.editTypes.push(DisplayServiceEditTypePlugin);
        })(_editable.datetimepicker || (_editable.datetimepicker = {}));
        var datetimepicker = _editable.datetimepicker;
    })(dt.editable || (dt.editable = {}));
    var editable = dt.editable;
})(dt || (dt = {}));
//# sourceMappingURL=dataTables.angular.editable.uiDatetimepicker.js.map
