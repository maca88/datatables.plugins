(function(window, document, undefined) {

    var defaultSettings = {
        query: null, //breeze.EntityQuery
        entityManager: null, //breeze.EntityManager
        resultEntityType: null, //breeze.EntityType or string (optional, used for automaticaly detect types, alternatively can be passed by toType function of breeze.EntityType)
        projectOnlyTableColumns: false,
        beforeQueryExecution: null //function
    };

    function customAjax(data, fn, oSettings) {
        var settings = oSettings.breezeRemote;
        var manager = settings.entityManager;
        var query = settings.query;
        var clientToServerNameFn = manager.metadataStore.namingConvention.clientPropertyNameToServer;

        //Clear query params
        query.orderByClause = null;
        query.parameters = {};
        query.wherePredicate = null;
        query.selectClause = null;

        var select = "";
        var order = "";
        var columnPredicates = [];
        var globalPredicates = [];

        //Columns
        $.each(data.columns, function (i, column) {
            if (!column.data || $.type(column.data) === 'number')
                return;

            var serverSideName = clientToServerNameFn(column.data);

            select += serverSideName + ",";

            if (!column.searchable)
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
            var col = data.columns[ord.column];
            if (!col.data)
                return;
            var serverSideName = clientToServerNameFn(col.data);
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
        if (settings.projectOnlyTableColumns === true)
            query = query.select(select);

        if ($.isFunction(settings.beforeQueryExecution))
            query = settings.beforeQueryExecution.call(oSettings, query, data);

        query.skip(data.start).take(data.length).inlineCount().execute().then(function (json) {
            var draw = parseInt(data.draw);
            var dtJson = {
                data: json.results,
                draw: ++draw,
                recordsTotal: json.inlineCount,
                recordsFiltered: json.inlineCount
            };

            fn(dtJson);
        }).catch(function (error) {
            throw error;
        });
    }


    function getEntityPropertiesMap(entityType) {
        var propMap = {};
        var properties = entityType.getProperties();
        $.each(properties, function (i, prop) {
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

    function detectEntityPropertyTypes(oSettings, settings) {
        var resultEntityType = settings.resultEntityType || settings.query.resultEntityType;
        if (!resultEntityType) return;
        var entityType = $.type(resultEntityType) === 'string'
                ? settings.entityManager.metadataStore.getEntityType(resultEntityType, true)
                : resultEntityType;
        if (!entityType) return;

        var baseEntityPropMap = getEntityPropertiesMap(entityType);

        $.each(oSettings.aoColumns, function(i, col) {
            if (col.sType) return; //Do not detect types if was passed on init
            if ($.type(col.mData) !== 'string') { //columns without mData are not searchable
                col.bSearchable = col.searchable = false;
                return;
            }
            var paths = col.mData.split('.');
            var type = null;
            var currPropMap = baseEntityPropMap;
            //mData can be Id, Order.Id, Orders[0].Id
            $.each(paths, function () {
                var path = this.replace(/(.*)(\[.*\])/i, '$1'); //remove []
                var prop = currPropMap[path];
                if (!prop) return;
                if (!prop.isEntityType)
                    type = prop.type.name;
                else {
                    currPropMap = getEntityPropertiesMap(prop.type);
                }
            });
            if (!type)
                col.bSearchable = col.searchable = false;
            col.sType = col.type = type;
        });
    }

    $.fn.DataTable.Api.prototype.breezeRemote = function (settings) {
        var oSettings = this.settings()[0];
        settings = $.extend({}, defaultSettings, settings);

        oSettings.breezeRemote = settings; //save the settings so that others can use it (i.e. customAjax function)

        if (!settings.query)
            throw 'query property must be set for breezeRemote to work';

        settings.entityManager = settings.entityManager || settings.query.entityManager;
        if (settings.entityManager == null)
            throw "entity manager must be provided. Use EnitityQuery method 'using' or add a property entityManager in breezeRemote configuration";

        if (!oSettings.oInit.bServerSide && !oSettings.oInit.serverSide)
            throw 'serverSide option must be set to true for breezeRemote to work';

        oSettings.ajax = customAjax;
        detectEntityPropertyTypes(oSettings, settings);
        
        return null;
    };

    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().breezeRemote(oSettings.oInit.breezeRemote);
        },
        "cFeature": "F",
        "sFeature": "BreezeRemote"
    });
}(window, document, undefined));