declare module dt.editable.uiBootstrap {
    class DisplayServicePopoverCellValidationPlugin implements IDisplayServiceCellValidationPlugin {
        public setupColumnTemplate(opts: IColumnTemplateSetupArgs): void;
        public mergeErrors(errors: ValidationError[]): string;
    }
    class DisplayServicePopoverRowValidationPlugin implements IDisplayServiceRowValidationPlugin {
        public setupRowTemplate(args: IRowTemplateSetupArgs): void;
        public mergeErrors(errors: ValidationError[]): string;
    }
}
