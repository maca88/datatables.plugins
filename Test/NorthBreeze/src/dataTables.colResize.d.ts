declare module dt {
    class ColResize {
        static defaultSettings: {
            minWidth: number;
            maxWidth: any;
            fixedLayout: boolean;
            fixedHeader: any;
            dblClick: string;
        };
        private settings;
        private tableSize;
        private initialized;
        private dt;
        private dom;
        constructor(api: any, settings: any);
        public initialize(): void;
        private setupColumn(col);
        private setupFixedHeader();
        private memorizeFixedHeaderNodes();
        private getVisibleColumn(idx);
        private updateTableSize();
        private proportionallyColumnSizing();
        private getColumnIndex(col);
        private getColumnEvent(th, type, ns);
        private loadState(data);
        private saveState(data);
        private registerCallbacks();
        private setTablesLayout(value);
        private fixFootAndHeadTables(e?);
        private onDraw(e?);
        private getTableAutoColWidths(table, types);
        private updateColumnsAutoWidth(types);
        private overrideClickHander(col, $th);
        private onDblClick(e, $th, col);
        private onMouseDown(e, col);
        public resize(col: any, width: any): boolean;
        private beforeResizing(col);
        private afterResizing();
        private onMouseUp(e, col);
        private canResizeColumn(col, newWidth);
        private getColumnMaxWidth(col);
        private getColumnMinWidth(col);
        private getPrevResizableColumnIdx(col, moveLength);
        private getNextResizableColumnIdx(col, moveLength);
        private resizeColumn(col, startWidth, moveLength, lastMoveLength);
        private onMouseMove(e, col);
        private destroy();
    }
    class ColResizeHelper {
        private static fakeEl;
        static indexOf(arr: any, item: any, equalFun?: any): number;
    }
}
