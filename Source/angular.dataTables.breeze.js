angular.module("dt").config([
    "dtSettings", function (dtSettings) {
        dtSettings.dtTableCreatingCallbacks.push(function ($element, options, scope, attrs, $compile) {
            var breezeOpts = options.breeze;
            if (breezeOpts != null) {
                options.serverSide = true;
                var query = breezeOpts.query;
                var manager = breezeOpts.entityManager || query.entityManager;
                if (manager == null)
                    throw "entity manager must be provided. Use EnitityQuery method 'using' or by adding a property with name entityManager in breeze configuration in datatables";

                var clientToServerNameFn = manager.metadataStore.namingConvention.clientPropertyNameToServer;

                options.ajax = function (data, fn, oSettings) {
                    query.orderByClause = null;
                    query.parameters = {};
                    query.wherePredicate = null;
                    query.selectClause = null;

                    var select = "";
                    var order = "";
                    var columnPredicates = [];
                    var globalPredicates = [];

                    angular.forEach(data.columns, function (column) {
                        if (!column.data)
                            return;

                        var serverSideName = clientToServerNameFn(column.data);

                        select += serverSideName + ",";

                        if (!column.searchable)
                            return;

                        if (column.search.value != "") {
                            var colPred = breeze.Predicate.create(serverSideName, "contains", column.search.value);
                            columnPredicates.push(colPred);
                        }

                        if (data.search.value != "") {
                            var globalPred = breeze.Predicate.create(serverSideName, "contains", data.search.value);
                            globalPredicates.push(globalPred);
                        }
                    });
                    select = select.substring(0, select.length - 1);

                    angular.forEach(data.order, function (ord) {
                        var col = data.columns[ord.column];
                        if (!col.data)
                            return;
                        var serverSideName = clientToServerNameFn(col.data);
                        var dir = ord.dir == "desc" ? " desc" : "";
                        order += serverSideName + dir + ",";
                    });
                    if (order.length > 0) {
                        order = order.substring(0, order.length - 1);
                        query = query.orderBy(order);
                    }

                    if (globalPredicates.length > 0)
                        columnPredicates.push(breeze.Predicate.or(globalPredicates));
                    if (columnPredicates.length > 0)
                        query = query.where(breeze.Predicate.and(columnPredicates));

                    if (breezeOpts.projectOnlyTableColumns === true)
                        query = query.select(select);

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
                };
            }
        });
    }
]);
