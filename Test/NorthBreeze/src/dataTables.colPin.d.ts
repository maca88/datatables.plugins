declare module dt {
    interface IColPinBindingAdapter {
        fixedColumnsDestroying(fixedColumns: any): void;
        fixedColumnsDestroyed(): void;
        fixedColumnsDraw(data: any): void;
        fixedColumnsCreated(fixedColumns: any): void;
    }
    class AngularColPinAdapter implements IColPinBindingAdapter {
        private dt;
        private settings;
        constructor(api: any, settings: any);
        public fixedColumnsDestroying(fixedColumns: any): void;
        public fixedColumnsDestroyed(): void;
        public fixedColumnsCreated(fixedColumns: any): void;
        public fixedColumnsDraw(data: any): void;
        private linkTable(table);
    }
    class ColPin {
        static defaultSettings: any;
        private settings;
        private initialized;
        private dt;
        private dom;
        public bindingAdapterInstance: IColPinBindingAdapter;
        constructor(api: any, settings: any);
        private setupAdapters();
        private setupBindingAdapter();
        private pinColumn(col, direction);
        private getColumnIndex(col);
        private incPinnedColumns(direction);
        private decPinnedColumns(direction);
        private getPinnedColumnsCount(direction?);
        private moveColumn(fromIndex, toIndex);
        private unpinColumn(col);
        private createPinIcon(pinned, col);
        private destroyFixedColumns();
        private createFixedColumns(settings);
        private saveState(data);
        public reset(): void;
        private repinColumns(data);
        private loadState(data);
        private registerCallbacks();
        public initialize(): void;
    }
}
