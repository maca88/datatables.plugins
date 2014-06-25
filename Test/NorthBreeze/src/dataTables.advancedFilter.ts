module dt {
    
    export class AdvancedFilter {
        
        public static defaultSettings = {
            operators: {
                types: {
                    'string': ['nn', 'nl', 'eq', 'ne', 'co', 'nc', 'sw', 'ew'],
                    'number': ['nn', 'nl', 'eq', 'ne', 'lt', 'le', 'gt', 'ge'],
                    'boolean': ['nn', 'nl', 'eq', 'ne'],
                    'date': ['nn', 'nl', 'eq', 'ne', 'lt', 'le', 'gt', 'ge'],
                    'undefined': ['nn', 'nl', 'eq', 'ne']
                },
                eq: {
                    fn: null//function (data, input) { return data === input; }
                }
            },
            typesEditor: { //each property can be an object or a 
                'string': {
                    tag: 'input',
                    attr: { type: 'text' },
                    className: 'form-control input-sm',

                    customCreationFn: null, //function(column, operator, value, settings): editor - this -> api
                    setFilterValue: null,
                    getFilterValue: null
                },
                'date': {
                    tag: 'input',
                    attr: { type: 'date' },
                    className: 'form-control input-sm',
                    getFilterValue: function () {
                        return this.get(0).valueAsDate;
                    },
                    setFilterValue: function (date) {
                        this.get(0).valueAsDate = date;
                    }
                },
                'time': {
                    tag: 'input',
                    attr: { type: 'time' },
                    className: 'form-control input-sm'
                },
                'dateTime': {
                    tag: 'input',
                    attr: { type: 'datetime-local' },
                    className: 'form-control input-sm'
                },
                'number': {
                    tag: 'input',
                    attr: { type: 'number', step: 'any' },
                    className: 'form-control input-sm',
                    getFilterValue: function () {
                        return this.get(0).valueAsNumber;
                    },
                    setFilterValue: function (num) {
                        this.get(0).valueAsNumber = num;
                    }
                },
                'select': {
                    tag: 'select',
                    attr: {},
                    className: 'form-control input-sm'
                }
            },
            dom: {
                settingButtonDiv: {
                    className: 'dt-global-filter-div'
                },
                settingButton: {
                    buttonClass: 'btn btn-default btn-sm',
                    spanClass: 'glyphicon glyphicon-filter'
                },
                addGroupButton: {
                    buttonClass: 'btn btn-default btn-sm',
                    spanClass: 'glyphicon glyphicon-plus'
                },
                removeGroupButton: {
                    buttonClass: 'btn btn-default btn-sm',
                    spanClass: 'glyphicon glyphicon-minus'
                },
                addRuleButton: {
                    buttonClass: 'btn btn-default btn-sm',
                    spanClass: 'glyphicon glyphicon-plus'
                },
                removeRuleButton: {
                    buttonClass: 'btn btn-default btn-sm',
                    spanClass: 'glyphicon glyphicon-minus'
                },
                ruleOperatorSelect: {
                    className: 'form-control input-sm',
                },
                groupOperatorSelect: {
                    className: 'form-control input-sm',
                },
                columnSelect: {
                    className: 'form-control input-sm',
                },
                columnFilterIcon: {
                    className: 'glyphicon glyphicon-filter'
                },
                filterButton: {
                    className: 'btn btn-primary'
                },
                clearButton: {
                    className: 'btn btn-default'
                }
            },
            language: {
                'all': 'All',
                'filter': 'Filter',
                'clear': 'Clear',
                'and': 'And',
                'or': 'Or',
                'columnFilter': 'Column filter',
                'filterFor': 'Filter for',
                'removeGroup': 'Remove group',
                'removeRule': 'Remove rule',
                'addGroup': 'Add group',
                'addRule': 'Add rule',
                'filterSettings': 'Filter settings',
                'operators': {
                    'nl': 'Is null',
                    'nn': 'Not null',
                    'eq': 'Equal',
                    'ne': 'Not equal',
                    'co': 'Contains',
                    'nc': 'Not contain',
                    'sw': 'Starts with',
                    'ew': 'Ends with',
                    'lt': 'Less than',
                    'le': 'Less or equal',
                    'gt': 'Greater than',
                    'ge': 'Greater or equal'
                }
            },
            stateData: null,
            getDefaultFilterEditor: (settings, column) => {
                var type = column.sType ? column.sType.toLowerCase() : '';
                switch (type) {
                    case 'num-fmt':
                    case 'num':
                        return settings.typesEditor['number'];
                    default:
                        return settings.typesEditor['string'];
                }
            },
            getDefaultColumnOperators: (settings, column) => { //this will execute for types that are not defined in operators.types and in the column itself
                var type = column.sType ? column.sType.toLowerCase() : '';
                switch (type) {
                    case 'num-fmt':
                    case 'num':
                        return settings.operators.types['number'];
                    default:
                        return settings.operators.types['undefined'];
                }
            },
            createFilterEditor: null, //function(column, operator, value): editor - this -> api
            filterEditorCreated: null, //function(editor, column, operator, value): void - this -> api
            ruleRemoving: null, //function(table): void - this -> api
        }
        public settings: any;
        public dt:any = {
            settings: null,
            api: null
        };
        public dom = {
            modal: {
                id: null,
                content: null,
                header: null,
                body: null,
                footer: null,
                container: null
            },
            globalFilter: {
                container: null,
                button: null
            }
        };
        public filterDefaultSettings = {
            columns: null,
            data: null,
            group: {
                table: {
                    css: {},
                    columnHeader: true,
                },
                add: true,
                remove: true,
                visible: true,
            },
            rule: {
                add: true,
                initAdd: false,
                remove: true,
                initRemove: false,
                table: {
                    css: {}
                },
                columnSelect: {
                    separateRow: false,
                    colSpan: 1,
                    attr: {},
                    css: {}
                },
                operatorSelect: {
                    separateRow: false,
                    colSpan: 1,
                    attr: {},
                    css: {}
                },
                filterInput: {
                    separateRow: false,
                    colSpan: 1,
                    attr: {},
                    css: {}
                },
                removeButton: {
                    separateRow: false,
                    colSpan: 1,
                    attr: {},
                    css: {}
                }
            }
        };
        public initialized: boolean;
        private stateData: any;
        private columnsByOrigData: any = {};

        constructor(api, settings) {
            this.settings = $.extend(true, AdvancedFilter.defaultSettings, settings);
            this.stateData = this.settings.stateData;
            if (!this.stateData)
                this.stateData = this.getDefaultGroupState();
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.advancedFilter = this;

            //Create a map for faster getting the column information by the original mData
            for (var i = 0; i < this.dt.settings.aoColumns.length; i++) {
                var col = this.dt.settings.aoColumns[i];
                this.columnsByOrigData[this.getColumnData(col)] = col;
            }
            this.createDomElements();
            this.registerCallbacks();
        }

        private createDomElements() {
            this.dom.modal.id = this.dt.settings.sTableId + '_FilterSettings_Modal';
            this.dom.modal.content = $('<div/>').addClass('modal-content');
            this.dom.modal.header = $('<div/>')
                .addClass('modal-header')
                .append(
                $('<button />')
                    .attr({
                        'type': 'button',
                        'data-dismiss': 'modal',
                        'aria-hidden': 'true'
                    })
                    .html('&times;')
                    .addClass('close')
                )
                .append($('<h4 />').addClass('modal-title').html(this.getTranslation('filterSettings'))
                );
            this.dom.modal.body = $('<div/>').addClass('modal-body');
            this.dom.modal.footer = $('<div/>').addClass('modal-footer');
            this.dom.modal.container = $('<div />')
                .attr({
                    'id': this.dom.modal.id,
                    'role': 'dialog',
                    'aria-hidden': 'true'
                })
                .on('hide.bs.modal', () => {
                    this.saveGlobalFilterState();
                })
                .addClass('modal fade')
                .append(
                $('<div/>')
                    .addClass('modal-dialog modal-lg')
                    .append(
                    this.dom.modal.content
                        .append(this.dom.modal.header, this.dom.modal.body, this.dom.modal.footer)
                    )
                );


            this.dom.globalFilter.button = $('<button />');
            this.dom.globalFilter.container =
            $('<div />')
                .addClass(this.settings.dom.settingButtonDiv.className)
                .append(
                this.dom.globalFilter.button
                    .attr('title', this.getTranslation('filterSettings'))
                    .addClass(this.settings.dom.settingButton.buttonClass)
                    .on('click', (e) => {
                        this.closeAllColumnFilters();
                        this.populateGlobalFilter();
                        this.dom.modal.container.modal('show');
                    })
                    .append(
                    $('<span />')
                        .addClass(this.settings.dom.settingButton.spanClass)
                    )
                )
                .append(this.dom.modal.container);
        }

        private registerCallbacks() {
            if ($.fn.DataTable.models.oSettings.remoteStateInitCompleted !== undefined) {
                //Integrate with remote state
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateLoadedParams', this.loadState.bind(this), "AdvFilter_StateLoad");
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateSaveParams', this.saveState.bind(this), "AdvFilter_StateSave");
            }

            if (this.dt.settings.oInit.bServerSide || this.dt.settings.oInit.serverSide) {
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoServerParams', this.setServerParams.bind(this), "AdvFilter_ServerParam");

                //If breezeRemote is used integrate advanceFilter with it
                if (this.dt.settings.oInit.breezeRemote) {
                    var origBeforeQueryExecution;
                    var breezeRemoteSettings;
                    //check if breezeRemote was already initialized
                    breezeRemoteSettings = this.dt.settings.breezeRemote != null && this.dt.settings.breezeRemote.settings
                    ? this.dt.settings.breezeRemote.settings
                    : this.dt.settings.oInit.breezeRemote;
                    origBeforeQueryExecution = breezeRemoteSettings.beforeQueryExecution;

                    var that = this;
                    breezeRemoteSettings.beforeQueryExecution = function (query, data) {
                        query = that.serverSideBreezeRemoteFilter(query, data);
                        return $.isFunction(origBeforeQueryExecution)
                            ? origBeforeQueryExecution.call(this, query, data)
                            : query;
                    };
                }
            } 
        }

        public initialize() {     
            this.drawColumnFilters();
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'advancedFilterInitCompleted', 'advancedFilterInitCompleted', [this]);
        }

        private saveGlobalFilterState() {
            var state = this.filtersToJson(this.dom.modal.body);
            this.stateData = state;

            var cols = {};

            $.each(state.groups, (idx, group) => {
                if (group.colFilter == null) return;
                var col = this.columnsByOrigData[group.colFilter];
                col.advFilterState = group;
                cols[group.colFilter] = true;
            });

            $.each(this.dt.settings.aoColumns, (i, colOpts) => {
                if (cols.hasOwnProperty(this.getColumnData(colOpts))) return;
                colOpts.advFilterState = this.getDefaultGroupState();
                this.removeActiveColumnClass(colOpts);
            });

            if (state.groups.length || state.rules.length)
                this.addActiveGlobalFilterClass();
            else
                this.removeActiveGlobalFilterClass();
        }

        private populateGlobalFilter() {
            var filterDom = this.createFilters({
                data: this.stateData
            });
            filterDom.filterBtn.on('click', () => {
                this.saveGlobalFilterState();
                this.dom.modal.container.modal('hide');
                this.dt.api.draw(true);
            });
            filterDom.clearBtn.on('click', () => {
                this.clearGlobalFilterState();
                this.dt.api.draw(true);
            });
            this.dom.modal.body.html(filterDom.groups);
            this.dom.modal.footer.empty();
            this.dom.modal.footer.append(filterDom.clearBtn, filterDom.filterBtn);
        }

        private clearGlobalFilterState() {
            this.stateData = this.getDefaultGroupState();
            this.removeActiveGlobalFilterClass();
            $.each(this.dt.settings.aoColumns, (idx, colOpts) => {
                colOpts.advFilterState = this.getDefaultGroupState();
                this.removeActiveColumnClass(colOpts);
            });
            var filterDom = this.createFilters({
                data: this.stateData
            });
            this.dom.modal.body.html(filterDom.groups);
        }

        private getTranslation(key: string, prefix: string = null): string {
            var lang = this.settings.language;
            if (prefix)
                lang = lang[prefix] || {};
            return lang[key] || key;
        }

        private closeAllColumnFilters() {
            $.each(this.dt.settings.aoColumns, (idx, colOpts) => {
                if (!colOpts.advFilterIcon) return;
                var popover = colOpts.advFilterIcon.data('bs.popover');
                if (popover == null || popover.$tip == null) return;
                if(popover.$tip.hasClass('in'))
                    colOpts.advFilterIcon.popover('hide');
            });
        }

        private addActiveGlobalFilterClass() {
            this.dom.globalFilter.button.addClass('dt-global-filter-active');
        }

        private removeActiveGlobalFilterClass() {
            this.dom.globalFilter.button.removeClass('dt-global-filter-active');
        }

        private addActiveColumnClass(colOpts) {
            var icon = colOpts.advFilterIcon;
            if (!icon) {
                colOpts.advFilterIconActive = true;
                return;
            }
            icon.addClass('dt-column-filter-active');
            //FixedColumns
            var iconTarget = icon.data('advFilter.iconTarget');
            if (iconTarget == null || iconTarget === icon.get(0)) return;
            $(iconTarget).addClass('dt-column-filter-active');
        }

        private removeActiveColumnClass(colOpts) {
            var icon = colOpts.advFilterIcon;
            if (!icon) return;
            icon.removeClass('dt-column-filter-active');
            //FixedColumns
            var iconTarget = icon.data('advFilter.iconTarget');
            if (iconTarget == null || iconTarget === icon.get(0)) return;
            $(iconTarget).removeClass('dt-column-filter-active');
        }

        private saveColumnFilterState(colOpts, columnFilterDiv, state = null) {
            colOpts.advFilterState = state || this.filtersToJson(columnFilterDiv);
            colOpts.advFilterState.colFilter = this.getColumnData(colOpts); //mark as column filter
            var gIdx = -1;
            $.each(this.stateData.groups, (idx, group) => {
                if (group.colFilter == null) return;
                if (group.colFilter === colOpts.advFilterState.colFilter)
                    gIdx = idx;
            });
            if (colOpts.advFilterState.rules.length > 0) { //append column filter to the global filter
                if (gIdx < 0)
                    this.stateData.groups.push(colOpts.advFilterState);
                else
                    this.stateData.groups[gIdx] = colOpts.advFilterState;
                this.addActiveColumnClass(colOpts);
            }
            else if (gIdx >= 0) {//remove the column filter
                this.stateData.groups.splice(gIdx, 1);
                this.removeActiveColumnClass(colOpts);
            }

            if (this.stateData.rules.length || this.stateData.groups.length)
                this.addActiveGlobalFilterClass();
            else
                this.removeActiveGlobalFilterClass();
        }

        private clearColumnFilterState(colOpts, columnFilterDiv) {
            this.saveColumnFilterState(colOpts, columnFilterDiv, this.getDefaultGroupState());
        }

        private populateColumnFilter(colOpts, columnFilterDiv) {
            var filterDom = this.createFilters({
                columns: [colOpts],
                data: colOpts.advFilterState,
                group: {
                    add: false,
                    table: {
                        css: { 'width': '100%' },
                        columnHeader: false,
                    },
                },
                rule: {
                    initRemove: true,
                    table: {
                        css: { 'width': '100%' }
                    },
                    columnSelect: {
                        separateRow: true,
                    },
                    operatorSelect: {
                        separateRow: true,
                        css: { width: '100%' }
                    },
                    filterInput: {
                        separateRow: true,
                    },
                    removeButton: {
                        separateRow: true,
                    }
                }
            });
            filterDom.clearBtn.on('click', () => {
                colOpts.advFilterIcon.popover('hide');
                this.clearColumnFilterState(colOpts, columnFilterDiv);
                this.dt.api.draw(true);
            });
            filterDom.filterBtn.on('click', () => {
                colOpts.advFilterIcon.popover('hide');
                this.dt.api.draw(true);
            });

            columnFilterDiv
                .html(filterDom.groups)
                .on('keyup', (e) => {
                    if (e.keyCode !== 13) return;
                    colOpts.advFilterIcon.popover('hide');
                    this.dt.api.draw(true);
                })
                .append(
                $('<div />')
                    .addClass('row')
                    .append(
                    $('<div />')
                        .addClass('col-md-6')
                        .append(filterDom.clearBtn)
                    )
                    .append(
                    $('<div />')
                        .addClass('col-md-6')
                        .append(filterDom.filterBtn)
                    )
                );
        }

        private getOperators(column) {
            var filter = column.filter || {};
            var operators = filter.operators;
            if (operators) return operators;

            var colType = filter.type || column.sType || column.type || 'undefined';
            var type = colType.toLowerCase();
            if (this.settings.operators.types.hasOwnProperty(type)) {
                return this.settings.operators.types[type];
            } else if ($.isFunction(this.settings.getDefaultColumnOperators))
                return this.settings.getDefaultColumnOperators.call(this.dt.api, this.settings, column);
            else
                return this.settings.operators.types['undefined'];
        }

        private drawColumnFilters() {
            $.each(this.dt.settings.aoColumns, (i, col) => {
                if (!this.isColumnFilterable(col)) return;
                col.advFilterState = col.advFilterState || this.getDefaultGroupState();
                var columnFilterDiv = $('<div />');
                var link = $('<a />');
                link.popover({ //TODO: how to fix positioning on window resize
                    content: columnFilterDiv,
                    placement: 'bottom',
                    html: true,
                    container: '#' + this.dt.settings.nTableWrapper.id //Without this when scrollX/Scroller is used the popover will be hidden because of hidden overflow on the header container
                });
                link
                    .attr('title', this.getTranslation('columnFilter'))
                    .on('hide.bs.popover', () => {
                        this.saveColumnFilterState(col, columnFilterDiv);
                    })
                    .on('shown.bs.popover', e => {
                        var origTarget = link.data('advFilter.iconTarget');
                        if (origTarget == null || e.target === origTarget) return;
                        //FixedColumns
                        var popover = link.data('bs.popover');
                        if (popover == null) return;
                        //Copied from bootstrap
                        var pos = $.extend({}, (typeof origTarget.getBoundingClientRect == 'function') ? origTarget.getBoundingClientRect() : {
                            width: origTarget.offsetWidth,
                            height: origTarget.offsetHeight
                        }, $(origTarget).offset());
                        var tip = popover.$tip[0];
                        var offset = popover.getCalculatedOffset('bottom', pos, tip.offsetWidth, tip.offsetHeight);
                        popover.applyPlacement(offset, 'bottom');
                    })
                    .append(
                        $('<span />')
                        .addClass(this.settings.dom.columnFilterIcon.className)
                        .on('click', (e) => {
                            e.stopPropagation(); //We have to do this in order to skip dt ordering 
                            this.populateColumnFilter(col, columnFilterDiv);
                            link.data('advFilter.iconTarget', $(e.target).closest('a').get(0));
                            link.popover('toggle');
                        })
                    );
                col.advFilterIcon = link;
                if (col.advFilterIconActive) { //when remote state load a state
                    this.addActiveColumnClass(col);
                    delete col['advFilterIconActive'];
                }

                $(col.nTh).append(link);
            });
            
        }

        private createFilters(opts) {
            //We must not clone columns and data!
            var notDeepClone = { data: opts.data, columns: opts.columns };
            delete opts['data'];
            delete opts['columns'];
            opts = $.extend(true, {}, this.filterDefaultSettings, opts);
            $.extend(opts, notDeepClone);

            opts.columns = opts.columns || this.dt.settings.aoColumns;
            var group = this.createGroup(opts, null, true);

            var filterBtn = $('<button/>')
                .addClass(this.settings.dom.filterButton.className)
                .append(
                $('<span />')
                    .html(this.getTranslation('filter'))
                );
            var clearBtn = $('<button/>')
                .addClass(this.settings.dom.clearButton.className)
                .append(
                $('<span />')
                    .html(this.getTranslation('clear'))
                );

            return {
                groups: group,
                filterBtn: filterBtn,
                clearBtn: clearBtn
            };
        }

        private createGroup(opts, data, init) {
            var group: any = $('<table/>')
                .addClass('dt-filter-group')
                .css(opts.group.table.css);
            data = data || opts.data;

            group.data('colFilter', data.colFilter);
            if (data.colFilter != null && opts.group.table.columnHeader) {
                group.prepend(
                    $('<theader/>')
                        .append(
                        $('<tr/>')
                            .append(
                            $('<th/>')
                                .attr({ 'colspan': 4 })
                                .html(this.getTranslation('filterFor') + ': ' + this.columnsByOrigData[data.colFilter].sTitle)
                            )
                        )
                    );
            }

            var rules = data.rules ? data.rules : null;
            var groups = data.groups ? data.groups : null;

            var headerRow = this.createHeaderRow(opts, data, init);
            if (!opts.group.visible)
                headerRow.hide();
            group.append(headerRow);

            if (rules) {
                $.each(rules, (i, rule) => {
                    group.append(this.createFilterRow(opts, i, rule, data));
                });
            }
            else {
                group.append(this.createFilterRow(opts, 0, null, data));
            }

            if (groups) {
                $.each(groups, (i, child) => {
                    var groupRow = this.createGroupRow(opts, child);
                    group.append(groupRow);
                });
            }
            return group;
        }

        private createGroupRow(opts, groupObject) {
            var cell = $('<td/>').attr({ 'colspan': 4 });
            var group = this.createGroup(opts, groupObject, false);
            cell.append(group);
            return $('<tr/>').addClass('group-row').append(cell);
        }

        private createHeaderRow(opts, data, init) {
            var cell = $('<th/>').attr({ 'colspan': 4 });
            data = data || {};
            var groupOp = data.groupOp != null ? data.groupOp : 'and';

            var selectOperator = $('<select/>')
                .attr({ 'name': 'groupOperator' })
                .addClass(this.settings.dom.groupOperatorSelect.className)
                .append(
                $('<option/>')
                    .attr({ 'value': 'and' })
                    .html(this.getTranslation('and')),
                $('<option/>')
                    .attr({ 'value': 'or' })
                    .html(this.getTranslation('or'))
                );

            selectOperator.val(groupOp);

            cell.append(selectOperator);

            if (opts.group.add !== false && data.colFilter == null) //do not support adding new group for column filter
                cell.append(this.createAddGroupButton(opts));

            if (opts.rule.add !== false)
                cell.append(this.createAddRuleButton(opts, data));

            if (init !== true && opts.group.remove !== false) {
                cell.append(this.createRemoveGroupButton());
            }

            return $('<tr/>').append(cell);
        }

        private createFilterRow(opts, idx, rule, data) {
            var column;
            var td;
            var row = $('<tr/>');
            var body = $('<tbody/>');
            var table = $('<table/>');
            var rows = [];
            rule = rule || {};
            var result = $('<tr/>')
                .append(
                $('<td/>')
                    .attr({ 'colspan': 4 })
                    .append(
                    table
                        .css(<Object>(opts.rule.table.css))
                        .append(body)
                    )
                );

            var colSelectSepRow = opts.rule.columnSelect.separateRow;
            var opSelectSepRow = opts.rule.operatorSelect.separateRow;
            var fInputSepRow = opts.rule.filterInput.separateRow;
            var rButtonSepRow = opts.rule.removeButton.separateRow;

            //#region columns
            if (opts.columns.length == 1 || data.colFilter != null) { //if only one column is in the list we do not need to create a select box
                column = data.colFilter != null ? this.columnsByOrigData[data.colFilter] : opts.columns[0];
                td = $('<td/>').addClass('columns')
                    .append(
                    $('<input/>')
                        .attr({ 'name': 'column', 'type': 'hidden' })
                        .val(this.getColumnData(column))
                    );
                if (colSelectSepRow) {
                    rows.push($('<tr/>').append(td.attr({ 'colspan': 4 })).hide());
                } else {
                    row.append(td.attr({ 'colspan': opts.rule.columnSelect.colSpan }).hide());
                }
            } else {
                var columnSelect = this.createColumnSelect(opts, rule.data);
                column = $('option:selected', columnSelect).data('_DT_ColumnOpt');

                td = $('<td/>').addClass('columns').append(columnSelect);
                if (colSelectSepRow) {
                    rows.push($('<tr/>').append(
                        td.attr({ 'colspan': 4 })
                        ));
                } else {
                    row.append(td.attr({ 'colspan': opts.rule.columnSelect.colSpan }));
                }
            }
            //#endregion

            //#region operators
            td = $('<td/>').addClass('operators');
            if (opSelectSepRow) {
                rows.push($('<tr/>').append(
                    td.attr({ 'colspan': 4 })
                    ));
            } else {
                row.append(td.attr({ 'colspan': opts.rule.operatorSelect.colSpan }));
            }

            if (column) {
                var operatorSelect = this.createOperatorSelect(opts, column, rule.op);
                td.append(operatorSelect);
            }
            //#endregion

            //#region filter input
            td = $('<td/>').addClass('data');
            if (fInputSepRow) {
                rows.push($('<tr/>').append(
                    td.attr({ 'colspan': 4 })
                    ));
            } else {
                row.append(td.attr({ 'colspan': opts.rule.filterInput.colSpan }));
            }

            if (rule.op) {
                var filterInput = this.createFilterInput(column, rule.op, rule.value);
                if (filterInput.control)
                    td.append(filterInput.control)
                        .data("_DT_GetFilterValue", filterInput.getValue)
                        .data("_DT_SetFilterValue", filterInput.setValue);
            }
            //#endregion

            //#region delete button
            td = $('<td/>').addClass('remove');
            if (rButtonSepRow) {
                rows.push($('<tr/>').append(
                    td.attr({ 'colspan': 4 })
                    ));
            } else {
                row.append(td.attr({ 'colspan': opts.rule.removeButton.colSpan }));
            }

            if ((idx == 0 && opts.rule.initRemove) || opts.rule.remove) {
                td.append(this.createRemoveRuleButton());
            }
            //#endregion

            if (!colSelectSepRow || !opSelectSepRow || !fInputSepRow || !rButtonSepRow)
                rows.push(row);
            body.append(rows);

            return result;
        }

        private createColumnSelect(opts, selectedValue) {
            var select = $('<select/>')
                .addClass(this.settings.dom.columnSelect.className)
                .attr(<Object>(opts.rule.columnSelect.attr))
                .css(<Object>(opts.rule.columnSelect.css))
                .attr({ 'name': 'column' });

            var selected;
            $.each(opts.columns, (i, column) => {
                if (this.isColumnFilterable(column)) {
                    selected = (selectedValue != null) ? (this.getColumnData(column) == selectedValue) : false;
                    select.append(this.createColumnOption(column, selected));
                }
            });

            this.addDefaultOption(select, selectedValue == null);

            select.change((e) => {
                var cell = $(e.target).parent();
                var option = $('option:selected', e.target);
                var value = option.val();

                cell.nextUntil('.remove').empty();

                if (value != null && value != '') {
                    var column = option.data('_DT_ColumnOpt');
                    var operatorSelect = this.createOperatorSelect(opts, column, null);

                    cell.next().append(operatorSelect);
                }
            });

            return select;
        }

        private createColumnOption(column, selected) {
            var option = $('<option/>', {
                'value': this.getColumnData(column),
                'text': column.sTitle
            }).data(
                '_DT_ColumnOpt', column
                );
            if (selected)
                option.prop('selected', true);

            return option;
        }

        private createRemoveGroupButton() {
            var button = $('<button/>')
                .addClass(this.settings.dom.removeGroupButton.buttonClass)
                .addClass('remove-group')
                .append($('<span/>')
                    .addClass(this.settings.dom.removeGroupButton.spanClass)
                    .attr('title', this.getTranslation('removeGroup'))
                );
            button.click((e) => {
                $(e.target).closest('table').parent().remove();
            });

            return button;
        }

        private createAddGroupButton(opts) {
            var button = $('<button/>')
                .addClass(this.settings.dom.addGroupButton.buttonClass)
                .addClass('add-group')
                .append($('<span/>')
                    .addClass(this.settings.dom.addGroupButton.spanClass)
                    .attr('title', this.getTranslation('addGroup'))
                );

            button.click((e) => {
                var cell = $('<td/>').attr({ 'colspan': 4 });
                cell.append(this.createGroup(opts, {}, false));

                var row = $('<tr/>').addClass('group-row').append(cell);
                $(e.target).closest('tbody').append(row);
            });

            return button;
        }

        private createAddRuleButton(opts, data) {
            var button = $('<button/>')
                .addClass(this.settings.dom.addRuleButton.buttonClass)
                .addClass('add-rule')
                .append($('<span/>')
                    .addClass(this.settings.dom.addRuleButton.spanClass)
                    .attr('title', this.getTranslation('addRule'))
                );
            button.click((e) => {
                var tbody = $(e.target).closest('tbody');
                var groups = $('> .group-row', tbody);
                var idx = $('tr:not(.row-group)', tbody).length;
                var row = this.createFilterRow(opts, idx, null, data);

                if (groups.length)
                    groups.first().before(row);
                else
                    tbody.append(row);
            });

            return button;
        }

        private createRemoveRuleButton() {
            var button = $('<button/>')
                .addClass(this.settings.dom.removeRuleButton.buttonClass)
                .addClass('remove-rule')
                .append($('<span/>')
                    .addClass(this.settings.dom.removeRuleButton.spanClass)
                    .attr('title', this.getTranslation('removeRule'))
                );
            button.click((e) => {
                var ruleTable = button.closest('table');
                if ($.isFunction(this.settings.ruleRemoving))
                    this.settings.ruleRemoving.call(this.dt.api, ruleTable);
                ruleTable.remove();
            });
            return button;
        }

        private createOperatorSelect(opts, column, selectedValue) {
            var select = $('<select/>')
                .addClass(this.settings.dom.ruleOperatorSelect.className)
                .attr(<Object>(opts.rule.operatorSelect.attr))
                .css(<Object>(opts.rule.operatorSelect.css))
                .attr({ 'name': 'ruleOperator' });
            var operators = this.getOperators(column);
            var selected, option;
            $.each(operators, (i) => {
                selected = (selectedValue != null) ? (operators[i] == selectedValue) : false;
                option = this.createOperatorOption(operators[i], selected);
                if (option !== null)
                    select.append(option);
            });

            this.addDefaultOption(select, selectedValue == null);

            select.change((e) => {
                var cell = $(e.target).parent();
                var value = $('option:selected', e.target).val();

                if (!opts.rule.operatorSelect.separateRow)
                    cell.nextUntil('.remove').empty();
                else
                    $('td.data', cell.parent('tr').next('tr')).empty();

                if (value != null && value != '') {
                    var filterInput = this.createFilterInput(column, select.val(), null);

                    if (!filterInput.control) return;

                    var td;

                    if (!opts.rule.operatorSelect.separateRow)
                        td = cell.next();
                    else
                        td = $('td.data', cell.parent('tr').next('tr'));

                    td.data("_DT_GetFilterValue", filterInput.getValue)
                        .data("_DT_SetFilterValue", filterInput.setValue)
                        .append(filterInput.control);
                }
            });

            return select;
        }

        private createOperatorOption(operator, selected) {
            var option = $('<option/>', {
                'value': operator,
                'text': this.getTranslation(operator, 'operators')
            });
            if (selected)
                option.prop('selected', true);
            return option;
        }

        private createFilterInput(column, operator, value) : any {
            var element;
            if (operator === 'nl' || operator === 'nn') return {};

            //If a custom function for creating the filter editor is not provided
            var typeOptions = this.settings.typesEditor;
            var filter = column.filter || {};
            var colType = filter.type || column.sType || 'undefined';
            var options = typeOptions[colType.toLowerCase()];
            if (!options && $.isFunction(this.settings.getDefaultFilterEditor))
                options = this.settings.getDefaultFilterEditor.call(this.dt.api, this.settings, column);
            else if (!options)
                options = typeOptions['string'];

            if ($.isFunction(options.customCreationFn))
                element = options.call(this.dt.api, column, operator, value, this.settings);
            else {
                element = $('<' + options.tag + '/>')
                    .attr('name', 'data')
                    .attr(<Object>options.attr)
                    .addClass(options.className);

                if (options.tag == 'select') {
                    var values = [];
                    if (!filter.values) {
                        if (!!column.mData) { //TODO: always true
                            var uniq = {};
                            for (var i = 0, len = this.dt.settings.aoData.length; i < len; i++) {
                                var val = this.dt.settings.aoData[i]._aData[column.mData]; //TODO: FIX
                                if (uniq.hasOwnProperty(val)) continue;
                                uniq[val] = i;
                                values.push(val);
                            }
                        }
                    } else {
                        values = filter.values;
                    }

                    $.each(values, (idx, option) => {
                        element.append($('<option/>')
                            .attr({
                                'text': option.name,
                                'value': option.value,
                            }));
                    });
                    this.addDefaultOption(element);
                }
            }
            var getControlValue = $.isFunction(options.getFilterValue)
                ? $.proxy(options.getFilterValue, element)
                : $.proxy(element.val, element);
            var setControlValue = $.isFunction(options.setFilterValue)
                ? $.proxy(options.setFilterValue, element)
                : $.proxy(element.val, element);

            if (value !== null)
                setControlValue(value);

            if ($.isFunction(this.settings.filterEditorCreated))
                this.settings.filterEditorCreated.call(this.dt.api, element, column, operator, value, this.settings);
            return {
                control: element,
                getValue: getControlValue,
                setValue: setControlValue
            };
        }

        private addDefaultOption(select, selected = null) {
            var option = $('<option/>');
            if (selected)
                option.prop('selected', true);
            return select.prepend(option);
        }

        private isColumnFilterable(col) : boolean {
            return col.bSearchable && (!this.dt.settings.serverSide || (this.dt.settings.serverSide && !$.isNumeric(col.mData)));
        }

        private getOrigColumnIndex(currIdx): number {
            var origColIdx = this.dt.settings.aoColumns[currIdx]._ColReorder_iOrigCol;
            return origColIdx != null ? origColIdx : currIdx;
        }

        private getColumnData(column) : any {
            return $.isNumeric(column.mData) ? this.getOrigColumnIndex(column.mData) : column.mData;
        }

        private loadState(s, data) {
            if (!data.advFilter) {
                this.stateData = this.getDefaultGroupState();
                $.each(this.dt.settings.aoColumns, (i, col) => {
                    col.advFilterState = this.getDefaultGroupState();
                    this.removeActiveColumnClass(col);
                });
            } else
                this.stateData = data.advFilter;

            if (this.stateData.groups.length || this.stateData.rules.length)
                this.addActiveGlobalFilterClass();
            else
                this.removeActiveGlobalFilterClass();

            $.each(this.stateData.groups, (i, group) => {
                if (group.colFilter == null) return;
                var col = this.columnsByOrigData[group.colFilter];
                if (!col) return;
                col.advFilterState = group;
                if (group.rules.length)
                    this.addActiveColumnClass(col);
            });
        }

        private getDefaultGroupState() {
            return {
                groupOp: 'and',
                rules: [],
                groups: []
            };
        }

        private saveState(s, data) {
            data.advFilter = this.stateData;
        }

        private setServerParams(data) {
            data['searchGroup'] = this.stateData;
        }

        private groupToObject(group) {
            var groupOperator = $('> tbody > tr > th > select[name="groupOperator"] :selected', group).val();
            var rules = $('> tbody > tr > td > table > tbody > tr > td.columns', group).closest('table');
            var groups = $('> tbody > tr > td > table.dt-filter-group', group);

            var object = new GroupObject(groupOperator);
            object.colFilter = group.data('colFilter');

            rules.each((i, rule) => {
                var columnElement = $('td.columns input[type="hidden"], .columns select :selected', rule);
                var operator = $('td.operators select', rule).val();
                var dataElement = $('td.data', rule);

                if (!columnElement.length || !operator)
                    return;

                var column = columnElement.val();
                var data = null;
                if (dataElement.length) {
                    var getValue = dataElement.data('_DT_GetFilterValue');
                    if (getValue)
                        data = getValue();
                }
                if (!column)
                    return;

                object.rules.push(new RuleObject(column, operator, data));
            });

            groups.each((i, subGroup) => {
                object.groups.push(this.groupToObject($(subGroup)));
            });

            return object;
        }

        private filtersToJson(elem) {
            var filterGroup = $('> .dt-filter-group', elem);
            var filter = this.groupToObject(filterGroup);
            return filter;
        }

        //#region Server side implementation for breezeRemote plugin

        private getRuleBreezePredicate(name, op, value) {
            var operator = breeze.FilterQueryOp;
            switch (op) {
                case 'nn': //NotNull
                    return breeze.Predicate.create(name, operator.NotEquals, null);
                case 'nl': //IsNull
                    return breeze.Predicate.create(name, operator.Equals, null);
                case 'eq': //Equal
                    return breeze.Predicate.create(name, operator.Equals, value);
                case 'ne': //NotEqual
                    return breeze.Predicate.create(name, operator.NotEquals, value);
                case 'lt': //LessThan
                    return breeze.Predicate.create(name, operator.LessThan, value);
                case 'le': //LessOrEqual
                    return breeze.Predicate.create(name, operator.LessThanOrEqual, value);
                case 'gt': //GreaterThan
                    return breeze.Predicate.create(name, operator.GreaterThan, value);
                case 'ge': //GreaterOrEqual
                    return breeze.Predicate.create(name, operator.GreaterThanOrEqual, value);
                case 'co': //Contains
                    return breeze.Predicate.create(name, operator.Contains, value);
                case 'nc': //NotContain
                    return breeze.Predicate.not(breeze.Predicate.create(name, operator.Contains, value));
                case 'sw': //StartsWith
                    return breeze.Predicate.create(name, operator.StartsWith, value);
                case 'ew': //EndsWith
                    return breeze.Predicate.create(name, operator.EndsWith, value);
                default:
                    throw 'unknown operator for breezeRemote - ' + op;
            }
        }

        private getGroupBreezePredicate(groupData, clientToServerNameFn) {
            var index, rule, predicates = [], predicate;

            for (index = 0; index < groupData.rules.length; index++) {
                rule = groupData.rules[index];
                predicate = this.getRuleBreezePredicate(clientToServerNameFn(rule.data), rule.op, rule.value);
                if (predicate)
                    predicates.push(predicate);
            }

            for (index = 0; index < groupData.groups.length; index++) {
                predicate = this.getGroupBreezePredicate(groupData.groups[index], clientToServerNameFn);
                if (predicate)
                    predicates.push(predicate);
            }

            if (!predicates.length) return null;

            return groupData.groupOp === 'and'
                ? breeze.Predicate.and(predicates)
                : breeze.Predicate.or(predicates);
        }

        private serverSideBreezeRemoteFilter(query, data) {
            var state = data.searchGroup;
            if (!state || (!state.rules.length && !state.groups.length)) return query;

            var breezeRemoteSettings = this.dt.settings.breezeRemote.settings;
            var clientToServerNameFn = breezeRemoteSettings.entityManager.metadataStore.namingConvention.clientPropertyNameToServer;
            var p = this.getGroupBreezePredicate(state, clientToServerNameFn);
            if (!p) return query;
            return query.where(p);
        }

        //#endregion
    }

    class GroupObject {

        public groupOp: string;
        public rules: RuleObject[] = [];
        public groups: GroupObject[] = [];
        public colFilter: any = null;

        constructor(groupOp: string) {
            this.groupOp = groupOp;
        }
    }

    class RuleObject {
        
        public data: any;
        public op: string;
        public value: any;

        constructor(data: any, op: string, value: any) {
            this.data = data;
            this.op = op;
            this.value = value;
        }
    }
}
    
(function (window, document, undefined) {

    //Register events
    $.fn.DataTable.models.oSettings.advancedFilterInitCompleted = [];

    //#region Client side search engine implementation
    function clientSideFilter(oSettings, aFilterData, rowIdx, aData) {
        if (oSettings.advancedFilter === undefined || !oSettings.oFeatures.bFilter) return true;
        var settings = oSettings.advancedFilter.settings;
        var operators = settings.operators;
        var state = oSettings.advancedFilter.stateData;
        if (!state || (!state.rules.length && !state.groups.length)) return true;

        //TODO: do it only once
        var columns = {};
        for (var i = 0; i < oSettings.aoColumns.length; i++) {
            var col = oSettings.aoColumns[i];
            var mData = $.isNumeric(col.mData)
                ? (oSettings.aoColumns[col.mData]._ColReorder_iOrigCol != null
                    ? oSettings.aoColumns[col.mData]._ColReorder_iOrigCol
                    : col.mData)
                : col.mData;
            columns[mData] = i;
        }

        function getGroupResult(groupData) {
            var index: any, rule: any, propValue: any, groupResult: any, groupOp: any, ruleValue: any, regex: any;
            groupOp = groupData.groupOp;
            groupResult = groupData.groupOp === 'and' ? true : false; //for or operator we will start with false in order to know if one of the rules will return true
            for (index = 0; index < groupData.rules.length; index++) {
                rule = groupData.rules[index];
                propValue = aFilterData[columns[rule.data]];
                ruleValue = rule.value;
                if (operators.hasOwnProperty(rule.op) && (typeof (operators[rule.op].fn) == 'function')) {
                    if (groupOp === 'and')
                        groupResult &= operators[rule.op].fn.call(oSettings, propValue, rule, aFilterData, rowIdx, aData, groupData);
                    else
                        groupResult |= operators[rule.op].fn.call(oSettings, propValue, rule, aFilterData, rowIdx, aData, groupData);
                }
                else {
                    if (propValue instanceof Date)//for ==, != operators to work correctly we have to convert Date instances to timestamp
                        propValue = propValue.getTime();
                    if (ruleValue instanceof Date)
                        ruleValue = ruleValue.getTime();

                    //Implementation for known operators if a custom function is not provided
                    switch (rule.op) {
                        //#region Default operator implementations
                        case 'nn': //NotNull
                            if (groupOp === 'and')
                                groupResult &= <any>(propValue != null);
                            else
                                groupResult |= <any>(propValue != null);
                            break;
                        case 'nl': //IsNull
                            if (groupOp === 'and')
                                groupResult &= <any>(propValue == null);
                            else
                                groupResult |= <any>(propValue == null);
                            break;
                        case 'eq': //Equal
                            if (groupOp === 'and')
                                groupResult &= <any>(propValue == ruleValue);
                            else
                                groupResult |= <any>(propValue == ruleValue);
                            break;
                        case 'ne': //NotEqual
                            if (groupOp === 'and')
                                groupResult &= <any>(propValue != ruleValue);
                            else
                                groupResult |= <any>(propValue != ruleValue);
                            break;
                        case 'lt': //LessThan
                            if (groupOp === 'and')
                                groupResult &= <any>(propValue < ruleValue);
                            else
                                groupResult |= <any>(propValue < ruleValue);
                            break;
                        case 'le': //LessOrEqual
                            if (groupOp === 'and')
                                groupResult &= <any>(propValue <= ruleValue);
                            else
                                groupResult |= <any>(propValue <= ruleValue);
                            break;
                        case 'gt': //GreaterThan
                            if (groupOp === 'and')
                                groupResult &= <any>(propValue > ruleValue);
                            else
                                groupResult |= <any>(propValue > ruleValue);
                            break;
                        case 'ge': //GreaterOrEqual
                            if (groupOp === 'and')
                                groupResult &= <any>(propValue >= ruleValue);
                            else
                                groupResult |= <any>(propValue >= ruleValue);
                            break;
                        case 'co': //Contains
                            regex = new RegExp('^.*' + (ruleValue || '') + '.*$');
                            if (groupOp === 'and')
                                groupResult &= regex.test(propValue);
                            else
                                groupResult |= regex.test(propValue);
                            break;
                        case 'nc': //NotContain
                            regex = new RegExp('^.*' + (ruleValue || '') + '.*$');
                            if (groupOp === 'and')
                                groupResult &= <any>(!regex.test(propValue));
                            else
                                groupResult |= <any>(!regex.test(propValue));
                            break;
                        case 'sw': //StartsWith
                            regex = new RegExp('^.*' + (ruleValue || ''));
                            if (groupOp === 'and')
                                groupResult &= regex.test(propValue);
                            else
                                groupResult |= regex.test(propValue);
                            break;
                        case 'ew': //EndsWith
                            regex = new RegExp((ruleValue || '') + '.*$');
                            if (groupOp === 'and')
                                groupResult &= regex.test(propValue);
                            else
                                groupResult |= regex.test(propValue);
                            break;
                        default:
                            break;
                        //#endregion
                    }

                }
                if (groupData.groupOp !== 'and' && groupResult) { //If groupOp is or and one of the rules returned true we can skip the other rules
                    break;
                }
            }

            //if the current group rules returned false (groupOp is 'and') or if the current group rules returned true (groupOp is 'or') then we do not need to go deeper
            if ((!groupResult && groupOp === 'and') || (groupResult && groupOp !== 'and')) return groupResult;

            for (index = 0; index < groupData.groups.length; index++) {
                if (groupOp === 'and')
                    groupResult &= getGroupResult(groupData.groups[index]);
                else {
                    groupResult |= getGroupResult(groupData.groups[index]);
                    if (groupResult) //we can skip the other groups because of the 'or' operator
                        break;
                }
            }
            return groupResult;
        }

        return getGroupResult(state);
    };

    //Add clientSide filter to the global DataTables filters
    $.fn.DataTable.ext.search.push(clientSideFilter);

    //#endregion

    //Register api function
    $.fn.DataTable.Api.prototype.advancedFilter = function (settings) {
        var advancedFilter = new dt.AdvancedFilter(this, settings);
        if (this.settings()[0]._bInitComplete)
            advancedFilter.initialize();
        else
            this.one('init.dt', () => { advancedFilter.initialize(); });

        return advancedFilter.dom.globalFilter.container.get(0);
    };

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().advancedFilter(oSettings.oInit.advancedFilter);
        },
        "cFeature": "A",
        "sFeature": "AdvancedFilter"
    });

} (window, document, undefined));