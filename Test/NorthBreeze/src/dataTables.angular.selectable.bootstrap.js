dt.selectable.SelectableTablePlugin.defaultSettings.column.className = 'text-center';
dt.selectable.SelectableTablePlugin.defaultSettings.column.width = '15px';
dt.selectable.SelectableTablePlugin.defaultSettings.column.headerTemplate = '<span ng-click="$table.allRowsSelected = !($table.allRowsSelected)" ng-class="{ \'glyphicon-check\': $table.allRowsSelected, \'glyphicon-unchecked\': $table.allRowsSelected === false }" class="glyphicon"></span>';
dt.selectable.SelectableTablePlugin.defaultSettings.column.template = '<span ng-class="{ \'glyphicon-check\': $selected, \'glyphicon-unchecked\': !$selected }" class="glyphicon"></span>'; //ng-click="$table.toggleRowsSelection()"
//# sourceMappingURL=dataTables.angular.selectable.bootstrap.js.map
