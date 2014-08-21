module dt.editable.uiSelect2 {


    var Editable = dt.editable.Editable;
    //#region ui-select2 display adapter plugin

    export class DisplayServiceEditTypePlugin implements IDisplayServiceEditTypePlugin {

        public displayService: IDisplayService;

        public static $inject = ['displayService'];
        constructor(displayService) {
            this.displayService = displayService;
        }

        public getSupportedTypes(): string[] {
            return ['select'];
        }

        public selectControl(event, cell, col): boolean {
            var select:any = $('select[ui-select2]', cell);
            if (!select.length) return false;
            setTimeout(() => select.select2('open'), 0);
            return true;
        }

        public canBlurCell(event, cell, col): boolean {
            return true;
        }

        public cellPostLink(args: dt.ICellPostLinkArgs) {
            var editable = $.isPlainObject(args.column.editable) ? args.column.editable : null;
            if (!editable) return;
            var scope = args.scope;
            if (editable.options)
                scope.$options = editable.options;
            if (editable.groups)
                scope.$groups = editable.groups;
            scope.$settings = editable.settings || {};
        }

        /*
            <select ui-select2 ng-model="select2" data-placeholder="Pick a number">
                <option value=""></option>
                <option ng-repeat="number in range" value="{{number.value}}">{{number.text}}</option>
            </select>
         */
        public getEditTemplateForType(type, col): string {
            var opts = Editable.getColumnEditableSettings(col) || {}; //TODO: default settings   

            var settings = opts.settings || {};
            var template = opts.template || {};
            template.input = template.input || {};
            template.select = template.select || {};
            template.option = template.option || {};
            template.optgroup = template.optgroup || {};

            if (opts.asInput) {
                return $('<input />')
                    .attr('ui-select2', '$settings')
                    .attr('ng-model', Editable.MODEL_PATH)
                    .attr(Editable.EDIT_CONTROL_ATTRS, '')
                    .attr(<Object>(template.input.attrs || {}))
                    .addClass(template.input.className || '')
                    .addClass(this.displayService.getControlClass())[0].outerHTML;
            }

            var select = $('<select />')
                .attr('ui-select2', '$settings')
                .attr('ng-model', Editable.MODEL_PATH)
                .attr(Editable.EDIT_CONTROL_ATTRS, '')
                .attr(<Object>(template.select.attrs || {}))
                .addClass(template.select.className || '')
                .addClass(this.displayService.getControlClass());

            //we have to add an empty option
            if (settings.allowClear === true) {
                select.append($('<option />'));
            }

            if (opts.groups) {
                select.append(
                    $('<optgroup />')
                    .attr('ng-repeat', 'group in $groups')
                    .attr('label', '{{group.name}}')
                    .attr(<Object>(template.optgroup.attrs || {}))
                    .addClass(template.optgroup.className || '')
                    .append(
                        $('<option />')
                        .attr('ng-repeat', 'option in group.options')
                        .attr('ng-bind', 'option.text')
                        .attr('ng-value', 'option.value')
                        .attr(<Object>(template.option.attrs || {}))
                        .addClass(template.option.className || '')
                    ));
            } else {
                select.append(
                    $('<option />')
                        .attr('ng-repeat', 'option in $options')
                        .attr('ng-bind', 'option.text')
                        .attr('ng-value', 'option.value')
                        .attr(<Object>(template.option.attrs || {}))
                        .addClass(template.option.className || '')
                    );
            }
            return select[0].outerHTML;
        }
    }

    //Register plugins
    Editable.defaultSettings.services.display.plugins.editTypes.push(DisplayServiceEditTypePlugin);

    //#endregion
}
    
 