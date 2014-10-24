declare module dt.editable.uiSelect2 {
    class DisplayServiceEditTypePlugin implements IDisplayServiceEditTypePlugin {
        public displayService: IDisplayService;
        static $inject: string[];
        constructor(displayService: any);
        public getSupportedTypes(): string[];
        public dispose(): void;
        public selectControl(event: any, cell: any, col: any): boolean;
        public canBlurCell(event: any, cell: any, col: any): boolean;
        public cellPostLink(args: ICellPostLinkArgs): void;
        public getEditTemplateForType(type: any, col: any): string;
    }
    class ColumnAttributeProcessor extends BaseAttributeProcessor implements IColumnAttributeProcessor {
        constructor();
        public process(column: any, attrName: string, attrVal: any, $node: JQuery): void;
    }
}
