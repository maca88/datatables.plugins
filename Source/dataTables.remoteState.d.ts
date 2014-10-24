declare module dt {
    class RemoteState {
        static defaultSettings: {
            storeId: any;
            defaultState: string;
            currentState: any;
            minStateLength: number;
            defaultTableState: string;
            states: any;
            getStatesFromServer: boolean;
            sendCurrentStateToServer: any;
            dom: {
                inputWidth: string;
                stateSelectClass: string;
                setDefaultButton: {
                    className: string;
                    icon: string;
                };
                settingButton: {
                    className: string;
                    icon: string;
                };
                removeButton: {
                    className: string;
                    icon: string;
                };
                saveButton: {
                    className: string;
                    icon: string;
                };
                removeForm: {
                    className: string;
                    groupClass: string;
                    labelClass: string;
                    selectDivClass: string;
                };
                saveForm: {
                    className: string;
                    inputClass: string;
                    groupClass: string;
                    labelClass: string;
                    selectDivClass: string;
                };
            };
            language: {
                'settings': string;
                'default': string;
                'load': string;
                'save': string;
                'add': string;
                'remove': string;
                'setDefault': string;
                'createNew': string;
                'state': string;
            };
            settingsDisplayAction: any;
            ajax: {
                getAll: {
                    url: any;
                    type: string;
                    beforeSendAction: any;
                    doneAction: any;
                    failAction: any;
                };
                save: {
                    url: any;
                    type: string;
                    beforeSendAction: any;
                    doneAction: any;
                    failAction: any;
                };
                remove: {
                    url: any;
                    type: string;
                    beforeSendAction: any;
                    doneAction: any;
                    failAction: any;
                };
                setDefault: {
                    url: any;
                    type: string;
                    beforeSendAction: any;
                    doneAction: any;
                    failAction: any;
                };
            };
        };
        private settings;
        public dt: {
            settings: any;
            api: any;
        };
        public initialized: boolean;
        public dom: {
            stateSelects: any[];
            container: any;
            settingsContainer: any;
            background: any;
            settingButton: any;
            setDefaultButton: any;
            stateSelect: any;
            removeButton: any;
            saveButton: any;
        };
        constructor(api: any, settings: any);
        private addState(name, data, mainOnly?, selected?);
        private createDomElements();
        public initialize(): void;
        private hideTableWrapper();
        private showTableWrapper();
        private registerCallbacks();
        private setServerParams(data);
        private getTranslation(key, prefix?);
        private createRequest(settings, data, doneAction, failAction);
        private createSelectStates(excludeDefault?);
        private getState(name);
        private generateStateData(settings);
        private saveState(storeId, name, requestSettings, doneAction, failAction);
        private setDefaultStateData();
        private loadState(state, dtInitialized);
        private getRemoteStates();
        private setDefaultState(name);
        private removeState(name);
    }
}
