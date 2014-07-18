module app.BreezeExamples {
     
     export class EmployeeController {
         
         private dataservice: any;
         private $scope: any;

         public employee;
         public options;
         public ordersLoaded;

         public static $inject = ["$scope", "dataservice"];
         constructor($scope, dataservice) {
             $scope.vm = this;
             this.$scope = $scope;
             this.dataservice = dataservice;
             this.dataservice.getAllEmployees()
                 .then(this.onEmployeesLoaded.bind(this))
                 .fail((error) => {
                     throw error.message;
                 });
             this.initialize();
         }

        private initialize() {
            this.options = {
                paging: true,
                lengthChange: true,
                searching: true,
                info: true,
                autoWidth: true,
                deferRender: true,
                order: [],
                entityFilter: {
                    adapter: 'breeze'
                },
                tableTools: {
                    "sRowSelect": "os",
                    "sSwfPath": "libs/datatables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
                    "aButtons": ["editable_restore_deleted", "editable_delete", "editable_add", "editable_reject", "select_all", "select_none"]
                },
                breezeEditable: {
                    entityType: 'Order',
                    createEntity: this.dataservice.createEntity
                },
                dom: "<'row'<'col-xs-6'l><'col-xs-6'f>r>" +
                "C" + //ColVis
                "T" + //TableTools
                "G" + //BreezeFilter
                //"D" + //RowDetails
                "L" + //BreezeEdiatble
                "t" +
                "<'row'<'col-xs-6'i><'col-xs-6'p>>R"

            };
        }

        private onEmployeesLoaded(data) {
            this.employee = data.results[0];
            this.$scope.$digest();
            this.employee.entityAspect.loadNavigationProperty("Orders")
                .then((json) => {
                    this.ordersLoaded = true;
                    this.$scope.$digest();
                })
                .catch((error) => {
                    throw error;
                });
        }

        public rejectChanges() {
            this.dataservice.rejectChanges();
        }

        public saveChanges() {
            this.dataservice.saveChanges(null, () => {
                this.$scope.$digest();
             });
        }
     }
 }

angular.module("app").controller("BreezeExamples.EmployeeController", app.BreezeExamples.EmployeeController);