module app.BreezeExamples {
    
    export class OrdersController {
        private dataservice: any;
        private $scope: any;

        public orders = [];
        public orderGridOpts;

        public static $inject = ["$scope", "breezedataservice"];
        constructor($scope, breezedataservice) {
            $scope.vm = this;
            this.$scope = $scope;
            this.dataservice = breezedataservice;
            this.initialize();
        }

        private initialize() {
            this.dataservice.getOrders()
                .then(this.onOrdersLoaded.bind(this))
                .fail((error) => {
                    throw error.message;
                });

            this.orderGridOpts = {
                paging: true,
                lengthChange: true,
                lengthMenu: [[3, 25, 50, -1], [3, 25, 50, "All"]],
                searching: true,
                info: true,
                //autoWidth: true,
                scrollX: true,
                scrollCollapse: true,
                deferRender: true,
                stateSave: true,
                entityFilter: {
                    adapter: dt.BreezeEntityFilterAdapter
                },
                remoteState: {
                    storeId: 'OrderGrid',
                    getStatesFromServer: true,
                    ajax: {
                        getAll: {
                            url: 'breeze/NorthBreeze/RemoteState'
                        },
                        save: {
                            url: 'breeze/NorthBreeze/RemoteState'
                        },
                        remove: {
                            url: 'breeze/NorthBreeze/RemoteState'
                        },
                        setDefault: {
                            url: 'breeze/NorthBreeze/RemoteState'
                        }
                    }
                },
                formFilter: {
                    formSelectors: ['#order-dt-filter'],
                    clientFilter: (currentFormsData, data, dataIndex, rowData) => {
                        if (!currentFormsData) return true;
                        var result:any = true;
                        for (var i = 0; i < currentFormsData.length; i++) {
                            var name = currentFormsData[i].name;
                            switch (name) {
                                case 'city':
                                    result &= <any>(currentFormsData[i].value == '' || rowData.ShipCity == currentFormsData[i].value);
                                    break;
                                case 'region':
                                    result &= <any>(currentFormsData[i].value == '' || rowData.ShipRegion == currentFormsData[i].value);
                                    break;
                                case 'name':
                                    result &= <any>(currentFormsData[i].value == '' || rowData.ShipName == currentFormsData[i].value);
                                    break;
                            }
                        }
                        return result;
                    }
                },
                dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" +
                "G" + //BreezeFilter
                "C" + //ColVis
                "<'pull-left'B>" + //RemoteState
                "<'pull-right'A><'clearfix'>" + //AdvancedFilter
                "t" +
                "K" + //FormFilter
                "I" + //ColPin
                "J" + //ColResize
                "<'row'<'col-xs-6'i><'col-xs-6'p>>R"

            };
        }

        private onOrdersLoaded(data) {
            this.orders = data.results;
            this.$scope.$apply();
        }

        public setState(itemIdx, stateName) {
            var item = this.orders[itemIdx];
            switch (stateName) {
                case 'deleted':
                    item.entityAspect.setDeleted();
                    break;
                case 'detached':
                    item.entityAspect.setDetached();
                    break;
                case 'modified':
                    item.entityAspect.setModified();
                    break;
                case 'unchanged':
                    item.entityAspect.setUnchanged();
                    break;
                default:
                    break;
            }
            this.$scope.orderTable.draw(false);
        }
    }

} 

angular.module("app").controller("BreezeExamples.OrdersController", app.BreezeExamples.OrdersController);