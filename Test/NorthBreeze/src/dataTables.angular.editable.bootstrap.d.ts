declare module dt.editable.bootstrap {
    class DisplayServiceStylePlugin implements IDisplayServiceStylePlugin {
        public setupColumnTemplate(args: IColumnTemplateSetupArgs): void;
        public setupRowTemplate(args: IRowTemplateSetupArgs): void;
    }
    class BootstrapEditCommand extends BaseEditCommand {
        static alias: string;
        static $inject: string[];
        constructor(settings: any);
    }
    class BootstrapIconEditCommand extends BaseEditCommand {
        static alias: string;
        static $inject: string[];
        constructor(settings: any);
    }
    class BootstrapRemoveCommand extends BaseRemoveCommand {
        static alias: string;
        static $inject: string[];
        constructor(settings: any);
    }
    class BootstrapIconRemoveCommand extends BaseRemoveCommand {
        static alias: string;
        static $inject: string[];
        constructor(settings: any);
    }
    class BootstrapRejectCommand extends BaseRejectCommand {
        static alias: string;
        static $inject: string[];
        constructor(settings: any);
    }
    class BootstrapIconRejectCommand extends BaseRejectCommand {
        static alias: string;
        static $inject: string[];
        constructor(settings: any);
    }
}
