var dt;
(function (dt) {
    var ColResize = (function () {
        function ColResize(api, settings) {
            this.tableSize = -1;
            this.initialized = false;
            this.dt = {};
            this.dom = {
                mouse: {
                    startX: -1,
                    nextStartWidth: null,
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
            this.settings = $.extend(true, {}, settings);
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
                $th.bind('mousemove.ColResize', function (e) {
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
                //col._sWidth_Orig = col.sWidth;
                var colReorderMouseDownEvent = _this.getColumnEvent(col, 'mousedown', 'ColReorder');

                //Remove the ColReorder handler so that reordering will not occur on resizing
                if (colReorderMouseDownEvent)
                    $th.off('mousedown.ColReorder');

                // listen to mousedown event
                $th.on('mousedown.ColResize', function (e) {
                    return _this.onMouseDown(e, $th, col, colReorderMouseDownEvent);
                });
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

            if (this.dt.settings.oInit.bStateSave && this.dt.settings.oLoadedState) {
                this.loadState(this.dt.settings.oLoadedState);
            }

            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'colResizeInitCompleted', 'colResizeInitCompleted', [this]);
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
                if (!data.colResize) {
                    if (_this.dt.settings.oFeatures.bAutoWidthOrig)
                        _this.dt.settings.oFeatures.bAutoWidth = true;
                    else if (_this.dt.settings.sTableWidthOrig)
                        $(_this.dt.settings.nTable).width(_this.dt.settings.sTableWidthOrig);

                    for (i = 0; i < _this.dt.settings.aoColumns.length; i++) {
                        col = _this.dt.settings.aoColumns[i];
                        if (col._ColResize_WidthOrig !== undefined) {
                            col.sWidthOrig = col._ColResize_WidthOrig;
                        }
                    }
                } else {
                    var columns = data.colResize.columns || [];
                    var wMap = {};

                    if (_this.dt.settings.oFeatures.bAutoWidth) {
                        _this.dt.settings.oFeatures.bAutoWidth = false;
                        _this.dt.settings.oFeatures.bAutoWidthOrig = true;
                    }

                    if (_this.dom.scrollX && data.colResize.tableSize > 0) {
                        _this.dom.scrollHeadTable.width(data.colResize.tableSize);
                        _this.dom.scrollBodyTable.width(data.colResize.tableSize);
                        _this.dom.scrollFootTable.width(data.colResize.tableSize);
                    }

                    for (i = 0; i < columns.length; i++) {
                        wMap[i] = columns[i];
                    }

                    for (i = 0; i < _this.dt.settings.aoColumns.length; i++) {
                        col = _this.dt.settings.aoColumns[i];
                        var idx = col._ColReorder_iOrigCol != null ? col._ColReorder_iOrigCol : i;

                        col._ColResize_WidthOrig = col.sWidthOrig;
                        col.sWidth = wMap[idx];
                        col.sWidthOrig = wMap[idx];
                    }

                    for (i = 0; i < columns.length; i++) {
                        _this.dt.settings.aoColumns[i].nTh.style.width = columns[i];
                    }
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

        ColResize.prototype.onDraw = function (e) {
            if (e != null && e.target !== this.dt.settings.nTable)
                return;

            $('thead', this.dom.scrollFootTable).remove();
            this.dom.scrollFootTable.prepend($('thead', this.dom.scrollBodyTable).clone());

            $('tfoot', this.dom.scrollHeadTable).remove();
            this.dom.scrollHeadTable.append($('tfoot', this.dom.scrollBodyTable).clone());

            var removeHeaderWidth = function (table) {
                $('tfoot>tr>th', table).each(function (i, th) {
                    $(th).css('width', '');
                });
            };

            //Remove all tfoot headers widths
            removeHeaderWidth(this.dom.scrollFootTable);
            removeHeaderWidth(this.dom.scrollBodyTable);
            removeHeaderWidth(this.dom.scrollHeadTable);
        };

        ColResize.prototype.onMouseDown = function (e, $th, col, colReorderMouseDownEvent) {
            var _this = this;
            if ($th.css('cursor') != 'col-resize' || col.resizable === false) {
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
            $(document).on('mousemove.ColResize', function (event) {
                _this.onMouseMove(event, col);
            });

            var dtClickEvent = this.getColumnEvent(col, 'click', 'DT');

            //Remove the DataTables event so that ordering will not occur
            if (dtClickEvent) {
                $th.off('click.DT');
                $(document).one('click.ColResize', function (event) {
                    $th.on('click.DT', dtClickEvent.handler);
                }); //Add the original handler so that ordering will work
            }

            $(document).on('mouseup.ColResize', function (event) {
                _this.onMouseUp(event, col);
            });

            /* Save the state */
            //this.dt.settings.oInstance.oApi._fnSaveState(this.dt.settings);
            return false;
        };

        ColResize.prototype.onMouseUp = function (e, col) {
            $(document).off('mousemove.ColResize');
            $(document).off('mouseup.ColResize');
            if (!this.dom.resize)
                return;
            var i;
            var colIdx = this.getColumnIndex(col);
            var currentColumn;
            var nextVisibleColumnIndex;
            var previousVisibleColumnIndex;

            //Save the new resized column's width - add only the diff to the orig width in order ColPin to work
            col.sWidth = $(this.dom.mouse.resizeElem).css('width'); /*Number(col.sWidth.replace('px', '')) + (e.pageX - this.dom.mouse.startX) + 'px'; $(this.dom.mouse.resizeElem).innerWidth() + "px";*/

            //If other columns might have changed their size, save their size too
            if (!this.dom.scrollX) {
                for (nextVisibleColumnIndex = colIdx + 1; nextVisibleColumnIndex < this.dt.settings.aoColumns.length; nextVisibleColumnIndex++) {
                    if (this.dt.settings.aoColumns[nextVisibleColumnIndex].bVisible)
                        break;
                }

                for (previousVisibleColumnIndex = colIdx - 1; previousVisibleColumnIndex >= 0; previousVisibleColumnIndex--) {
                    if (this.dt.settings.aoColumns[previousVisibleColumnIndex].bVisible)
                        break;
                }

                if (this.dt.settings.aoColumns.length > nextVisibleColumnIndex)
                    this.dt.settings.aoColumns[nextVisibleColumnIndex].sWidth = $(this.dom.mouse.resizeElem).next().css('width'); //$(this.dom.mouse.resizeElem).next().innerWidth() + "px";
                else {
                    currentColumn = this.dom.mouse.resizeElem;
                    for (i = previousVisibleColumnIndex; i > 0; i--) {
                        if (this.dt.settings.aoColumns[i].bVisible) {
                            currentColumn = $(currentColumn).prev();
                            this.dt.settings.aoColumns[i].sWidth = $(currentColumn).css('width'); //$(currentColumn).innerWidth() + "px";
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
        };

        ColResize.prototype.onMouseMove = function (e, col) {
            var moveLength = e.pageX - this.dom.mouse.startX;
            if (moveLength == 0)
                return;
            var $th = $(this.dom.mouse.resizeElem);
            var $thNext = $th.next();

            var thWidth = this.dom.mouse.startWidth + moveLength;
            var thNextWidth = this.dom.mouse.nextStartWidth - moveLength;

            if (this.dom.scrollX) {
                if (this.tableSize < 0)
                    this.tableSize = this.dom.scrollHeadTable.width();
                this.dom.scrollHeadTable.width(this.tableSize + moveLength);
                this.dom.scrollBodyTable.width(this.tableSize + moveLength);
                this.dom.scrollFootTable.width(this.tableSize + moveLength);
            } else {
                $thNext.width(thNextWidth).width();
            }
            $th.width(thWidth).width();

            //scrollX or scrollY enabled
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
                var resizingBodyHeadColumn = $('thead>tr>th:nth(' + visibleColumnIndex + ')', this.dom.scrollBodyTable);
                var resizingFootHeadColumn = $('thead>tr>th:nth(' + visibleColumnIndex + ')', this.dom.scrollFootTable);

                //This will happen only when Scroller plugin is used without scrollX
                if (!this.dom.scrollX) {
                    resizingBodyHeadColumn.next().width(thNextWidth);
                    resizingBodyHeadColumn.width(thWidth);

                    resizingFootHeadColumn.next().width(thNextWidth);
                    resizingFootHeadColumn.width(thWidth);
                }

                //Resize the table and the column
                if (this.dom.scrollX) {
                    resizingBodyHeadColumn.width(thWidth);
                    resizingFootHeadColumn.width(thWidth);
                }
            }
        };

        ColResize.prototype.destroy = function () {
        };
        return ColResize;
    })();
    dt.ColResize = ColResize;
})(dt || (dt = {}));

(function (window, document, undefined) {
    //Register events
    $.fn.DataTable.models.oSettings.colResizeInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.prototype.colResize = function (settings) {
        var colResize = new dt.ColResize(this, settings);
        if (this.settings()[0]._bInitComplete)
            colResize.initialize();
        else
            this.one('init.dt', function () {
                colResize.initialize();
            });

        return null;
    };

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().colResize(oSettings.oInit.colResize);
        },
        "cFeature": "J",
        "sFeature": "ColResize"
    });
}(window, document, undefined));
//# sourceMappingURL=dataTables.colResize.js.map
