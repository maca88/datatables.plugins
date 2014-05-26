datatables.plugins
==================

This repository contains various plugins for [DataTables](https://github.com/DataTables/DataTables). Most of them are for the integration with [angular](https://github.com/angular/angular.js) and [Breezejs](https://github.com/Breeze/breeze.js).

<b>NOTE: These plugins works only with datatables 1.10!<b>

<b>Browser support: IE9+, Chrome, Firefox, Opera<b>

## Demonstration:
The demo is based on [NorthBreeze](https://github.com/Breeze/breeze.js.samples) which is using [ng-grid](https://github.com/angular-ui/ng-grid) for tables. We modified it so that [DataTables](https://github.com/DataTables/DataTables) is used instead of [ng-grid](https://github.com/angular-ui/ng-grid).   

The demo can be seen [HERE](http://hartis.si/datatables/).

## Plugins:

### angular.dataTables

This is the main plugin for integrating datatables with angular. Instead of recreating or empty/fill the whole table on collection changes as other similar plugins does this plugin handles model changes in a smart way so that only the collection items that are removed/added/swapped will be removed/added/swapped in DataTables. It populate items with the special property $$dtHash that is used for faster item searching (similar approach that [ngRepeat](https://docs.angularjs.org/api/ng/directive/ngRepeat)).

<b>Simple usage:</b>
```html
<table dt-table dt-data="items" dt-options="options">
  <thead>
    <tr>
      <th dt-data="OrderID">Id</th>
      <th dt-data="OrderDate">Order Date</th>
      <th dt-data="ShipAddress">Ship Address</th>
    </tr>
  </thead>
</table>
```
When using dt-table directive the following attributes are possible for table tag:

<tt>dt-data</tt> path of the collection in the current scope <br />
<tt>dt-options</tt> path of datatables options in the current scope <br />
<tt>dt-witdh</tt> width that will be set using the css function of jQLite/JQuery <br />
<tt>dt-row-data-path</tt> path of the row data (default is 'data') <br />
<tt>dt-row-invalidate</tt> row invalidation mode possible values: "none" and "rendered" (default is "none"). When set to "rendered" row that are rendered will be automatically invalidated with [rows().invalidate()](http://datatables.net/reference/api/row().invalidate()) when row data will change. <br />
<tt>dt-draw-digest</tt> digest the rendered rows on draw. Possible values "true" or "false" (default is "true") <br />
<tt>dt-no-row-binding</tt> when set to "false" binding for rows will not be created. If we have a readonly table or we will just adding and removing rows without later modifications, this option can be used in order to gain performance. default is "false" <br />

<b>NOTE:</b> if you want to use dt instance in your controller give the dt-table attribute the path you want to have the instance defined (i.e. dt-table="variableName")

Columns can be defined in code inside dt-options attribute or in html like in the above example.

When defining a cloumn in html the following attributes are possible for th tag:

<tt>dt-data</tt> http://datatables.net/reference/option/columns.data <br />
<tt>dt-name</tt> http://datatables.net/reference/option/columns.name <br />
<tt>dt-class</tt> http://datatables.net/reference/option/columns.className <br />
<tt>dt-orderable</tt> http://datatables.net/reference/option/columns.orderable <br />
<tt>dt-searchable</tt> http://datatables.net/reference/option/columns.searchable <br />
<tt>dt-width</tt> http://datatables.net/reference/option/columns.width <br />
<tt>dt-def-content</tt> http://datatables.net/reference/option/columns.defaultContent <br />
<tt>dt-order-dtype</tt> http://datatables.net/reference/option/columns.orderDataType <br />

<b>NOTE:<b> the title will be the content inside th element

In addition to standard column options there are two more:

<tt>dt-template</tt> selector for the template that will be used

<b>Sample usage:</b>
```html
<div id="options-tpl" ng-non-bindable style="display: none">
  <span>data.engine</span>
  <button ng-click="removeItem($index)"><span>Delete</span></button>
</div>

<table dt-table dt-data="data" dt-options="options">
  <thead>
    <tr>
      <th dt-data="engine">Rendering engine</th>
      <th dt-data="browser">Browser</th>
      <th dt-data="platform">Platform(s)</th>
      <th dt-data="version">Engine version</th>
      <th dt-data="grade">CSS grade</th>
      <th dt-template="#options-tpl">Options</th>
    </tr>
  </thead>
</table>
```
Note that the template has special attribute [ng-non-bindable](https://docs.angularjs.org/api/ng/directive/ngNonBindable) that has to be applied to every template in order to work correctly. Within the template the following special properties  can be used:
<ul>
	<li><tt>$rowIndex</tt> iterator offset of the row (0..row length-1). </li>
	<li><tt>$firstRow</tt> true if the row is first in the iterator. </li>
	<li><tt>$lastRow</tt> true if the row is last in the iterator. </li>
	<li><tt>$middleRow</tt> true if the row is between the first and last in the iterator. </li>
	<li><tt>$oddRow</tt> true if the iterator position $rowIndex is odd (otherwise false). </li>
	<li><tt>$cellIndex</tt> iterator offset of the cell (0..column length-1). </li>
</ul>

In the above example 'data' represent the data of the collection item. If you want to change that you can with the attribute <tt>dt-row-data-path</tt> in table tag.

If you want to define the template in code define template property in the column definition.

<b>NOTE:</b> when using this option searching and ordering will be disabled.

<tt>dt-expression</tt> angular expression to be evaluated

<b>Sample usage:</b>
```html
<table dt-table dt-data="orders" dt-options="orderGridOpts" dt-row-data-path="order">
    <thead>
        <th dt-data="OrderID">Order ID</th>
        <th dt-expression="order.Freight | currency">Freight</th>
        <th dt-expression="order.OrderDate | date:'shortDate'">Order Date</th>
    </thead>
</table>
```
Note that in the expression you cannot use special properties like in the template option, but in opposite to the template option this option can be searchable and orderable.

### dataTables.rowDetails

This plugin provides a simple way to create row details content. To use this plugin you have to add the char 'D' to your dom. (i.e. lfrDtip). In addition to that you have to specify which column will be for opening and closing the row details, use property iconColumn for this. 

<b>Sample:</b>
```js
...
columns: [
    { iconColumn: true },
    { data: "engine", title: "Engine" },
    { data: "browser", title: "Browser" }
],
...
```
If you want to specify the template for the open and close icons you can do by providing rowDetails property in your datatables options:
```js
...
rowDetails: {
    animation: 'slide',
    icon: {
        'class': 'row-detail-icon',
        'closeHtml': '<button><span class="row-detail-icon">Close</span></button>',
        'openHtml': '<button><span class="row-detail-icon">Open</span></button>',
        'defaultHtml': '',
        'hasIcon': function (row) { return true; }
    },
    destroyOnClose: false,
    trClass: 'sub',
    tdClass: ''
}
...
```
The above configuration is the default that will be used if is not specified in initial datatables options.

For populating row details you have to specify rowDetailCreated function in the datatables options.
rowDetailCreated takes 3 parameters. (1. dt row, 2. details node wrapper in jQuery, 3. rowDetails settings)

<b>Properties:</b>

<tt>animation</tt> specify what animation will be used when open/close icon will be clicked. Options: 'slide' (uses: slideDown/slideUp)  and 'none' (uses: hide/show)<br />

<tt>icon.class</tt> the class used to create a jQuery delegate for click event<br />
<tt>icon.closeHtml</tt> the template for the close icon (dont forget to use icon.class in order the click delegate to work)<br />
<tt>icon.openHtml</tt> the template for the open icon (dont forget to use icon.class in order the click delegate to work)<br />
<tt>icon.hasIcon</tt> function that get the row data as parameter and has to return a boolean, where true means that open or close icon will be shown and false means that icon.defaultHtml will be shown.<br />
<tt>icon.defaultHtml</tt> the template that will be used when a row has not an icon (is not expandable)<br />
<tt>destroyOnClose</tt> specify whether the row details will be removed from the dom or will remain hidden<br />
<tt>trClass</tt> class to apply to the tr tag or row details<br />
<tt>tdClass</tt> class to apply to the td tag of row details<br />

If you want to programatically open or close details you can do this with the functions that this plugin exposes:

<tt>row().closeDetails()</tt> for closing row details<br />
<tt>row().openDetails()</tt> for open row details<br />
<tt>row().toggleDetails()</tt> for open/close row details<br />
<tt>row().isOpen()</tt> check whether row details are opened or not<br />


### angular.dataTables.rowDetails

<b>Dependencies:</b> angular.dataTables, dataTables.rowDetails

This plugin integrates dataTables.rowDetails with angularjs.

<b>Sample:</b>
```html
<div id="row-details-tpl" ng-non-bindable style="display: none">
  <h4>SubItems</h4>
  <table class="table table-striped table-bordered" dt-table dt-data="item.subItems" dt-options="subItemOptions">
    <thead>
      <tr>
        <th dt-data="prop1">Prop1</th>
      </tr>
    </thead>
  </table>
</div>

<table dt-table dt-data="data" dt-options="options" dt-row-detail-tpl="#row-details-tpl">
  <thead>
    <tr>
      <th dt-row-detail-icon></th>
      <th dt-data="engine">Rendering engine</th>
      <th dt-data="browser">Browser</th>
    </tr>
  </thead>
</table>
```
In the above sample you can see the special dt-row-detail-tpl attribute on the table tag that defines the row details template and dt-row-detail-icon on the th tag specifing the icon column. 

### angular.dataTables.tableTools

<b>Dependencies:</b> angular.dataTables, datatables.tableTools

This plugin integrates the offical TableTools extension with angular. It add a special property rowsSelected to the DataTable instance that can be binded in the view template. Property rowsSelected returns an array of objects that have the following propeties:

<tt>index</tt> row index<br />
<tt>data</tt> data of the row<br />
<tt>node</tt> row node<br />
<tt>row</tt> the api instance of the row <br />



### dataTables.breeze.entityFilter

This plugin provide a select box to filter breeze entities. This will only work when you bind breeze entites to datatables. In order to enable this plugin you have to add char 'Y' to the dom (i.e. lfrYtip)

<b>Default configurations:</b>
```js
entityFilter: {
        selectedState: 'default',
        states: {
            'default': { 'filter': ['Added', 'Modified', 'Unchanged', 'Detached'] },
            'all': { 'filter': [] },
            'added': { 'filter': ['Added'] },
            'modified': { 'filter': ['Modified'] },
            'unchanged': { 'filter': ['Unchanged'] },
            'edited': { 'filter': ['Added', 'Modified'] },
            'detached': { 'filter': ['Detached'] },
            'deleted': { 'filter': ['Deleted'] }
        },
        dom: {
            containerClass: '',
            selectClass: 'form-control'  
        },
        language: {
            'entityFilter': 'Entity filter',
            'default': 'Default',
            'all': 'All',
            'added': 'Added',
            'modified': 'Modified',
            'unchanged': 'Unchanged',
            'edited': 'Edited',
            'detached': 'Detached',
            'deleted': 'Deleted'
        }
    }
```
This filter will check the property entityAspect.entityState.name value and check if the state name exist in the current selected filter. Note that empty array means that all states are matched.

### angular.dataTables.breeze.remote

This plugin enables paging/searching/ordering on the serverside using breeze query engine. In order to enable this plugin you have to define breezeRemote property in DataTables configuration.

<b>Sample:</b>
```js
breezeRemote: {
    query: app.dataservice.getCustomersQuery(),
    entityName: "Customer",
    entityManager: null,
    projectOnlyTableColumns: false
}
```
<b>Properties:</b>

<tt>query</tt> is an instance of Entity.Query<br />
<tt>entityName</tt> the entity name that will be returned by the server<br />
<tt>entityManager</tt> the entityManger that will be used for querying the server (Note: this is not required if the query was populated with the entity manager using the 'using' function)<br />
<tt>projectOnlyTableColumns</tt> specify if only the column that are defined in the table will be fetched. Note if this option is set to true then server results will be plain objects (not breeze.Entity)<br />


### dataTables.breeze.editable

<b>Dependencies:</b> datatables.tableTools, datatables.KeyTable, bootstrap (popover plugin)

This plugin enables to editing breeze entities with the helps of offical DataTables plugins TableTools and KeyTable. For validation messages Bootstrap popover plugin is used.

<b>Note: this plugin has nothing to do with the offical DataTables Editor plugin and is not meant to be a replacement, as this plugin will only work with breeze Entities, that have builtin the logic for valiation/addition/deletion/restoration of the data. If you want editing of  non breeze entities this plugin is not for you. </b>

Settings:
```js
breezeEditable: {
	parentEntity: breeze.Entity,
	collectionProperty: string,
	typesTemplate: {
		String: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		Int64: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		Int32: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		Int16: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		Byte: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		Decimal: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		Double: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		Single: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		DateTime: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		DateTimeOffset: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		Time: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		Boolean: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		Guid: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		Binary: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
		Undefined: function(prop: breeze.DataProperty, entity: breeze.Entity, manualBinding: bool),
	},
	editorControlSelector: string,
	startCellEditing: function(td: Element, x: int, y: int, oData: dtRowData, oColumn: dtColumnData),
	endCellEditing: function(td: Element, entity: breeze.Entity, editorCtrl, prop: breeze.DataProperty, x: int, y: int),
	tableFocused: function(e: Event) - context is DataTables api instance,
	entityAddded: function(item: breeze.Entity) - context is TableTools instance,
	entitiesRejected: function(items: breeze.Entity[]) - context is TableTools instance,
	entitiesDeleted: function(items: breeze.Entity[]) - context is TableTools instance,
	entitiesRestored: function(items: breeze.Entity[]) - context is TableTools instance
}
```
<tt>parentEntity</tt> the parent entity that has the collection that will be modified<br />
<tt>collectionProperty</tt> the name of the collection that will be editable within entity<br />
<tt>typesTemplate</tt> an object that contains edit templates for all types supported by breeze<br />
<tt>editorControlSelector</tt>jQuery selector for the editor control.<br />
<tt>startCellEditing</tt>callback before the editor template get focused<br />
<tt>endCellEditing</tt>callback when the editor get out of focus (blured)<br />
<tt>tableFocused</tt>callback when the table get focused<br />
<tt>entityAddded</tt>callback when an entity is added<br />
<tt>entitiesRejected</tt>callback when an entity is rejected<br />
<tt>entitiesRejected</tt>callback when entities are rejected<br />
<tt>entitiesDeleted</tt>callback when entities are deleted<br />
<tt>entitiesRestored</tt>callback when entities are restored<br />

### angular.dataTables.breeze.editable

<b>Dependencies:</b> dataTables.breeze.editable, angular.dataTables, angular.datatables.tableTools

This plugin integrates the dataTables.breeze.editable with angular.


### dataTables.remoteState

This plugin enables to store the table state on a remote location. One table can have multiple states in which one can be set as the default. The states will be shown on in a select box, when switching the table will load the selected state on the fly. This also works with ColReorder and ColVis plugin. The default classes are designed to work with Bootstrap but can be overriden to a custom ones.

Default settings:
```js
remoteState: {
	storeId: null,
	defaultState: '',
	currentState: null,
	minStateLength: 2,
	defaultTableState: 'Default',
	states: null,
	getStatesFromServer: false,
	sendCurrentStateToServer: 'currentState',
	dom: {
		inputWidth: '200px',
		stateSelectClass: 'form-control',
		setDefaultButton: {
			'class': 'btn btn-default btn-sm',
			'icon': 'glyphicon glyphicon-star-empty'
		},
		settingButton: {
			'class': 'btn btn-default btn-sm',
			'icon': 'glyphicon glyphicon-list-alt'
		},
		deleteButton: {
			'class': 'btn btn-default btn-sm',
			'icon': 'glyphicon glyphicon-remove'
		},
		saveButton: {
			'class': 'btn btn-default btn-sm',
			'icon': 'glyphicon glyphicon-floppy-disk'
		},
		deleteForm: {
			'class': 'form-horizontal',
			'groupClass': 'form-group',
			'labelClass': 'col-sm-2 control-label',
			'selectDivClass': 'col-sm-10'
		},
		saveForm: {
			'class': 'form-horizontal',
			'inputClass': 'form-control',
			'groupClass': 'form-group',
			'labelClass': 'col-sm-2 control-label',
			'selectDivClass': 'col-sm-10'
		}
	},
	language: {
		'settings': 'Settings',
		'default': 'Default',
		'load': 'Load',
		'save': 'Save',
		'add': 'Add',
		'delete': 'Delete',
		'setDefault': 'Set default',
		'createNew': 'Create new',
		'state': 'State'
	},
	settingsDisplayAction: null,
	ajax: {
		'getAll': {
			url: null,
			type: 'POST',
			beforeSendAction: null,
			doneAction: null,
			failAction: null
		},
		'save': {
			url: null,
			type: 'POST',
			beforeSendAction: null,
			doneAction: null,
			failAction: null
		},
		'delete': {
			url: null,
			type: 'POST',
			beforeSendAction: null,
			doneAction: null,
			failAction: null
		},
		'setDefault': {
			url: null,
			type: 'POST',
			beforeSendAction: null,
			doneAction: null,
			failAction: null
		}
	}
}
```



### TODO
<b>AdvanceFilter</b>



