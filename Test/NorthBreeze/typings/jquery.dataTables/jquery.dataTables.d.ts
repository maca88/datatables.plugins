// Type definitions for JQuery DataTables 1.10
// Project: http://www.datatables.net
// Definitions by: Armin Sander <https://github.com/pragmatrix/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

// missing:
// - Static methods that are defined in JQueryStatic.fn are not typed.
// - Plugin and extension definitions are not typed.

interface JQuery
{
	DataTable(param? :DataTables.Options) : DataTables.DataTable;
}

declare module DataTables
{
	export interface DataTable
	{
		/// Perform a jQuery selector action on the table's TR elements (from the tbody) and return the resulting jQuery object.
		$(selector:string, opts?:RowParams): JQuery;
		$(selector:Node[], opts?:RowParams): JQuery;
		$(selector:JQuery, opts?:RowParams): JQuery;

		/// Almost identical to $ in operation, but in this case returns the data for the matched rows.
		_(selector:string, opts?:RowParams): any[];
		_(selector:Node[], opts?:RowParams): any[];
		_(selector:JQuery, opts?:RowParams): any[];

		/// Add a single new row or multiple rows of data to the table.
		fnAddData(data:any, redraw?:boolean) : number[];

		/// This function will make DataTables recalculate the column sizes.
		fnAdjustColumnSizing(redraw? : boolean) : void;

		/// Quickly and simply clear a table
		fnClearTable(redraw? : boolean) : void;

		/// The exact opposite of 'opening' a row, this function will close any rows which are currently 'open'.
		fnClose(node: Node) : number;

		///	Remove a row for the table
		fnDeleteRow(index: number, callback?: () => void, redraw?: boolean) : any[];
		fnDeleteRow(tr: Node, callback?: () => void, redraw?: boolean) : any[];

		/// Restore the table to it's original state in the DOM by removing all of DataTables enhancements,
		/// alterations to the DOM structure of the table and event listeners.
		fnDestroy(remove?: boolean) : void;

		/// Redraw the table
		fnDraw(complete? : boolean) : void;

		/// Filter the input based on data
		fnFilter(input: string, column? : number, regex?: boolean, smart? : boolean, showGlobal?: boolean, caseInsensitive? : boolean) : void;

		/// Get the data for the whole table, an individual row or an individual cell based on the provided parameters.
		fnGetData(row?: Node, col? : number) : any;
		fnGetData(row?: number, col? : number) : any;

		/// Get an array of the TR nodes that are used in the table's body.
		fnGetNodes(row? : number) : any; // Node[] | Node

		/// Get the array indexes of a particular cell from it's DOM element and column index including hidden columns
		fnGetPosition(node: Node) : any; // number | number[]

		/// Check to see if a row is 'open' or not.
		fnIsOpen(tr: Node) : boolean;

		/// This function will place a new row directly after a row which is currently on display on the page,
		/// with the HTML contents that is passed into the function.
		fnOpen(node: Node, html: string, clazz: string) : Node;
		fnOpen(node: Node, html: Node, clazz: string) : Node;
		fnOpen(node: Node, html: JQuery, clazz: string) : Node;

		/// Change the pagination - provides the internal logic for pagination in a simple API function.
		fnPageChange(action: string, redraw?: boolean) : void;
		fnPageChange(page: number, redraw?: boolean) : void;

		/// Show a particular column
		fnSetColumnVis(column: number, show: boolean, redraw?: boolean) : void;

		/// Get the settings for a particular table for external manipulation
		fnSettings() : Settings;

		/// Sort the table by a particular column
		fnSort(col: number) : void;
		fnSort(col: any[][]) : void;

		/// Attach a sort listener to an element for a given column
		fnSortListener(node: Node, column: number, callback? : () => void): void;

		/// Update a table cell or row - this method will accept either a single value to update the cell with,
		/// an array of values with one element for each column or an object in the same format as the original data source.
		fnUpdate(data: any, row: Node, column?:number, redraw?: boolean, action? : boolean) : number;
		fnUpdate(data: any, dataIndex: number, column?:number, redraw?: boolean, action? : boolean) : number;

		/// Provide a common method for plug-ins to check the version of DataTables being used,
		/// in order to ensure compatibility.
		fnVersionCheck(version: string) : boolean;
	}

	export interface Static
	{
		/// Provide a common method for plug-ins to check the version of DataTables being used,
		/// in order to ensure compatibility.
		fnVersionCheck(version: string) : boolean;

		/// Check if a TABLE node is a DataTable table already or not.
		fnIsDataTable(table: Node) : boolean;

		/// Get all DataTable tables that have been initialised.
		fnTables(visible? : boolean) : Node[];
	}

	export interface RowParams
	{
		/// Select TR elements that meet the current filter criterion ("applied") or all TR elements (i.e. no filter).
		filter?: string;

		/// Order of the TR elements in the processed array.
		/// Can be either 'current', whereby the current sorting of the table is used, or
		/// 'original' whereby the original order the data was read into the table is used.
		order?: string;

		/// Limit the selection to the currently displayed page
		/// ("current") or not ("all"). If 'current' is given, then order is assumed to be
		/// 'current' and filter is 'applied', regardless of what they might be given as.
		page?: string;
	}

	export interface Options
	{
		data?: any[];
		order?: any[];
        orderFixed?: any[];
		ajax?: any; //TODO: implement
        lengthMenu?: any[];
        columns?: ColumnOptions[];
        columnDefs?: ColumnDef[];
        searchCols?: any[];
        stripeClasses?: string[];
        autoWidth?: boolean;
        deferRender?: boolean;
        destroy?: boolean;
        searching?: boolean;
        info?: boolean;
        jQueryUI?: boolean;
        lengthChange?: boolean;
        paging?: boolean;
        processing?: boolean;
        retrieve?: boolean;
		bScrollAutoCss?: boolean;
        scrollCollapse?: boolean;
		bScrollInfinite?: boolean;
        serverSide?: boolean;
        ordering?: boolean;
        orderMulti?: boolean;
        orderCellsTop?: boolean;
        orderClasses?: boolean;
        stateSave?: boolean;
		fnCookieCallback?: CookieCallback;
        createdRow?: RowCreatedCallback;
        drawCallback?: DrawCallback;
        footerCallback?: FooterCallback;
        formatNumber?: FormatNumber;
        headerCallback?: HeaderCallback; //TODO: check fheaderCallback??
        infoCallback?: InfoCallback;
        initComplete?: InitComplete;
        preDrawCallback?: PreDrawCallback;
        rowCallback?: RowCallback;

        stateLoadCallback?: StateLoadCallback;
        stateLoadParams?: StateLoadParams;
        stateLoaded?: StateLoaded;
        stateSaveCallback?: StateSaveCallback;
        stateSaveParams?: StateSaveParams;
        stateDuration?: number;
        deferLoading?: any;
        pageLength?: number;
        displayStart?: number;
		iScrollLoadGap?: number;
        tabIndex?: number;
        classes?: any; //TODO: class
        language?: LanguageOptions;
        search?: any;
        //ajaxDataProp?: string;
		//sAjaxSource?: string;
		sCookiePrefix?: string;
        dom?: string;
        pagingType?: string;
        scrollX?: string;
        scrollXInner?: string;
        scrollY?: string;
		//sServerMethod? : string;
	}

	export interface LanguageOptions
	{
        aria? : AriaOptions;
        paginate? : PaginateOptions;
        emptyTable?: string;
        info?: string;
        infoEmpty?: string;
        infoFiltered?: string;
        infoPostFix?: string;
        decimal?: string;
        thousands?: string;
        lengthMenu?: string;
        loadingRecords?: string;
        processing?: string;
        search?: string;
        url?: string;
        zeroRecords?: string;
	}

	export interface AriaOptions
	{
        sortAscending?: string;
        sortDescending?: string;
	}

	export interface PaginateOptions
	{
        first?: string;
        last?: string;
        next?: string;
        previous?: string;
	}

	export interface ColumnOptions
	{
        orderData?: number[];
        orderSequence?: string[];
        searchable? : boolean;
        orderable? : boolean;
        visible? : boolean;
		_bAutoType? : boolean;
        createdCell?: CreatedCell;
		iDataSort?: number;
        data?: any;
        render?: any;
        cellType?: string;
        class?: string;
        contentPadding?: string;
        defaultContent?: string;
        name?: string;
        orderDataType?: string;
		sSortingClass?: string; //???
        title?: string;
        type?: string;
        width?: string;
	}

	export interface ColumnDef extends ColumnOptions
	{
		aTargets: any[];
	}

	export interface Settings
	{
		oFeatures : Features;
		oScroll: ScrollingSettings;
		oLanguage : { fnInfoCallback : InfoCallback; };
		oBrowser : { bScrollOversize : boolean; };
		aanFeatures: Node[][];
		aoData: Row[];
		aiDisplay: number[];
		aiDisplayMaster: number[];
		aoColumns: Column[];
		aoHeader: any[];
		aoFooter: any[];
		asDataSearch: string[];
		oPreviousSearch: any;
		aoPreSearchCols: any[];
		aaSorting: any[][];
		aaSortingFixed: any[][];
		asStripeClasses: string[];
		asDestroyStripes: string[];
		sDestroyWidth: number;
		aoRowCallback: RowCallback[];
		aoHeaderCallback: HeaderCallback[];
		aoFooterCallback: FooterCallback[];
		aoDrawCallback: DrawCallback[];
		aoRowCreatedCallback: RowCreatedCallback[];
		aoPreDrawCallback: PreDrawCallback[];
		aoInitComplete: InitComplete[];
		aoStateSaveParams: StateSaveParams[];
		aoStateLoadParams: StateLoadParams[];
		aoStateLoaded: StateLoaded[];
		sTableId: string;
		nTable: Node;
		nTHead: Node;
		nTFoot: Node;
		nTBody: Node;
		nTableWrapper: Node;
		bDeferLoading: boolean;
		bInitialized: boolean;
		aoOpenRows: any[];
		sDom: string;
		sPaginationType: string;
		iCookieDuration: number;
		sCookiePrefix: string;
		fnCookieCallback: CookieCallback;
		aoStateSave: StateSaveCallback[];
		aoStateLoad: StateLoadCallback[];
		oLoadedState: any;
		sAjaxSource: string;
		sAjaxDataProp: string;
		bAjaxDataGet: boolean;
		jqXHR: any;
		//fnServerData: any;
		aoServerParams: any[];
		sServerMethod: string;
		fnFormatNumber: FormatNumber;
		aLengthMenu: any[];
		iDraw: number;
		bDrawing: boolean;
		iDrawError: number;
		_iDisplayLength: number;
		_iDisplayStart: number;
		_iDisplayEnd: number;
		_iRecordsTotal: number;
		_iRecordsDisplay: number;
		bJUI: boolean;
		oClasses: any;
		bFiltered: boolean;
		bSorted: boolean;
		bSortCellsTop: boolean;
		oInit: any;
		aoDestroyCallback: any[];
		fnRecordsTotal: () => number;
		fnRecordsDisplay: () => number;
		fnDisplayEnd: () => number;
		oInstance : any;
		sInstance: string;
		iTabIndex: number;
		nScrollHead: Node;
		nScrollFoot: Node;
	}

	export interface Features
	{
		bAutoWidth: boolean;
		bDeferRender: boolean;
		bFilter: boolean;
		bInfo: boolean;
		bLengthChange: boolean;
		bPaginate: boolean;
		bProcessing: boolean;
		bServerSize: boolean;
		bSort: boolean;
		bSortClasses: boolean;
		bStateSave: boolean;
	}

	export interface ScrollingSettings
	{
		bAutoCss : boolean;
		bCollapse: boolean;
		bInfinite: boolean;
		iBarWidth: number;
		iLoadGap: number;
		sX: string;
		sY: string;
	}

	export interface Row
	{
		nTr: Node;
		_aData: any;
		_aSortData: any[];
		_anHidden: Node[];
		_sRowStripe: string;
	}

	export interface Column
	{
		aDataSort?: any;
		asSorting?: string[];
		bSearchable? : boolean;
		bSortable?: boolean;
		bVisible?: boolean;
		_bAutoType?: boolean;
		fnCreatedCell?: CreatedCell;
		fnGetData?: (data: any, specific: string) => any;
		fnSetData?: (data: any, value: any) => void;
		data?: any;
		mRender?: any;
		nTh?: Node;
		nIf?: Node;
		class?: string;
		sContentPadding?: string;
		defaultContent?: string;
		name?: string;
		sSortDataType?: string;
		sSortingClass?: string;
		sSortingClassJUI?: string;
		title?: string;
		sType?: string;
		sWidth?: string;
		sWidthOrig?: string;
	}

	export interface CookieCallback
	{
		(name: string, data: any, expires: string, path: string, cookie: string) : void;
	}

	export interface RowCreatedCallback
	{
		(row: Node, data: any[], dataIndex: number) : void;
	}

	export interface DrawCallback
	{
		(settings: Settings) : void;
	}

	export interface FooterCallback
	{
		(foot: Element, data: any[], start:number, end:number, display: number[]) : void;
	}

	export interface FormatNumber
	{
		(toFormat: number) : string;
	}

	export interface HeaderCallback
	{
		(head: Element, data: any[], start:number, end:number, display: number[]) : void;
	}

	export interface InfoCallback
	{
		(settings: Settings, start: number, end: number, max:number, total: number, pre: string) : string;
	}

	export interface InitComplete
	{
		(settings: Settings, json: any) : void;
	}

	export interface PreDrawCallback
	{
		(settings: Settings) : boolean;
	}

	export interface RowCallback
	{
		(row : Settings, data: any[], displayIndex: number, displayIndexFull: number) : void;
	}

	export interface StateLoadCallback
	{
		(settings: Settings) : any;
	}

	export interface StateLoadParams
	{
		(settings: Settings, data: any) : void;
	}

	export interface StateLoaded
	{
		(settings: Settings, data: any) : void;
	}

	export interface StateSaveCallback
	{
		(settings: any, data:any) : void;
	}

	export interface StateSaveParams
	{
		(settings: any, data:any) : void;
	}

	export interface CreatedCell
	{
		(nTd: Node, cellData: any, rowData: any, row: number, col: number) : void;
	}
}