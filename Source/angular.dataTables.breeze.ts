//Breeze plugin
angular.module("dt")
    .config([
        "dtSettings", (dtSettings) => {
            dtSettings.dtTableCreatingCallbacks.push(($element, options, scope, attrs, $compile) => {
                //#region Breeze

                var breezeOpts = options.breeze;
                if (breezeOpts != null) {
                    options.serverSide = true;
                    var query = breezeOpts.query;
                    var manager = breezeOpts.entityManager || query.entityManager;
                    if (manager == null)
                        throw "entity manager must be provided. Use EnitityQuery method 'using' or by adding a property with name entityManager in breeze configuration in datatables";

                    var clientToServerNameFn = manager.metadataStore.namingConvention.clientPropertyNameToServer;

                    options.ajax = (data, fn, oSettings) => {

                        //Clear query params
                        query.orderByClause = null;
                        query.parameters = {};
                        query.wherePredicate = null;
                        query.selectClause = null;

                        var select = "";
                        var order = "";
                        var columnPredicates = []; //breeze.Predicate
                        var globalPredicates = []; //breeze.Predicate

                        //Columns
                        angular.forEach(data.columns, (column) => {
                            if (!column.data) return; //TODO: should look at name property instead?

                            var serverSideName = clientToServerNameFn(column.data);

                            select += serverSideName + ",";

                            if (!column.searchable) return;

                            //Column filter
                            if (column.search.value != "") {
                                var colPred = breeze.Predicate.create(serverSideName, "contains", column.search.value);//TODO: cast value to propety type
                                columnPredicates.push(colPred);
                            }
                            
                            //Global filter
                            if (data.search.value != "") {
                                var globalPred = breeze.Predicate.create(serverSideName, "contains", data.search.value);//TODO: cast value to propety type
                                globalPredicates.push(globalPred);
                            }
                        });
                        select = select.substring(0, select.length - 1); //remove the last ,

                        //Order
                        angular.forEach(data.order, (ord) => {
                            var col = data.columns[ord.column];
                            if (!col.data) return;
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
                        if (breezeOpts.projectOnlyTableColumns === true)
                            query = query.select(select);

                        query
                            .skip(data.start)
                            .take(data.length)
                            .inlineCount()
                            .execute()
                            .then(json => {

                                var draw = parseInt(data.draw);
                                var dtJson = {
                                    data: json.results,
                                    draw: ++draw,
                                    recordsTotal: json.inlineCount,
                                    recordsFiltered: json.inlineCount,
                                };

                                fn(dtJson);
                            })
                            .catch(error => {
                                throw error;
                            });
                    };

                }

                //#endregion
            });
        }
    ]); 