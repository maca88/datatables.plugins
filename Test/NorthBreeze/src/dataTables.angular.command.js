var dt;
(function (dt) {
    (function (_command) {
        

        var CommandTablePlugin = (function () {
            function CommandTablePlugin(dtTable, $injector) {
                this.dt = {
                    api: null,
                    settings: null
                };
                this.name = 'command';
                this.table = dtTable;
                this.$injector = $injector;
            }
            CommandTablePlugin.registerCommand = function (command) {
                CommandTablePlugin.registeredCommands[command.name] = command;
                if (command.alias)
                    CommandTablePlugin.registeredCommands[command.alias] = command;
            };

            //check if there is any column that has the commands property set
            CommandTablePlugin.prototype.isEnabled = function () {
                var _this = this;
                var opts = this.table.settings.options;
                var enabled = false;
                angular.forEach(opts.columns, function (col) {
                    if (col.commands === undefined)
                        return;
                    if (!angular.isArray(col.commands))
                        throw 'column "' + col.title + '" property commands must be an array';

                    var cmds = _this.buildCommands(col.commands);

                    col.editable = col.orderable = col.searchable = false;
                    col.defaultContent = cmds.template;
                    col.$commandScopes = cmds.scopes;
                    col.$commandInstances = cmds.instances;
                    enabled = true;
                });
                return enabled;
            };

            CommandTablePlugin.prototype.initialize = function (dtSettings) {
                this.dt.settings = dtSettings;
                this.dt.api = dtSettings.oInstance.api();
            };

            CommandTablePlugin.prototype.buildCommands = function (commands) {
                var _this = this;
                var template = '';
                var scopes = {};
                var cmdName;
                var instances = [];
                var settings;
                angular.forEach(commands, function (command) {
                    if (angular.isString(command)) {
                        if (!CommandTablePlugin.registeredCommands.hasOwnProperty(command))
                            throw 'Unknown command name: ' + command;
                        command = CommandTablePlugin.registeredCommands[command];
                        cmdName = command.alias || command.name;
                        settings = {};
                    } else if ($.isPlainObject(command)) {
                        cmdName = command.name;
                        settings = command.settings || {};
                        if (CommandTablePlugin.registeredCommands.hasOwnProperty(cmdName)) {
                            command = CommandTablePlugin.registeredCommands[cmdName];
                            cmdName = command.alias || command.name;
                        }
                    }

                    //we have to convert all char to lowercase in order the bindings to work
                    cmdName = cmdName.toLowerCase();

                    //anonimus command like: {name: 'custom', template: '...', scope: {...}}
                    if (angular.isObject(command)) {
                        template += command.template;
                        scopes[cmdName] = command.scope;
                    } else {
                        var locals = { settings: settings || {} };
                        var cmd = _this.$injector.instantiate(command, locals);
                        instances.push(cmd);
                        var cmdScope = scopes[cmdName] = {};
                        var opts = {
                            canExecuteExp: "$commands['" + cmdName + "'].canExecute(this)",
                            executeExp: "$commands['" + cmdName + "'].execute(this)"
                        };
                        template += cmd.getTemplate(opts);
                        cmdScope.canExecute = $.proxy(cmd.canExecute, cmd);
                        cmdScope.execute = $.proxy(cmd.executing, cmd);
                    }
                });

                return {
                    template: template,
                    scopes: scopes,
                    instances: instances
                };
            };

            CommandTablePlugin.prototype.getEventListeners = function () {
                return [
                    {
                        event: dt.TableController.events.cellPostLink,
                        scope: this,
                        fn: this.onCellPostLink
                    }
                ];
            };

            CommandTablePlugin.prototype.destroy = function () {
                this.table = null;
                this.dt = null;
            };

            CommandTablePlugin.prototype.onCellPostLink = function (args) {
                var col = args.column;
                args.scope.$commands = col.$commandScopes;
            };
            CommandTablePlugin.registeredCommands = {};

            CommandTablePlugin.$inject = ['dtTable', '$injector'];
            return CommandTablePlugin;
        })();
        _command.CommandTablePlugin = CommandTablePlugin;

        //Register plugin
        dt.TableController.registerPlugin(CommandTablePlugin);

        var BaseCommand = (function () {
            function BaseCommand(defSettings, settings) {
                this.settings = $.extend(true, {}, BaseCommand.defaultSettings, defSettings, settings);
            }
            BaseCommand.prototype.getTemplate = function (opts) {
                var tmpl = $('<' + this.settings.tagName + '/>').addClass(this.settings.className || '').attr('ng-disabled', "" + opts.canExecuteExp + " === false").attr('ng-class', "{ disabled: " + opts.canExecuteExp + " === false }").attr('ng-click', opts.executeExp).attr(this.settings.attrs || {}).append(this.settings.html);

                if (this.settings.visibleWhen)
                    this.settings.ngIfExpressions.push(this.settings.visibleWhen);

                if (this.settings.ngIfExpressions.length)
                    tmpl.attr('ng-if', this.settings.ngIfExpressions.join(' && '));

                var html = $('<div />').append(tmpl).html();
                return html.replaceAll(BaseCommand.EXEC_EXPR, opts.executeExp).replaceAll(BaseCommand.CAN_EXEC_EXPR, opts.canExecuteExp);
            };

            BaseCommand.prototype.executing = function (scope) {
                var _this = this;
                var execFn = function () {
                    _this.execute(scope);
                    _this.executed(scope);
                };
                if (angular.isFunction(this.settings.executing))
                    this.settings.executing.call(this, execFn);
                else
                    execFn();
            };

            BaseCommand.prototype.executed = function (scope) {
            };

            BaseCommand.prototype.canExecute = function (scope) {
                if (angular.isFunction(this.settings.canExecute))
                    return this.settings.canExecute.call(this);
                return true;
            };

            BaseCommand.prototype.execute = function (scope) {
            };
            BaseCommand.EXEC_EXPR = "exec_expr";
            BaseCommand.CAN_EXEC_EXPR = "can_exec_expr";

            BaseCommand.defaultSettings = {
                tagName: 'button',
                className: '',
                attrs: {},
                html: '',
                executing: null,
                visibleWhen: null,
                ngIfExpressions: [],
                canExecute: null
            };
            return BaseCommand;
        })();
        _command.BaseCommand = BaseCommand;
    })(dt.command || (dt.command = {}));
    var command = dt.command;
})(dt || (dt = {}));
//# sourceMappingURL=dataTables.angular.command.js.map
