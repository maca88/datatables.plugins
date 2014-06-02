var dt;
(function (dt) {
    var ColResize = (function () {
        function ColResize(api, settings) {
            this.tableSize = -1;
            this.dt = {};
            this.dom = {
                mouse: {
                    startX: -1,
                    nextStartWidth: null,
                    startWidth: null,
                    resizeElem: null
                },
                resize: false
            };
            this.settings = $.extend(true, {}, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
        }
        ColResize.prototype.initialize = function () {
            var _this = this;
            $.each(this.dt.settings.aoColumns, function (i, col) {
                var $th = $(col.nTh);

                // listen to mousemove event for resize
                $th.bind('mousemove.ColResize', function (e) {
                    if (_this.dom.resize)
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

                var colReorderMouseDownEvent = _this.getColumnEvent(col, 'mousedown', 'ColReorder');

                //Remove the ColReorder handler so that reordering will not occur on resizing
                if (colReorderMouseDownEvent)
                    $th.off('mousedown.ColReorder');

                // listen to mousedown event
                $th.on('mousedown.ColResize', function (e) {
                    return _this.onMouseDown(e, $th, col, colReorderMouseDownEvent);
                });
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

        ColResize.prototype.onMouseDown = function (e, $th, col, colReorderMouseDownEvent) {
            var _this = this;
            if ($th.css('cursor') != 'col-resize') {
                if (colReorderMouseDownEvent != null && $.isFunction(colReorderMouseDownEvent.handler))
                    return colReorderMouseDownEvent.handler(e);
                return false;
            }
            this.dom.mouse.startX = e.pageX;
            this.dom.mouse.startWidth = $th.width();
            this.dom.mouse.resizeElem = $th;
            this.dom.mouse.nextStartWidth = $th.next().width();
            this.dom.resize = true;
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
            var scrollXEnabled = this.dt.settings.oInit.sScrollX === undefined ? false : true;
            var scrollHead = $('div.dataTables_scrollHead', this.dt.settings.nTableWrapper);

            //Save the new resized column's width
            col.sWidth = $(this.dom.mouse.resizeElem).innerWidth() + "px";

            //If other columns might have changed their size, save their size too
            if (!scrollXEnabled) {
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
                else {
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
            if (scrollXEnabled && scrollHead.length) {
                this.tableSize = $('table', scrollHead).width();
            }

            //Save the state
            this.dt.settings.oInstance.oApi._fnSaveState(this.dt.settings);

            this.dom.resize = false;
        };

        ColResize.prototype.onMouseMove = function (e, col) {
            var scrollXEnabled = this.dt.settings.oInit.sScrollX === undefined ? false : true;
            var scrollHead = $('div.dataTables_scrollHead', this.dt.settings.nTableWrapper);
            var scrollBody = $('div.dataTables_scrollBody', this.dt.settings.nTableWrapper);
            var moveLength = e.pageX - this.dom.mouse.startX;
            var $th = $(this.dom.mouse.resizeElem);
            var $thNext = $th.next();

            if (scrollXEnabled && scrollHead.length) {
                var scrollHeadTable = $('table', scrollHead);
                if (this.tableSize < 0)
                    this.tableSize = scrollHeadTable.width();
                scrollHeadTable.width(this.tableSize + moveLength);
            }

            if (moveLength != 0 && !scrollXEnabled)
                $thNext.width(this.dom.mouse.nextStartWidth - moveLength);
            $th.width(this.dom.mouse.startWidth + moveLength);

            if (scrollBody.length) {
                var visibleColumnIndex;
                var colIdx = this.getColumnIndex(col);
                var currentColumnIndex;
                visibleColumnIndex = 0;
                for (currentColumnIndex = 0; currentColumnIndex < this.dt.settings.aoColumns.length && currentColumnIndex != colIdx; currentColumnIndex++) {
                    if (this.dt.settings.aoColumns[currentColumnIndex].bVisible)
                        visibleColumnIndex++;
                }

                //Get the table
                var resizingHeaderColumn = $('table thead tr th:nth(' + visibleColumnIndex + ')', scrollBody);

                //This will happen only when Scroller plugin is used without scrollX
                if (!scrollXEnabled && moveLength != 0) {
                    resizingHeaderColumn.width(this.dom.mouse.startWidth + moveLength);
                    resizingHeaderColumn.next().width(this.dom.mouse.nextStartWidth - moveLength);
                }

                //Resize the table and the column
                if (scrollXEnabled) {
                    $('table', scrollBody).width(this.tableSize + moveLength);
                    resizingHeaderColumn.width(this.dom.mouse.startWidth + moveLength);
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
    $.fn.DataTable.Api.prototype.colResize = function (settings) {
        var colResize = new dt.ColResize(this, settings);
        if (this.settings()[0].bInitialized)
            colResize.initialize();
        else
            this.one('init.dt', function () {
                colResize.initialize();
            });

        return null;
    };

    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().colResize(oSettings.oInit.colResize);
        },
        "cFeature": "J",
        "sFeature": "ColResize"
    });
}(window, document, undefined));
//# sourceMappingURL=dataTables.colResize.js.map
