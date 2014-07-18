module app.JayDataExamples {
    
    export class CustomerController {
        
        public static $inject = ["$scope", "jaydataservice"];

        public dataservice: any; 
        private $scope: any;

        public customerOrdersGridOpts = {}
        public customerGridOpts;

        constructor($scope, jaydataservice) {
            $scope.vm = this;
            this.$scope = $scope;
            this.dataservice = jaydataservice;
            this.initialize();
        }

        private initialize() {
            this.customerGridOpts = {
                paging: true,
                columnDefs: [
                    {
                        targets: 0,
                        resizable: false
                    }
                ],
                lengthChange: true,
                searching: true,
                info: true,
                stateSave: true,
                autoWidth: true,
                deferRender: true,
                processing: false,
                advancedFilter: {
                    remoteAdapter: dt.JayDataAdvancedFilterAdapter
                },
                colResize: {

                },
                rowDetails: {
                    template: '#row-details-tpl',
                    opened: (row) => {
                        var scope: any = angular.element(row.node()).scope();
                        if (scope.ordersLoaded === true) return;
                        var customer = row.data();
                        this.dataservice.loadItemProperty(customer, 'Orders', {
                            success: (json) => {
                                customer.Orders = json;
                                scope.ordersLoaded = true;
                                scope.$apply();
                            },
                            error: (error) => {
                                throw error;
                            }
                        });
                    }
                },
                serverSide: true,
                //scrollX: true,
                //scrollCollapse: true,
                remoteFilter: {
                    adapter:dt.JayDataRemoteFilterAdapter,
                    prefetchPages: 3,
                    //method: 'POST',
                    sendExtraData: (data) => {
                        return data['formFilter'];
                    },
                    query: this.dataservice.Customers,
                    entityName: "Customer",
                    projectOnlyTableColumns: false //If true then server results will be plain objects (not breeze.Entity)
                },
                order: [],
                tableTools: {
                    "sRowSelect": "single",
                    "sSwfPath": "libs/datatables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
                },
                formFilter: {
                    formSelectors: ['#cust-dt-filter']
                },
                dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" +
                "T" + //TableTools
                "D" + //RowDetails
                "C" + //ColVis
                "<'pull-right'A>" + //AdvancedFilter
                "F" + //BreezeRemote
                "J" + //ColResize
                "K" + //FormFilter
                "t" +
                "<'row'<'col-xs-6'i><'col-xs-6'p>>R"

            };
        }

        public getStateName(state) {
            switch (state) {
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

        
        public reset(customer:any) {
            customer.refresh().then(() => {
                customer.entityState = (<any>$data).EntityState.Unchanged;
                if (!this.$scope.$$phase) this.$scope.$apply();
            });
            //if (!this.$scope.$$phase) this.$scope.$apply();
        }

        public update(customer: any) { 
            customer.save().then(() => {
                if(!this.$scope.$$phase) this.$scope.$apply();
            });
        }
    }

}


angular.module("app").controller("JayDataExamples.CustomerController", app.JayDataExamples.CustomerController);