declare module dt.editable.datetimepicker {
    class DisplayServiceEditTypePlugin implements IDisplayServiceEditTypePlugin {
        private displayService;
        private $timeout;
        private $locale;
        static $inject: string[];
        constructor(displayService: IDisplayService, $timeout: any, $locale: any);
        public selectControl(event: any, cell: any, col: any): boolean;
        public cellPostLink(args: ICellPostLinkArgs): void;
        public canBlurCell(event: any, cell: any, col: any): boolean;
        public getSupportedTypes(): string[];
        public dispose(): void;
        public getEditTemplateForType(type: any, col: any): string;
    }
}
