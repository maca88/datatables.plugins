var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var dt;
(function (dt) {
    (function (_command) {
        

        var CommandTablePlugin = (function () {
            function CommandTablePlugin(tableController, $injector) {
                this.dt = {
                    api: null,
                    settings: null
                };
                this.name = 'command';
                this.tableController = tableController;
                this.$injector = $injector;
            }
            CommandTablePlugin.registerCommand = function (command) {
                CommandTablePlugin.registeredCommands[command.name] = command;
                if (command.alias)
                    CommandTablePlugin.registeredCommands[command.alias] = command;
            };

            //check if there is any column that has the commands property set
            CommandTablePlugin.isEnabled = function (settings) {
                var enabled = false;
                for (var i = 0; i < settings.columns.length; i++) {
                    var col = settings.columns[i];
                    if (col.commands === undefined)
                        continue;
                    if (!angular.isArray(col.commands))
                        throw 'column "' + col.title + '" property commands must be an array';
                    enabled = true;
                    break;
                }
                return enabled;
            };

            CommandTablePlugin.prototype.initialize = function (dtSettings) {
                var _this = this;
                this.dt.settings = dtSettings;
                this.dt.api = dtSettings.oInstance.api();
                angular.forEach(this.dt.settings.aoColumns, function (col) {
                    if (col.commands === undefined)
                        return;
                    if (!angular.isArray(col.commands))
                        throw 'column "' + col.title + '" property commands must be an array';

                    var cmds = _this.buildCommands(col.commands);

                    col.editable = col.orderable = col.searchable = false;
                    col.defaultContent = cmds.template;
                    col.$commandScopes = cmds.scopes;
                    col.$commandInstances = cmds.instances;
                });
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
                this.tableController = null;
                this.dt = null;
            };

            CommandTablePlugin.prototype.onCellPostLink = function (event, args) {
                var col = args.column;
                args.scope.$commands = col.$commandScopes;
            };
            CommandTablePlugin.registeredCommands = {};

            CommandTablePlugin.$inject = ['tableController', '$injector'];
            return CommandTablePlugin;
        })();
        _command.CommandTablePlugin = CommandTablePlugin;

        //Register plugin
        dt.TableController.registerPlugin(CommandTablePlugin.isEnabled, CommandTablePlugin);

        var ColumnAttributeProcessor = (function (_super) {
            __extends(ColumnAttributeProcessor, _super);
            function ColumnAttributeProcessor() {
                _super.call(this, [/^cmd([0-9]+)/gi]);
            }
            ColumnAttributeProcessor.prototype.process = function (column, attrName, attrVal, $node) {
                if (!angular.isString(attrVal) && !angular.isArray(attrVal) && !attrVal.length)
                    throw 'attribute dt-cmd must contain a string or an array with at least one element. [name, settings = optional]';
                var pattern = this.getMatchedPattern(attrName);
                var commands = column.commands = column.commands || [];
                var cmd = {
                    index: parseInt(pattern.exec(attrName)[1])
                };
                if (angular.isString(attrVal))
                    cmd.name = attrVal;
                else {
                    cmd.name = attrVal[0];
                    if (attrVal.length > 1)
                        cmd.settings = attrVal[1];
                }

                //position the command in the array
                var cIdx = 0;
                for (var i = 0; i < commands.length; i++) {
                    var idx = commands[i].index || i;
                    if (idx < cmd.index)
                        cIdx++;
                }
                commands.splice(cIdx, 0, cmd);
            };
            return ColumnAttributeProcessor;
        })(dt.BaseAttributeProcessor);
        _command.ColumnAttributeProcessor = ColumnAttributeProcessor;

        //Register column attribute processor
        dt.TableController.registerColumnAttrProcessor(new ColumnAttributeProcessor());

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
