DataTables.plugins
==================

This repository contains various plugins for [DataTables](https://github.com/DataTables/DataTables). Most of them are integrations with [AngularJS](https://github.com/angular/angular.js) and [Breezejs](https://github.com/Breeze/breeze.js).

<b>NOTE: These plugins works only with DataTables 1.10 and above!</b>

<b>Browser support: IE9+, Chrome, Firefox, Opera</b>

## Motivation:
As I started using AngularJS a few months ago, I was looking for a grid system that would work well with the technology, and the only free system at that time was ng-grid. Since I had a lot of experience with DataTables from creating various plugins, I was wondering what it would take for me to integrate it completely with AngularJS. All current projects that tried integrating AngularJS with DataTables were either done poorly (recreating/refilling the table on each change), or incomplete, that is when I decided to create my own repository.

## Demonstration:
The demo is based on [NorthBreeze](https://github.com/Breeze/breeze.js.samples), which is using [ng-grid](https://github.com/angular-ui/ng-grid) for tables. We modified it, so that [DataTables](https://github.com/DataTables/DataTables) is used instead of [ng-grid](https://github.com/angular-ui/ng-grid).   

The demo can be seen [HERE](http://hartis.si/datatables/).

## Plugins:

## Table of Contents
* <b>Plugins</b>
  * [dataTables.rowDetails](#datatablesrowdetails)
  * [dataTables.breezeFilter](#datatablesbreezefilter)
  * [dataTables.breezeRemote](#datatablesbreezeremote)
  * [dataTables.breezeEditable](#datatablesbreezeeditable)
  * [dataTables.remoteState](#datatablesremotestate)
  * [dataTables.advancedFilter](#datatablesadvancedfilter)
  * [dataTables.colPin](#datatablescolpin)
  * [dataTables.colResize](#datatablescolresize)
  * [dataTables.formFilter](#datatablesformfilter)
* <b>AngularJs integrations</b>
  * [angular.dataTables](#angulardatatables)
  * [angular.dataTables.rowDetails](#angulardatatablesrowdetails)
  * [angular.dataTables.tableTools](#angulardatatablestabletools)
  * [angular.dataTables.breezeEditable](#angulardatatablesbreezeeditable)
  * [angular.dataTables.colPin](#angulardatatablescolpin)



### dataTables.rowDetails

This plugin provides a simple way to create row details content. To use this plugin you have to add the char 'D' to your dom. (i.e. lfrDtip). In addition to that you have to specify which column will be for opening and closing the row details, use property iconColumn for this. 

<b>Sample:</b>
```js
...
columns: [
    { iconColumn: true, defaultContent: "" },
    { data: "engine", title: "Engine" },
    { data: "browser", title: "Browser" }
],
...
```
If you want to specify the template for the open and close icons you can do by providing rowDetails property in your DataTables options:
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
The above configuration is the default that will be used if is not specified in initial DataTables options.

For populating row details you have to specify rowDetailCreated function in the DataTables options.
rowDetailCreated takes 3 parameters. (1. dt row, 2. details node wrapper in jQuery, 3. rowDetails settings)

<b>Properties:</b>

<tt>animation</tt> specify what animation will be used when open/close icon will be clicked. Options: 'slide' (uses: slideDown/slideUp) and 'none' (uses: hide/show) <br />

<tt>icon.class</tt> the class used to create a jQuery delegate for click event<br />
<tt>icon.closeHtml</tt> the template for the close icon (dont forget to use icon.class in order the click delegate to work)<br />
<tt>icon.openHtml</tt> the template for the open icon (dont forget to use icon.class in order the click delegate to work)<br />
<tt>icon.hasIcon</tt> function that get the row data as parameter and has to return a boolean, where true means that open or close icon will be shown and false means that icon.defaultHtml will be shown.<br />
<tt>icon.defaultHtml</tt> the template that will be used when a row has not an icon (is not expandable)<br />
<tt>destroyOnClose</tt> specify whether the row details will be removed from the dom or will remain hidden<br />
<tt>trClass</tt> class to apply to the tr tag or row details<br />
<tt>tdClass</tt> class to apply to the td tag of row details<br />

If you want to programmatically open or close details you can do this with the functions that this plugin exposes:

<tt>row().closeDetails()</tt> for closing row details<br />
<tt>row().openDetails()</tt> for open row details<br />
<tt>row().toggleDetails()</tt> for open/close row details<br />
<tt>row().isOpen()</tt> check whether row details are opened or not<br />



### dataTables.breezeFilter

This plugin provide a select box to filter breeze entities. This will only work when you bind breeze entities to DataTables. In order to enable this plugin you have to add char 'G' to the dom (i.e. lfrGtip)

<b>Default configurations :</b>
```js
breezeFilter: {
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

### dataTables.breezeRemote

<b>Dependencies:</b> Breezejs

This plugin enables paging/searching/ordering on the server side using breeze query engine. In order to enable this plugin you have to define breezeRemote property in DataTables configuration.

<b>Default configurations :</b>
```js
breezeRemote: {
	prefetchPages: 1,
	method: 'GET',
	sendExtraData: false,
	encoding: null,
	query: null,
	entityManager: null,
	resultEntityType: null, 
	projectOnlyTableColumns: false,
	beforeQueryExecution: null
}
```

<b>Properties:</b>

<tt>prefetchPages</tt> number of pages to prefetch. The idea was taken from [DataTables pipelining](http://datatables.net/examples/server_side/pipeline.html)<br />
<tt>method</tt> method to be used when getting data from the server. For POST method [breezeajaxpostjs](http://www.breezejs.com/breeze-labs/breezeajaxpostjs) must be included in order to work correctly<br />
<tt>sendExtraData</tt> can be a boolean or a function that is used to filter the data that will be send to the server.<br />
<tt>encoding</tt> specifies the encoding used when requesting the server. Possible values: ‘JSON’ or x-www-form-urlencoded (the default). [breezeajaxpostjs](http://www.breezejs.com/breeze-labs/breezeajaxpostjs) must be included in order to work <br />
<tt>query</tt> is an instance of Entity.Query<br />
<tt>entityManager</tt> the entityManger that will be used for querying the server (Note: this is not required if the query was populated with the entity manager using the 'using' function)<br />
<tt>resultEntityType</tt> the entity name that will be returned by the server. can be breeze.EntityType or string (optional, used for automaticaly detect types, alternatively can be passed by toType function of breeze.EntityQuery)<br />
<tt>projectOnlyTableColumns</tt> specify if only the column that are defined in the table will be fetched. Note if this option is set to true then server results will be plain objects (not breeze.Entity)<br />
<tt>beforeQueryExecution</tt> is a callback that will be called before the request will be send to the server<br />

### dataTables.breezeEditable

<b>Dependencies:</b> datatables.tableTools, datatables.KeyTable, Bootstrap (Popover plugin)

This plugin enables to editing breeze entities with the help of official DataTables plugins TableTools and KeyTable. For validation messages Bootstrap popover plugin is used.

<b>Note: this plugin has nothing to do with the official DataTables Editor plugin and is not meant to be a replacement, as this plugin will only work with breeze Entities, that have built-in the logic for validation/addition/deletion/restoration of the data. If you want editing of  non-breeze entities this plugin is not for you. </b>

<b>Note: at the moment a custom KeyTable library has to be used in order to work</b>

<b>Default configurations :</b>
```js
breezeEditable: {
	entityType: string,
	createEntity: function(name: string): breeze.Entity,
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
<tt>entityType</tt> the entity type<br />
<tt>createEntity</tt> a function that creates a new entity, usually this will be the createEntity function of the breeze.EntityManager<br />
<tt>typesTemplate</tt> an object that contains edit templates for all types supported by breeze<br />
<tt>editorControlSelector</tt>jQuery selector for the editor control.<br />
<tt>startCellEditing</tt>callback before the editor template get focused<br />
<tt>endCellEditing</tt>callback when the editor get out of focus (blurred)<br />
<tt>tableFocused</tt>callback when the table get focused<br />
<tt>entityAddded</tt>callback when an entity is added<br />
<tt>entitiesRejected</tt>callback when an entity is rejected<br />
<tt>entitiesRejected</tt>callback when entities are rejected<br />
<tt>entitiesDeleted</tt>callback when entities are deleted<br />
<tt>entitiesRestored</tt>callback when entities are restored<br />



### dataTables.remoteState

This plugin enables to store the table state on a remote location. One table can have multiple states in which one can be set as the default. The states will be shown on in a select box, when switching the table will load the selected state on the fly. This also works with plugins: ColVis, ColReorder, AdvancedFilter, ColResize, ColPin and FormFilter. The default classes are designed to work with Bootstrap but can be overridden to a custom ones.
To use this plugin you have to add the char 'B' to your dom. (i.e. lfrBtip)
 
<b>Default configurations :</b>
```js
remoteState: {
	storeId: null,
	defaultState: '',
	currentState: null,
	minStateLength: 2,
	defaultTableState: 'Default',
	states: null,
	getStatesFromServer: false,
	sendCurrentStateToServer: null,
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

### dataTables.advancedFilter

<b>Dependencies :</b> Bootstrap (Modal and Popover)

The AdvancedFilter plugin is used to create complex filters that can be applied to our data (client side or server side). The big difference between DataTables builtin search engine and AdvancedFilter is that AdvancedFilter support nested predicates on a column level, with a friendly UI. There are two ways to add a filter with the AdvancedFilter plugin. One is by clicking on the filter icon whitin the column header or by clicking the filter icon above the table. When clicking on the icon above the table a modal window will be shown with all the filters that are currently applied.
To use this plugin you have to add the char 'A' to your dom. (i.e. lfrAtip).

<b>Default configurations :</b>
```js
advancedFilter: {
	operators: {
		types: {
			'string': ['nn', 'nl', 'eq', 'ne', 'co', 'nc', 'sw', 'ew'],
			'number': ['nn', 'nl', 'eq', 'ne', 'lt', 'le', 'gt', 'ge'],
			'boolean': ['nn', 'nl', 'eq', 'ne'],
			'date': ['nn', 'nl', 'eq', 'ne', 'lt', 'le', 'gt', 'ge'],
			'undefined': ['nn', 'nl', 'eq', 'ne']
		},
		eq: {
			fn: null//function (data, input) { return data === input; }
		}
	},
	typesEditor: {
		'string': {
			tag: 'input',
			attr: { type: 'text' },
			className: 'form-control input-sm',

			customCreationFn: null, //function(column, operator, value, settings): editor - this -> api
			setFilterValue: null,
			getFilterValue: null
		},
		'date': {
			tag: 'input',
			attr: { type: 'date' },
			className: 'form-control input-sm',
			getFilterValue: function () {
				return this.get(0).valueAsDate;
			},
			setFilterValue: function (date) {
				this.get(0).valueAsDate = date;
			}
		},
		'time': {
			tag: 'input',
			attr: { type: 'time' },
			className: 'form-control input-sm'
		},
		'dateTime': {
			tag: 'input',
			attr: { type: 'datetime-local' },
			className: 'form-control input-sm'
		},
		'number': {
			tag: 'input',
			attr: { type: 'number', step: 'any' },
			className: 'form-control input-sm',
			getFilterValue: function () {
				return this.get(0).valueAsNumber;
			},
			setFilterValue: function (num) {
				this.get(0).valueAsNumber = num;
			}
		},
		'select': {
			tag: 'select',
			attr: {},
			className: 'form-control input-sm'
		}
	},
	dom: {
		settingButtonDiv: {
			className: 'dt-global-filter-div'
		},
		settingButton: {
			buttonClass: 'btn btn-default btn-sm',
			spanClass: 'glyphicon glyphicon-filter'
		},
		addGroupButton: {
			buttonClass: 'btn btn-default btn-sm',
			spanClass: 'glyphicon glyphicon-plus'
		},
		removeGroupButton: {
			buttonClass: 'btn btn-default btn-sm',
			spanClass: 'glyphicon glyphicon-minus'
		},
		addRuleButton: {
			buttonClass: 'btn btn-default btn-sm',
			spanClass: 'glyphicon glyphicon-plus'
		},
		removeRuleButton: {
			buttonClass: 'btn btn-default btn-sm',
			spanClass: 'glyphicon glyphicon-minus'
		},
		ruleOperatorSelect: {
			className: 'form-control input-sm',
		},
		groupOperatorSelect: {
			className: 'form-control input-sm',
		},
		columnSelect: {
			className: 'form-control input-sm',
		},
		columnFilterIcon: {
			className: 'glyphicon glyphicon-filter'
		},
		filterButton: {
			className: 'btn btn-primary'
		},
		clearButton: {
			className: 'btn btn-default'
		}
	},
	language: {
		'all': 'All',
		'filter': 'Filter',
		'clear': 'Clear',
		'and': 'And',
		'or': 'Or',
		'columnFilter': 'Column filter',
		'filterFor': 'Filter for',
		'removeGroup': 'Remove group',
		'removeRule': 'Remove rule',
		'addGroup': 'Add group',
		'addRule': 'Add rule',
		'filterSettings': 'Filter settings',
		'operators': {
			'nl': 'Is null',
			'nn': 'Not null',
			'eq': 'Equal',
			'ne': 'Not equal',
			'co': 'Contains',
			'nc': 'Not contain',
			'sw': 'Starts with',
			'ew': 'Ends with',
			'lt': 'Less than',
			'le': 'Less or equal',
			'gt': 'Greater than',
			'ge': 'Greater or equal'
		}
	},
	stateData: null,
	getDefaultFilterEditor: (settings, column) => {
		var type = column.sType ? column.sType.toLowerCase() : '';
		switch (type) {
			case 'num-fmt':
			case 'num':
				return settings.typesEditor['number'];
			default:
				return settings.typesEditor['string'];
		}
	},
	getDefaultColumnOperators: (settings, column) => { //this will execute for types that are not defined in operators.types and in the column itself
		var type = column.sType ? column.sType.toLowerCase() : '';
		switch (type) {
			case 'num-fmt':
			case 'num':
				return settings.operators.types['number'];
			default:
				return settings.operators.types['undefined'];
		}
	},
	createFilterEditor: null, //function(column, operator, value): editor - this -> api
	filterEditorCreated: null, //function(editor, column, operator, value): void - this -> api
	ruleRemoving: null, //function(table): void - this -> api
}
```

### dataTables.colPin

<b>Dependencies :</b> dataTables.fixedColumns

The ColPin plugin is used for pinning columns, so that they are always visible, even when scrolling horizontally. Under the hood ColPin uses the official DataTables plugin called FixedColumns. By clicking on the pin, the column will be automatically pinned to the left side of the table and the pin icon will be colored red. We can obtain a mirrored effect by holding shift + click, this way the column will be pinned on the right side. For unpinning the column, we just habe to click again on the icon and the column will not be pinned anymore. To use this plugin you have to add the char 'I' to your dom. (i.e. lfrItip).

<b>Default configurations :</b>
```js
{
	dom: {
		pinIcon: {
			iconClass: 'glyphicon glyphicon-pushpin',
			pinnedClass: 'pinned',
			unpinnedClass: 'unpinned'
		}
	}
}
```

### dataTables.colResize
ColResize is a plugin that is used for column resizing. It works for tables that have scrollX either enabled or disabled, and even with the official DataTables plugin called Scroller. This plugin was initialy base on [ColReorderWithresize](http://legacy.datatables.net/extras/thirdparty/ColReorderWithResize/) but was modified in order to work as standalone plugin. To use this plugin you have to add the char 'J' to your dom. (i.e. lfrJtip).


### dataTables.formFilter
The FormFilter is used for the integration of html forms with the DataTables filtering engine. Before filtering FormFilter will fetch all the data from the forms, so that can be used for server or client side filtering. This plugin comes handy when we have a special condition that cannot be created throught the AdvancedFilter. To use this plugin you have to add the char 'K' to your dom. (i.e. lfrKtip).

<b>Default configurations :</b>
```js
{
	formSelectors: [],
	getFormData: (form) => { return form.serializeArray(); },
	setFormData: (form, data) => { $.each(data, (i, item) => { $('input[name="' + item.name + '"], select[name="' + item.name + '"], textarea[name="' + item.name + '"]', form).val(item.value); }); },
	mergeFormData: (data, fData) => { return !$.isArray(fData) ? data : (data || []).concat(fData); },
	resetForm: (form) => { $(':input', form).not(':button, :submit, :reset, :hidden').removeAttr('checked').removeAttr('selected').not(':checkbox, :radio, select').val(''); },
	clientFilter: null, //function(currentFormsData, data, dataIndex, rowData)
}
```

<b>Note: at the moment a custom DataTables library has to be used in order to work</b>


### angular.dataTables

This is the main plugin for integrating DataTables with AngularJS. Instead of recreating or empty/fill the whole table on collection changes as other similar plugins, this one handles model changes in a smart way, so that only the collection items that are removed/added/swapped will be removed/added/swapped in DataTables. It populates items with the special property $$dtHash that is used for faster item searching (similar approach that [ngRepeat](https://docs.angularjs.org/api/ng/directive/ngRepeat)).

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
<tt>dt-options</tt> path of DataTables options in the current scope <br />
<tt>dt-witdh</tt> width that will be set using the css function of jQLite/JQuery <br />
<tt>dt-row-data-path</tt> path of the row data (default is 'data') <br />
<tt>dt-row-invalidate</tt> row invalidation mode possible values: "none" and "rendered" (default is "none"). When set to "rendered" row that are rendered will be automatically invalidated with [rows().invalidate()](http://datatables.net/reference/api/row().invalidate()) when row data will change. <br />
<tt>dt-draw-digest</tt> digest the rendered rows on draw. Possible values "true" or "false" (default is "true") <br />
<tt>dt-no-row-binding</tt> when set to "false" binding for rows will not be created. If we have a read-only table or we will just adding and removing rows without later modifications, this option can be used in order to gain performance. Default is "false" <br />

<b>NOTE:</b> if you want to use dt instance in your controller give the dt-table attribute the path you want to have the instance defined (i.e. dt-table="variableName")

Columns can be defined in code inside dt-options attribute or in html like in the above example.

When defining a column in html the following attributes are possible for th tag:

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

<b>Sample usage :</b>
```html
<div id="options-tpl" ng-non-bindable style="display: none">
  <span>data.engine</span>
  <button ng-click="removeItem($rowIndex)"><span>Delete</span></button>
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
Note that the template has special attribute [ng-non-bindable](https://docs.angularjs.org/api/ng/directive/ngNonBindable) that has to be applied to every template in order to work correctly. Within the template the following special properties can be used:
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
<b>NOTE:</b> with official DataTables library row invalidation will break the template!

<tt>dt-expression</tt> AngularJS expression to be evaluated

<b>Sample usage :</b>
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


### angular.dataTables.rowDetails

<b>Dependencies :</b> angular.dataTables, dataTables.rowDetails

This plugin integrates dataTables.rowDetails with AngularJS.

<b>Sample :</b>
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
In the above sample you can see the special dt-row-detail-tpl attribute on the table tag that defines the row details template and dt-row-detail-icon on the th tag specifying the icon column. 

### angular.dataTables.tableTools

<b>Dependencies :</b> angular.dataTables, datatables.tableTools

This plugin integrates the official TableTools extension with AngularJS. It add a special property rowsSelected to the DataTable instance that can be binded in the view template. Property rowsSelected returns an array of objects that have the following properties:

<tt>index</tt> row index<br />
<tt>data</tt> data of the row<br />
<tt>node</tt> row node<br />
<tt>row</tt> the api instance of the row <br />


### angular.dataTables.breezeEditable

<b>Dependencies :</b> dataTables.breezeEditable, angular.dataTables, angular.datatables.tableTools

This plugin integrates the dataTables.breezeEditable with AngularJS.


### angular.dataTables.colPin

<b>Dependencies :</b> angular.dataTables, dataTables.colPin

This plugin integrates the dataTables.colPin with AngularJS.




