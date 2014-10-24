declare module dt {
    class FormFilter {
        static defaultSettings: {
            formSelectors: any[];
            getFormData: (form: any) => any;
            setFormData: (form: any, data: any) => void;
            mergeFormData: (data: any, fData: any) => any;
            resetForm: (form: any) => void;
            clientFilter: any;
        };
        public settings: any;
        public initialized: boolean;
        public dt: {
            api: any;
            settings: any;
        };
        public currentFormsData: any;
        constructor(api: any, settings: any);
        private registerCallbacks();
        private saveState(data);
        private loadState(data);
        public resetForms(): void;
        public setFormsData(data: any): void;
        public getFormsData(separateForms?: boolean): any;
        private executeSelector(selector);
        private setServerParams(data);
        public initialize(): void;
        private setupForms();
    }
}
