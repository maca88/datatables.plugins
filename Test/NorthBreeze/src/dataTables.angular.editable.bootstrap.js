var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var dt;
(function (dt) {
    (function (editable) {
        (function (bootstrap) {
            var Editable = dt.editable.Editable;

            Editable.defaultEditTemplateControl.className = 'form-control';
            Editable.defaultEditTemplateWrapper.className = 'form-group';

            var DisplayServiceStylePlugin = (function () {
                function DisplayServiceStylePlugin() {
                }
                DisplayServiceStylePlugin.prototype.setupColumnTemplate = function (args) {
                    //Setup classes for validation
                    args.editCtrlWrapper.ngClass['has-error'] = "$getRowForm()[$getInputName()].$valid === false";
                };

                DisplayServiceStylePlugin.prototype.setupRowTemplate = function (args) {
                    //Setup classes for validation
                    //args.ngClass['has-error'] = "$getRowForm().$valid === false";
                };
                return DisplayServiceStylePlugin;
            })();
            bootstrap.DisplayServiceStylePlugin = DisplayServiceStylePlugin;

            //Register plugins
            Editable.defaultSettings.services.display.plugins.style = DisplayServiceStylePlugin;

            //#region Commands
            //#region Edit
            var BootstrapEditCommand = (function (_super) {
                __extends(BootstrapEditCommand, _super);
                function BootstrapEditCommand(settings) {
                    _super.call(this, {
                        className: 'btn btn-default',
                        attrs: {
                            'ng-bind': "$isInEditMode() === false ? 'Edit' : 'Save'"
                        }
                    }, settings);
                }
                BootstrapEditCommand.alias = 'bs.edit';

                BootstrapEditCommand.$inject = ['settings'];
                return BootstrapEditCommand;
            })(dt.editable.BaseEditCommand);
            bootstrap.BootstrapEditCommand = BootstrapEditCommand;

            var BootstrapIconEditCommand = (function (_super) {
                __extends(BootstrapIconEditCommand, _super);
                function BootstrapIconEditCommand(settings) {
                    _super.call(this, {
                        className: 'btn btn-default',
                        html: '<span title="' + "{{$isInEditMode() === false ? 'Edit' : 'Save'}}" + '" ' + 'class="glyphicon" ng-class="{' + " 'disabled': " + dt.command.BaseCommand.CAN_EXEC_EXPR + " === false," + " 'glyphicon-edit': $isInEditMode() === false, 'glyphicon-floppy-disk': $isInEditMode() }" + '"></span>'
                    }, settings);
                }
                BootstrapIconEditCommand.alias = 'bs.icon.edit';

                BootstrapIconEditCommand.$inject = ['settings'];
                return BootstrapIconEditCommand;
            })(dt.editable.BaseEditCommand);
            bootstrap.BootstrapIconEditCommand = BootstrapIconEditCommand;

            //Register commands
            dt.command.CommandTablePlugin.registerCommand(BootstrapEditCommand);
            dt.command.CommandTablePlugin.registerCommand(BootstrapIconEditCommand);

            //#endregion
            //#region Remove
            var BootstrapRemoveCommand = (function (_super) {
                __extends(BootstrapRemoveCommand, _super);
                function BootstrapRemoveCommand(settings) {
                    _super.call(this, {
                        className: 'btn btn-default',
                        html: 'Remove'
                    }, settings);
                }
                BootstrapRemoveCommand.alias = 'bs.remove';

                BootstrapRemoveCommand.$inject = ['settings'];
                return BootstrapRemoveCommand;
            })(dt.editable.BaseRemoveCommand);
            bootstrap.BootstrapRemoveCommand = BootstrapRemoveCommand;

            var BootstrapIconRemoveCommand = (function (_super) {
                __extends(BootstrapIconRemoveCommand, _super);
                function BootstrapIconRemoveCommand(settings) {
                    _super.call(this, {
                        className: 'btn btn-default',
                        html: '<span title="Remove" class="glyphicon glyphicon-remove"></span>'
                    }, settings);
                }
                BootstrapIconRemoveCommand.alias = 'bs.icon.remove';

                BootstrapIconRemoveCommand.$inject = ['settings'];
                return BootstrapIconRemoveCommand;
            })(dt.editable.BaseRemoveCommand);
            bootstrap.BootstrapIconRemoveCommand = BootstrapIconRemoveCommand;

            //Register commands
            dt.command.CommandTablePlugin.registerCommand(BootstrapRemoveCommand);
            dt.command.CommandTablePlugin.registerCommand(BootstrapIconRemoveCommand);

            //#endregion
            //#region Reject
            var BootstrapRejectCommand = (function (_super) {
                __extends(BootstrapRejectCommand, _super);
                function BootstrapRejectCommand(settings) {
                    _super.call(this, {
                        className: 'btn btn-default',
                        html: 'Reject'
                    }, settings);
                }
                BootstrapRejectCommand.alias = 'bs.reject';

                BootstrapRejectCommand.$inject = ['settings'];
                return BootstrapRejectCommand;
            })(dt.editable.BaseRejectCommand);
            bootstrap.BootstrapRejectCommand = BootstrapRejectCommand;

            var BootstrapIconRejectCommand = (function (_super) {
                __extends(BootstrapIconRejectCommand, _super);
                function BootstrapIconRejectCommand(settings) {
                    _super.call(this, {
                        className: 'btn btn-default',
                        html: '<span title="Reject" class="glyphicon glyphicon-repeat"></span>'
                    }, settings);
                }
                BootstrapIconRejectCommand.alias = 'bs.icon.reject';

                BootstrapIconRejectCommand.$inject = ['settings'];
                return BootstrapIconRejectCommand;
            })(dt.editable.BaseRejectCommand);
            bootstrap.BootstrapIconRejectCommand = BootstrapIconRejectCommand;

            //Register commands
            dt.command.CommandTablePlugin.registerCommand(BootstrapRejectCommand);
            dt.command.CommandTablePlugin.registerCommand(BootstrapIconRejectCommand);
        })(editable.bootstrap || (editable.bootstrap = {}));
        var bootstrap = editable.bootstrap;
    })(dt.editable || (dt.editable = {}));
    var editable = dt.editable;
})(dt || (dt = {}));

(function (window, document, undefined) {
    angular.module('dt').config([
        'dtInlineRowErrorsSettings', 'dtInlineCellErrorsSettings', function (dtInlineRowErrorsSettings, dtInlineCellErrorsSettings) {
            dtInlineRowErrorsSettings.error.className = 'text-danger';
            dtInlineCellErrorsSettings.error.className = 'help-block error';
        }
    ]);
}(window, document, undefined));
//# sourceMappingURL=dataTables.angular.editable.bootstrap.js.map
