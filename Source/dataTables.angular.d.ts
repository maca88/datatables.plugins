declare module dt {
    interface ICellCompileArgs {
        attr: any;
        html: any;
        column: any;
        node: any;
        cellIndex: number;
        rowIndex: number;
        dataFullPath: string;
    }
    interface ICellPostLinkArgs {
        scope: any;
        node: any;
        column: any;
        cellIndex: number;
        rowIndex: number;
    }
    interface IBlock {
        id: any;
        index: number;
        scope: any;
    }
    interface ICellPreLinkArgs extends ICellPostLinkArgs {
    }
    interface IRowPostLinkArgs {
        scope: any;
        node: any;
        hash: string;
        rowIndex: number;
        dataPath: number;
    }
    interface IRowPreLinkArgs extends IRowPostLinkArgs {
    }
    interface IRowCompileArgs {
        node: any;
        hash: string;
        rowIndex: number;
        dataPath: number;
    }
    interface IEventListener {
        condition?: Function;
        event: string;
        fn: Function;
        scope: any;
    }
    interface ITablePlugin {
        name: string;
        initialize(dtSettings: any): void;
        destroy(): void;
        getEventListeners(): IEventListener[];
    }
    interface ITableController {
        addEventListener(el: IEventListener): Function;
        removeEventListener(el: IEventListener): void;
        $attrs: any;
        settings: any;
        $scope: any;
        $element: JQuery;
    }
    interface IAttributeProcessor {
        isAttributeSupported(attrName: string): boolean;
        process(obj: any, attrName: string, attrVal: any, $node: JQuery): void;
    }
    interface IColumnAttributeProcessor extends IAttributeProcessor {
    }
    interface ITableAttributeProcessor extends IAttributeProcessor {
    }
    class TableController implements ITableController {
        static events: {
            cellCompile: string;
            cellPostLink: string;
            cellPreLink: string;
            rowCompile: string;
            rowPostLink: string;
            rowPreLink: string;
            tableCreating: string;
            tableCreated: string;
            blocksCreated: string;
        };
        static registerPlugin: (isEnabledFn: Function, pluginType: any) => void;
        static registerColumnAttrProcessor: (processor: IColumnAttributeProcessor) => void;
        static registerTableAttrProcessor: (processor: ITableAttributeProcessor) => void;
        static defaultSettings: {
            invalidateRows: string;
            digestOnDraw: boolean;
            debug: boolean;
            rowBinding: boolean;
            rowDataPath: string;
            options: {};
            collectionPath: any;
            defaultContent: string;
            tableCreating: any[];
            tableCreated: any[];
            rowsRemoved: any[];
            rowsAdded: any[];
            plugins: any[];
            columnAttrProcessors: any[];
            tableAttrProcessors: any[];
        };
        public dt: {
            api: any;
            settings: any;
        };
        public settings: any;
        public $scope: any;
        public $attrs: any;
        public $element: any;
        private $parse;
        private $templateCache;
        private $rootScope;
        private $injector;
        private $compile;
        private $http;
        private $q;
        private lastBlockMap;
        private templatesToLoad;
        private watchedProperties;
        private activePlugins;
        private declarativeHeader;
        private declarativeFooter;
        private eventListeners;
        static $inject: string[];
        constructor($parse: any, $scope: any, $element: any, $attrs: any, $transclude: any, $rootScope: any, $q: any, $http: any, $compile: any, $templateCache: any, $injector: any);
        static checkAngularModulePresence: (moduleName: any) => boolean;
        static executeSelector(selector: string, node: Node): JQuery;
        public addEventListener(el: IEventListener): Function;
        public removeEventListener(el: IEventListener): void;
        public setupTable(): void;
        private loadTemplates(onSuccess);
        private triggerEventListeners(name, params);
        private instantiatePlugins();
        private initializePlugins(dtSettings);
        private destroyActivePlugin(plugin);
        private initialize();
        private onCollectionChange(newValue);
        private destroy();
        private setupScope();
        private setupRowBinding();
        public preLinkRow(scope: any, row: any, attrs: any): void;
        public postLinkRow(scope: any, row: any, attrs: any): void;
        public preLinkCell(scope: any, $cellNode: any, $rowNode: any, attrs: any): void;
        public postLinkCell(scope: any, $cellNode: any, $rowNode: any, attrs: any): void;
        private digestDisplayedPage(api?);
        private mergeTableAttributes();
        private cloneOptions(options);
        private defineRowScopeProperties(scope, element);
        private mergeColumnAttributes();
        private mergeNodeAttributesToObject(node, obj, ignoreAttrs?);
        private fillWatchedProperties(row);
        private createRowWatcher(rowScope, node);
        private setupColumns();
    }
    class BaseAttributeProcessor implements IAttributeProcessor {
        public patterns: any[];
        constructor(patterns: any[]);
        public isAttributeSupported(attrName: string): boolean;
        public process(obj: any, attrName: string, attrVal: any, $node: JQuery): void;
        public getMatchedPattern(attrName: string): any;
    }
    class AngularHelper {
        private static uid;
        /**
        * A consistent way of creating unique IDs in angular.
        *
        * Using simple numbers allows us to generate 28.6 million unique ids per second for 10 years before
        * we hit number precision issues in JavaScript.
        *
        * Math.pow(2,53) / 60 / 60 / 24 / 365 / 10 = 28.6M
        *
        * @returns {number} an unique alpha-numeric string
        */
        static nextUid(): number;
        /**
        * Computes a hash of an 'obj'.
        * Hash of a:
        *  string is string
        *  number is number as string
        *  object is either result of calling $$dtHash function on the object or uniquely generated id,
        *         that is also assigned to the $$dtHash property of the object.
        *
        * @param obj
        * @returns {string} hash string such that the same input will have the same hash string.
        *         The resulting string key is in 'type:hashKey' format.
        */
        static hashKey(obj: any, nextUidFn?: any): string;
    }
}
