module dt {
    export class ColResize {

        private settings: any;
        private tableSize = -1;
        private initialized: boolean = false;
        private dt: any = {};
        private dom: any = {
            mouse: {
                startX: -1,
                nextStartWidth: null,
                startWidth: null,
                resizeElem: null
            },
            resize: false,
            scrollHead: null,
            scrollHeadTable: null,
            scrollBody: null,
            scrollBodyTable: null,
            scrollX: false
        };

        constructor(api, settings) {
            this.settings = $.extend(true, {}, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.colResize = this;
            this.registerCallbacks();
        }

        public initialize(): void {
            $.each(this.dt.settings.aoColumns, (i, col) => {
                var $th = $(col.nTh);
                if (col.resizable === false) return;
                // listen to mousemove event for resize
                $th.bind('mousemove.ColResize', (e: any) => {
                    if (this.dom.resize || col.resizable === false) return;
                    /* Store information about the mouse position */
                    var $thTarget = e.target.nodeName.toUpperCase() == 'TH' ? $(e.target) : $(e.target).closest('TH');
                    var offset = $thTarget.offset();
                    var nLength = $thTarget.innerWidth();
                    /* are we on the col border (if so, resize col) */
                    if (Math.abs(e.pageX - Math.round(offset.left + nLength)) <= 5) {
                        $thTarget.css({ 'cursor': 'col-resize' });
                    }
                    else
                        $thTarget.css({ 'cursor': 'pointer' });
                });
                
                //Save the original width
                //col._sWidth_Orig = col.sWidth;

                var colReorderMouseDownEvent = this.getColumnEvent(col, 'mousedown', 'ColReorder');
                //Remove the ColReorder handler so that reordering will not occur on resizing
                if (colReorderMouseDownEvent)
                    $th.off('mousedown.ColReorder');

                // listen to mousedown event
                $th.on('mousedown.ColResize', (e) => { return this.onMouseDown(e, $th, col, colReorderMouseDownEvent); });
            });

            //Save scroll head and body if found
            this.dom.scrollHead = $('div.' + this.dt.settings.oClasses.sScrollHead, this.dt.settings.nTableWrapper);
            this.dom.scrollHeadTable = $('div.' + this.dt.settings.oClasses.sScrollHeadInner + ' > table', this.dom.scrollHead);

            this.dom.scrollBody = $('div.' + this.dt.settings.oClasses.sScrollBody, this.dt.settings.nTableWrapper);
            this.dom.scrollBodyTable = $('> table', this.dom.scrollBody);

            this.dom.scrollX = this.dt.settings.oInit.sScrollX === undefined ? false : true;

            //SaveTableWidth
            this.dt.settings.sTableWidthOrig = $(this.dt.settings.nTable).width();

            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'colResizeInitCompleted', 'colResizeInitCompleted', [this]);
        }

        private getColumnIndex(col: any) : number {
            //Get the current column position
            var colIdx = -1;
            for (var i = 0; i < this.dt.settings.aoColumns.length; i++) {
                if (this.dt.settings.aoColumns[i] === col) {
                    colIdx = i;
                    break;
                }
            }
            return colIdx;
        }

        private getColumnEvent(col, type, ns) : any {
            var event;
            var thEvents = (<any>$)._data(col.nTh, "events");
            $.each(thEvents[type] || [], (idx, handler) => {
                if (handler.namespace === ns)
                    event = handler;
            });
            return event;
        }

        private loadState(data) : void {
            var i, col;

            var onInit = () => {
                if (!data.colResize) {
                    if (this.dt.settings.oFeatures.bAutoWidthOrig)
                        this.dt.settings.oFeatures.bAutoWidth = true;
                    else if (this.dt.settings.sTableWidthOrig)
                        $(this.dt.settings.nTable).width(this.dt.settings.sTableWidthOrig);

                    for (i = 0; i < this.dt.settings.aoColumns.length; i++) {
                        col = this.dt.settings.aoColumns[i];
                        if (col._ColResize_WidthOrig !== undefined) {
                            col.sWidthOrig = col._ColResize_WidthOrig;
                        }
                    }

                } else {
                    var columns = data.colResize.columns || [];
                    var wMap = {}

                    if (this.dt.settings.oFeatures.bAutoWidth) {
                        this.dt.settings.oFeatures.bAutoWidth = false;
                        this.dt.settings.oFeatures.bAutoWidthOrig = true;
                    }

                    if (this.dom.scrollX && data.colResize.tableSize > 0) {
                        this.dom.scrollHeadTable.width(data.colResize.tableSize);
                        this.dom.scrollBodyTable.width(data.colResize.tableSize);
                    }

                    for (i = 0; i < columns.length; i++) {
                        wMap[i] = columns[i];
                    }

                    for (i = 0; i < this.dt.settings.aoColumns.length; i++) {
                        col = this.dt.settings.aoColumns[i];
                        var idx = col._ColReorder_iOrigCol != null ? col._ColReorder_iOrigCol : i;

                        col._ColResize_WidthOrig = col.sWidthOrig;
                        col.sWidth = wMap[idx];
                        col.sWidthOrig = wMap[idx];
                    }
                }
                this.dt.api.columns.adjust();
            };

            if (this.initialized) {
                onInit();
                return;
            }
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'colResizeInitCompleted', () => {
                onInit();
            }, "ColResize_Init");
        }

        private saveState(data) : void {
            data.colResize = {
                columns: [],
                tableSize: this.tableSize
            };

            data.colResize.columns.length = this.dt.settings.aoColumns.length;
            for (var i = 0; i < this.dt.settings.aoColumns.length; i++) {
                var col = this.dt.settings.aoColumns[i];
                var idx = col._ColReorder_iOrigCol != null ? col._ColReorder_iOrigCol : i;
                data.colResize.columns[idx] = col.sWidth;
            }
        }

        private registerCallbacks() : void {
            /* State saving */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateSaveParams', (oS, oData) => {
                this.saveState(oData);
            }, "ColResize_State");

            /* State loading */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateLoadParams', (oS, oData) => {
                this.loadState(oData);
            }, "ColResize_State");

            if ($.fn.DataTable.models.oSettings.remoteStateInitCompleted !== undefined) {
                //Integrate with remote state
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateLoadedParams', (s, data) => {
                    this.loadState(data);
                }, "ColResize_StateLoad");
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateSaveParams', (s, data) => {
                    this.saveState(data);
                }, "ColResize_StateSave");
            }
            
        }

        private onMouseDown(e, $th, col, colReorderMouseDownEvent): boolean {
            if ($th.css('cursor') != 'col-resize' || col.resizable === false ) {
                if (colReorderMouseDownEvent != null && $.isFunction(colReorderMouseDownEvent.handler))
                    return colReorderMouseDownEvent.handler(e);
                return false;
            }
            this.dom.mouse.startX = e.pageX;
            this.dom.mouse.startWidth = $th.width();
            this.dom.mouse.resizeElem = $th;
            this.dom.mouse.nextStartWidth = $th.next().width();
            this.dom.resize = true;
            if (this.dt.settings.oFeatures.bAutoWidth)
                this.dt.settings.oFeatures.bAutoWidthOrig = true;
            this.dt.settings.oFeatures.bAutoWidth = false;

            /* Add event handlers to the document */
            $(document).on('mousemove.ColResize', (event) => { this.onMouseMove(event, col); });

            var dtClickEvent = this.getColumnEvent(col, 'click', 'DT');
            //Remove the DataTables event so that ordering will not occur
            if (dtClickEvent) {
                $th.off('click.DT');
                $(document).one('click.ColResize', (event) => { $th.on('click.DT', dtClickEvent.handler); });  //Add the original handler so that ordering will work
            }

            $(document).on('mouseup.ColResize', (event) => { this.onMouseUp(event, col); });

            /* Save the state */
            this.dt.settings.oInstance.oApi._fnSaveState(this.dt.settings);

            return false;
        }

        private onMouseUp(e, col): void {
            $(document).off('mousemove.ColResize');
            $(document).off('mouseup.ColResize');
            if (!this.dom.resize) return;
            var i;
            var colIdx = this.getColumnIndex(col);
            var currentColumn;
            var nextVisibleColumnIndex;
            var previousVisibleColumnIndex;

            //Save the new resized column's width - add only the diff to the orig width in order ColPin to work
            col.sWidth = Number(col.sWidth.replace('px', '')) + (e.pageX - this.dom.mouse.startX) + 'px'; //  $(this.dom.mouse.resizeElem).innerWidth() + "px";

            //If other columns might have changed their size, save their size too
            if (!this.dom.scrollX) {
                //The colResized index (internal model) here might not match the visible index since some columns might have been hidden
                for (nextVisibleColumnIndex = colIdx + 1; nextVisibleColumnIndex < this.dt.settings.aoColumns.length; nextVisibleColumnIndex++) {
                    if (this.dt.settings.aoColumns[nextVisibleColumnIndex].bVisible)
                        break;
                }

                for (previousVisibleColumnIndex = colIdx - 1; previousVisibleColumnIndex >= 0; previousVisibleColumnIndex--) {
                    if (this.dt.settings.aoColumns[previousVisibleColumnIndex].bVisible)
                        break;
                }

                if (this.dt.settings.aoColumns.length > nextVisibleColumnIndex)
                    this.dt.settings.aoColumns[nextVisibleColumnIndex].sWidth = $(this.dom.mouse.resizeElem).next().innerWidth() + "px";
                else { //The column resized is the right-most, so save the sizes of all the columns at the left
                    currentColumn = this.dom.mouse.resizeElem;
                    for (i = previousVisibleColumnIndex; i > 0; i--) {
                        if (this.dt.settings.aoColumns[i].bVisible) {
                            currentColumn = $(currentColumn).prev();
                            this.dt.settings.aoColumns[i].sWidth = $(currentColumn).innerWidth() + "px";
                        }
                    }
                }
            }

            //Update the internal storage of the table's width (in case we changed it because the user resized some column and scrollX was enabled
            if (this.dom.scrollX && this.dom.scrollHead.length) {
                this.tableSize = this.dom.scrollHeadTable.width();
            }

            //Save the state
            this.dt.settings.oInstance.oApi._fnSaveState(this.dt.settings);
            
            this.dom.resize = false;
        }

        private onMouseMove(e, col): void {
            var moveLength = e.pageX - this.dom.mouse.startX;
            var $th = $(this.dom.mouse.resizeElem);
            var $thNext = $th.next();

            if (this.dom.scrollX && this.dom.scrollHead.length) {
                if (this.tableSize < 0)
                    this.tableSize = this.dom.scrollHeadTable.width();
                this.dom.scrollHeadTable.width(this.tableSize + moveLength);
            }

            if (moveLength != 0 && !this.dom.scrollX)
                $thNext.width(this.dom.mouse.nextStartWidth - moveLength);
            $th.width(this.dom.mouse.startWidth + moveLength);

            
            if (this.dom.scrollBody.length) {
                var visibleColumnIndex;
                var colIdx = this.getColumnIndex(col);
                var currentColumnIndex;
                visibleColumnIndex = 0;
                for (currentColumnIndex = 0; currentColumnIndex < this.dt.settings.aoColumns.length && currentColumnIndex != colIdx; currentColumnIndex++) {
                    if (this.dt.settings.aoColumns[currentColumnIndex].bVisible)
                        visibleColumnIndex++;
                }
                //Get the table
                var resizingHeaderColumn = $('thead tr th:nth(' + visibleColumnIndex + ')', this.dom.scrollBodyTable);

                //This will happen only when Scroller plugin is used without scrollX
                if (!this.dom.scrollX && moveLength != 0) {
                    resizingHeaderColumn.width(this.dom.mouse.startWidth + moveLength);
                    resizingHeaderColumn.next().width(this.dom.mouse.nextStartWidth - moveLength);
                }

                //Resize the table and the column
                if (this.dom.scrollX) {
                    this.dom.scrollBodyTable.width(this.tableSize + moveLength);
                    resizingHeaderColumn.width(this.dom.mouse.startWidth + moveLength);
                }  
            }
        }

        private destroy() {
            
        }
    }
}

(function (window, document, undefined) {

    //Register events
    $.fn.DataTable.models.oSettings.colResizeInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.prototype.colResize = function (settings) {
        var colResize = new dt.ColResize(this, settings);
        if (this.settings()[0].bInitialized)
            colResize.initialize();
        else
            this.one('init.dt', () => { colResize.initialize(); });
        
        return null;
    };

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().colResize(oSettings.oInit.colResize);
        },
        "cFeature": "J",
        "sFeature": "ColResize"
    });

}(window, document, undefined));