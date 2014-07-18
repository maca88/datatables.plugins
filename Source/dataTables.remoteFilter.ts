module dt {

    export interface IRemoteFilterAdapter {
        getEntityManager(settings): any;
        getResultEntityType(settings): any;
        executeQuery(query, start, length, data, successCallback, errorCallback): void;
        processQuery(eManager, query, start, length, data): any;
        getEntityPropertiesMap(entityType?): any;
    }

    export class BreezeRemoteFilterAdapter implements IRemoteFilterAdapter {

        private dt={
            api: null,
            settings: null
        }
        private settings;

        constructor(api, settings) {
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
        }

        public getEntityManager(settings) {
            return settings.entityManager || settings.query.entityManager;
        }

        public getResultEntityType(settings) {
            return settings.resultEntityType || settings.query.resultEntityType;
        }

        public processQuery(eManager, query, start, length, data) {
            var clientToServerNameFn = eManager.metadataStore.namingConvention.clientPropertyNameToServer;
            var select = "";
            var order = "";
            var columnPredicates = [];
            var globalPredicates = [];

            //Clear query params TODO: CLONE
            query.orderByClause = null;
            query.parameters = {};
            query.wherePredicate = null;
            query.selectClause = null;

            //Columns
            $.each(data.columns, (i, column) => {
                if (!column.data || $.type(column.data) === 'number')
                    return;

                var serverSideName = clientToServerNameFn(column.data);
                select += serverSideName + ",";

                if (column.searchable === false)
                    return;

                //Column filter
                if (column.search.value != "") {
                    var colPred = breeze.Predicate.create(serverSideName, "contains", column.search.value);
                    columnPredicates.push(colPred);
                }

                //Global filter
                if (data.search.value != "") {
                    var globalPred = breeze.Predicate.create(serverSideName, "contains", data.search.value);
                    globalPredicates.push(globalPred);
                }
            });
            select = select.substring(0, select.length - 1); //remove the last ,

            //Order
            $.each(data.order, (i, ord) => {
                var column = data.columns[ord.column];
                if (!column.data || $.type(column.data) === 'number')
                    return;
                var serverSideName = clientToServerNameFn(column.data);
                var dir = ord.dir == "desc" ? " desc" : "";
                order += serverSideName + dir + ",";
            });
            if (order.length > 0) {
                order = order.substring(0, order.length - 1); //remove the last ,
                query = query.orderBy(order);
            }

            //Predicates (join global predicates with OR and columns predicate with AND
            if (globalPredicates.length > 0)
                columnPredicates.push(breeze.Predicate.or(globalPredicates));
            if (columnPredicates.length > 0)
                query = query.where(breeze.Predicate.and(columnPredicates));

            //Pojection (If true then server results will be plain objects, not breeze.Entity-ies)
            if (this.settings.projectOnlyTableColumns === true)
                query = query.select(select);

            var params = {};

            if (this.settings.sendExtraData)
                params['$data'] = $.isFunction(this.settings.sendExtraData) ? this.settings.sendExtraData.call(this, data) : data;
            if (this.settings.method !== 'GET')
                params['$method'] = this.settings.method;
            if (this.settings.encoding != null)
                params['$encoding'] = this.settings.encoding;

            if (Object.keys(params).length > 0)
                query = query.withParameters(params);

            if (!this.settings.tracking)
                query = query.noTracking();

            return query.skip(start)
                .take(length)
                .inlineCount();
        }

        public executeQuery(query, start, length, data, successCallback, errorCallback) {
            query.execute()
                .then((json) => {
                    successCallback(json);
                }).catch((error) => {
                    errorCallback(error);
                });
        }

        public getEntityPropertiesMap(entityType?) {
            var propMap = {};
            if (!entityType) {
                var resultEntityType = this.settings.resultEntityType;
                if (!resultEntityType) return propMap;
                entityType = $.type(resultEntityType) === 'string'
                    ? this.settings.entityManager.metadataStore.getEntityType(resultEntityType, true)
                    : resultEntityType;
            }
            if (!entityType) return propMap;

            var properties = entityType.getProperties();
            $.each(properties, (i, prop) => {
                var type = null;
                var isEntityType = false;
                if (prop.dataType) {
                    type = prop.dataType;
                }
                else if (prop.entityType) {
                    type = prop.entityType;
                    isEntityType = true;
                }
                propMap[prop.name] = {
                    type: type,
                    isEntityType: isEntityType
                };
            });
            return propMap;
        }
    }

    export class JayDataRemoteFilterAdapter implements IRemoteFilterAdapter {

        private dt = {
            api: null,
            settings: null
        }
        private settings;

        constructor(api, settings) {
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
        }

        public getEntityManager(settings) {
            return settings.entityManager || settings.query.entityContext;
        }

        public getResultEntityType(settings) {
            return settings.resultEntityType || settings.query.defaultType;
        }

        public processQuery(eManager, query, start, length, data) {
            //Example: select("{ i: it.Id, t: it.Title }")
            var pIdx = 0;
            var select = "";
            var columnPredicatesParams = {};
            var columnPredicatesExprs = [];
            var globalPredicatesParams = {};
            var globalPredicatesExprs = [];

            //Columns
            $.each(data.columns, (i, column) => {
                if (!column.data || $.type(column.data) === 'number')
                    return;
                select += column.data + ": it." + column.data + ",";
                if (column.searchable === false)
                    return;
                
                //Column filter
                if (column.search.value != "") {
                    columnPredicatesParams['p' + pIdx] = column.search.value;
                    columnPredicatesExprs.push("it." + column.data + ".contains(this.p" + pIdx + ")");
                    pIdx++;
                }

                //Global filter
                if (data.search.value != "") {
                    globalPredicatesParams['p' + pIdx] = data.search.value;
                    globalPredicatesExprs.push("it." + column.data + ".contains(this.p" + pIdx + ")");
                    pIdx++;
                }
            });
            select = select.substring(0, select.length - 1); //remove the last ,

            //Order
            $.each(data.order, (i, ord) => {
                var column = data.columns[ord.column];
                if (!column.data || $.type(column.data) === 'number')
                    return;
                if (ord.dir == "desc")
                    query = query.orderByDescending("it." + column.data);
                else
                    query = query.orderBy("it." + column.data);
            });

            //Predicates (join global predicates with OR and columns predicate with AND
            if (globalPredicatesExprs.length > 0) {
                var gFilter = "";
                $.each(globalPredicatesExprs, (i, predicate) => {
                    if (i != 0)
                        gFilter += " || ";
                    gFilter += predicate;
                });
                query = query.filter(gFilter, globalPredicatesParams);
            }
                //columnPredicates.push(breeze.Predicate.or(globalPredicates));
            if (columnPredicatesExprs.length > 0) {
                var cFilter = "";
                $.each(columnPredicatesExprs, (i, predicate) => {
                    if (i != 0)
                        cFilter += " && ";
                    cFilter += predicate;
                });
                query = query.filter(cFilter, columnPredicatesParams);
            }

            //Pojection (If true then server results will be plain objects, not entity-ies)
            if (this.settings.projectOnlyTableColumns === true)
                query = query.map(select);

            if (!eManager.dtRemoteFilter) {
                eManager.origPrepRequest = eManager.prepareRequest;
                eManager.dtRemoteFilter = true;
            }

            return query.withInlineCount();
        }

        private prepareRequest(that, requestData, query, data) {
            var url = that.providerConfiguration.serviceUrl;
            var host = that.providerConfiguration.oDataServiceHost;
            var queryText = requestData[0].requestUri.substring(url.length + host.length);
            var queryText2 = query.toTraceString().queryText;
            if (queryText == queryText2) {
                requestData[0].method = this.settings.method;
                if (this.settings.sendExtraData) {
                    var extraData = $.isFunction(this.settings.sendExtraData) ? this.settings.sendExtraData.call(this, data) : data;
                    if (this.settings.method == 'GET') {
                        if (requestData[0].requestUri.indexOf('?') < 0)
                            requestData[0].requestUri += '?' + $.param(extraData);
                        else
                            requestData[0].requestUri += '&' + $.param(extraData);
                    } else {
                        requestData[0].data = $.extend(requestData[0].data || {}, extraData);
                    }
                }
            }

            if ($.isFunction(that.context.origPrepRequest))
                that.context.origPrepRequest.call(that, requestData);
        }

        public executeQuery(query, start, length, data, successCallback, errorCallback) {
            var that = this;
            var eManager = this.settings.entityManager;

            query = query.skip(start).take(length);
            eManager.prepareRequest = function (rData) {
                that.prepareRequest(this, rData, query, data);
            };

            query.toArray({
                success: (json) => {
                    if (this.settings.tracking) {
                        for (var i = 0; i < json.length; i++) {
                            json[i] = eManager.attachOrGet(json[i]);
                        }
                    }
                    successCallback({ results: json, inlineCount: json.totalCount});
                },
                error: (error) => {
                    errorCallback(error);
                }
            });
        }

        public getEntityPropertiesMap(entityType?) {
            var propMap = {};
            if (!entityType) {
                var resultEntityType = this.settings.resultEntityType;
                if (!resultEntityType) return propMap;
                entityType = $.type(resultEntityType) === 'string'
                    ? this.settings.entityManager.getDataType(resultEntityType).elementType
                    : resultEntityType;
            }
            if (!entityType) return propMap;
            
            var fieldNames = entityType.getFieldNames();
            $.each(fieldNames, (ii, fName) => {
                var type = null;
                var member = entityType.getMemberDefinition(fName);
                var isEntityType = false;
                if ($.isArray(member.dataType.baseTypes) || (member.elementType && $.isArray(member.elementType.baseTypes))) {
                    var dataType = member.elementType
                        ? member.elementType
                        : member.dataType;
                    for (var i = 0; i < dataType.baseTypes.length; i++) {
                        if (dataType.baseTypes[i] !== $data.Entity) continue;
                        isEntityType = true;
                        type = dataType;
                    }
                }
                else if (member.dataType) {
                    type = member.dataType;
                }
                propMap[member.name] = {
                    type: type,
                    isEntityType: isEntityType
                };
            });
            return propMap;
        }
    }

    export class RemoteFilter {

        public static defaultSettings = {
            adapter: null,
            prefetchPages: 1,
            tracking: true,
            method: 'GET',
            sendExtraData: false,
            encoding: null,
            query: null, //breeze.EntityQuery
            entityManager: null, //breeze.EntityManager
            resultEntityType: null, //breeze.EntityType or string (optional, used for automaticaly detect types, alternatively can be passed by toType function of breeze.EntityType)
            projectOnlyTableColumns: false,
            beforeQueryExecution: null //function
        };
        public settings;
        public initialized: boolean = false;
        public dt = {
            api: null,
            settings: null
        };
        private cache = {
            lastRequest: null,
            lower: -1,
            upper: null,
            lastResponse: null,
            clear: false,
        };
        private adapterInstance;
        private initQuery;

        constructor(api, settings) {
            this.settings = $.extend({}, RemoteFilter.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.registerCallbacks();
            this.dt.settings.remoteFilter = this; //save the settings so that others can use it (i.e. customAjax function)
            if (!this.dt.settings.oInit.bServerSide && !this.dt.settings.oInit.serverSide)
                throw 'serverSide option must be set to true for remoteFilter to work';
            if (!settings.query)
                throw 'query property must be set for remoteFilter to work';
            this.setupAdapter();
            
            this.adapterInstance = new this.settings.adapter(api, this.settings);
            this.settings.entityManager = this.adapterInstance.getEntityManager(this.settings);  
            this.settings.resultEntityType = this.adapterInstance.getResultEntityType(this.settings);
            if (this.settings.entityManager == null)
                throw "entity manager must be provided. For Breeze: Use EnitityQuery method 'using' or add a property entityManager in remoteFilter configuration";
            
            this.dt.settings.ajax = $.proxy(this.customAjax, this);
            this.detectEntityPropertyTypes();
        }

        private detectEntityPropertyTypes() {
            var baseEntityPropMap = this.adapterInstance.getEntityPropertiesMap();

            $.each(this.dt.settings.aoColumns, (i, col) => {
                if (col.sType) return; //Do not detect types if was passed on init
                if ($.type(col.mData) !== 'string') { //columns without mData are not searchable
                    col.bSearchable = col.searchable = false;
                    return;
                }
                var paths = col.mData.split('.');
                var type = null;
                var currPropMap = baseEntityPropMap;
                //mData can be Id, Order.Id, Orders[0].Id
                $.each(paths, (idx, str) => {
                    var path = str.replace(/(.*)(\[.*\])/i, '$1'); //remove []
                    var prop = currPropMap[path];
                    if (!prop) return;
                    if (!prop.isEntityType)
                        type = prop.type.name;
                    else {
                        currPropMap = this.adapterInstance.getEntityPropertiesMap(prop.type);
                    }
                });
                if (!type)
                    col.bSearchable = col.searchable = false;
                col._sManualType = col.sType = col.type = type;
            });
        }

        private setupAdapter() {
            if (this.settings.adapter) return;
            if (breeze !== undefined && $data != undefined)
                throw 'adapter must be specified';
            if (breeze !== undefined)
                this.settings.adapter = dt.BreezeRemoteFilterAdapter;
            if ($data != undefined)
                this.settings.adapter = dt.JayDataRemoteFilterAdapter;
        }

        public initialize() {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'remoteFilterInitCompleted', 'remoteFilterInitCompleted', [this]);
        }

        private makeAjaxRequest(data, fn) {
            var requestStart = data.start;
            var requestLength = data.length;

            if (requestStart < this.cache.lower) {
                requestStart -= (requestLength * (this.settings.prefetchPages - 1));
                if (requestStart < 0)
                    requestStart = 0;
            }
            this.cache.lower = requestStart;
            this.cache.upper = requestStart + (requestLength * this.settings.prefetchPages);
            requestLength = requestLength * this.settings.prefetchPages;

            var query = this.adapterInstance.processQuery(this.settings.entityManager, this.settings.query, requestStart, requestLength, data);
            this.cache.lastRequest = this.getCachedRequest(data);

            if ($.isFunction(this.settings.beforeQueryExecution))
                query = this.settings.beforeQueryExecution.call(this, query, data);

            this.adapterInstance.executeQuery(query, requestStart, requestLength, data,
                (json) => {
                    var response = {
                        data: json.results,
                        draw: data.draw,
                        recordsTotal: json.inlineCount,
                        recordsFiltered: json.inlineCount
                    };
                    this.cache.lastResponse = response;
                    fn(this.getDtResponse(response, data));
                }, (error) => {
                    throw error;
                });
        }

        private getDtResponse(response, data) {
            var copyData = response.data.slice(0);
            if (this.cache.lower != data.start)
                copyData.splice(0, data.start - this.cache.lower);
            copyData.splice(data.length, copyData.length);

            return {
                data: copyData,
                draw: data.draw,
                recordsTotal: response.recordsTotal,
                recordsFiltered: response.recordsFiltered
            };
        }

        //Return a deep clone of the request with removed properties that we want to ignore 
        private getCachedRequest(data) {
            var cache = $.extend(true, {}, data);
            delete cache['draw'];
            delete cache['start'];
            delete cache['length'];
            return cache;
        }

        private canGetDataFromCache(data): boolean {
            var dataEnd = data.start + data.length;
            var currentRequest = this.getCachedRequest(data);
            return !this.cache.clear &&
                this.cache.lower >= 0 &&
                data.start >= this.cache.lower &&
                dataEnd <= this.cache.upper &&
                JSON.stringify(currentRequest) === JSON.stringify(this.cache.lastRequest);
        }

        private customAjax(data, fn) {
            if (this.canGetDataFromCache(data)) {
                var json = this.getDtResponse(this.cache.lastResponse, data);
                fn(json);
            } else {
                this.cache.clear = false;
                this.makeAjaxRequest(data, fn);
            }
        }

        private registerCallbacks() {

        }
    }

}

(function (window, document, undefined) {

    //Register events
    $.fn.DataTable.models.oSettings.remoteFilterInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.register('remoteFilter.init()', function (settings) {
        var remoteFilter = new dt.RemoteFilter(this, settings);
        if (this.settings()[0]._bInitComplete)
            remoteFilter.initialize();
        else
            this.one('init.dt', () => { remoteFilter.initialize(); });

        return null;
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().remoteFilter.init(oSettings.oInit.remoteFilter);
        },
        "cFeature": "F",
        "sFeature": "RemoteFilter"
    });

} (window, document, undefined));