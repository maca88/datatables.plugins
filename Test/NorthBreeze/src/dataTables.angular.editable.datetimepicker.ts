module dt.editable.datetimepicker {
    
    export class DisplayServiceEditTypePlugin implements IDisplayServiceEditTypePlugin {

        public static $inject = ['displayService', '$timeout'];
        constructor(private displayService: IDisplayService, private $timeout) {
        }

        public selectControl(event, cell, col): boolean {
            this.$timeout(() => {
                var dpElem = angular.element('div.date', cell);
                if (!dpElem.length)
                    dpElem = angular.element('input.' + this.displayService.getControlClass(), cell);

                dpElem.data('DateTimePicker').show(event);
            });
            
            return true;
        }

        public cellPostLink(args: dt.ICellPostLinkArgs) {

        }

        public canBlurCell(event: any, cell, col): boolean {
            return true;
        }

        public getSupportedTypes(): string[] {
            return ["date", "datetime", "time"];
        }

        public dispose() {

        }

        public getEditTemplateForType(type, col): string {
            var opts = Editable.getColumnEditableSettings(col) || {};
            var tmplSettings = Editable.getColumnTemplateSettings(col) || {};

            var $template = $('<input />')
                .attr({
                    'ng-model': Editable.MODEL_PATH,
                    'bs-datetime-picker': '',
                    'type': 'text'
                })
                .attr(Editable.EDIT_CONTROL_ATTRS, '')
                .addClass('form-control')
                .addClass(this.displayService.getControlClass())
                .addClass(tmplSettings.className || '')
                .attr(<Object>(tmplSettings.attrs || {}));

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
        }

    }

    //Register plugins
    Editable.defaultSettings.services.display.plugins.editTypes.push(DisplayServiceEditTypePlugin);

}