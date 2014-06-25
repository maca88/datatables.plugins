var dt;
(function (dt) {
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
            this.registerCallbacks();
        }
        ColPin.prototype.pinColumn = function (col, direction) {
            if (col == null)
                return;
            var fromIndex = this.getColumnIndex(col);
            col.nTh._DT_PinDir = direction === 'left' ? 'left' : 'right';
            var toIndex = direction === 'left' ? this.dom.leftPinned : (this.dt.settings.aoColumns.length - 1) - this.dom.rightPinned;
            this.moveColumn(fromIndex, toIndex);
            this.incPinnedColumns(direction);
            col.resizableOrig = col.resizable;
            col.resizable = false;
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
            var fromIndex = this.getColumnIndex(col);
            var direction = col.nTh._DT_PinDir;
            var toIndex = direction === 'left' ? this.dom.leftPinned - 1 : this.dt.settings.aoColumns.length - this.dom.rightPinned;
            this.moveColumn(fromIndex, toIndex);
            this.decPinnedColumns(direction);
            col.nTh._DT_PinDir = null;
            col.resizable = col.resizableOrig;
        };

        ColPin.prototype.createPinIcon = function (pinned, col) {
            var _this = this;
            return $('<span />').addClass('dt-pin').data('_DT_Column', col).addClass(this.settings.dom.pinIcon.iconClass).addClass(pinned ? this.settings.dom.pinIcon.pinnedClass : this.settings.dom.pinIcon.unpinnedClass).on('click', function (evt) {
                evt.stopPropagation(); //We have to do this in order to skip dt ordering
            }).on('mouseup', function (evt) {
                evt.preventDefault();
                var $target = $(evt.target);
                var direction = !evt.shiftKey ? 'left' : 'right';

                if ($target.hasClass(_this.settings.dom.pinIcon.pinnedClass))
                    _this.unpinColumn($target.data('_DT_Column'));
                else
                    _this.pinColumn($target.data('_DT_Column'), direction);

                //reInit FixedColumns
                _this.destroyFixedColumns();
                _this.createFixedColumns({
                    leftColumns: _this.dom.leftPinned,
                    rightColumns: _this.dom.rightPinned
                });
            });
        };

        ColPin.prototype.destroyFixedColumns = function () {
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, null, 'colPinFcDestroying', [this]);

            var cf = this.dt.fixedColumns;
            if (!cf)
                return;

            $(this.dt.fixedColumns).off('draw.dtfc');

            $(this.dt.settings.nTable).off('column-sizing.dt.DTFC destroy.dt.DTFC draw.dt.DTFC');

            $(cf.dom.scroller).off('scroll.DTFC mouseover.DTFC');
            $(window).off('resize.DTFC');

            $(cf.dom.grid.left.liner).off('scroll.DTFC wheel.DTFC mouseover.DTFC');
            $(cf.dom.grid.left.wrapper).remove();

            $(cf.dom.grid.right.liner).off('scroll.DTFC wheel.DTFC mouseover.DTFC');
            $(cf.dom.grid.right.wrapper).remove();

            this.dt.fixedColumns = null;
        };

        ColPin.prototype.createFixedColumns = function (settings) {
            var _this = this;
            settings = settings || {};

            var pinnIcons = function (elem) {
                if (elem == null)
                    return;
                $('thead>tr>th', elem).each(function (i, th) {
                    var pin = $('span.dt-pin', th);
                    pin.removeClass(_this.settings.dom.pinIcon.unpinnedClass);
                    pin.addClass(_this.settings.dom.pinIcon.pinnedClass);
                });
            };
            settings.drawCallback = function (leftClone, rightClone) {
                var data = {
                    "leftClone": leftClone,
                    "rightClone": rightClone
                };
                _this.dt.settings.oApi._fnCallbackFire(_this.dt.settings, null, 'colPinFcDraw', [_this, data]);
                pinnIcons(leftClone.header);
                pinnIcons(rightClone.header);
            };
            this.dt.fixedColumns = new $.fn.DataTable.FixedColumns(this.dt.api, settings);
        };

        ColPin.prototype.saveState = function (data) {
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

        ColPin.prototype.loadState = function (data) {
            var _this = this;
            if (!data.colPin) {
                this.reset();
                return;
            }

            var onInit = function () {
                var i;
                var leftPinned = data.colPin.leftPinned;
                for (i = 0; i < leftPinned; i++) {
                    _this.pinColumn(_this.dt.settings.aoColumns[i], 'left');
                }

                var rightPinned = data.colPin.rightPinned;
                var colNum = _this.dt.settings.aoColumns.length - 1;
                for (i = colNum; i > (colNum - rightPinned); i--) {
                    _this.pinColumn(_this.dt.settings.aoColumns[i], 'right');
                }

                //reInit FixedColumns
                _this.destroyFixedColumns();
                _this.createFixedColumns({
                    leftColumns: _this.dom.leftPinned,
                    rightColumns: _this.dom.rightPinned
                });
            };

            //If the plugin aws already initialized we can pin the columns otherwise register a callback
            if (this.initialized) {
                onInit();
                return;
            }
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'colPinInitCompleted', function () {
                onInit();
            }, "ColPin_Init");
        };

        ColPin.prototype.registerCallbacks = function () {
            var _this = this;
            /* State saving */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateSaveParams', function (oS, oData) {
                _this.saveState(oData);
            }, "ColPin_StateSave");

            /* State loading */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateLoadParams', function (oS, oData) {
                _this.loadState(oData);
            }, "ColPin_StateLoad");

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
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'colPinInitCompleted', 'colPinInitCompleted', [this]);
        };
        ColPin.defaultSettings = {
            dom: {
                pinIcon: {
                    iconClass: 'glyphicon glyphicon-pushpin',
                    pinnedClass: 'pinned',
                    unpinnedClass: 'unpinned'
                }
            }
        };
        return ColPin;
    })();
    dt.ColPin = ColPin;
})(dt || (dt = {}));

(function (window, document, undefined) {
    //Register events
    $.fn.DataTable.models.oSettings.colPinInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.prototype.colPin = function (settings) {
        var colPin = new dt.ColPin(this, settings);
        if (this.settings()[0]._bInitComplete)
            colPin.initialize();
        else
            this.one('init.dt', function () {
                colPin.initialize();
            });

        return null;
    };

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().colPin(oSettings.oInit.colPin);
        },
        "cFeature": "I",
        "sFeature": "ColPin"
    });
}(window, document, undefined));
//# sourceMappingURL=dataTables.colPin.js.map
