datatables.plugins
==================

This repository contains various plugins for [datatables](https://github.com/DataTables/DataTables). Most of them are for the integration with [angular](https://github.com/angular/angular.js) and [breezejs](https://github.com/Breeze/breeze.js).

<b>NOTE: These plugins works only with datatables 1.10!<b>

## Demonstration:
The demo is based on [NorthBreeze](https://github.com/Breeze/breeze.js.samples) which is using [ng-grid](https://github.com/angular-ui/ng-grid) for tables. We modified it so that [datatables](https://github.com/DataTables/DataTables) is used instead of [ng-grid](https://github.com/angular-ui/ng-grid).   

The demo can be seen [HERE](http://hartis.si/datatables/).

## Plugins:

### angular.dataTables

This is the main plugin for integrating datatables with angular. Instead of recreating or empty/fill the whole table on collection changes as other similar plugis does this plugin handles model changes in a smart way so that only the collection items that are removed/added will be removed/added in datatables. Further more when an item in a collection is changed the apropriate row will be invalidated. This means that ordering/filtering will take the new value not the cached one.

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
<tt>dt-item-name</tt> path of the row data (default is 'item') <br />

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
  <span>item.engine</span>
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
Note that the template has special attribute [ng-non-bindable](https://docs.angularjs.org/api/ng/directive/ngNonBindable) that has to be applied to every template in order to work correctly. Within the template the special properties of [ngRepeat](https://docs.angularjs.org/api/ng/directive/ngRepeat) can be used. In the above example 'item' represent the data of the collection item. If you want to change that you can with the attribute dt-item-name in table tag.

If you want to define the template in code define template property in the column definition.

<b>NOTE:</b> when using this option searching and ordering will be disabled.

<tt>dt-expression</tt> angular expression to be evaluated

<b>Sample usage:</b>
```html
<table dt-table dt-data="orders" dt-options="orderGridOpts" dt-item-name="order">
    <thead>
        <th dt-data="OrderID">Order ID</th>
        <th dt-expression="order.Freight | currency">Freight</th>
        <th dt-expression="order.OrderDate | date:'shortDate'">Order Date</th>
    </thead>
</table>
```
Note that in the expression you cannot use special properties of ngRepeat like in the template option, but in opposite to the template option this option can be searchable and orderable.

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

### angular.dataTables.selectable

<b>Dependencies:</b> angular.dataTables.selectable

This plugin provides the ability to select a single row and have the current scope populated with special properties:

<tt>$selectedRow</tt> current selected row<br />
<tt>$selectedItem</tt> current selected row data<br />
<tt>$selectedRowIndex</tt> current selected row index<br />

<b>NOTE:</b> when one of these three properties is set the other two will also be modified. 

When user click on a row the clicked row (tr tag) a 'dt-selected-row' class will be added an the three above properties will be populated.

### angular.dataTables.colReorder

<b>Dependencies:</b> angular.dataTables, dataTables.colReorder

This plugin fixes the angular bindings when columns are reordered.


### dataTables.breeze.entityFilter

This plugin provide a select box to filter breeze entities. This will only work when you bind breeze entites to datatables. In order to enable this plugin you have to add char 'Y' to the dom (i.e. lfrYtip)

<b>Default configurations:</b>
```js
entityFilter: {
  'default': { 'text': 'Default', 'filter': ['Added', 'Modified', 'Unchanged', 'Detached'], 'selected': true },
  'all': { 'text': 'All', 'filter': [] },
  'added': { 'text': 'Added', 'filter': ['Added'] },
  'modified': { 'text': 'Modified', 'filter': ['Modified'] },
  'unchanged': { 'text': 'Unchanged', 'filter': ['Unchanged'] },
  'edited': { 'text': 'Edited', 'filter': ['Added', 'Modified'] },
  'detached': { 'text': 'Detached', 'filter': ['Detached'] },
  'deleted': { 'text': 'Deleted', 'filter': ['Deleted'] }
}
```
This filter will check the property entityAspect.entityState.name value and check if the state name exist in the current selected filter. Note that empty array means that all states are matched.


### angular.dataTables.breeze

This plugin enables paging/searching/ordering on the serverside using breeze query engine. In order to enable this plugin you have to define breeze property in datatables configuration.

<b>Sample:</b>
```js
breeze: {
    query: app.dataservice.getCustomersQuery(),
    entityName: "Customer",
    entityManager: null,
    projectOnlyTableColumns: false
}
```
<b>Properties:</b>

<tt>query</tt> is an isntance of Entity.Query<br />
<tt>entityName</tt> the entity name that will be returned by the server<br />
<tt>entityManager</tt> the entityManger that will be used for querying the server (Note: this is not requried if the query was populated with the entity manager using the 'using' function)<br />
<tt>projectOnlyTableColumns</tt> specify if only the column that are defined in the table will be fetched. Note if this option is set to true then server results will be plain objects (not breeze.Entity)<br />

### dataTables.remoteState (In development)

This plugin enables to store the table state on a remote location. One table can have multiple states in which one can be set as the default. The states will be shown on in a select box, when switching the table will load the selected state on the fly. This will also work with ColReorder and ColVis plugin.   


### TODO
<b>AdvanceFilter</b>



