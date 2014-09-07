module app.JayDataExamples {
    
    export class OrdersController {
        private dataservice: any;
        private $scope: any;

        public orders = [];
        public orderGridOpts;

        public static $inject = ["$scope", "jaydataservice"];
        constructor($scope, jaydataservice) {
            $scope.vm = this;
            this.$scope = $scope;
            this.dataservice = jaydataservice;
            this.initialize();
        }

        private initialize() {
            this.dataservice.Orders.toArray(this.onOrdersLoaded.bind(this));
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
                    adapter: dt.JayDataEntityFilterAdapter
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
            this.orders = data;
            this.$scope.$apply();
        }

        public getStateName(state) {
            switch(state) {
                case (<any>$data).EntityState.Detached:
                    return 'Detached';
                case (<any>$data).EntityState.Unchanged:
                    return 'Unchanged';
                case (<any>$data).EntityState.Added:
                    return 'Added';
                case (<any>$data).EntityState.Modified:
                    return 'Modified'; 
                case (<any>$data).EntityState.Deleted:
                    return 'Deleted'; 
                default:
                    return 'Undefined'; 
            }
        }

        public setState(itemIdx, stateName) {
            var item = this.orders[itemIdx];
            switch (stateName) {
                case 'attach':
                    this.dataservice.Orders.attach(item);
                    break;
                case 'deleted':
                    this.dataservice.Orders.remove(item);
                    break;
                case 'detached':
                    this.dataservice.Orders.detach(item);
                    break;
                case 'modified':
                    item.entityState = (<any>$data).EntityState.Modified;
                    break;
                case 'unchanged':
                    item.entityState = (<any>$data).EntityState.Unchanged;
                    break;
                default:
                    break;
            }
            //this.$scope.orderTable.draw(false);
        }
    }

} 

angular.module("app").controller("JayDataExamples.OrdersController", app.JayDataExamples.OrdersController);