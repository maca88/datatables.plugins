module dt.editable.datetimepicker {
    
    export class DisplayServiceEditTypePlugin implements IDisplayServiceEditTypePlugin {

        public static $inject = ['displayService', '$timeout', '$locale'];
        constructor(private displayService: IDisplayService, private $timeout, private $locale) {
        }

        public selectControl(event, cell, col): boolean {
            return false;
        }

        public cellPostLink(args: dt.ICellPostLinkArgs) {
            if (!Editable.isColumnEditable(args.column)) return;
            var editable = Editable.getColumnEditableSettings(args.column) || {};
            var scope = args.scope;
            if (editable.options)
                scope.$options = editable.options;
            var type = Editable.getColumnType(args.column);
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
                    'datetimepicker-popup': '{{$format}}',
                    'type': 'text',
                    'close-text': '{{\'Close\' | translate}}',
                    'clear-text': '{{\'Clear\' | translate}}',
                    'current-text': '{{\'Current\' | translate}}',
                    'open-on-focus': 'true'
                })
                .attr(Editable.EDIT_CONTROL_ATTRS, '')
                .addClass('form-control')
                .addClass(this.displayService.getControlClass())
                .addClass(tmplSettings.className || '')
                .attr(<Object>(tmplSettings.attrs || {}));

            if (opts.options)
                $template.attr('datepicker-options', '$options');


            if ($.isFunction(opts.init))
                opts.init.call(this, $template, type, opts);

            var template = $template[0].outerHTML;
            return template;
        }

    }

    //Register plugins
    Editable.defaultSettings.services.display.plugins.editTypes.push(DisplayServiceEditTypePlugin);

}