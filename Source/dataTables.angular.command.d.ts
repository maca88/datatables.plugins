declare module dt.command {
    interface ICommand {
        getTemplate(opts: any): string;
        canExecute(scope: any): boolean;
        execute(scope: any): void;
        executing(scope: any): void;
        executed(scope: any): void;
    }
    class CommandTablePlugin implements ITablePlugin {
        private static registeredCommands;
        static registerCommand(command: any): void;
        private tableController;
        private $injector;
        private dt;
        static $inject: string[];
        constructor(tableController: TableController, $injector: ng.auto.IInjectorService);
        public name: string;
        static isEnabled(settings: any): boolean;
        public initialize(dtSettings: any): void;
        private buildCommands(commands);
        public getEventListeners(): IEventListener[];
        public destroy(): void;
        private onCellPostLink(event, args);
    }
    class ColumnAttributeProcessor extends BaseAttributeProcessor implements IColumnAttributeProcessor {
        constructor();
        public process(column: any, attrName: string, attrVal: any, $node: JQuery): void;
    }
    class BaseCommand implements ICommand {
        static EXEC_EXPR: string;
        static CAN_EXEC_EXPR: string;
        static defaultSettings: {
            tagName: string;
            className: string;
            attrs: {};
            html: string;
            executing: any;
            visibleWhen: any;
            ngIfExpressions: any[];
            canExecute: any;
        };
        public settings: any;
        constructor(defSettings: any, settings: any);
        public getTemplate(opts: any): any;
        public executing(scope: any): void;
        public executed(scope: any): void;
        public canExecute(scope: any): any;
        public execute(scope: any): void;
    }
}
