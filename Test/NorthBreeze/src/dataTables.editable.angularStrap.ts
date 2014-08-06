module dt.editable.angularStrap {
    
    var Editable = dt.editable.Editable;

    //#region AngularStrap display adapter plugin

    export class DisplayServicePopoverCellValidationPlugin implements IDisplayServiceCellValidationPlugin {

        public setupColumnTemplate(opts: IColumnTemplateSetupArgs): void {
            var cellValidationAttrs = {
                'bs-popover': '',
                'data-content': '{{$getCellErrorMessage()}}',
                'bs-show': '$cellErrors.length > 0',
                'data-trigger': 'manual',
                'data-html': true,
                'data-placement': 'bottom',
            };
            $.extend(opts.editCtrlWrapper.attrs, cellValidationAttrs);
        }

        public mergeErrors(errors: ValidationError[]): string {
            if (!errors) return null;
            var msg = ' '; //the default mesasge must be evaluated to true as the angularstrap check it at init
            for (var i = 0; i < errors.length; i++) {
                msg += errors[i].message + '<br />';
            }
            return msg;
        }

    }

    export class DisplayServicePopoverRowValidationPlugin implements IDisplayServiceRowValidationPlugin {

        public setupRowTemplate(args: IRowTemplateSetupArgs): void {
            var rowValidationAttrs = {
                'bs-popover': '',
                'data-content': '{{$getRowErrorMessage()}}',
                'bs-show': '$rowErrors.length > 0',
                'data-trigger': 'manual',
                'data-html': true,
                'data-placement': 'bottom',
            };
            $.extend(args.attrs, rowValidationAttrs);
        }

        public mergeErrors(errors: ValidationError[]): string {
            if (!errors) return null;
            var msg = ' '; //the default mesasge must be evaluated to true as the angularstrap check it at init
            for (var i = 0; i < errors.length; i++) {
                msg += errors[i].message + '<br />';
            }
            return msg;
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

        public cellCompiling(args: dt.ICellCompilingArgs) {
        }

        public cellCompiled(args: dt.ICellCompiledArgs) {
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