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

        private table: TableController;
        private $injector: ng.auto.IInjectorService;
        private dt = {
            api: null,
            settings: null
        };

        public static $inject = ['dtTable', '$injector'];
        constructor(dtTable: TableController, $injector: ng.auto.IInjectorService) {
            this.table = dtTable;
            this.$injector = $injector;
        }

        public name: string = 'command';

        //check if there is any column that has the commands property set
        public isEnabled(): boolean {
            var opts = this.table.settings.options;
            var enabled = false;
            angular.forEach(opts.columns, col => {
                if (col.commands === undefined) return;
                if (!angular.isArray(col.commands))
                    throw 'column "' + col.title + '" property commands must be an array';

                var cmds = this.buildCommands(col.commands);

                col.editable = col.orderable = col.searchable = false;
                col.defaultContent = cmds.template;
                col.$commandScopes = cmds.scopes;
                col.$commandInstances = cmds.instances;
                enabled = true;
            });
            return enabled;
        }

        public initialize(dtSettings): void {
            this.dt.settings = dtSettings;
            this.dt.api = dtSettings.oInstance.api();
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
            this.table = null;
            this.dt = null;
        }

        private onCellPostLink(args: ICellPostLinkArgs) {
            var col = args.column;
            args.scope.$commands = col.$commandScopes;
        }
    }

    //Register plugin
    TableController.registerPlugin(CommandTablePlugin);


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