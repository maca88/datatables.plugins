module app.BreezeExamples {
    
    export class CustomerController {
        
        public static $inject = ["$scope", "breezedataservice"];

        public dataservice: any;
        private $scope: any;

        public customerOrdersGridOpts = {}
        public customerGridOpts;

        constructor($scope, breezedataservice) {
            $scope.vm = this;
            this.$scope = $scope;
            this.dataservice = breezedataservice;
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
                    remoteAdapter: dt.BreezeAdvancedFilterAdapter
                },
                colResize: {

                },
                rowDetails: {
                    template: '#row-details-tpl',
                    opened: (row) => {
                        var scope: any = angular.element(row.node()).scope();
                        if (scope.ordersLoaded === true) return;
                        var customer = row.data();
                        customer.entityAspect.loadNavigationProperty("Orders")
                            .then((json) => {
                                console.log(customer.Orders);
                                scope.ordersLoaded = true;
                                scope.$apply();
                            })
                            .catch((error) => {
                                throw error;
                            });
                    }
                },
                serverSide: true,
                //scrollX: true,
                //scrollCollapse: true,
                remoteFilter: {
                    adapter: dt.BreezeRemoteFilterAdapter,
                    prefetchPages: 3,
                    //method: 'POST',
                    sendExtraData: (data) => {
                        return data['formFilter'];
                    },
                    query: this.dataservice.getCustomersQuery(),
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

        public reset(customer:any) {
            customer.entityAspect.rejectChanges();
        }

        public update(customer: any) {
            this.dataservice.saveChanges([customer], () => {
                this.$scope.$apply();
            });
        }
    }

}


angular.module("app").controller("BreezeExamples.CustomerController", app.BreezeExamples.CustomerController);