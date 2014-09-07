module dt.editable.bootstrap {
    
    var Editable = dt.editable.Editable;

    Editable.defaultEditTemplateControl.className = 'form-control';
    Editable.defaultEditTemplateWrapper.className = 'form-group';

    export class DisplayServiceStylePlugin implements dt.editable.IDisplayServiceStylePlugin {
        
        public setupColumnTemplate(args: dt.editable.IColumnTemplateSetupArgs): void {
            //Setup classes for validation
            args.editCtrlWrapper.ngClass['has-error'] = "$getRowForm()[$getInputName()].$valid === false";
        }

        public setupRowTemplate(args: dt.editable.IRowTemplateSetupArgs): void {
            //Setup classes for validation
            //args.ngClass['has-error'] = "$getRowForm().$valid === false";
        }

    }

    //Register plugins
    Editable.defaultSettings.services.display.plugins.style = DisplayServiceStylePlugin;

    //#region Commands

    //#region Edit

    export class BootstrapEditCommand extends dt.editable.BaseEditCommand {
        public static alias = 'bs.edit';

        public static $inject = ['settings']
        constructor(settings) {
            super({
                className: 'btn btn-default',
                attrs: {
                    'ng-bind': "$isInEditMode() === false ? 'Edit' : 'Save'"
                }
            }, settings);
        }
    }

    export class BootstrapIconEditCommand extends dt.editable.BaseEditCommand {
        public static alias = 'bs.icon.edit';

        public static $inject = ['settings']
        constructor(settings) {
            super({
                className: 'btn btn-default',
                html: '<span title="' + "{{$isInEditMode() === false ? 'Edit' : 'Save'}}" + '" ' +
                'class="glyphicon" ng-class="{' + " 'disabled': " + dt.command.BaseCommand.CAN_EXEC_EXPR + " === false," +
                " 'glyphicon-edit': $isInEditMode() === false, 'glyphicon-floppy-disk': $isInEditMode() }" + '"></span>'
            }, settings);
        }
    }

    //Register commands
    dt.command.CommandTablePlugin.registerCommand(BootstrapEditCommand);
    dt.command.CommandTablePlugin.registerCommand(BootstrapIconEditCommand);

    //#endregion

    //#region Remove

    export class BootstrapRemoveCommand extends dt.editable.BaseRemoveCommand {
        public static alias = 'bs.remove';

        public static $inject = ['settings']
        constructor(settings) {
            super({
                className: 'btn btn-default',
                html: 'Remove',
            }, settings);
        }

    }

    export class BootstrapIconRemoveCommand extends dt.editable.BaseRemoveCommand {
        public static alias = 'bs.icon.remove';

        public static $inject = ['settings']
        constructor(settings) {
            super({
                className: 'btn btn-default',
                html: '<span title="Remove" class="glyphicon glyphicon-remove"></span>'
            }, settings);
        }

    }

    //Register commands
    dt.command.CommandTablePlugin.registerCommand(BootstrapRemoveCommand);
    dt.command.CommandTablePlugin.registerCommand(BootstrapIconRemoveCommand);

    //#endregion

    //#region Reject

    export class BootstrapRejectCommand extends dt.editable.BaseRejectCommand {
        public static alias = 'bs.reject';

        public static $inject = ['settings']
        constructor(settings) {
            super({
                className: 'btn btn-default',
                html: 'Reject',
            }, settings);
        }

    }

    export class BootstrapIconRejectCommand extends dt.editable.BaseRejectCommand {
        public static alias = 'bs.icon.reject';

        public static $inject = ['settings']
        constructor(settings) {
            super({
                className: 'btn btn-default',
                html: '<span title="Reject" class="glyphicon glyphicon-repeat"></span>'
            }, settings);
        }

    }

    //Register commands
    dt.command.CommandTablePlugin.registerCommand(BootstrapRejectCommand);
    dt.command.CommandTablePlugin.registerCommand(BootstrapIconRejectCommand);

    //#endregion

    //#endregion

}



(function(window, document, undefined) {

    angular.module('dt').config([
        'dtInlineRowErrorsSettings', 'dtInlineCellErrorsSettings', (dtInlineRowErrorsSettings, dtInlineCellErrorsSettings) => {
            dtInlineRowErrorsSettings.error.className = 'text-danger';
            dtInlineCellErrorsSettings.error.className = 'help-block error';
        }
    ]);

} (window, document, undefined));