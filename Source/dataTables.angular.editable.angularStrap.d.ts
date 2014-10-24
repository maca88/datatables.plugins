declare module dt.editable.angularStrap {
    class DisplayServicePopoverCellValidationPlugin implements IDisplayServiceCellValidationPlugin {
        public setupColumnTemplate(opts: IColumnTemplateSetupArgs): void;
        public mergeErrors(errors: ValidationError[]): string;
    }
    class DisplayServicePopoverRowValidationPlugin implements IDisplayServiceRowValidationPlugin {
        public setupRowTemplate(args: IRowTemplateSetupArgs): void;
        public mergeErrors(errors: ValidationError[]): string;
    }
    class DisplayServiceEditTypePlugin implements IDisplayServiceEditTypePlugin {
        public displayService: IDisplayService;
        static $inject: string[];
        constructor(displayService: any);
        public selectControl(event: any, cell: any, col: any): boolean;
        public cellPostLink(args: ICellPostLinkArgs): void;
        public canBlurCell(event: any, cell: any, col: any): boolean;
        public getSupportedTypes(): string[];
        public dispose(): void;
        public getEditTemplateForType(type: any, col: any): string;
        private getDateTimeTemplate(attrs, opts);
        private getDateTemplate(attrs, opts);
        private getTimeTemplate(attrs, opts);
    }
}
