declare module dt.editable.breeze {
    class DataService extends DefaultDataSerice {
        static $inject: string[];
        constructor(api: any, settings: any, i18Service: any);
        public removeItems(items: any[]): any[];
        public restoreRemovedItems(): any[];
        public rejectItems(items: any[]): any[];
        public validateItem(row: any): ValidationError[];
        public validateItemProperty(column: any, row: any): ValidationError[];
        private validateEntityProperty(column, entity);
        private getEntityByPath(entity, fullpath);
    }
}
