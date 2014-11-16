var dt;
(function (dt) {
    var BreezeRemoteFilterAdapter = (function () {
        function BreezeRemoteFilterAdapter(api, settings) {
            this.dt = {
                api: null,
                settings: null
            };
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
        }
        BreezeRemoteFilterAdapter.prototype.getEntityManager = function (settings) {
            return settings.entityManager || settings.query.entityManager;
        };

        BreezeRemoteFilterAdapter.prototype.getResultEntityType = function (settings) {
            return settings.resultEntityType || settings.query.resultEntityType;
        };

        BreezeRemoteFilterAdapter.prototype.processQuery = function (eManager, query, start, length, data, extraData) {
            //var clientToServerNameFn = eManager.metadataStore.namingConvention.clientPropertyNameToServer;
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
            $.each(data.columns, function (i, column) {
                if (!column.data || $.type(column.data) === 'number')
                    return;

                var serverSideName = column.data;
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
            $.each(data.order, function (i, ord) {
                var column = data.columns[ord.column];
                if (!column.data || $.type(column.data) === 'number')
                    return;
                var serverSideName = column.data;
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

            if (extraData)
                params['$data'] = extraData;
            if (this.settings.method !== 'GET')
                params['$method'] = this.settings.method;
            if (this.settings.encoding != null)
                params['$encoding'] = this.settings.encoding;

            if (Object.keys(params).length > 0)
                query = query.withParameters(params);

            if (!this.settings.tracking)
                query = query.noTracking();

            return query.skip(start).take(length).inlineCount();
        };

        BreezeRemoteFilterAdapter.prototype.executeQuery = function (query, start, length, data, successCallback, errorCallback) {
            query.execute().then(function (json) {
                successCallback(json);
            }).catch(function (error) {
                errorCallback(error);
            });
        };

        BreezeRemoteFilterAdapter.prototype.getEntityPropertiesMap = function (entityType) {
            var propMap = {};
            if (!entityType) {
                var resultEntityType = this.settings.resultEntityType;
                if (!resultEntityType)
                    return propMap;
                entityType = $.type(resultEntityType) === 'string' ? this.settings.entityManager.metadataStore.getEntityType(resultEntityType, true) : resultEntityType;
            }
            if (!entityType)
                return propMap;

            var properties = entityType.getProperties();
            $.each(properties, function (i, prop) {
                var type = null;
                var isEntityType = false;
                if (prop.dataType) {
                    type = prop.dataType;
                } else if (prop.entityType) {
                    type = prop.entityType;
                    isEntityType = true;
                }
                propMap[prop.name] = {
                    type: type,
                    isEntityType: isEntityType
                };
            });
            return propMap;
        };
        return BreezeRemoteFilterAdapter;
    })();
    dt.BreezeRemoteFilterAdapter = BreezeRemoteFilterAdapter;

    var JayDataRemoteFilterAdapter = (function () {
        function JayDataRemoteFilterAdapter(api, settings) {
            this.dt = {
                api: null,
                settings: null
            };
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
        }
        JayDataRemoteFilterAdapter.prototype.getEntityManager = function (settings) {
            return settings.entityManager || settings.query.entityContext;
        };

        JayDataRemoteFilterAdapter.prototype.getResultEntityType = function (settings) {
            return settings.resultEntityType || settings.query.defaultType;
        };

        JayDataRemoteFilterAdapter.prototype.processQuery = function (eManager, query, start, length, data, extraData) {
            //Example: select("{ i: it.Id, t: it.Title }")
            var pIdx = 0;
            var select = "";
            var columnPredicatesParams = {};
            var columnPredicatesExprs = [];
            var globalPredicatesParams = {};
            var globalPredicatesExprs = [];

            //Columns
            $.each(data.columns, function (i, column) {
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
            $.each(data.order, function (i, ord) {
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
                $.each(globalPredicatesExprs, function (i, predicate) {
                    if (i != 0)
                        gFilter += " || ";
                    gFilter += predicate;
                });
                query = query.filter(gFilter, globalPredicatesParams);
            }

            //columnPredicates.push(breeze.Predicate.or(globalPredicates));
            if (columnPredicatesExprs.length > 0) {
                var cFilter = "";
                $.each(columnPredicatesExprs, function (i, predicate) {
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
        };

        JayDataRemoteFilterAdapter.prototype.getExtraData = function (data) {
            if (this.settings.sendExtraData === false)
                return null;
            return $.isFunction(this.settings.sendExtraData) ? this.settings.sendExtraData.call(this, data) : data;
        };

        JayDataRemoteFilterAdapter.prototype.prepareRequest = function (that, requestData, query, data) {
            var url = that.providerConfiguration.serviceUrl;
            var host = that.providerConfiguration.oDataServiceHost;
            var queryText = requestData[0].requestUri.substring(url.length + host.length);
            var queryText2 = query.toTraceString().queryText;
            if (queryText == queryText2) {
                requestData[0].method = this.settings.method;
                if (this.settings.sendExtraData) {
                    var extraData = this.getExtraData(data);
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
        };

        JayDataRemoteFilterAdapter.prototype.executeQuery = function (query, start, length, data, successCallback, errorCallback) {
            var _this = this;
            var that = this;
            var eManager = this.settings.entityManager;

            query = query.skip(start).take(length);
            eManager.prepareRequest = function (rData) {
                that.prepareRequest(this, rData, query, data);
            };

            query.toArray({
                success: function (json) {
                    if (_this.settings.tracking) {
                        for (var i = 0; i < json.length; i++) {
                            json[i] = eManager.attachOrGet(json[i]);
                        }
                    }
                    successCallback({ results: json, inlineCount: json.totalCount });
                },
                error: function (error) {
                    errorCallback(error);
                }
            });
        };

        JayDataRemoteFilterAdapter.prototype.getEntityPropertiesMap = function (entityType) {
            var propMap = {};
            if (!entityType) {
                var resultEntityType = this.settings.resultEntityType;
                if (!resultEntityType)
                    return propMap;
                entityType = $.type(resultEntityType) === 'string' ? this.settings.entityManager.getDataType(resultEntityType).elementType : resultEntityType;
            }
            if (!entityType)
                return propMap;

            var fieldNames = entityType.getFieldNames();
            $.each(fieldNames, function (ii, fName) {
                var type = null;
                var member = entityType.getMemberDefinition(fName);
                var isEntityType = false;
                if ($.isArray(member.dataType.baseTypes) || (member.elementType && $.isArray(member.elementType.baseTypes))) {
                    var dataType = member.elementType ? member.elementType : member.dataType;
                    for (var i = 0; i < dataType.baseTypes.length; i++) {
                        if (dataType.baseTypes[i] !== $data.Entity)
                            continue;
                        isEntityType = true;
                        type = dataType;
                    }
                } else if (member.dataType) {
                    type = member.dataType;
                }
                propMap[member.name] = {
                    type: type,
                    isEntityType: isEntityType
                };
            });
            return propMap;
        };
        return JayDataRemoteFilterAdapter;
    })();
    dt.JayDataRemoteFilterAdapter = JayDataRemoteFilterAdapter;

    var RemoteFilter = (function () {
        function RemoteFilter(api, settings) {
            this.initialized = false;
            this.dt = {
                api: null,
                settings: null
            };
            this.cache = {
                lastRequest: null,
                lower: -1,
                upper: null,
                lastResponse: null,
                clear: false,
                extraData: null
            };
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
        RemoteFilter.prototype.detectEntityPropertyTypes = function () {
            var _this = this;
            var baseEntityPropMap = this.adapterInstance.getEntityPropertiesMap();

            $.each(this.dt.settings.aoColumns, function (i, col) {
                if (col.sType)
                    return;
                if ($.type(col.mData) !== 'string') {
                    col.bSearchable = col.searchable = false;
                    return;
                }
                var paths = col.mData.split('.');
                var type = null;
                var currPropMap = baseEntityPropMap;

                //mData can be Id, Order.Id, Orders[0].Id
                $.each(paths, function (idx, str) {
                    var path = str.replace(/(.*)(\[.*\])/i, '$1');
                    var prop = currPropMap[path];
                    if (!prop)
                        return;
                    if (!prop.isEntityType)
                        type = prop.type.name;
                    else {
                        currPropMap = _this.adapterInstance.getEntityPropertiesMap(prop.type);
                    }
                });
                if (!type)
                    col.bSearchable = col.searchable = false;
                col._sManualType = col.sType = col.type = type;
            });
        };

        RemoteFilter.prototype.setupAdapter = function () {
            if (this.settings.adapter)
                return;
            if (window.hasOwnProperty("breeze") && window.hasOwnProperty("$data"))
                throw 'adapter must be specified';
            if (window.hasOwnProperty("breeze"))
                this.settings.adapter = dt.BreezeRemoteFilterAdapter;
            if (window.hasOwnProperty("$data"))
                this.settings.adapter = dt.JayDataRemoteFilterAdapter;
        };

        RemoteFilter.prototype.initialize = function () {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'remoteFilterInitCompleted', 'remoteFilterInitCompleted', [this]);
        };

        RemoteFilter.prototype.makeAjaxRequest = function (data, fn) {
            var _this = this;
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

            var extraData = this.getExtraData(data);
            var query = this.adapterInstance.processQuery(this.settings.entityManager, this.settings.query, requestStart, requestLength, data, extraData);
            this.cache.lastRequest = this.getCachedRequest(data);
            this.cache.extraData = JSON.stringify(extraData);

            if ($.isFunction(this.settings.beforeQueryExecution))
                query = this.settings.beforeQueryExecution.call(this, query, data);

            this.adapterInstance.executeQuery(query, requestStart, requestLength, data, function (json) {
                var response = {
                    data: json.results,
                    draw: data.draw,
                    recordsTotal: json.inlineCount,
                    recordsFiltered: json.inlineCount
                };
                _this.cache.lastResponse = response;
                fn(_this.getDtResponse(response, data));
            }, function (error) {
                throw error;
            });
        };

        RemoteFilter.prototype.getDtResponse = function (response, data) {
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
        };

        //Return a deep clone of the request with removed properties that we want to ignore
        RemoteFilter.prototype.getCachedRequest = function (data) {
            var cache = $.extend(true, {}, data);
            delete cache['draw'];
            delete cache['start'];
            delete cache['length'];
            return cache;
        };

        RemoteFilter.prototype.getExtraData = function (data) {
            if (this.settings.sendExtraData === false)
                return null;
            return $.isFunction(this.settings.sendExtraData) ? this.settings.sendExtraData.call(this, data) : data;
        };

        RemoteFilter.prototype.canGetDataFromCache = function (data) {
            var dataEnd = data.start + data.length;
            var currentRequest = this.getCachedRequest(data);
            var extraData = this.getExtraData(data);
            return !this.cache.clear && this.cache.lower >= 0 && data.start >= this.cache.lower && dataEnd <= this.cache.upper && this.cache.extraData === JSON.stringify(extraData) && JSON.stringify(currentRequest) === JSON.stringify(this.cache.lastRequest);
        };

        RemoteFilter.prototype.customAjax = function (data, fn) {
            if (this.canGetDataFromCache(data)) {
                var json = this.getDtResponse(this.cache.lastResponse, data);
                fn(json);
            } else {
                this.cache.clear = false;
                this.makeAjaxRequest(data, fn);
            }
        };

        RemoteFilter.prototype.registerCallbacks = function () {
        };
        RemoteFilter.defaultSettings = {
            adapter: null,
            prefetchPages: 1,
            tracking: true,
            method: 'GET',
            sendExtraData: false,
            encoding: null,
            query: null,
            entityManager: null,
            resultEntityType: null,
            projectOnlyTableColumns: false,
            beforeQueryExecution: null
        };
        return RemoteFilter;
    })();
    dt.RemoteFilter = RemoteFilter;
})(dt || (dt = {}));

(function (window, document, undefined) {
    //Register events
    $.fn.DataTable.models.oSettings.remoteFilterInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.register('remoteFilter.init()', function (settings) {
        var remoteFilter = new dt.RemoteFilter(this, settings);
        if (this.settings()[0]._bInitComplete)
            remoteFilter.initialize();
        else
            this.one('init.dt', function () {
                remoteFilter.initialize();
            });

        return null;
    });

    $.fn.DataTable.Api.register('remoteFilter.reload()', function (callback, resetPaging, force) {
        var remoteFilter = this.settings()[0].remoteFilter;
        if (!remoteFilter)
            throw 'remoteFilter is not initilaized';
        remoteFilter.cache.clear = force === true;
        this.ajax.reload(callback, resetPaging);
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().remoteFilter.init(oSettings.oInit.remoteFilter);
        },
        "cFeature": "F",
        "sFeature": "RemoteFilter"
    });
}(window, document, undefined));
