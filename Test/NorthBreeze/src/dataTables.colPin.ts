module dt {
    
    export interface IColPinBindingAdapter {
        fixedColumnsDestroying(fixedColumns): void
        fixedColumnsDestroyed(): void
        fixedColumnsDraw(data): void
        fixedColumnsCreated(fixedColumns): void
    }

    export class AngularColPinAdapter implements IColPinBindingAdapter{
        
        private dt = {
            settings: null,
            api: null
        }
        private settings;

        constructor(api, settings) {
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
        }

        public fixedColumnsDestroying(fixedColumns): void {
            
        }

        public fixedColumnsDestroyed(): void {
            
        }

        public fixedColumnsCreated(fixedColumns): void {
            
        }

        public fixedColumnsDraw(data): void {
            this.linkTable(data.leftClone.body);
            this.linkTable(data.rightClone.body);
        }

        private linkTable(table) {
            if (!table) return;
            $('tr>td', table).each((i, td) => {
                var $td = $(td);
                var cellScope = (<any>$td).scope();
                if (!cellScope) return;
                this.dt.settings.oInit.angular.$compile($td)(cellScope);
            });
        }
    }


    export class ColPin {

        public static defaultSettings: any = {
            classes: {
                iconClass: 'pin',
                pinnedClass: 'pinned',
                unpinnedClass: 'unpinned'
            },
            fixedColumns: null,
            bindingAdapter: null,
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
        public bindingAdapterInstance: IColPinBindingAdapter;

        constructor(api, settings) {
            this.settings = $.extend(true, {}, ColPin.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.colPin = this;
            this.setupAdapters();
            this.registerCallbacks();
        }

        private setupAdapters() {
            this.setupBindingAdapter();
        }

        private setupBindingAdapter() {
            if (!this.settings.bindingAdapter) {
                if (window.hasOwnProperty('angular'))
                    this.settings.bindingAdapter = dt.AngularColPinAdapter;
            }
            if (!this.settings.bindingAdapter) return;
            this.bindingAdapterInstance = new this.settings.bindingAdapter(this.dt.api, this.settings);
        }

        private pinColumn(col, direction) : void {
            if (col == null) return;
            var fromIndex = this.getColumnIndex(col);
            col.nTh._DT_PinDir = direction === 'left' ? 'left' : 'right';
            var toIndex = direction === 'left'
                ? this.dom.leftPinned
                : (this.dt.settings.aoColumns.length - 1) - this.dom.rightPinned;
            this.destroyFixedColumns();
            this.moveColumn(fromIndex, toIndex);
            this.incPinnedColumns(direction);
            col.resizableOrig = col.resizable;
            col.resizable = false;
            this.createFixedColumns({
                leftColumns: this.dom.leftPinned,
                rightColumns: this.dom.rightPinned
            });
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
            var i, cIdx;
            var columns = this.dt.settings.aoColumns;
            var fromIndex = this.getColumnIndex(col);
            var direction = col.nTh._DT_PinDir;
            var origPos = col._ColReorder_iOrigCol != null ? col._ColReorder_iOrigCol : fromIndex;
            var toIndex;

            switch(direction) {
                case 'left':
                    toIndex = (this.dom.leftPinned - 1) > origPos
                        ? (this.dom.leftPinned - 1)
                        : origPos;
                    for (i = toIndex + 1; i < columns.length; i++) {
                        cIdx = columns[i]._ColReorder_iOrigCol != null ? columns[i]._ColReorder_iOrigCol : i;
                        if (cIdx >= origPos) break;
                        toIndex++;
                    }
                    break;
                default:
                    toIndex = (columns.length - this.dom.rightPinned) < origPos
                        ? (columns.length - this.dom.rightPinned)
                        : origPos;
                    for (i = toIndex-1; i >= 0; i--) {
                        cIdx = columns[i]._ColReorder_iOrigCol != null ? columns[i]._ColReorder_iOrigCol : i;
                        if (cIdx <= origPos) break;
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
        }

        private createPinIcon(pinned: boolean, col: any) : JQuery {
            return $('<span />')
                .addClass('dt-pin')
                .data('_DT_Column', col)
                .addClass(this.settings.classes.iconClass)
                .addClass(pinned ? this.settings.classes.pinnedClass : this.settings.classes.unpinnedClass)
                .on('click', (evt) => {
                    evt.stopPropagation();
                    var $target = $(evt.target);
                    var direction = !evt.shiftKey ? 'left' : 'right';

                    if ($target.hasClass(this.settings.classes.pinnedClass)) 
                        this.unpinColumn($target.data('_DT_Column'));
                    else
                        this.pinColumn($target.data('_DT_Column'), direction);

            });
        }

        private destroyFixedColumns(): void {
            if (!this.dt.fixedColumns) return;

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
        }

        private createFixedColumns(settings): void {
            settings = settings || {};
            if (this.settings.fixedColumns)
                settings = $.extend(true, {}, this.settings.fixedColumns, settings);
            var pinnIcons = (elem) => {
                if (elem == null) return;
                $('thead>tr>th', elem).each((i, th) => {
                    var pin = $('span.dt-pin', th);
                    pin.removeClass(this.settings.classes.unpinnedClass);
                    pin.addClass(this.settings.classes.pinnedClass);
                });
            }
            settings.drawCallback = (leftClone, rightClone) => {
                var data = {
                    "leftClone": leftClone,
                    "rightClone": rightClone
                };
                
                pinnIcons(leftClone.header);
                pinnIcons(rightClone.header);

                if (this.bindingAdapterInstance)
                    this.bindingAdapterInstance.fixedColumnsDraw(data);

                this.dt.settings.oApi._fnCallbackFire(this.dt.settings, null, 'colPinFcDraw', [this, data]);
            };
            this.dt.fixedColumns = new $.fn.DataTable.FixedColumns(this.dt.api, settings);
            if (this.bindingAdapterInstance)
                this.bindingAdapterInstance.fixedColumnsCreated(this.dt.fixedColumns);
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

        private repinColumns(data) {
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
        }

        private loadState(data) {
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
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'colPinInitCompleted', () => {
                this.repinColumns(opts);
            }, "ColPin_Init");
        }

        private registerCallbacks() {
            /* State saving */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateSaveParams', (oS, oData) => {
                this.saveState(oData);
            }, "ColPin_StateSave");

            /* State loading */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateLoaded', (oS, oData) => {
                this.loadState(oData);
            }, "ColPin_StateLoaded");

            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateLoadParams', (oS, oData) => {
                this.reset();
            }, "ColPin_StateLoading");

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
        }
    }
} 

(function(window, document, undefined) {

    //Register events
    $.fn.DataTable.models.oSettings.colPinInitCompleted = [];

     //Register api function
    $.fn.DataTable.Api.register('colPin.init()', function (settings) {
        var colPin = new dt.ColPin(this, settings);
        if (this.settings()[0]._bInitComplete)
            colPin.initialize();
        else
            this.one('init.dt', () => { colPin.initialize(); });

        return null;
    });

    $.fn.DataTable.Api.register('colPin.repin()', function (settings) {
        var colPin = this.settings()[0].colPin;
        colPin.repinColumns(settings);
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().colPin.init(oSettings.oInit.colPin);
        },
        "cFeature": "I",
        "sFeature": "ColPin"
    });

    //Integrate with boostrap 3 if present
    if ((typeof (<any>$)().emulateTransitionEnd == 'function'))
        dt.ColPin.defaultSettings.classes.iconClass = 'glyphicon glyphicon-pushpin';

} (window, document, undefined));