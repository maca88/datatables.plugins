var dt;
(function (dt) {
    var ColResize = (function () {
        function ColResize(api, settings) {
            this.tableSize = -1;
            this.initialized = false;
            this.dt = {};
            this.dom = {
                fixedLayout: false,
                mouse: {
                    startX: -1,
                    startWidth: null,
                    resizeElem: null
                },
                table: {
                    prevWidth: null
                },
                origState: true,
                resize: false,
                scrollHead: null,
                scrollHeadTable: null,
                scrollFoot: null,
                scrollFootTable: null,
                scrollFootInner: null,
                scrollBody: null,
                scrollBodyTable: null,
                scrollX: false,
                scrollY: false
            };
            this.settings = $.extend(true, {}, dt.ColResize.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.colResize = this;
            this.registerCallbacks();
        }
        ColResize.prototype.initialize = function () {
            var _this = this;
            $.each(this.dt.settings.aoColumns, function (i, col) {
                var $th = $(col.nTh);
                if (col.resizable === false)
                    return;

                // listen to mousemove event for resize
                $th.on('mousemove.ColResize', function (e) {
                    if (_this.dom.resize || col.resizable === false)
                        return;

                    /* Store information about the mouse position */
                    var $thTarget = e.target.nodeName.toUpperCase() == 'TH' ? $(e.target) : $(e.target).closest('TH');
                    var offset = $thTarget.offset();
                    var nLength = $thTarget.innerWidth();

                    /* are we on the col border (if so, resize col) */
                    if (Math.abs(e.pageX - Math.round(offset.left + nLength)) <= 5) {
                        $thTarget.css({ 'cursor': 'col-resize' });
                    } else
                        $thTarget.css({ 'cursor': 'pointer' });
                });

                //Save the original width
                col._ColResize_sWidthOrig = col.sWidthOrig;
                col.initWidth = $th.width();
                col.minWidthOrig = col.minWidth;

                $th.on('dblclick.ColResize', function (e) {
                    _this.onDblClick(e, $th, col);
                });

                $th.off('mousedown.ColReorder');

                // listen to mousedown event
                $th.on('mousedown.ColResize', function (e) {
                    return _this.onMouseDown(e, $th, col);
                });
            });

            //Save scroll head and body if found
            this.dom.scrollHead = $('div.' + this.dt.settings.oClasses.sScrollHead, this.dt.settings.nTableWrapper);
            this.dom.scrollHeadInner = $('div.' + this.dt.settings.oClasses.sScrollHeadInner, this.dom.scrollHead);
            this.dom.scrollHeadTable = $('div.' + this.dt.settings.oClasses.sScrollHeadInner + ' > table', this.dom.scrollHead);

            this.dom.scrollFoot = $('div.' + this.dt.settings.oClasses.sScrollFoot, this.dt.settings.nTableWrapper);
            this.dom.scrollFootInner = $('div.' + this.dt.settings.oClasses.sScrollFootInner, this.dom.scrollFoot);
            this.dom.scrollFootTable = $('div.' + this.dt.settings.oClasses.sScrollFootInner + ' > table', this.dom.scrollFoot);

            this.dom.scrollBody = $('div.' + this.dt.settings.oClasses.sScrollBody, this.dt.settings.nTableWrapper);
            this.dom.scrollBodyTable = $('> table', this.dom.scrollBody);
            this.dt.api.on('draw.dt', this.onDraw.bind(this));
            if (this.dom.scrollFootTable) {
                this.dt.api.on('colPinFcDraw.dt', function (e, colPin, data) {
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

            //SaveTableWidth
            this.dt.settings.sTableWidthOrig = $(this.dt.settings.nTable).width();
            this.updateTableSize();

            this.dt.settings.oFeatures.bAutoWidthOrig = this.dt.settings.oFeatures.bAutoWidth;
            this.dt.settings.oFeatures.bAutoWidth = false;

            if (this.dt.settings.oInit.bStateSave && this.dt.settings.oLoadedState) {
                this.loadState(this.dt.settings.oLoadedState);
            }

            this.onDraw();
            this.dom.table.preWidth = parseFloat(this.dom.scrollBodyTable.css('width'));

            if (!this.dom.scrollX && this.dom.scrollY && this.settings.fixedLayout && this.dt.settings._reszEvt) {
                //We have to manually resize columns on window resize
                var eventName = 'resize.DT-' + this.dt.settings.sInstance;
                $(window).off(eventName);
                $(window).on(eventName, function () {
                    _this.proportionallyColumnSizing();
                    //api._fnAdjustColumnSizing(this.dt.settings);
                });
            }

            if (this.dom.scrollX || this.dom.scrollY) {
                this.dt.api.on('column-sizing.dt', this.fixFootAndHeadTables.bind(this));
                this.dt.api.on('column-visibility.dt', this.fixFootAndHeadTables.bind(this));
            }

            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'colResizeInitCompleted', 'colResizeInitCompleted', [this]);
        };

        ColResize.prototype.updateTableSize = function () {
            if (this.dom.scrollX && this.dom.scrollHeadTable.length)
                this.tableSize = this.dom.scrollHeadTable.width();
            else
                this.tableSize = -1;
        };

        ColResize.prototype.proportionallyColumnSizing = function () {
            var _this = this;
            var prevWidths = [], newWidths = [], prevWidth, newWidth, newTableWidth, prevTableWidth, moveLength, multiplier, cWidth, i, j, prevTotalColWidths = 0, currTotalColWidths, columnRestWidths = [], oApi = this.dt.settings.oApi, columns = this.dt.settings.aoColumns, bodyTableColumns = $('thead th', this.dom.scrollBodyTable), headTableColumns = $('thead th', this.dom.scrollHeadTable), footTableColumns = this.dom.scrollFootTable.length ? $('thead th', this.dom.scrollFootTable) : [], visColumns = [];

            for (i = 0; i < columns.length; i++) {
                if (!columns[i].bVisible)
                    continue;
                visColumns.push(columns[i]);
                columnRestWidths.push(0); //set default value
            }

            for (i = 0; i < bodyTableColumns.length; i++) {
                cWidth = parseFloat(bodyTableColumns[i].style.width);
                prevTotalColWidths += cWidth;
                prevWidths.push(cWidth);
            }

            for (i = 0; i < bodyTableColumns.length; i++) {
                bodyTableColumns[i].style.width = '';
            }

            //Get the new table width calculated by the browser
            newTableWidth = parseFloat(this.dom.scrollBodyTable.css('width'));

            //Get the old table width
            prevTableWidth = this.dom.table.preWidth;
            moveLength = newTableWidth - prevTableWidth;
            if (moveLength == 0) {
                for (i = 0; i < bodyTableColumns.length; i++) {
                    bodyTableColumns[i].style.width = prevWidths[i] + 'px';
                }
                return;
            }

            //var tot = 0;
            currTotalColWidths = prevTotalColWidths;
            for (i = 0; i < visColumns.length; i++) {
                //For each column calculate the new width
                prevWidth = prevWidths[i];
                multiplier = (+(prevWidth / prevTotalColWidths).toFixed(2));

                //tot += multiplier;
                newWidth = prevWidth + (moveLength * multiplier) + columnRestWidths[i];
                currTotalColWidths -= prevWidth;

                //Check whether the column can be resized to the new calculated value
                //if not, set it to the min or max width depends on the moveLength value
                if (!this.canColumnBeResized(visColumns[i], newWidth)) {
                    cWidth = moveLength > 0 ? this.getColumnMaxWidth(visColumns[i]) : this.getColumnMinWidth(visColumns[i]);
                    var rest = newWidth - cWidth;
                    newWidth = cWidth;

                    for (j = (i + 1); j < visColumns.length; j++) {
                        columnRestWidths[j] += rest * (+(visColumns[j] / currTotalColWidths).toFixed(2));
                    }
                }
                newWidths.push(newWidth);
            }

            //Apply the calculated column widths to the headers cells
            var tablesWidth = this.dom.scrollBodyTable.outerWidth() + 'px';
            for (i = 0; i < headTableColumns.length; i++) {
                headTableColumns[i].style.width = newWidths[i] + 'px';
            }
            this.dom.scrollHeadTable.css('width', tablesWidth);
            this.dom.scrollHeadInner.css('width', tablesWidth);

            for (i = 0; i < bodyTableColumns.length; i++) {
                bodyTableColumns[i].style.width = newWidths[i] + 'px';
            }

            for (i = 0; i < footTableColumns.length; i++) {
                footTableColumns[i].style.width = newWidths[i] + 'px';
            }
            if (this.dom.scrollFootTable.length) {
                this.dom.scrollFootTable[0].style.width = tablesWidth;
                this.dom.scrollFootInner[0].style.width = tablesWidth;
            }

            //this.dom.scrollFootTable.css('width', tablesWidth);
            //this.dom.scrollFootInner.css('width', tablesWidth);
            //Look for the y scroller taken from dataTable source TODO: check whether we need this
            /*
            var divBody = this.dt.settings.nScrollBody,
            scroll = this.dt.settings.oScroll,
            barWidth = scroll.iBarWidth,
            $divBody = $(divBody),
            $table = $(this.dt.settings.nTable),
            browser = this.dt.settings.oBrowser,
            divHeader = $(this.dt.settings.nScrollHead),
            divHeaderStyle = divHeader[0].style,
            divHeaderInner = divHeader.children('div'),
            divHeaderInnerStyle = divHeaderInner[0].style;
            // Figure out if there are scrollbar present - if so then we need a the header and footer to
            // provide a bit more space to allow "overflow" scrolling (i.e. past the scrollbar)
            var bScrolling = $table.height() > divBody.clientHeight || $divBody.css('overflow-y') == "scroll";
            var padding = 'padding' + (browser.bScrollbarLeft ? 'Left' : 'Right');
            divHeaderInnerStyle[padding] = bScrolling ? barWidth + "px" : "0px";*/
            //console.log('moveLength: ' + moveLength + ' multiplier: ' + tot);
            //console.log(newWidths);
            this.dom.table.preWidth = newTableWidth;

            oApi._fnThrottle(function () {
                _this.afterResizing();
            });
        };

        ColResize.prototype.getColumnIndex = function (col) {
            //Get the current column position
            var colIdx = -1;
            for (var i = 0; i < this.dt.settings.aoColumns.length; i++) {
                if (this.dt.settings.aoColumns[i] === col) {
                    colIdx = i;
                    break;
                }
            }
            return colIdx;
        };

        ColResize.prototype.getColumnEvent = function (col, type, ns) {
            var event;
            var thEvents = $._data(col.nTh, "events");
            $.each(thEvents[type] || [], function (idx, handler) {
                if (handler.namespace === ns)
                    event = handler;
            });
            return event;
        };

        ColResize.prototype.loadState = function (data) {
            var _this = this;
            var i, col;

            var onInit = function () {
                if (_this.settings.fixedLayout) {
                    _this.setTablesLayout('fixed');
                } else {
                    _this.setTablesLayout('auto');
                }
                if (!data.colResize) {
                    if (_this.dt.settings.oFeatures.bAutoWidthOrig)
                        _this.dt.settings.oFeatures.bAutoWidth = true;
                    else if (_this.dt.settings.sTableWidthOrig)
                        $(_this.dt.settings.nTable).width(_this.dt.settings.sTableWidthOrig);

                    for (i = 0; i < _this.dt.settings.aoColumns.length; i++) {
                        col = _this.dt.settings.aoColumns[i];
                        if (col._ColResize_sWidthOrig) {
                            col.sWidthOrig = col._ColResize_sWidthOrig;
                        }
                    }
                    _this.dom.origState = true;
                } else {
                    var columns = data.colResize.columns || [];
                    var wMap = {};

                    if (_this.dt.settings.oFeatures.bAutoWidth) {
                        _this.dt.settings.oFeatures.bAutoWidth = false;
                    }

                    if (_this.dom.scrollX && data.colResize.tableSize > 0) {
                        _this.dom.scrollHeadTable.width(data.colResize.tableSize);
                        _this.dom.scrollHeadInner.width(data.colResize.tableSize);
                        _this.dom.scrollBodyTable.width(data.colResize.tableSize);
                        _this.dom.scrollFootTable.width(data.colResize.tableSize);
                    }

                    for (i = 0; i < columns.length; i++) {
                        wMap[i] = columns[i];
                    }
                    for (i = 0; i < _this.dt.settings.aoColumns.length; i++) {
                        col = _this.dt.settings.aoColumns[i];
                        var idx = col._ColReorder_iOrigCol != null ? col._ColReorder_iOrigCol : i;
                        col.sWidth = wMap[idx];
                        col.sWidthOrig = wMap[idx];
                        _this.dt.settings.aoColumns[i].nTh.style.width = columns[i];
                    }
                    _this.dom.origState = false;
                }

                _this.dt.api.columns.adjust();
                if (_this.dom.scrollX || _this.dom.scrollY)
                    _this.dt.api.draw(false);
            };

            if (this.initialized) {
                onInit();
                return;
            }
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'colResizeInitCompleted', function () {
                onInit();
            }, "ColResize_Init");
        };

        ColResize.prototype.saveState = function (data) {
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
        };

        ColResize.prototype.registerCallbacks = function () {
            var _this = this;
            /* State saving */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateSaveParams', function (oS, oData) {
                _this.saveState(oData);
            }, "ColResize_StateSave");

            /* State loading */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateLoaded', function (oS, oData) {
                _this.loadState(oData);
            }, "ColResize_StateLoad");

            if ($.fn.DataTable.models.oSettings.remoteStateInitCompleted !== undefined) {
                //Integrate with remote state
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateLoadedParams', function (s, data) {
                    _this.loadState(data);
                }, "ColResize_StateLoad");
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateSaveParams', function (s, data) {
                    _this.saveState(data);
                }, "ColResize_StateSave");
            }
        };

        ColResize.prototype.setTablesLayout = function (value) {
            if (this.dom.scrollX || this.dom.scrollY) {
                this.dom.scrollHeadTable.css('table-layout', value);
                this.dom.scrollBodyTable.css('table-layout', value);
                this.dom.scrollFootTable.css('table-layout', value);
            } else {
                $(this.dt.settings.nTable).css('table-layout', value);
            }
            this.dom.fixedLayout = value == 'fixed';
        };

        ColResize.prototype.fixFootAndHeadTables = function (e) {
            if (e != null && e.target !== this.dt.settings.nTable)
                return;

            if (this.dom.scrollFootTable.length) {
                $('thead', this.dom.scrollFootTable).remove();
                this.dom.scrollFootTable.prepend($('thead', this.dom.scrollBodyTable).clone());
            }
            $('tfoot', this.dom.scrollHeadTable).remove();
            this.dom.scrollHeadTable.append($('tfoot', this.dom.scrollBodyTable).clone());
            var removeFooterWidth = function (table) {
                $('tfoot>tr>th', table).each(function (i, th) {
                    $(th).css('width', '');
                });
            };

            //Remove all tfoot headers widths
            removeFooterWidth(this.dom.scrollFootTable);
            removeFooterWidth(this.dom.scrollBodyTable);
            removeFooterWidth(this.dom.scrollHeadTable);
        };

        ColResize.prototype.onDraw = function (e) {
            if (e != null && e.target !== this.dt.settings.nTable)
                return;
            if (this.dom.scrollX || this.dom.scrollY) {
                this.fixFootAndHeadTables();

                //Fix the header table padding
                if (this.dt.settings._bInitComplete) {
                    var borderWidth = this.dom.scrollHeadTable.outerWidth() - this.dom.scrollHeadTable.innerWidth();
                    var paddingType = this.dt.settings.oBrowser.bScrollbarLeft ? 'padding-left' : 'padding-right';
                    var paddingVal = parseFloat(this.dom.scrollHeadInner.css(paddingType));
                    this.dom.scrollHeadInner.css(paddingType, (paddingVal + borderWidth) + 'px');
                }
            }
            if (this.settings.dblClick == 'matchContent' || !this.settings.fixedLayout)
                this.updateColumnsContentWidth();

            if (!this.settings.fixedLayout) {
                var columns = this.dt.settings.aoColumns;
                var i;
                for (i = 0; i < columns.length; i++) {
                    if (!columns[i].bVisible)
                        continue;
                    columns[i].minWidth = Math.max((columns[i].minWidthOrig || 0), columns[i].contentWidth);

                    //We have to resize if the current column width is less that the column minWidth
                    if ($(columns[i].nTh).width() < columns[i].minWidth)
                        this.resize(columns[i], columns[i].minWidth);
                }
            } else {
                if (!this.dom.fixedLayout) {
                    this.setTablesLayout('fixed');
                    this.afterResizing();
                }
            }
        };

        ColResize.prototype.getTableMinColWidths = function (table) {
            var $table = $(table);
            var widths = [];
            if (!$table.length)
                return widths;
            var clnTable = $table.clone().removeAttr('id').css('width', '1px').css('table-layout', 'auto').css('position', 'absolute').css('visibility', 'hidden');

            // Remove any assigned widths from the footer (from scrolling)
            clnTable.find('thead th, tfoot th, tfoot td').css('width', '');
            $(this.dt.settings.nTableWrapper).append(clnTable);
            $('thead>tr>th', clnTable).each(function (i, th) {
                widths.push($(th).width());
            });
            clnTable.remove();

            //console.log(widths);
            return widths;
        };

        ColResize.prototype.updateColumnsContentWidth = function () {
            var columns = this.dt.settings.aoColumns;
            var i;
            var widths = [];
            if (this.dom.scrollX || this.dom.scrollY) {
                var headWidths = this.getTableMinColWidths(this.dom.scrollHeadTable);
                var bodyWidths = this.getTableMinColWidths(this.dom.scrollBodyTable);
                var footWidths = this.getTableMinColWidths(this.dom.scrollFootTable);
                footWidths.length = headWidths.length;
                for (i = 0; i < headWidths.length; i++) {
                    widths.push(Math.max(headWidths[i], bodyWidths[i], (footWidths[i] || 0)));
                }
            } else {
                widths = this.getTableMinColWidths(this.dt.settings.nTable);
            }

            //console.log(widths);
            var visColIdx = 0;
            for (i = 0; i < columns.length; i++) {
                if (!columns[i].bVisible)
                    continue;
                columns[i].contentWidth = widths[visColIdx];
                visColIdx++;
            }
        };

        ColResize.prototype.overrideClickHander = function (col, $th) {
            var dtClickEvent = this.getColumnEvent(col, 'click', 'DT');

            //Remove the DataTables event so that ordering will not occur
            if (dtClickEvent) {
                $th.off('click.DT');
                $(document).one('click.ColResize', function (e) {
                    $th.on('click.DT', dtClickEvent.handler);
                });
            }
        };

        ColResize.prototype.onDblClick = function (e, $th, col) {
            if (e.target !== $th.get(0))
                return;
            if ($th.css('cursor') != 'col-resize')
                return;

            var width;
            switch (this.settings.dblClick) {
                case 'matchContent':
                    width = col.contentWidth;
                    break;
                default:
                    width = col.initWidth;
            }
            this.resize(col, width);
        };

        ColResize.prototype.onMouseDown = function (e, $th, col) {
            var _this = this;
            if (e.target !== $th.get(0))
                return true;
            if ($th.css('cursor') != 'col-resize' || col.resizable === false) {
                var colReorder = this.dt.settings._colReorder;
                if (colReorder) {
                    colReorder._fnMouseDown.call(colReorder, e, $th.get(0)); //Here we fix the e.preventDefault() in ColReorder so that we can have working inputs in headers
                }
                return true;
            }
            this.dom.mouse.startX = e.pageX;
            this.dom.mouse.prevX = e.pageX;
            this.dom.mouse.startWidth = $th.width();
            this.dom.mouse.resizeElem = $th;
            this.dom.resize = true;

            this.beforeResizing(col);

            /* Add event handlers to the document */
            $(document).on('mousemove.ColResize', function (event) {
                _this.onMouseMove(event, col);
            });
            this.overrideClickHander(col, $th);
            $(document).one('mouseup.ColResize', function (event) {
                _this.onMouseUp(event, col);
            });

            return false;
        };

        ColResize.prototype.resize = function (col, width) {
            var colWidth = $(col.nTh).width();
            var moveLength = width - $(col.nTh).width();
            this.beforeResizing(col);
            var resized = this.resizeColumn(col, colWidth, moveLength, moveLength);
            this.afterResizing();
            return resized;
        };

        ColResize.prototype.beforeResizing = function (col) {
            if (this.settings.fixedLayout && !this.dom.fixedLayout)
                this.setTablesLayout('fixed');
        };

        ColResize.prototype.afterResizing = function () {
            var i;
            var columns = this.dt.settings.aoColumns;
            for (i = 0; i < columns.length; i++) {
                if (!columns[i].bVisible)
                    continue;
                columns[i].sWidth = $(columns[i].nTh).css('width');
            }

            //Update the internal storage of the table's width (in case we changed it because the user resized some column and scrollX was enabled
            this.updateTableSize();

            //Save the state
            this.dt.settings.oInstance.oApi._fnSaveState(this.dt.settings);
            this.dom.origState = false;
        };

        ColResize.prototype.onMouseUp = function (e, col) {
            $(document).off('mousemove.ColResize');
            if (!this.dom.resize)
                return;
            this.dom.resize = false;
            this.afterResizing();
        };

        ColResize.prototype.canColumnBeResized = function (col, newWidth) {
            return (col.resizable === undefined || col.resizable) && this.settings.minWidth <= newWidth && (!col.minWidth || col.minWidth <= newWidth) && (!this.settings.maxWidth || this.settings.maxWidth >= newWidth) && (!col.maxWidth || col.maxWidth >= newWidth);
        };

        ColResize.prototype.getColumnMaxWidth = function (col) {
            return col.maxWidth ? col.maxWidth : this.settings.maxWidth;
        };

        ColResize.prototype.getColumnMinWidth = function (col) {
            return col.minWidth ? col.minWidth : this.settings.minWidth;
        };

        ColResize.prototype.getPrevResizableColumnIdx = function (col, moveLength) {
            var columns = this.dt.settings.aoColumns;
            var colIdx = ColResizeHelper.indexOf(columns, col);
            for (var i = colIdx; i >= 0; i--) {
                if (!columns[i].bVisible)
                    continue;
                var newWidth = $(columns[i].nTh).width() + moveLength;
                if (this.canColumnBeResized(columns[i], newWidth))
                    return i;
            }
            return -1;
        };

        ColResize.prototype.getNextResizableColumnIdx = function (col, moveLength) {
            var columns = this.dt.settings.aoColumns;
            var colIdx = ColResizeHelper.indexOf(columns, col);
            for (var i = (colIdx + 1); i < columns.length; i++) {
                if (!columns[i].bVisible)
                    continue;
                var newWidth = $(columns[i].nTh).width() - moveLength;
                if (this.canColumnBeResized(columns[i], newWidth))
                    return i;
            }
            return -1;
        };

        ColResize.prototype.resizeColumn = function (col, startWidth, moveLength, lastMoveLength) {
            if (moveLength == 0 || lastMoveLength == 0 || col.resizable === false)
                return false;
            var i;
            var columns = this.dt.settings.aoColumns;
            var headCol = $(col.nTh);
            var headColNext = headCol.next();
            var colIdx = this.getColumnIndex(col);
            var thWidth = startWidth + moveLength;
            var thNextWidth;
            var nextColIdx, prevColIdx;

            if (!this.dom.scrollX) {
                if (lastMoveLength < 0) {
                    thWidth = headColNext.width() - lastMoveLength;
                    prevColIdx = this.getPrevResizableColumnIdx(col, lastMoveLength);
                    if (prevColIdx < 0)
                        return false;
                    headCol = headColNext;
                    colIdx = colIdx + 1;
                    headColNext = $(columns[prevColIdx].nTh);
                    nextColIdx = prevColIdx;
                    thNextWidth = headColNext.width() + lastMoveLength;
                } else {
                    thWidth = headCol.width() + lastMoveLength;
                    nextColIdx = this.getNextResizableColumnIdx(col, lastMoveLength);

                    //If there is no columns that can be shrinked dont resize anymore
                    if (nextColIdx < 0)
                        return false;
                    headColNext = $(columns[nextColIdx].nTh);
                    thNextWidth = headColNext.width() - lastMoveLength;

                    if ((this.settings.maxWidth && this.settings.maxWidth < thWidth) || col.maxWidth && col.maxWidth < thWidth)
                        return false;
                }
                if (!this.canColumnBeResized(columns[nextColIdx], thNextWidth))
                    return false;
                headColNext.width(thNextWidth);
            } else {
                if (!this.canColumnBeResized(col, thWidth))
                    return false;
                var tSize = this.tableSize + moveLength + 'px';
                this.dom.scrollHeadInner.css('width', tSize);
                this.dom.scrollHeadTable.css('width', tSize);
                this.dom.scrollBodyTable.css('width', tSize);
                this.dom.scrollFootTable.css('width', tSize);
            }
            headCol.width(thWidth);

            //scrollX or scrollY enabled
            if (this.dom.scrollBody.length) {
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
            return true;
        };

        ColResize.prototype.onMouseMove = function (e, col) {
            var moveLength = e.pageX - this.dom.mouse.startX;
            var lastMoveLength = e.pageX - this.dom.mouse.prevX;
            this.resizeColumn(col, this.dom.mouse.startWidth, moveLength, lastMoveLength);
            this.dom.mouse.prevX = e.pageX;
        };

        ColResize.prototype.destroy = function () {
        };
        ColResize.defaultSettings = {
            minWidth: 1,
            maxWidth: null,
            fixedLayout: true,
            dblClick: 'restoreOrig'
        };
        return ColResize;
    })();
    dt.ColResize = ColResize;

    var ColResizeHelper = (function () {
        function ColResizeHelper() {
        }
        ColResizeHelper.indexOf = function (arr, item, equalFun) {
            if (typeof equalFun === "undefined") { equalFun = null; }
            for (var i = 0; i < arr.length; i++) {
                if (equalFun) {
                    if (equalFun(arr[i], item))
                        return i;
                } else if (arr[i] === item)
                    return i;
            }
            return -1;
        };
        return ColResizeHelper;
    })();
    dt.ColResizeHelper = ColResizeHelper;
})(dt || (dt = {}));

(function (window, document, undefined) {
    //Register events
    $.fn.DataTable.models.oSettings.colResizeInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.register('colResize.init()', function (settings) {
        var colResize = new dt.ColResize(this, settings);
        if (this.settings()[0]._bInitComplete)
            colResize.initialize();
        else
            this.one('init.dt', function () {
                colResize.initialize();
            });
        return null;
    });

    $.fn.DataTable.Api.register('column().resize()', function (width) {
        var oSettings = this.settings()[0];
        var colResize = oSettings.colResize;
        return colResize.resize(oSettings.aoColumns[this[0][0]], width);
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().colResize.init(oSettings.oInit.colResize);
        },
        "cFeature": "J",
        "sFeature": "ColResize"
    });
}(window, document, undefined));
//# sourceMappingURL=dataTables.colResize.js.map
