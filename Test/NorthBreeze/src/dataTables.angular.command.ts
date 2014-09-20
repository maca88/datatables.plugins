module dt.command {
    
    //#region Command plugin

    export interface ICommand {
        getTemplate(opts): string;
        canExecute(scope): boolean;
        execute(scope): void;
        executing(scope): void;
        executed(scope): void;
    }

    export class CommandTablePlugin implements ITablePlugin {

        private static registeredCommands = {};

        public static registerCommand(command) {
            CommandTablePlugin.registeredCommands[command.name] = command;
            if (command.alias)
                CommandTablePlugin.registeredCommands[command.alias] = command;
        }

        private tableController: ITableController;
        private $injector: ng.auto.IInjectorService;
        private dt = {
            api: null,
            settings: null
        };

        public static $inject = ['tableController', '$injector'];
        constructor(tableController: TableController, $injector: ng.auto.IInjectorService) {
            this.tableController = tableController;
            this.$injector = $injector;
        }

        public name: string = 'command';

        //check if there is any column that has the commands property set
        public static isEnabled(settings): boolean {
            var enabled = false;
            for (var i = 0; i < settings.columns.length; i++) {
                var col = settings.columns[i];
                if (col.commands === undefined) continue;
                if (!angular.isArray(col.commands))
                    throw 'column "' + col.title + '" property commands must be an array';
                enabled = true;
                break;
            }
            return enabled;
        }

        public initialize(dtSettings): void {
            this.dt.settings = dtSettings;
            this.dt.api = dtSettings.oInstance.api();
            angular.forEach(this.dt.settings.aoColumns, col => {
                if (col.commands === undefined) return;
                if (!angular.isArray(col.commands))
                    throw 'column "' + col.title + '" property commands must be an array';

                var cmds = this.buildCommands(col.commands);

                col.editable = col.orderable = col.searchable = false;
                col.defaultContent = cmds.template;
                col.$commandScopes = cmds.scopes;
                col.$commandInstances = cmds.instances;
            });
        }

        private buildCommands(commands): any {
            var template = '';
            var scopes: any = {};
            var cmdName;
            var instances = [];
            var settings;
            angular.forEach(commands, command => {
                if (angular.isString(command)) {
                    if (!CommandTablePlugin.registeredCommands.hasOwnProperty(command))
                        throw 'Unknown command name: ' + command;
                    command = CommandTablePlugin.registeredCommands[command];
                    cmdName = command.alias || command.name;
                    settings = {};
                } else if ($.isPlainObject(command)) { //We can have cmd like: {name: 'edit', settings: {...}} - a registered cmd with custom settings
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
                    var cmd: ICommand = this.$injector.instantiate(command, locals);
                    instances.push(cmd);
                    var cmdScope: any = scopes[cmdName] = {};
                    var opts = {
                        canExecuteExp: "$commands['" + cmdName + "'].canExecute(this)",
                        executeExp: "$commands['" + cmdName + "'].execute(this)",
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
        }

        public getEventListeners(): IEventListener[] {
            return [
                {
                    event: TableController.events.cellPostLink,
                    scope: this,
                    fn: this.onCellPostLink
                }
            ];
        }

        public destroy(): void {
            this.tableController = null;
            this.dt = null;
        }

        private onCellPostLink(event, args: ICellPostLinkArgs) {
            var col = args.column;
            args.scope.$commands = col.$commandScopes;
        }
    }

    //Register plugin
    TableController.registerPlugin(CommandTablePlugin.isEnabled, CommandTablePlugin);


    export class ColumnAttributeProcessor extends BaseAttributeProcessor implements IColumnAttributeProcessor {
        constructor() {
            super([/^cmd([0-9]+)/gi]);
        }

        public process(column, attrName: string, attrVal, $node: JQuery): void {
            if (!angular.isString(attrVal) && !angular.isArray(attrVal) && !attrVal.length)
                throw 'attribute dt-cmd must contain a string or an array with at least one element. [name, settings = optional]';
            var pattern = this.getMatchedPattern(attrName);
            var commands = column.commands = column.commands || [];
            var cmd: any = {
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
        }
    }

    //Register column attribute processor
    TableController.registerColumnAttrProcessor(new ColumnAttributeProcessor());


    export class BaseCommand implements ICommand {

        public static EXEC_EXPR = "exec_expr";
        public static CAN_EXEC_EXPR = "can_exec_expr";

        public static defaultSettings = {
            tagName: 'button',
            className: '',
            attrs: {},
            html: '',
            executing: null,
            visibleWhen: null,
            ngIfExpressions: [],
            canExecute: null
        }

        public settings;

        constructor(defSettings, settings) {
            this.settings = $.extend(true, {}, BaseCommand.defaultSettings, defSettings, settings);
        }

        public getTemplate(opts) {
            var tmpl = $('<' + this.settings.tagName + '/>')
                .addClass(this.settings.className || '')
                .attr('ng-disabled', "" + opts.canExecuteExp + " === false")
                .attr('ng-class', "{ disabled: " + opts.canExecuteExp + " === false }")
                .attr('ng-click', opts.executeExp)
                .attr(<Object>this.settings.attrs || {})
                .append(this.settings.html);

            if (this.settings.visibleWhen)
                this.settings.ngIfExpressions.push(this.settings.visibleWhen);

            if (this.settings.ngIfExpressions.length)
                tmpl.attr('ng-if', this.settings.ngIfExpressions.join(' && '));

            var html: any = $('<div />').append(tmpl).html();
            return html.replaceAll(BaseCommand.EXEC_EXPR, opts.executeExp)
                .replaceAll(BaseCommand.CAN_EXEC_EXPR, opts.canExecuteExp);
        }

        public executing(scope) {
            var execFn = () => {
                this.execute(scope);
                this.executed(scope);
            };
            if (angular.isFunction(this.settings.executing))
                this.settings.executing.call(this, execFn);
            else
                execFn();
        }

        public executed(scope) { 
        }

        public canExecute(scope) {
            if (angular.isFunction(this.settings.canExecute))
                return this.settings.canExecute.call(this);
            return true;
        }

        public execute(scope) {
        }
    }

    //#endregion

} 