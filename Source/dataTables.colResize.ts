module dt {
    export class ColResize {

        public static defaultSettings = {
            widthMatch: 'semiauto'     
        };
        private settings: any;
        private tableSize = -1;
        private initialized: boolean = false;
        private dt: any = {};
        private dom: any = {
            mouse: {
                startX: -1,
                startWidth: null,
                resizeElem: null
            },
            resize: false,
            scrollHead: null,
            scrollHeadTable: null,
            scrollFoot: null,
            scrollFootTable: null,
            scrollBody: null,
            scrollBodyTable: null,
            scrollX: false,
            scrollY: false
        };

        constructor(api, settings) {
            this.settings = $.extend(true, dt.ColResize.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.colResize = this;
            this.registerCallbacks();
        }

        public initialize(): void {
            $.each(this.dt.settings.aoColumns, (i, col) => {
                var $th = $(col.nTh);
                if (col.resizable === false) return;

                if (col.minWidth)
                    col._minWidthManual = col.minWidth;

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

                $th.off('mousedown.ColReorder');
                // listen to mousedown event
                $th.on('mousedown.ColResize', (e) => { return this.onMouseDown(e, $th, col); });
            });

            //Save scroll head and body if found
            this.dom.scrollHead = $('div.' + this.dt.settings.oClasses.sScrollHead, this.dt.settings.nTableWrapper);
            this.dom.scrollHeadTable = $('div.' + this.dt.settings.oClasses.sScrollHeadInner + ' > table', this.dom.scrollHead);

            this.dom.scrollFoot = $('div.' + this.dt.settings.oClasses.sScrollFoot, this.dt.settings.nTableWrapper);
            this.dom.scrollFootTable = $('div.' + this.dt.settings.oClasses.sScrollFootInner + ' > table', this.dom.scrollFoot);

            this.dom.scrollBody = $('div.' + this.dt.settings.oClasses.sScrollBody, this.dt.settings.nTableWrapper);
            this.dom.scrollBodyTable = $('> table', this.dom.scrollBody);
            if (this.dom.scrollFootTable) {
                this.dt.api.on('draw.dt', this.onDraw.bind(this));
                if (this.dt.settings._bInitComplete)
                    this.onDraw();
                this.dt.api.on('colPinFcDraw.dt', (e, colPin, data) => {
                    if (data.leftClone.header)
                        $('tfoot', data.leftClone.header).remove();
                    if (data.leftClone.footer)
                        $('thead', data.leftClone.footer).remove();
                    if (data.rightClone.header)
                        $('tfoot', data.rightClone.header).remove();
                    if (data.rightClone.footer)
                        $('thead', data.rightClone.footer).remove();
                });
            }

            this.dom.scrollX = this.dt.settings.oInit.sScrollX === undefined ? false : true;
            this.dom.scrollY = this.dt.settings.oInit.sScrollY === undefined ? false : true;

            switch (this.settings.widthMatch) {
                case 'none':
                    break;
                case 'auto':
                    this.dt.api.on('draw.dt', this.calcColumnMinWidths.bind(this)); //on every draw
                    if (this.dt.settings._bInitComplete)
                        this.calcColumnMinWidths();
                    break;
                default: //default is semiauto (calculate only on the first draw)
                    if (this.dt.settings._bInitComplete)
                        this.calcColumnMinWidths();
                    else
                        this.dt.api.one('draw.dt', this.calcColumnMinWidths.bind(this));
                    break;
            }
            
            //SaveTableWidth
            this.dt.settings.sTableWidthOrig = $(this.dt.settings.nTable).width();
            this.updateTableSize();

            if (this.dt.settings.oInit.bStateSave && this.dt.settings.oLoadedState) {
                this.loadState(this.dt.settings.oLoadedState);
            }
            
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'colResizeInitCompleted', 'colResizeInitCompleted', [this]);
        }

        private calcColumnMinWidths(e = null) {
            if (e != null && e.target !== this.dt.settings.nTable) return;

            $.each(this.dt.settings.aoColumns, (i, col) => {
                if (col.resizable === false || col._minWidthManual) return; //skip if column is not resizable or a custom width was given on init
                var $th = $(col.nTh);
                var colIdx = $th.parent().children().index(col.nTh);

                var maxWidth = -1; 

                if (this.dom.scrollX || this.dom.scrollY) {
                    $('thead>tr>th:nth-child(' + (colIdx + 1) + ')', this.dom.scrollHeadTable).each((ii, td) => {
                        maxWidth = Math.max(maxWidth, ColResizeHelper.calcWidth($(td)));
                    });
                    $('tbody>tr>td:nth-child(' + (colIdx + 1) + ')', this.dom.scrollBodyTable).each((ii, td) => {
                        maxWidth = Math.max(maxWidth, ColResizeHelper.calcWidth($(td)));
                    });
                    if (this.dom.scrollFootTable.length) {
                        $('tfoot>tr>th:nth-child(' + (colIdx + 1) + ')', this.dom.scrollFootTable).each((ii, td) => {
                            maxWidth = Math.max(maxWidth, ColResizeHelper.calcWidth($(td)));
                        });
                    }
                } else {
                    $('thead>tr>th:nth-child(' + (colIdx + 1) + ')', this.dt.settings.nTable).each((ii, td) => {
                        maxWidth = Math.max(maxWidth, ColResizeHelper.calcWidth($(td)));
                    });
                    $('tbody>tr>td:nth-child(' + (colIdx + 1) + ')', this.dt.settings.nTable).each((ii, td) => {
                        maxWidth = Math.max(maxWidth, ColResizeHelper.calcWidth($(td)));
                    });
                    $('tfoot>tr>th:nth-child(' + (colIdx + 1) + ')', this.dt.settings.nTable).each((ii, td) => {
                        maxWidth = Math.max(maxWidth, ColResizeHelper.calcWidth($(td)));
                    });
                }

                console.log(maxWidth);
                col.minWidth = maxWidth;
            });

        }

        private updateTableSize() {
            if (this.dom.scrollX && this.dom.scrollHeadTable.length)
                this.tableSize = this.dom.scrollHeadTable.width();
            else
                this.tableSize = -1;
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
                        this.dom.scrollFootTable.width(data.colResize.tableSize);
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

                    for (i = 0; i < columns.length; i++) {
                        this.dt.settings.aoColumns[i].nTh.style.width = columns[i];
                    }
                }

                this.dt.api.columns.adjust();
                if (this.dom.scrollX || this.dom.scrollY) // TODO: when stateSave is enabled with scrollX or scrollY resize will not work corectly. Check if can be fixed without a redraw
                    this.dt.api.draw(false);
            };

            if (this.initialized) {
                onInit();
                return;
            }
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'colResizeInitCompleted', () => {
                onInit();
            }, "ColResize_Init");
        }

        private saveState(data): void {
            if (!this.dt.settings._bInitComplete) {
                var oData = this.dt.settings.fnStateLoadCallback.call(this.dt.settings.oInstance, this.dt.settings);
                if (oData && oData.colResize)
                    data.colResize = oData.colResize;
                return;
            }
            this.updateTableSize();
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
            }, "ColResize_StateSave");

            /* State loading */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateLoaded', (oS, oData) => {
                this.loadState(oData);
            }, "ColResize_StateLoad");

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

        private onDraw(e?) {
            if (e != null && e.target !== this.dt.settings.nTable) return;

            if (this.dom.scrollFootTable.length) {
                $('thead', this.dom.scrollFootTable).remove();
                this.dom.scrollFootTable.prepend($('thead', this.dom.scrollBodyTable).clone());
            }

            if (this.dom.scrollHeadTable.length) {
                $('tfoot', this.dom.scrollHeadTable).remove();
                this.dom.scrollHeadTable.append($('tfoot', this.dom.scrollBodyTable).clone());
            }
            
            var removeHeaderWidth = (table) => {
                $('tfoot>tr>th', table).each((i, th) => {
                    $(th).css('width', '');
                });
            }
            //Remove all tfoot headers widths
            removeHeaderWidth(this.dom.scrollFootTable);
            removeHeaderWidth(this.dom.scrollBodyTable);
            removeHeaderWidth(this.dom.scrollHeadTable);
        }

        private overrideClickHander(col, $th) {
            var dtClickEvent = this.getColumnEvent(col, 'click', 'DT');
            //Remove the DataTables event so that ordering will not occur
            if (dtClickEvent) {
                $th.off('click.DT');
                $(document).one('click.ColResize', (e) => { //Add the original handler so that ordering will work
                    $th.on('click.DT', dtClickEvent.handler);
                });  
            }
        }

        private onMouseDown(e, $th, col): boolean {
            if (e.target !== $th.get(0)) return true;
            if ($th.css('cursor') != 'col-resize' || col.resizable === false) {
                var colReorder = this.dt.settings._colReorder;
                if (colReorder) {
                    colReorder._fnMouseDown.call(colReorder, e, $th.get(0));//Here we fix the e.preventDefault() in ColReorder so that we can have working inputs in headers
                }
                return true;
            }
            this.dom.mouse.startX = e.pageX;
            this.dom.mouse.prevX = e.pageX;
            this.dom.mouse.startWidth = $th.width();
            this.dom.mouse.resizeElem = $th;
            this.dom.resize = true;
            if (this.dt.settings.oFeatures.bAutoWidth)
                this.dt.settings.oFeatures.bAutoWidthOrig = true;
            this.dt.settings.oFeatures.bAutoWidth = false;

            /* Add event handlers to the document */
            $(document).on('mousemove.ColResize', (event) => { this.onMouseMove(event, col); });
            this.overrideClickHander(col, $th);
            $(document).one('mouseup.ColResize', (event) => { this.onMouseUp(event, col); });

            return false;
        }

        private onMouseUp(e, col): void {
            $(document).off('mousemove.ColResize');
            if (!this.dom.resize) return;
            var i;
            var columns = this.dt.settings.aoColumns;
            for (i = 0; i < columns.length; i++) {
                if (!columns[i].bVisible) continue;
                columns[i].sWidth = $(columns[i].nTh).css('width');
            }
            //Update the internal storage of the table's width (in case we changed it because the user resized some column and scrollX was enabled
            this.updateTableSize();

            //Save the state
            this.dt.settings.oInstance.oApi._fnSaveState(this.dt.settings);
            this.dom.resize = false;
        }

        private canColumnBeResized(col, newWidth): boolean {
            return (!col.minWidth || col.minWidth < newWidth) && (!col.maxWidth || col.maxWidth > newWidth);
        }

        private getPrevResizableColumnIdx(col, moveLength) {
            var columns = this.dt.settings.aoColumns;
            var colIdx = ColResizeHelper.indexOf(columns, col);
            for (var i = colIdx ; i >= 0; i--) {
                if (!columns[i].bVisible) continue;
                if (!columns[i].minWidth || columns[i].minWidth < ($(columns[i].nTh).width() + moveLength)) return i;
            }
            return -1;
        }

        private getNextResizableColumnIdx(col, moveLength) {
            var columns = this.dt.settings.aoColumns;
            var colIdx = ColResizeHelper.indexOf(columns, col);
            for (var i = (colIdx+1); i < columns.length; i++) {
                if (!columns[i].bVisible) continue;
                if (!columns[i].minWidth || columns[i].minWidth < ($(columns[i].nTh).width() - moveLength)) return i;
            }
            return -1;
        }

        private onMouseMove(e, col): void {
            var moveLength = e.pageX - this.dom.mouse.startX;
            var lastMoveLength = e.pageX - this.dom.mouse.prevX;
            if (moveLength == 0 || lastMoveLength == 0) return;
            var i;
            var columns = this.dt.settings.aoColumns;
            var headCol = $(this.dom.mouse.resizeElem);
            var headColNext = headCol.next();
            var colIdx = this.getColumnIndex(col);
            var thWidth = this.dom.mouse.startWidth + moveLength;
            var thNextWidth;
            var nextColIdx, prevColIdx;

            if (!this.dom.scrollX) {
                if (lastMoveLength < 0) {
                    thWidth = headColNext.width() - lastMoveLength;
                    prevColIdx = this.getPrevResizableColumnIdx(col, lastMoveLength);
                    if (prevColIdx < 0) {
                        this.dom.mouse.prevX = e.pageX;
                        return;
                    }
                    headCol = headColNext;
                    colIdx = colIdx + 1;
                    headColNext = $(columns[prevColIdx].nTh);
                    nextColIdx = prevColIdx;
                    thNextWidth = headColNext.width() + lastMoveLength;
                } else {
                    thWidth = headCol.width() + lastMoveLength;
                    nextColIdx = this.getNextResizableColumnIdx(col, lastMoveLength);

                    //If there is no columns that can be shrinked dont resize anymore
                    if (nextColIdx < 0) {
                        this.dom.mouse.prevX = e.pageX;
                        return;
                    }
                    headColNext = $(columns[nextColIdx].nTh);
                    thNextWidth = headColNext.width() - lastMoveLength;

                    if (col.maxWidth && col.maxWidth < thWidth) {
                        this.dom.mouse.prevX = e.pageX;
                        return;
                    }
                }
                if (!this.canColumnBeResized(columns[nextColIdx], thNextWidth)) {
                    this.dom.mouse.prevX = e.pageX;
                    return;
                }
                headColNext.width(thNextWidth);
            } else {
                if (!this.canColumnBeResized(col, thWidth)) {
                    this.dom.mouse.prevX = e.pageX;
                    return;
                }
                this.dom.scrollHeadTable.width(this.tableSize + moveLength);
                this.dom.scrollBodyTable.width(this.tableSize + moveLength);
                this.dom.scrollFootTable.width(this.tableSize + moveLength);
            }
            headCol.width(thWidth);
            
            //scrollX or scrollY enabled
            if (this.dom.scrollBody.length) { //th and thNext are in the scrollHeadTable
                var colDomIdx = 0;
                for (i = 0; i < this.dt.settings.aoColumns.length && i != colIdx; i++) {
                    if (this.dt.settings.aoColumns[i].bVisible)
                        colDomIdx++;
                }
                
                //Get the table
                var bodyCol = $('thead>tr>th:nth(' + colDomIdx + ')', this.dom.scrollBodyTable);
                var footCol = $('thead>tr>th:nth(' + colDomIdx + ')', this.dom.scrollFootTable);

                //This will happen only when Scroller plugin is used without scrollX
                if (!this.dom.scrollX) {
                    var nextColDomIdx = 0;
                    for (i = 0; i < this.dt.settings.aoColumns.length && i != nextColIdx; i++) {
                        if (this.dt.settings.aoColumns[i].bVisible)
                            nextColDomIdx++;
                    }
                    var bodyColNext = $('thead>tr>th:nth(' + nextColDomIdx + ')', this.dom.scrollBodyTable);
                    var footColNext = $('thead>tr>th:nth(' + nextColDomIdx + ')', this.dom.scrollFootTable);

                    bodyColNext.width(thNextWidth);
                    if (thWidth > 0)
                        bodyCol.width(thWidth);

                    footColNext.width(thNextWidth);
                    if (thWidth > 0)
                        footCol.width(thWidth);
                }

                //Resize the table and the column
                if (this.dom.scrollX && thWidth > 0) {
                    bodyCol.width(thWidth);
                    footCol.width(thWidth);
                }
            }
            this.dom.mouse.prevX = e.pageX;
        }

        private destroy() {
            
        }
    }

    export class ColResizeHelper {
        private static fakeEl: JQuery;

        public static indexOf(arr, item, equalFun = null) {
            for (var i = 0; i < arr.length; i++) {
                if (equalFun) {
                    if (equalFun(arr[i], item)) return i;
                } else if (arr[i] === item) return i;
            }
            return -1;
        }

        public static calcBlockWidth(item) {
            var pos = item.css("position");   // save original value
            item.css("position", "absolute");
            var width = item.width();
            item.css("position", pos);
            return (width);
        }

        public static calcWidth(elem): number {
            var children = elem.children();
            if (children.length) {
                var textWidth = ColResizeHelper.calcTextWidth(elem);
                var maxWidth = -1;
                var inlineElemsWidth = 0;
                $.each(children, (i, child) => {
                    var $child = $(child);
                    var display = $child.css('display');
                    switch (display) {
                        case 'inline-block':
                            inlineElemsWidth += ColResizeHelper.calcBlockWidth($child);
                            break;
                        case 'inline':
                            inlineElemsWidth += $(child).width();
                            break;
                        case 'block':
                            maxWidth = Math.max(maxWidth, ColResizeHelper.calcBlockWidth($child));
                            break;
                        default:
                            maxWidth = Math.max(maxWidth, $child.width());
                            break;
                    }
                });
                return Math.max(textWidth + inlineElemsWidth, maxWidth);
            } else {
                return ColResizeHelper.calcTextWidth(elem);
            }
        }

        public static calcTextWidth(elem, text = null, font = null): number {
            if (!ColResizeHelper.fakeEl) ColResizeHelper.fakeEl = $('<span>').hide().appendTo(document.body);
            ColResizeHelper.fakeEl.text(text || elem.val() || elem.text()).css('font', font || elem.css('font'));
            return ColResizeHelper.fakeEl.width();
        }

    }
}

(function (window, document, undefined) {

    //Register events
    $.fn.DataTable.models.oSettings.colResizeInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.register('colResize.init()', function (settings) {
        var colResize = new dt.ColResize(this, settings);
        if (this.settings()[0]._bInitComplete)
            colResize.initialize();
        else
            this.one('init.dt', () => { colResize.initialize(); });
        
        return null;
    });

    $.fn.DataTable.Api.register('colResize.calcMinWidths()', function () {
        var colResize = this.settings()[0].colResize;
        colResize.calcColumnMinWidths();
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().colResize.init(oSettings.oInit.colResize);
        },
        "cFeature": "J",
        "sFeature": "ColResize"
    });

}(window, document, undefined));