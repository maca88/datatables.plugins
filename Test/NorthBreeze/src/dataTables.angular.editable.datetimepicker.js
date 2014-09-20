var dt;
(function (dt) {
    (function (editable) {
        (function (datetimepicker) {
            var DisplayServiceEditTypePlugin = (function () {
                function DisplayServiceEditTypePlugin(displayService, $timeout) {
                    this.displayService = displayService;
                    this.$timeout = $timeout;
                }
                DisplayServiceEditTypePlugin.prototype.selectControl = function (event, cell, col) {
                    var _this = this;
                    this.$timeout(function () {
                        var dpElem = angular.element('div.date', cell);
                        if (!dpElem.length)
                            dpElem = angular.element('input.' + _this.displayService.getControlClass(), cell);

                        dpElem.data('DateTimePicker').show(event);
                    });

                    return true;
                };

                DisplayServiceEditTypePlugin.prototype.cellPostLink = function (args) {
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
                    var opts = editable.Editable.getColumnEditableSettings(col) || {};
                    var tmplSettings = editable.Editable.getColumnTemplateSettings(col) || {};

                    var $template = $('<input />').attr({
                        'ng-model': editable.Editable.MODEL_PATH,
                        'bs-datetime-picker': '',
                        'type': 'text'
                    }).attr(editable.Editable.EDIT_CONTROL_ATTRS, '').addClass('form-control').addClass(this.displayService.getControlClass()).addClass(tmplSettings.className || '').attr((tmplSettings.attrs || {}));

                    if (opts.clearIcon)
                        $template.attr('bs-clear-icon', angular.isString(opts.clearIcon) ? opts.clearIcon : '');

                    if (opts.icon)
                        $template.attr('bs-icon', angular.isString(opts.icon) ? opts.icon : '');

                    if (type === 'date')
                        $template.attr('dp-pick-time', 'false');
                    else if (type === 'time')
                        $template.attr('dp-pick-date', 'false');

                    if ($.isFunction(opts.init))
                        opts.init.call(this, $template, type, opts);

                    var template = $template[0].outerHTML;
                    return template;
                };
                DisplayServiceEditTypePlugin.$inject = ['displayService', '$timeout'];
                return DisplayServiceEditTypePlugin;
            })();
            datetimepicker.DisplayServiceEditTypePlugin = DisplayServiceEditTypePlugin;

            //Register plugins
            editable.Editable.defaultSettings.services.display.plugins.editTypes.push(DisplayServiceEditTypePlugin);
        })(editable.datetimepicker || (editable.datetimepicker = {}));
        var datetimepicker = editable.datetimepicker;
    })(dt.editable || (dt.editable = {}));
    var editable = dt.editable;
})(dt || (dt = {}));
//# sourceMappingURL=dataTables.angular.editable.datetimepicker.js.map
