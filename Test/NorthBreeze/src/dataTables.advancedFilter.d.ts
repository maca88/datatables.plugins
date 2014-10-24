declare module dt {
    class AdvancedFilter {
        static defaultSettings: {
            operators: {
                types: {
                    'string': string[];
                    'number': string[];
                    'boolean': string[];
                    'date': string[];
                    'undefined': string[];
                };
                eq: {
                    fn: any;
                };
            };
            typesEditor: {
                'string': {
                    tag: string;
                    attr: {
                        type: string;
                    };
                    className: string;
                    customCreationFn: any;
                    setFilterValue: any;
                    getFilterValue: any;
                };
                'date': {
                    tag: string;
                    attr: {
                        type: string;
                    };
                    className: string;
                    getFilterValue: () => any;
                    setFilterValue: (date: any) => void;
                };
                'time': {
                    tag: string;
                    attr: {
                        type: string;
                    };
                    className: string;
                };
                'dateTime': {
                    tag: string;
                    attr: {
                        type: string;
                    };
                    className: string;
                };
                'number': {
                    tag: string;
                    attr: {
                        type: string;
                        step: string;
                    };
                    className: string;
                    getFilterValue: () => any;
                    setFilterValue: (num: any) => void;
                };
                'select': {
                    tag: string;
                    attr: {};
                    className: string;
                };
            };
            dom: {
                settingButtonDiv: {
                    className: string;
                };
                settingButton: {
                    buttonClass: string;
                    spanClass: string;
                };
                addGroupButton: {
                    buttonClass: string;
                    spanClass: string;
                };
                removeGroupButton: {
                    buttonClass: string;
                    spanClass: string;
                };
                addRuleButton: {
                    buttonClass: string;
                    spanClass: string;
                };
                removeRuleButton: {
                    buttonClass: string;
                    spanClass: string;
                };
                ruleOperatorSelect: {
                    className: string;
                };
                groupOperatorSelect: {
                    className: string;
                };
                columnSelect: {
                    className: string;
                };
                columnFilterIcon: {
                    className: string;
                };
                filterButton: {
                    className: string;
                };
                clearButton: {
                    className: string;
                };
            };
            language: {
                'all': string;
                'filter': string;
                'clear': string;
                'and': string;
                'or': string;
                'columnFilter': string;
                'filterFor': string;
                'removeGroup': string;
                'removeRule': string;
                'addGroup': string;
                'addRule': string;
                'filterSettings': string;
                'operators': {
                    'nl': string;
                    'nn': string;
                    'eq': string;
                    'ne': string;
                    'co': string;
                    'nc': string;
                    'sw': string;
                    'ew': string;
                    'lt': string;
                    'le': string;
                    'gt': string;
                    'ge': string;
                };
            };
            stateData: any;
            getDefaultFilterEditor: (settings: any, column: any) => any;
            getDefaultColumnOperators: (settings: any, column: any) => any;
            createFilterEditor: any;
            filterEditorCreated: any;
            ruleRemoving: any;
            remoteAdapter: any;
        };
        public settings: any;
        public dt: any;
        public dom: {
            modal: {
                id: any;
                content: any;
                header: any;
                body: any;
                footer: any;
                container: any;
            };
            globalFilter: {
                container: any;
                button: any;
            };
        };
        public filterDefaultSettings: {
            columns: any;
            data: any;
            group: {
                table: {
                    css: {};
                    columnHeader: boolean;
                };
                add: boolean;
                remove: boolean;
                visible: boolean;
            };
            rule: {
                add: boolean;
                initAdd: boolean;
                remove: boolean;
                initRemove: boolean;
                table: {
                    css: {};
                };
                columnSelect: {
                    separateRow: boolean;
                    colSpan: number;
                    attr: {};
                    css: {};
                };
                operatorSelect: {
                    separateRow: boolean;
                    colSpan: number;
                    attr: {};
                    css: {};
                };
                filterInput: {
                    separateRow: boolean;
                    colSpan: number;
                    attr: {};
                    css: {};
                };
                removeButton: {
                    separateRow: boolean;
                    colSpan: number;
                    attr: {};
                    css: {};
                };
            };
        };
        public initialized: boolean;
        private stateData;
        private columnsByOrigData;
        private remoteAdapterInstance;
        constructor(api: any, settings: any);
        private createDomElements();
        private registerCallbacks();
        public initialize(): void;
        private saveGlobalFilterState();
        private populateGlobalFilter();
        private clearGlobalFilterState();
        private getTranslation(key, prefix?);
        private closeAllColumnFilters();
        private addActiveGlobalFilterClass();
        private removeActiveGlobalFilterClass();
        private addActiveColumnClass(colOpts);
        private removeActiveColumnClass(colOpts);
        private saveColumnFilterState(colOpts, columnFilterDiv, state?);
        private clearColumnFilterState(colOpts, columnFilterDiv);
        private populateColumnFilter(colOpts, columnFilterDiv);
        private getOperators(column);
        private drawColumnFilters();
        private createFilters(opts);
        private createGroup(opts, data, init);
        private createGroupRow(opts, groupObject);
        private createHeaderRow(opts, data, init);
        private createFilterRow(opts, idx, rule, data);
        private createColumnSelect(opts, selectedValue);
        private createColumnOption(column, selected);
        private createRemoveGroupButton();
        private createAddGroupButton(opts);
        private createAddRuleButton(opts, data);
        private createRemoveRuleButton();
        private createOperatorSelect(opts, column, selectedValue);
        private createOperatorOption(operator, selected);
        private createFilterInput(column, operator, value);
        private addDefaultOption(select, selected?);
        private isColumnFilterable(col);
        private getOrigColumnIndex(currIdx);
        private getColumnData(column);
        private loadState(s, data);
        private getDefaultGroupState();
        private saveState(s, data);
        private setServerParams(data);
        private groupToObject(group);
        private filtersToJson(elem);
    }
    interface IAdvancedFilterAdapter {
        filter(query: any, data: any): any;
    }
    class JayDataAdvancedFilterAdapter implements IAdvancedFilterAdapter {
        private dt;
        private settings;
        private paramIdx;
        constructor(api: any, settings: any);
        public filter(query: any, data: any): any;
        private getRulePredicate(name, op, value);
        private getGroupPredicate(groupData);
    }
    class BreezeAdvancedFilterAdapter implements IAdvancedFilterAdapter {
        private dt;
        private settings;
        constructor(api: any, settings: any);
        public filter(query: any, data: any): any;
        private getRulePredicate(name, op, value);
        private getGroupPredicate(groupData, clientToServerNameFn);
    }
}
