module dt {
    
    export class ColPin {

        public static defaultSettings: any = {
            dom: {
                pinIcon: {
                    iconClass: 'glyphicon glyphicon-pushpin',
                    pinnedClass: 'pinned',
                    unpinnedClass: 'unpinned'
                }
            }
        };

        private settings: any;
        private initialized: boolean = false;
        private dt: any = {
            settings: null,
            api: null,
            fixedColumns: null
        };
        private dom = {
            leftPinned: 0,
            rightPinned: 0
        };

        constructor(api, settings) {
            this.settings = $.extend(true, {}, ColPin.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.colPin = this;
            this.registerCallbacks();
        }

        private pinColumn(col, direction) : void {
            if (col == null) return;
            var fromIndex = this.getColumnIndex(col);
            col.nTh._DT_PinDir = direction === 'left' ? 'left' : 'right';
            var toIndex = direction === 'left'
                ? this.dom.leftPinned
                : (this.dt.settings.aoColumns.length - 1) - this.dom.rightPinned;
            this.moveColumn(fromIndex, toIndex);
            this.incPinnedColumns(direction);
            col.resizableOrig = col.resizable;
            col.resizable = false;
            
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

        private incPinnedColumns(direction): void {
            if (direction === 'left')
                this.dom.leftPinned += 1;
            else
                this.dom.rightPinned += 1;
        }

        private decPinnedColumns(direction) : void {
            if (direction === 'left')
                this.dom.leftPinned -= 1;
            else
                this.dom.rightPinned -= 1;
        }

        private getPinnedColumnsCount(direction = null) : number {
            if (direction === null) return this.dom.leftPinned + this.dom.rightPinned;
            return (direction === 'left')
                ? this.dom.leftPinned
                : this.dom.rightPinned;
        }

        private moveColumn(fromIndex: number, toIndex: number): void {
            if (fromIndex === toIndex) return;
            /* Actually do the reorder */
            this.dt.settings.oInstance.fnColReorder(fromIndex, toIndex);
            this.dt.settings._colReorder._fnSetColumnIndexes();

            /* When scrolling we need to recalculate the column sizes to allow for the shift */
            if (this.dt.settings.oScroll.sX !== "" || this.dt.settings.oScroll.sY !== "") {
                this.dt.settings.oInstance.fnAdjustColumnSizing();
            }
        }

        private unpinColumn(col) : void {
            if (col == null) return;
            var fromIndex = this.getColumnIndex(col);
            var direction = col.nTh._DT_PinDir;
            var toIndex = direction === 'left'
                ? this.dom.leftPinned - 1
                : this.dt.settings.aoColumns.length - this.dom.rightPinned;
            this.moveColumn(fromIndex, toIndex);
            this.decPinnedColumns(direction);
            col.nTh._DT_PinDir = null;
            col.resizable = col.resizableOrig;
        }

        private createPinIcon(pinned: boolean, col: any) : JQuery {
            return $('<span />')
                .addClass('dt-pin')
                .data('_DT_Column', col)
                .addClass(this.settings.dom.pinIcon.iconClass)
                .addClass(pinned ? this.settings.dom.pinIcon.pinnedClass : this.settings.dom.pinIcon.unpinnedClass)
                .on('click', evt => {
                    evt.stopPropagation(); //We have to do this in order to skip dt ordering 
                })
                .on('mouseup', (evt) => {
                    evt.preventDefault();
                    var $target = $(evt.target);
                    var direction = !evt.shiftKey ? 'left' : 'right';

                    if ($target.hasClass(this.settings.dom.pinIcon.pinnedClass)) 
                        this.unpinColumn($target.data('_DT_Column'));
                    else
                        this.pinColumn($target.data('_DT_Column'), direction);

                    //reInit FixedColumns
                    this.destroyFixedColumns();
                    this.createFixedColumns({
                        leftColumns: this.dom.leftPinned,
                        rightColumns: this.dom.rightPinned
                    });
            });
        }

        private destroyFixedColumns(): void {

            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, null, 'colPinFcDestroying', [this]);

            var cf = this.dt.fixedColumns;
            if (!cf) return;

            $(this.dt.fixedColumns).off('draw.dtfc');

            $(this.dt.settings.nTable).off('column-sizing.dt.DTFC destroy.dt.DTFC draw.dt.DTFC');

            $(cf.dom.scroller).off('scroll.DTFC mouseover.DTFC');
            $(window).off('resize.DTFC');

            $(cf.dom.grid.left.liner).off('scroll.DTFC wheel.DTFC mouseover.DTFC');
            $(cf.dom.grid.left.wrapper).remove();

            $(cf.dom.grid.right.liner).off('scroll.DTFC wheel.DTFC mouseover.DTFC');
            $(cf.dom.grid.right.wrapper).remove();

            this.dt.fixedColumns = null;
        }

        private createFixedColumns(settings): void {
            settings = settings || {};

            var pinnIcons = (elem) => {
                if (elem == null) return;
                $('thead>tr>th', elem).each((i, th) => {
                    var pin = $('span.dt-pin', th);
                    pin.removeClass(this.settings.dom.pinIcon.unpinnedClass);
                    pin.addClass(this.settings.dom.pinIcon.pinnedClass);
                });
            }
            settings.drawCallback = (leftClone, rightClone) => {
                var data = {
                    "leftClone": leftClone,
                    "rightClone": rightClone
                };
                this.dt.settings.oApi._fnCallbackFire(this.dt.settings, null, 'colPinFcDraw', [this, data]);
                pinnIcons(leftClone.header);
                pinnIcons(rightClone.header);
            };
            this.dt.fixedColumns = new $.fn.DataTable.FixedColumns(this.dt.api, settings);
        }

        private saveState(data) {
            if (!this.dt.settings._bInitComplete) {
                var oData = this.dt.settings.fnStateLoadCallback.call(this.dt.settings.oInstance, this.dt.settings);
                if (oData && oData.colPin)
                    data.colPin = oData.colPin;
                return;
            }
            data.colPin = {
                leftPinned: this.dom.leftPinned,
                rightPinned: this.dom.rightPinned,
            };
        }

        public reset() {
            this.dom.rightPinned = 0;
            this.dom.leftPinned = 0;
            this.destroyFixedColumns();
        }

        private loadState(data) {
            if (!data.colPin) {
                this.reset();
                return;
            }

            var onInit = () => {
                var i;
                var leftPinned = data.colPin.leftPinned;
                for (i = 0; i < leftPinned; i++) {
                    this.pinColumn(this.dt.settings.aoColumns[i], 'left');
                }

                var rightPinned = data.colPin.rightPinned;
                var colNum = this.dt.settings.aoColumns.length - 1;
                for (i = colNum; i > (colNum - rightPinned); i--) {
                    this.pinColumn(this.dt.settings.aoColumns[i], 'right');
                }

                //reInit FixedColumns
                this.destroyFixedColumns();
                this.createFixedColumns({
                    leftColumns: this.dom.leftPinned,
                    rightColumns: this.dom.rightPinned
                });
            };

            //If the plugin aws already initialized we can pin the columns otherwise register a callback
            if (this.initialized) {
                onInit();
                return;
            }
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'colPinInitCompleted', () => {
                onInit();
            }, "ColPin_Init");
        }

        private registerCallbacks() {
            /* State saving */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateSaveParams', (oS, oData) => {
                this.saveState(oData);
            }, "ColPin_StateSave");

            /* State loading */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateLoadParams', (oS, oData) => {
                this.loadState(oData);
            }, "ColPin_StateLoad");

            if ($.fn.DataTable.models.oSettings.remoteStateInitCompleted !== undefined) {
                //Integrate with remote state
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateLoadedParams', (s, data) => {
                    this.loadState(data);
                }, "ColPin_StateLoad");
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateLoadingParams', (s, data) => {
                    this.reset();
                }, "ColPin_StateLoad");
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateSaveParams', (s, data) => {
                    this.saveState(data);
                }, "ColPin_StateSave");
            }
        }

        public initialize() : void {
            $.each(this.dt.settings.aoColumns, (i, col) => {
                var $th = $(col.nTh);
                $th.append(this.createPinIcon(false, col));
            });

            if (this.dt.settings.oInit.bStateSave && this.dt.settings.oLoadedState) {
                this.loadState(this.dt.settings.oLoadedState);
            }

            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'colPinInitCompleted', 'colPinInitCompleted', [this]);
        }
    }
} 

(function(window, document, undefined) {

    //Register events
    $.fn.DataTable.models.oSettings.colPinInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.prototype.colPin = function (settings) {
        var colPin = new dt.ColPin(this, settings);
        if (this.settings()[0]._bInitComplete)
            colPin.initialize();
        else
            this.one('init.dt', () => { colPin.initialize(); });

        return null;
    };

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().colPin(oSettings.oInit.colPin);
        },
        "cFeature": "I",
        "sFeature": "ColPin"
    });

} (window, document, undefined));