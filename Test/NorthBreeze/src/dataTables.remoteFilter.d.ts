declare module dt {
    interface IRemoteFilterAdapter {
        getEntityManager(settings: any): any;
        getResultEntityType(settings: any): any;
        executeQuery(query: any, start: any, length: any, data: any, successCallback: any, errorCallback: any): void;
        processQuery(eManager: any, query: any, start: any, length: any, data: any, extraData: any): any;
        getEntityPropertiesMap(entityType?: any): any;
    }
    class BreezeRemoteFilterAdapter implements IRemoteFilterAdapter {
        private dt;
        private settings;
        private static cloneBreezeQuery(that);
        constructor(api: any, settings: any);
        public getEntityManager(settings: any): any;
        public getResultEntityType(settings: any): any;
        public processQuery(eManager: any, query: any, start: any, length: any, data: any, extraData: any): any;
        public executeQuery(query: any, start: any, length: any, data: any, successCallback: any, errorCallback: any): void;
        public getEntityPropertiesMap(entityType?: any): {};
    }
    class JayDataRemoteFilterAdapter implements IRemoteFilterAdapter {
        private dt;
        private settings;
        constructor(api: any, settings: any);
        public getEntityManager(settings: any): any;
        public getResultEntityType(settings: any): any;
        public processQuery(eManager: any, query: any, start: any, length: any, data: any, extraData: any): any;
        private getExtraData(data);
        private prepareRequest(that, requestData, query, data);
        public executeQuery(query: any, start: any, length: any, data: any, successCallback: any, errorCallback: any): void;
        public getEntityPropertiesMap(entityType?: any): {};
    }
    class RemoteFilter {
        static defaultSettings: {
            adapter: any;
            prefetchPages: number;
            tracking: boolean;
            method: string;
            sendExtraData: boolean;
            encoding: any;
            query: any;
            entityManager: any;
            resultEntityType: any;
            projectOnlyTableColumns: boolean;
            beforeQueryExecution: any;
        };
        public settings: any;
        public initialized: boolean;
        public dt: {
            api: any;
            settings: any;
        };
        private cache;
        private adapterInstance;
        private initQuery;
        constructor(api: any, settings: any);
        private detectEntityPropertyTypes();
        private setupAdapter();
        public initialize(): void;
        private makeAjaxRequest(data, fn);
        private getDtResponse(response, data);
        private getCachedRequest(data);
        private getExtraData(data);
        private canGetDataFromCache(data);
        private customAjax(data, fn);
        private registerCallbacks();
    }
}
