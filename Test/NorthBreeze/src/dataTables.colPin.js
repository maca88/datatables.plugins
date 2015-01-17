var dt;
(function (dt) {
    var AngularColPinAdapter = (function () {
        function AngularColPinAdapter(api, settings) {
            this.dt = {
                settings: null,
                api: null
            };
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
        }
        AngularColPinAdapter.prototype.fixedColumnsDestroying = function (fixedColumns) {
        };

        AngularColPinAdapter.prototype.fixedColumnsDestroyed = function () {
        };

        AngularColPinAdapter.prototype.fixedColumnsCreated = function (fixedColumns) {
        };

        AngularColPinAdapter.prototype.fixedColumnsDraw = function (data) {
            this.linkTable(data.leftClone.body);
            this.linkTable(data.rightClone.body);
        };

        AngularColPinAdapter.prototype.linkTable = function (table) {
            var _this = this;
            if (!table)
                return;
            $('tr>td', table).each(function (i, td) {
                var $td = $(td);
                var cellScope = $td.scope();
                if (!cellScope)
                    return;
                _this.dt.settings.oInit.angular.$compile($td)(cellScope);
            });
        };
        return AngularColPinAdapter;
    })();
    dt.AngularColPinAdapter = AngularColPinAdapter;

    var ColPin = (function () {
        function ColPin(api, settings) {
            this.initialized = false;
            this.dt = {
                settings: null,
                api: null,
                fixedColumns: null
            };
            this.dom = {
                leftPinned: 0,
                rightPinned: 0
            };
            this.settings = $.extend(true, {}, ColPin.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.colPin = this;
            this.setupAdapters();
            this.registerCallbacks();
        }
        ColPin.prototype.setupAdapters = function () {
            this.setupBindingAdapter();
        };

        ColPin.prototype.setupBindingAdapter = function () {
            if (!this.settings.bindingAdapter) {
                if (window.hasOwnProperty('angular'))
                    this.settings.bindingAdapter = dt.AngularColPinAdapter;
            }
            if (!this.settings.bindingAdapter)
                return;
            this.bindingAdapterInstance = new this.settings.bindingAdapter(this.dt.api, this.settings);
        };

        ColPin.prototype.pinColumn = function (col, direction) {
            if (col == null)
                return;
            var fromIndex = this.getColumnIndex(col);
            col.nTh._DT_PinDir = direction === 'left' ? 'left' : 'right';
            var toIndex = direction === 'left' ? this.dom.leftPinned : (this.dt.settings.aoColumns.length - 1) - this.dom.rightPinned;
            this.destroyFixedColumns();
            this.moveColumn(fromIndex, toIndex);
            this.incPinnedColumns(direction);
            col.resizableOrig = col.resizable;
            col.resizable = false;
            this.createFixedColumns({
                leftColumns: this.dom.leftPinned,
                rightColumns: this.dom.rightPinned
            });
        };

        ColPin.prototype.getColumnIndex = function (col) {
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

        ColPin.prototype.incPinnedColumns = function (direction) {
            if (direction === 'left')
                this.dom.leftPinned += 1;
            else
                this.dom.rightPinned += 1;
        };

        ColPin.prototype.decPinnedColumns = function (direction) {
            if (direction === 'left')
                this.dom.leftPinned -= 1;
            else
                this.dom.rightPinned -= 1;
        };

        ColPin.prototype.getPinnedColumnsCount = function (direction) {
            if (typeof direction === "undefined") { direction = null; }
            if (direction === null)
                return this.dom.leftPinned + this.dom.rightPinned;
            return (direction === 'left') ? this.dom.leftPinned : this.dom.rightPinned;
        };

        ColPin.prototype.moveColumn = function (fromIndex, toIndex) {
            if (fromIndex === toIndex)
                return;

            /* Actually do the reorder */
            this.dt.settings.oInstance.fnColReorder(fromIndex, toIndex);
            this.dt.settings._colReorder._fnSetColumnIndexes();

            /* When scrolling we need to recalculate the column sizes to allow for the shift */
            if (this.dt.settings.oScroll.sX !== "" || this.dt.settings.oScroll.sY !== "") {
                this.dt.settings.oInstance.fnAdjustColumnSizing();
            }
        };

        ColPin.prototype.unpinColumn = function (col) {
            if (col == null)
                return;
            var i, cIdx;
            var columns = this.dt.settings.aoColumns;
            var fromIndex = this.getColumnIndex(col);
            var direction = col.nTh._DT_PinDir;
            var origPos = col._ColReorder_iOrigCol != null ? col._ColReorder_iOrigCol : fromIndex;
            var toIndex;

            switch (direction) {
                case 'left':
                    toIndex = (this.dom.leftPinned - 1) > origPos ? (this.dom.leftPinned - 1) : origPos;
                    for (i = toIndex + 1; i < columns.length; i++) {
                        cIdx = columns[i]._ColReorder_iOrigCol != null ? columns[i]._ColReorder_iOrigCol : i;
                        if (cIdx >= origPos)
                            break;
                        toIndex++;
                    }
                    break;
                default:
                    toIndex = (columns.length - this.dom.rightPinned) < origPos ? (columns.length - this.dom.rightPinned) : origPos;
                    for (i = toIndex - 1; i >= 0; i--) {
                        cIdx = columns[i]._ColReorder_iOrigCol != null ? columns[i]._ColReorder_iOrigCol : i;
                        if (cIdx <= origPos)
                            break;
                        toIndex--;
                    }
                    break;
            }
            this.destroyFixedColumns();
            this.moveColumn(fromIndex, toIndex);
            this.decPinnedColumns(direction);
            col.nTh._DT_PinDir = null;
            col.resizable = col.resizableOrig;
            this.createFixedColumns({
                leftColumns: this.dom.leftPinned,
                rightColumns: this.dom.rightPinned
            });
        };

        ColPin.prototype.createPinIcon = function (pinned, col) {
            var _this = this;
            return $('<span />').addClass('dt-pin').data('_DT_Column', col).addClass(this.settings.classes.iconClass).addClass(pinned ? this.settings.classes.pinnedClass : this.settings.classes.unpinnedClass).on('click', function (evt) {
                evt.stopPropagation();
                var $target = $(evt.target);
                var direction = !evt.shiftKey ? 'left' : 'right';

                if ($target.hasClass(_this.settings.classes.pinnedClass))
                    _this.unpinColumn($target.data('_DT_Column'));
                else
                    _this.pinColumn($target.data('_DT_Column'), direction);
            });
        };

        ColPin.prototype.destroyFixedColumns = function () {
            if (!this.dt.fixedColumns)
                return;

            if (this.bindingAdapterInstance)
                this.bindingAdapterInstance.fixedColumnsDestroying(this.dt.fixedColumns);

            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, null, 'colPinFcDestroying', [this]);

            var cf = this.dt.fixedColumns;

            $(this.dt.fixedColumns).off('draw.dtfc');

            $(this.dt.settings.nTable).off('column-sizing.dt.DTFC destroy.dt.DTFC draw.dt.DTFC');

            $(cf.dom.scroller).off('scroll.DTFC mouseover.DTFC');
            $(window).off('resize.DTFC');

            $(cf.dom.grid.left.liner).off('scroll.DTFC wheel.DTFC mouseover.DTFC');
            $(cf.dom.grid.left.wrapper).remove();

            $(cf.dom.grid.right.liner).off('scroll.DTFC wheel.DTFC mouseover.DTFC');
            $(cf.dom.grid.right.wrapper).remove();

            if (this.bindingAdapterInstance)
                this.bindingAdapterInstance.fixedColumnsDestroyed();

            this.dt.fixedColumns = null;
        };

        ColPin.prototype.createFixedColumns = function (settings) {
            var _this = this;
            settings = settings || {};
            if (this.settings.fixedColumns)
                settings = $.extend(true, {}, this.settings.fixedColumns, settings);
            var pinnIcons = function (elem) {
                if (elem == null)
                    return;
                $('thead>tr>th', elem).each(function (i, th) {
                    var pin = $('span.dt-pin', th);
                    pin.removeClass(_this.settings.classes.unpinnedClass);
                    pin.addClass(_this.settings.classes.pinnedClass);
                });
            };
            settings.drawCallback = function (leftClone, rightClone) {
                var data = {
                    "leftClone": leftClone,
                    "rightClone": rightClone
                };

                pinnIcons(leftClone.header);
                pinnIcons(rightClone.header);

                if (_this.bindingAdapterInstance)
                    _this.bindingAdapterInstance.fixedColumnsDraw(data);

                _this.dt.settings.oApi._fnCallbackFire(_this.dt.settings, null, 'colPinFcDraw', [_this, data]);
            };
            this.dt.fixedColumns = new $.fn.DataTable.FixedColumns(this.dt.api, settings);
            if (this.bindingAdapterInstance)
                this.bindingAdapterInstance.fixedColumnsCreated(this.dt.fixedColumns);
        };

        ColPin.prototype.saveState = function (data) {
            if (!this.dt.settings._bInitComplete) {
                var oData = this.dt.settings.fnStateLoadCallback.call(this.dt.settings.oInstance, this.dt.settings);
                if (oData && oData.colPin)
                    data.colPin = oData.colPin;
                return;
            }
            data.colPin = {
                leftPinned: this.dom.leftPinned,
                rightPinned: this.dom.rightPinned
            };
        };

        ColPin.prototype.reset = function () {
            this.dom.rightPinned = 0;
            this.dom.leftPinned = 0;
            this.destroyFixedColumns();
        };

        ColPin.prototype.repinColumns = function (data) {
            this.reset();
            var i;
            var leftPinned = data.leftColumns;
            for (i = 0; i < leftPinned; i++) {
                this.pinColumn(this.dt.settings.aoColumns[i], 'left');
            }

            var rightPinned = data.rightColumns;
            var colNum = this.dt.settings.aoColumns.length - 1;
            for (i = colNum; i > (colNum - rightPinned); i--) {
                this.pinColumn(this.dt.settings.aoColumns[i], 'right');
            }
        };

        ColPin.prototype.loadState = function (data) {
            var _this = this;
            if (!data.colPin) {
                this.reset();
                return;
            }
            var opts = {
                leftColumns: data.colPin.leftPinned,
                rightColumns: data.colPin.rightPinned
            };

            //If the plugin aws already initialized we can pin the columns otherwise register a callback
            if (this.initialized) {
                this.repinColumns(opts);
                return;
            }
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'colPinInitCompleted', function () {
                _this.repinColumns(opts);
            }, "ColPin_Init");
        };

        ColPin.prototype.registerCallbacks = function () {
            var _this = this;
            /* State saving */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateSaveParams', function (oS, oData) {
                _this.saveState(oData);
            }, "ColPin_StateSave");

            /* State loading */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateLoaded', function (oS, oData) {
                _this.loadState(oData);
            }, "ColPin_StateLoaded");

            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateLoadParams', function (oS, oData) {
                _this.reset();
            }, "ColPin_StateLoading");

            if ($.fn.DataTable.models.oSettings.remoteStateInitCompleted !== undefined) {
                //Integrate with remote state
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateLoadedParams', function (s, data) {
                    _this.loadState(data);
                }, "ColPin_StateLoad");
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateLoadingParams', function (s, data) {
                    _this.reset();
                }, "ColPin_StateLoad");
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateSaveParams', function (s, data) {
                    _this.saveState(data);
                }, "ColPin_StateSave");
            }
        };

        ColPin.prototype.initialize = function () {
            var _this = this;
            $.each(this.dt.settings.aoColumns, function (i, col) {
                var $th = $(col.nTh);
                $th.append(_this.createPinIcon(false, col));
            });

            var fixCol = this.settings.fixedColumns;
            if (fixCol && (fixCol.leftColumns || fixCol.rightColumns)) {
                this.repinColumns({
                    leftColumns: fixCol.leftColumns || 0,
                    rightColumns: fixCol.rightColumns || 0
                });
            }

            if (this.dt.settings.oInit.bStateSave && this.dt.settings.oLoadedState) {
                this.loadState(this.dt.settings.oLoadedState);
            }

            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'colPinInitCompleted', 'colPinInitCompleted', [this]);
        };
        ColPin.defaultSettings = {
            classes: {
                iconClass: 'pin',
                pinnedClass: 'pinned',
                unpinnedClass: 'unpinned'
            },
            fixedColumns: null,
            bindingAdapter: null
        };
        return ColPin;
    })();
    dt.ColPin = ColPin;
})(dt || (dt = {}));

(function (window, document, undefined) {
    //Register events
    $.fn.DataTable.models.oSettings.colPinInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.register('colPin.init()', function (settings) {
        var colPin = new dt.ColPin(this, settings);
        if (this.settings()[0]._bInitComplete)
            colPin.initialize();
        else
            this.one('init.dt', function () {
                colPin.initialize();
            });

        return null;
    });

    $.fn.DataTable.Api.register('colPin.repin()', function (settings) {
        var colPin = this.settings()[0].colPin;
        colPin.repinColumns(settings);
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().colPin.init(oSettings.oInit.colPin);
        },
        "cFeature": "I",
        "sFeature": "ColPin"
    });

    //Integrate with boostrap 3 if present
    if ((typeof $().emulateTransitionEnd == 'function'))
        dt.ColPin.defaultSettings.classes.iconClass = 'glyphicon glyphicon-pushpin';
}(window, document, undefined));
