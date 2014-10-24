var dt;
(function (dt) {
    var AdvancedFilter = (function () {
        function AdvancedFilter(api, settings) {
            this.dt = {
                settings: null,
                api: null
            };
            this.dom = {
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
            this.filterDefaultSettings = {
                columns: null,
                data: null,
                group: {
                    table: {
                        css: {},
                        columnHeader: true
                    },
                    add: true,
                    remove: true,
                    visible: true
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
            this.columnsByOrigData = {};
            this.settings = $.extend(true, AdvancedFilter.defaultSettings, settings);
            this.stateData = this.settings.stateData;
            if (!this.stateData)
                this.stateData = this.getDefaultGroupState();
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.advancedFilter = this;

            for (var i = 0; i < this.dt.settings.aoColumns.length; i++) {
                var col = this.dt.settings.aoColumns[i];
                this.columnsByOrigData[this.getColumnData(col)] = col;
            }
            this.createDomElements();
            this.registerCallbacks();
        }
        AdvancedFilter.prototype.createDomElements = function () {
            var _this = this;
            this.dom.modal.id = this.dt.settings.sTableId + '_FilterSettings_Modal';
            this.dom.modal.content = $('<div/>').addClass('modal-content');
            this.dom.modal.header = $('<div/>').addClass('modal-header').append($('<button />').attr({
                'type': 'button',
                'data-dismiss': 'modal',
                'aria-hidden': 'true'
            }).html('&times;').addClass('close')).append($('<h4 />').addClass('modal-title').html(this.getTranslation('filterSettings')));
            this.dom.modal.body = $('<div/>').addClass('modal-body');
            this.dom.modal.footer = $('<div/>').addClass('modal-footer');
            this.dom.modal.container = $('<div />').attr({
                'id': this.dom.modal.id,
                'role': 'dialog',
                'aria-hidden': 'true'
            }).on('hide.bs.modal', function () {
                _this.saveGlobalFilterState();
            }).addClass('modal fade').append($('<div/>').addClass('modal-dialog modal-lg').append(this.dom.modal.content.append(this.dom.modal.header, this.dom.modal.body, this.dom.modal.footer)));

            this.dom.globalFilter.button = $('<button />');
            this.dom.globalFilter.container = $('<div />').addClass(this.settings.dom.settingButtonDiv.className).append(this.dom.globalFilter.button.attr('title', this.getTranslation('filterSettings')).addClass(this.settings.dom.settingButton.buttonClass).on('click', function (e) {
                _this.closeAllColumnFilters();
                _this.populateGlobalFilter();
                _this.dom.modal.container.modal('show');
            }).append($('<span />').addClass(this.settings.dom.settingButton.spanClass))).append(this.dom.modal.container);
        };

        AdvancedFilter.prototype.registerCallbacks = function () {
            if ($.fn.DataTable.models.oSettings.remoteStateInitCompleted !== undefined) {
                //Integrate with remote state
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateLoadedParams', this.loadState.bind(this), "AdvFilter_StateLoad");
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateSaveParams', this.saveState.bind(this), "AdvFilter_StateSave");
            }

            if (!this.dt.settings.oInit.bServerSide && !this.dt.settings.oInit.serverSide)
                return;

            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoServerParams', this.setServerParams.bind(this), "AdvFilter_ServerParam");

            //If remoteFilter is used integrate advanceFilter with it
            if (!this.dt.settings.oInit.remoteFilter)
                return;

            if (breeze !== undefined && $data !== undefined && !this.settings.remoteAdapter)
                return;
            if (!this.settings.remoteAdapter) {
                if (breeze !== undefined)
                    this.settings.remoteAdapter = dt.BreezeAdvancedFilterAdapter;
                else if ($data !== undefined)
                    this.settings.remoteAdapter = dt.JayDataAdvancedFilterAdapter;
            }
            if (!this.settings.remoteAdapter)
                return;

            this.remoteAdapterInstance = new this.settings.remoteAdapter(this.dt.api, this.settings);

            var origBeforeQueryExecution;
            var remoteFilterSettings;

            //check if remoteFilter was already initialized
            remoteFilterSettings = this.dt.settings.remoteFilter != null && this.dt.settings.remoteFilter.settings ? this.dt.settings.remoteFilter.settings : this.dt.settings.oInit.remoteFilter;
            origBeforeQueryExecution = remoteFilterSettings.beforeQueryExecution;
            var that = this;
            remoteFilterSettings.beforeQueryExecution = function (query, data) {
                query = that.remoteAdapterInstance.filter(query, data);
                return $.isFunction(origBeforeQueryExecution) ? origBeforeQueryExecution.call(this, query, data) : query;
            };
        };

        AdvancedFilter.prototype.initialize = function () {
            this.drawColumnFilters();
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'advancedFilterInitCompleted', 'advancedFilterInitCompleted', [this]);
        };

        AdvancedFilter.prototype.saveGlobalFilterState = function () {
            var _this = this;
            var state = this.filtersToJson(this.dom.modal.body);
            this.stateData = state;

            var cols = {};

            $.each(state.groups, function (idx, group) {
                if (group.colFilter == null)
                    return;
                var col = _this.columnsByOrigData[group.colFilter];
                col.advFilterState = group;
                cols[group.colFilter] = true;
            });

            $.each(this.dt.settings.aoColumns, function (i, colOpts) {
                if (cols.hasOwnProperty(_this.getColumnData(colOpts)))
                    return;
                colOpts.advFilterState = _this.getDefaultGroupState();
                _this.removeActiveColumnClass(colOpts);
            });

            if (state.groups.length || state.rules.length)
                this.addActiveGlobalFilterClass();
            else
                this.removeActiveGlobalFilterClass();
        };

        AdvancedFilter.prototype.populateGlobalFilter = function () {
            var _this = this;
            var filterDom = this.createFilters({
                data: this.stateData
            });
            filterDom.filterBtn.on('click', function () {
                _this.saveGlobalFilterState();
                _this.dom.modal.container.modal('hide');
                _this.dt.api.draw(true);
            });
            filterDom.clearBtn.on('click', function () {
                _this.clearGlobalFilterState();
                _this.dt.api.draw(true);
            });
            this.dom.modal.body.html(filterDom.groups);
            this.dom.modal.footer.empty();
            this.dom.modal.footer.append(filterDom.clearBtn, filterDom.filterBtn);
        };

        AdvancedFilter.prototype.clearGlobalFilterState = function () {
            var _this = this;
            this.stateData = this.getDefaultGroupState();
            this.removeActiveGlobalFilterClass();
            $.each(this.dt.settings.aoColumns, function (idx, colOpts) {
                colOpts.advFilterState = _this.getDefaultGroupState();
                _this.removeActiveColumnClass(colOpts);
            });
            var filterDom = this.createFilters({
                data: this.stateData
            });
            this.dom.modal.body.html(filterDom.groups);
        };

        AdvancedFilter.prototype.getTranslation = function (key, prefix) {
            if (typeof prefix === "undefined") { prefix = null; }
            var lang = this.settings.language;
            if (prefix)
                lang = lang[prefix] || {};
            return lang[key] || key;
        };

        AdvancedFilter.prototype.closeAllColumnFilters = function () {
            $.each(this.dt.settings.aoColumns, function (idx, colOpts) {
                if (!colOpts.advFilterIcon)
                    return;
                var popover = colOpts.advFilterIcon.data('bs.popover');
                if (popover == null || popover.$tip == null)
                    return;
                if (popover.$tip.hasClass('in'))
                    colOpts.advFilterIcon.popover('hide');
            });
        };

        AdvancedFilter.prototype.addActiveGlobalFilterClass = function () {
            this.dom.globalFilter.button.addClass('dt-global-filter-active');
        };

        AdvancedFilter.prototype.removeActiveGlobalFilterClass = function () {
            this.dom.globalFilter.button.removeClass('dt-global-filter-active');
        };

        AdvancedFilter.prototype.addActiveColumnClass = function (colOpts) {
            var icon = colOpts.advFilterIcon;
            if (!icon) {
                colOpts.advFilterIconActive = true;
                return;
            }
            icon.addClass('dt-column-filter-active');

            //FixedColumns
            var iconTarget = icon.data('advFilter.iconTarget');
            if (iconTarget == null || iconTarget === icon.get(0))
                return;
            $(iconTarget).addClass('dt-column-filter-active');
        };

        AdvancedFilter.prototype.removeActiveColumnClass = function (colOpts) {
            var icon = colOpts.advFilterIcon;
            if (!icon)
                return;
            icon.removeClass('dt-column-filter-active');

            //FixedColumns
            var iconTarget = icon.data('advFilter.iconTarget');
            if (iconTarget == null || iconTarget === icon.get(0))
                return;
            $(iconTarget).removeClass('dt-column-filter-active');
        };

        AdvancedFilter.prototype.saveColumnFilterState = function (colOpts, columnFilterDiv, state) {
            if (typeof state === "undefined") { state = null; }
            colOpts.advFilterState = state || this.filtersToJson(columnFilterDiv);
            colOpts.advFilterState.colFilter = this.getColumnData(colOpts); //mark as column filter
            var gIdx = -1;
            $.each(this.stateData.groups, function (idx, group) {
                if (group.colFilter == null)
                    return;
                if (group.colFilter === colOpts.advFilterState.colFilter)
                    gIdx = idx;
            });
            if (colOpts.advFilterState.rules.length > 0) {
                if (gIdx < 0)
                    this.stateData.groups.push(colOpts.advFilterState);
                else
                    this.stateData.groups[gIdx] = colOpts.advFilterState;
                this.addActiveColumnClass(colOpts);
            } else if (gIdx >= 0) {
                this.stateData.groups.splice(gIdx, 1);
                this.removeActiveColumnClass(colOpts);
            }

            if (this.stateData.rules.length || this.stateData.groups.length)
                this.addActiveGlobalFilterClass();
            else
                this.removeActiveGlobalFilterClass();
        };

        AdvancedFilter.prototype.clearColumnFilterState = function (colOpts, columnFilterDiv) {
            this.saveColumnFilterState(colOpts, columnFilterDiv, this.getDefaultGroupState());
        };

        AdvancedFilter.prototype.populateColumnFilter = function (colOpts, columnFilterDiv) {
            var _this = this;
            var filterDom = this.createFilters({
                columns: [colOpts],
                data: colOpts.advFilterState,
                group: {
                    add: false,
                    table: {
                        css: { 'width': '100%' },
                        columnHeader: false
                    }
                },
                rule: {
                    initRemove: true,
                    table: {
                        css: { 'width': '100%' }
                    },
                    columnSelect: {
                        separateRow: true
                    },
                    operatorSelect: {
                        separateRow: true,
                        css: { width: '100%' }
                    },
                    filterInput: {
                        separateRow: true
                    },
                    removeButton: {
                        separateRow: true
                    }
                }
            });
            filterDom.clearBtn.on('click', function () {
                colOpts.advFilterIcon.popover('hide');
                _this.clearColumnFilterState(colOpts, columnFilterDiv);
                _this.dt.api.draw(true);
            });
            filterDom.filterBtn.on('click', function () {
                colOpts.advFilterIcon.popover('hide');
                _this.dt.api.draw(true);
            });

            columnFilterDiv.html(filterDom.groups).on('keyup', function (e) {
                if (e.keyCode !== 13)
                    return;
                colOpts.advFilterIcon.popover('hide');
                _this.dt.api.draw(true);
            }).append($('<div />').addClass('row').append($('<div />').addClass('col-md-6').append(filterDom.clearBtn)).append($('<div />').addClass('col-md-6').append(filterDom.filterBtn)));
        };

        AdvancedFilter.prototype.getOperators = function (column) {
            var filter = column.filter || {};
            var operators = filter.operators;
            if (operators)
                return operators;

            var colType = filter.type || column.sType || column.type || 'undefined';
            var type = colType.toLowerCase();
            if (this.settings.operators.types.hasOwnProperty(type)) {
                return this.settings.operators.types[type];
            } else if ($.isFunction(this.settings.getDefaultColumnOperators))
                return this.settings.getDefaultColumnOperators.call(this.dt.api, this.settings, column);
            else
                return this.settings.operators.types['undefined'];
        };

        AdvancedFilter.prototype.drawColumnFilters = function () {
            var _this = this;
            $.each(this.dt.settings.aoColumns, function (i, col) {
                if (!_this.isColumnFilterable(col))
                    return;
                col.advFilterState = col.advFilterState || _this.getDefaultGroupState();
                var columnFilterDiv = $('<div />');
                var link = $('<a />');
                link.popover({
                    content: columnFilterDiv,
                    placement: 'bottom',
                    html: true,
                    container: '#' + _this.dt.settings.nTableWrapper.id
                });
                link.attr('title', _this.getTranslation('columnFilter')).on('hide.bs.popover', function () {
                    _this.saveColumnFilterState(col, columnFilterDiv);
                }).on('shown.bs.popover', function (e) {
                    var origTarget = link.data('advFilter.iconTarget');
                    if (origTarget == null || e.target === origTarget)
                        return;

                    //FixedColumns
                    var popover = link.data('bs.popover');
                    if (popover == null)
                        return;

                    //Copied from bootstrap
                    var pos = $.extend({}, (typeof origTarget.getBoundingClientRect == 'function') ? origTarget.getBoundingClientRect() : {
                        width: origTarget.offsetWidth,
                        height: origTarget.offsetHeight
                    }, $(origTarget).offset());
                    var tip = popover.$tip[0];
                    var offset = popover.getCalculatedOffset('bottom', pos, tip.offsetWidth, tip.offsetHeight);
                    popover.applyPlacement(offset, 'bottom');
                }).append($('<span />').addClass(_this.settings.dom.columnFilterIcon.className).on('click', function (e) {
                    e.stopPropagation(); //We have to do this in order to skip dt ordering
                    _this.populateColumnFilter(col, columnFilterDiv);
                    link.data('advFilter.iconTarget', $(e.target).closest('a').get(0));
                    link.popover('toggle');
                }));
                col.advFilterIcon = link;
                if (col.advFilterIconActive) {
                    _this.addActiveColumnClass(col);
                    delete col['advFilterIconActive'];
                }

                $(col.nTh).append(link);
            });
        };

        AdvancedFilter.prototype.createFilters = function (opts) {
            //We must not clone columns and data!
            var notDeepClone = { data: opts.data, columns: opts.columns };
            delete opts['data'];
            delete opts['columns'];
            opts = $.extend(true, {}, this.filterDefaultSettings, opts);
            $.extend(opts, notDeepClone);

            opts.columns = opts.columns || this.dt.settings.aoColumns;
            var group = this.createGroup(opts, null, true);

            var filterBtn = $('<button/>').addClass(this.settings.dom.filterButton.className).append($('<span />').html(this.getTranslation('filter')));
            var clearBtn = $('<button/>').addClass(this.settings.dom.clearButton.className).append($('<span />').html(this.getTranslation('clear')));

            return {
                groups: group,
                filterBtn: filterBtn,
                clearBtn: clearBtn
            };
        };

        AdvancedFilter.prototype.createGroup = function (opts, data, init) {
            var _this = this;
            var group = $('<table/>').addClass('dt-filter-group').css(opts.group.table.css);
            data = data || opts.data;

            group.data('colFilter', data.colFilter);
            if (data.colFilter != null && opts.group.table.columnHeader) {
                group.prepend($('<theader/>').append($('<tr/>').append($('<th/>').attr({ 'colspan': 4 }).html(this.getTranslation('filterFor') + ': ' + this.columnsByOrigData[data.colFilter].sTitle))));
            }

            var rules = data.rules ? data.rules : null;
            var groups = data.groups ? data.groups : null;

            var headerRow = this.createHeaderRow(opts, data, init);
            if (!opts.group.visible)
                headerRow.hide();
            group.append(headerRow);

            if (rules) {
                $.each(rules, function (i, rule) {
                    group.append(_this.createFilterRow(opts, i, rule, data));
                });
            } else {
                group.append(this.createFilterRow(opts, 0, null, data));
            }

            if (groups) {
                $.each(groups, function (i, child) {
                    var groupRow = _this.createGroupRow(opts, child);
                    group.append(groupRow);
                });
            }
            return group;
        };

        AdvancedFilter.prototype.createGroupRow = function (opts, groupObject) {
            var cell = $('<td/>').attr({ 'colspan': 4 });
            var group = this.createGroup(opts, groupObject, false);
            cell.append(group);
            return $('<tr/>').addClass('group-row').append(cell);
        };

        AdvancedFilter.prototype.createHeaderRow = function (opts, data, init) {
            var cell = $('<th/>').attr({ 'colspan': 4 });
            data = data || {};
            var groupOp = data.groupOp != null ? data.groupOp : 'and';

            var selectOperator = $('<select/>').attr({ 'name': 'groupOperator' }).addClass(this.settings.dom.groupOperatorSelect.className).append($('<option/>').attr({ 'value': 'and' }).html(this.getTranslation('and')), $('<option/>').attr({ 'value': 'or' }).html(this.getTranslation('or')));

            selectOperator.val(groupOp);

            cell.append(selectOperator);

            if (opts.group.add !== false && data.colFilter == null)
                cell.append(this.createAddGroupButton(opts));

            if (opts.rule.add !== false)
                cell.append(this.createAddRuleButton(opts, data));

            if (init !== true && opts.group.remove !== false) {
                cell.append(this.createRemoveGroupButton());
            }

            return $('<tr/>').append(cell);
        };

        AdvancedFilter.prototype.createFilterRow = function (opts, idx, rule, data) {
            var column;
            var td;
            var row = $('<tr/>');
            var body = $('<tbody/>');
            var table = $('<table/>');
            var rows = [];
            rule = rule || {};
            var result = $('<tr/>').append($('<td/>').attr({ 'colspan': 4 }).append(table.css((opts.rule.table.css)).append(body)));

            var colSelectSepRow = opts.rule.columnSelect.separateRow;
            var opSelectSepRow = opts.rule.operatorSelect.separateRow;
            var fInputSepRow = opts.rule.filterInput.separateRow;
            var rButtonSepRow = opts.rule.removeButton.separateRow;

            //#region columns
            if (opts.columns.length == 1 || data.colFilter != null) {
                column = data.colFilter != null ? this.columnsByOrigData[data.colFilter] : opts.columns[0];
                td = $('<td/>').addClass('columns').append($('<input/>').attr({ 'name': 'column', 'type': 'hidden' }).val(this.getColumnData(column)));
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
                    rows.push($('<tr/>').append(td.attr({ 'colspan': 4 })));
                } else {
                    row.append(td.attr({ 'colspan': opts.rule.columnSelect.colSpan }));
                }
            }

            //#endregion
            //#region operators
            td = $('<td/>').addClass('operators');
            if (opSelectSepRow) {
                rows.push($('<tr/>').append(td.attr({ 'colspan': 4 })));
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
                rows.push($('<tr/>').append(td.attr({ 'colspan': 4 })));
            } else {
                row.append(td.attr({ 'colspan': opts.rule.filterInput.colSpan }));
            }

            if (rule.op) {
                var filterInput = this.createFilterInput(column, rule.op, rule.value);
                if (filterInput.control)
                    td.append(filterInput.control).data("_DT_GetFilterValue", filterInput.getValue).data("_DT_SetFilterValue", filterInput.setValue);
            }

            //#endregion
            //#region delete button
            td = $('<td/>').addClass('remove');
            if (rButtonSepRow) {
                rows.push($('<tr/>').append(td.attr({ 'colspan': 4 })));
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
        };

        AdvancedFilter.prototype.createColumnSelect = function (opts, selectedValue) {
            var _this = this;
            var select = $('<select/>').addClass(this.settings.dom.columnSelect.className).attr((opts.rule.columnSelect.attr)).css((opts.rule.columnSelect.css)).attr({ 'name': 'column' });

            var selected;
            $.each(opts.columns, function (i, column) {
                if (_this.isColumnFilterable(column)) {
                    selected = (selectedValue != null) ? (_this.getColumnData(column) == selectedValue) : false;
                    select.append(_this.createColumnOption(column, selected));
                }
            });

            this.addDefaultOption(select, selectedValue == null);

            select.change(function (e) {
                var cell = $(e.target).parent();
                var option = $('option:selected', e.target);
                var value = option.val();

                cell.nextUntil('.remove').empty();

                if (value != null && value != '') {
                    var column = option.data('_DT_ColumnOpt');
                    var operatorSelect = _this.createOperatorSelect(opts, column, null);

                    cell.next().append(operatorSelect);
                }
            });

            return select;
        };

        AdvancedFilter.prototype.createColumnOption = function (column, selected) {
            var option = $('<option/>', {
                'value': this.getColumnData(column),
                'text': column.sTitle
            }).data('_DT_ColumnOpt', column);
            if (selected)
                option.prop('selected', true);

            return option;
        };

        AdvancedFilter.prototype.createRemoveGroupButton = function () {
            var button = $('<button/>').addClass(this.settings.dom.removeGroupButton.buttonClass).addClass('remove-group').append($('<span/>').addClass(this.settings.dom.removeGroupButton.spanClass).attr('title', this.getTranslation('removeGroup')));
            button.click(function (e) {
                $(e.target).closest('table').parent().remove();
            });

            return button;
        };

        AdvancedFilter.prototype.createAddGroupButton = function (opts) {
            var _this = this;
            var button = $('<button/>').addClass(this.settings.dom.addGroupButton.buttonClass).addClass('add-group').append($('<span/>').addClass(this.settings.dom.addGroupButton.spanClass).attr('title', this.getTranslation('addGroup')));

            button.click(function (e) {
                var cell = $('<td/>').attr({ 'colspan': 4 });
                cell.append(_this.createGroup(opts, {}, false));

                var row = $('<tr/>').addClass('group-row').append(cell);
                $(e.target).closest('tbody').append(row);
            });

            return button;
        };

        AdvancedFilter.prototype.createAddRuleButton = function (opts, data) {
            var _this = this;
            var button = $('<button/>').addClass(this.settings.dom.addRuleButton.buttonClass).addClass('add-rule').append($('<span/>').addClass(this.settings.dom.addRuleButton.spanClass).attr('title', this.getTranslation('addRule')));
            button.click(function (e) {
                var tbody = $(e.target).closest('tbody');
                var groups = $('> .group-row', tbody);
                var idx = $('tr:not(.row-group)', tbody).length;
                var row = _this.createFilterRow(opts, idx, null, data);

                if (groups.length)
                    groups.first().before(row);
                else
                    tbody.append(row);
            });

            return button;
        };

        AdvancedFilter.prototype.createRemoveRuleButton = function () {
            var _this = this;
            var button = $('<button/>').addClass(this.settings.dom.removeRuleButton.buttonClass).addClass('remove-rule').append($('<span/>').addClass(this.settings.dom.removeRuleButton.spanClass).attr('title', this.getTranslation('removeRule')));
            button.click(function (e) {
                var ruleTable = button.closest('table');
                if ($.isFunction(_this.settings.ruleRemoving))
                    _this.settings.ruleRemoving.call(_this.dt.api, ruleTable);
                ruleTable.remove();
            });
            return button;
        };

        AdvancedFilter.prototype.createOperatorSelect = function (opts, column, selectedValue) {
            var _this = this;
            var select = $('<select/>').addClass(this.settings.dom.ruleOperatorSelect.className).attr((opts.rule.operatorSelect.attr)).css((opts.rule.operatorSelect.css)).attr({ 'name': 'ruleOperator' });
            var operators = this.getOperators(column);
            var selected, option;
            $.each(operators, function (i) {
                selected = (selectedValue != null) ? (operators[i] == selectedValue) : false;
                option = _this.createOperatorOption(operators[i], selected);
                if (option !== null)
                    select.append(option);
            });

            this.addDefaultOption(select, selectedValue == null);

            select.change(function (e) {
                var cell = $(e.target).parent();
                var value = $('option:selected', e.target).val();

                if (!opts.rule.operatorSelect.separateRow)
                    cell.nextUntil('.remove').empty();
                else
                    $('td.data', cell.parent('tr').next('tr')).empty();

                if (value != null && value != '') {
                    var filterInput = _this.createFilterInput(column, select.val(), null);

                    if (!filterInput.control)
                        return;

                    var td;

                    if (!opts.rule.operatorSelect.separateRow)
                        td = cell.next();
                    else
                        td = $('td.data', cell.parent('tr').next('tr'));

                    td.data("_DT_GetFilterValue", filterInput.getValue).data("_DT_SetFilterValue", filterInput.setValue).append(filterInput.control);
                }
            });

            return select;
        };

        AdvancedFilter.prototype.createOperatorOption = function (operator, selected) {
            var option = $('<option/>', {
                'value': operator,
                'text': this.getTranslation(operator, 'operators')
            });
            if (selected)
                option.prop('selected', true);
            return option;
        };

        AdvancedFilter.prototype.createFilterInput = function (column, operator, value) {
            var element;
            if (operator === 'nl' || operator === 'nn')
                return {};

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
                element = $('<' + options.tag + '/>').attr('name', 'data').attr(options.attr).addClass(options.className);

                if (options.tag == 'select') {
                    var values = [];
                    if (!filter.values) {
                        if (!!column.mData) {
                            var uniq = {};
                            for (var i = 0, len = this.dt.settings.aoData.length; i < len; i++) {
                                var val = this.dt.settings.aoData[i]._aData[column.mData];
                                if (uniq.hasOwnProperty(val))
                                    continue;
                                uniq[val] = i;
                                values.push(val);
                            }
                        }
                    } else {
                        values = filter.values;
                    }

                    $.each(values, function (idx, option) {
                        element.append($('<option/>').attr({
                            'text': option.name,
                            'value': option.value
                        }));
                    });
                    this.addDefaultOption(element);
                }
            }
            var getControlValue = $.isFunction(options.getFilterValue) ? $.proxy(options.getFilterValue, element) : $.proxy(element.val, element);
            var setControlValue = $.isFunction(options.setFilterValue) ? $.proxy(options.setFilterValue, element) : $.proxy(element.val, element);

            if (value !== null)
                setControlValue(value);

            if ($.isFunction(this.settings.filterEditorCreated))
                this.settings.filterEditorCreated.call(this.dt.api, element, column, operator, value, this.settings);
            return {
                control: element,
                getValue: getControlValue,
                setValue: setControlValue
            };
        };

        AdvancedFilter.prototype.addDefaultOption = function (select, selected) {
            if (typeof selected === "undefined") { selected = null; }
            var option = $('<option/>');
            if (selected)
                option.prop('selected', true);
            return select.prepend(option);
        };

        AdvancedFilter.prototype.isColumnFilterable = function (col) {
            return col.bSearchable && (!this.dt.settings.serverSide || (this.dt.settings.serverSide && !$.isNumeric(col.mData)));
        };

        AdvancedFilter.prototype.getOrigColumnIndex = function (currIdx) {
            var origColIdx = this.dt.settings.aoColumns[currIdx]._ColReorder_iOrigCol;
            return origColIdx != null ? origColIdx : currIdx;
        };

        AdvancedFilter.prototype.getColumnData = function (column) {
            return $.isNumeric(column.mData) ? this.getOrigColumnIndex(column.mData) : column.mData;
        };

        AdvancedFilter.prototype.loadState = function (s, data) {
            var _this = this;
            if (!data.advFilter) {
                this.stateData = this.getDefaultGroupState();
                $.each(this.dt.settings.aoColumns, function (i, col) {
                    col.advFilterState = _this.getDefaultGroupState();
                    _this.removeActiveColumnClass(col);
                });
            } else
                this.stateData = data.advFilter;

            if (this.stateData.groups.length || this.stateData.rules.length)
                this.addActiveGlobalFilterClass();
            else
                this.removeActiveGlobalFilterClass();

            $.each(this.stateData.groups, function (i, group) {
                if (group.colFilter == null)
                    return;
                var col = _this.columnsByOrigData[group.colFilter];
                if (!col)
                    return;
                col.advFilterState = group;
                if (group.rules.length)
                    _this.addActiveColumnClass(col);
            });
        };

        AdvancedFilter.prototype.getDefaultGroupState = function () {
            return {
                groupOp: 'and',
                rules: [],
                groups: []
            };
        };

        AdvancedFilter.prototype.saveState = function (s, data) {
            data.advFilter = this.stateData;
        };

        AdvancedFilter.prototype.setServerParams = function (data) {
            data['searchGroup'] = this.stateData;
        };

        AdvancedFilter.prototype.groupToObject = function (group) {
            var _this = this;
            var groupOperator = $('> tbody > tr > th > select[name="groupOperator"] :selected', group).val();
            var rules = $('> tbody > tr > td > table > tbody > tr > td.columns', group).closest('table');
            var groups = $('> tbody > tr > td > table.dt-filter-group', group);

            var object = new GroupObject(groupOperator);
            object.colFilter = group.data('colFilter');

            rules.each(function (i, rule) {
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

            groups.each(function (i, subGroup) {
                object.groups.push(_this.groupToObject($(subGroup)));
            });

            return object;
        };

        AdvancedFilter.prototype.filtersToJson = function (elem) {
            var filterGroup = $('> .dt-filter-group', elem);
            var filter = this.groupToObject(filterGroup);
            return filter;
        };
        AdvancedFilter.defaultSettings = {
            operators: {
                types: {
                    'string': ['nn', 'nl', 'eq', 'ne', 'co', 'nc', 'sw', 'ew'],
                    'number': ['nn', 'nl', 'eq', 'ne', 'lt', 'le', 'gt', 'ge'],
                    'boolean': ['nn', 'nl', 'eq', 'ne'],
                    'date': ['nn', 'nl', 'eq', 'ne', 'lt', 'le', 'gt', 'ge'],
                    'undefined': ['nn', 'nl', 'eq', 'ne']
                },
                eq: {
                    fn: null
                }
            },
            typesEditor: {
                'string': {
                    tag: 'input',
                    attr: { type: 'text' },
                    className: 'form-control input-sm',
                    customCreationFn: null,
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
                    className: 'form-control input-sm'
                },
                groupOperatorSelect: {
                    className: 'form-control input-sm'
                },
                columnSelect: {
                    className: 'form-control input-sm'
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
            getDefaultFilterEditor: function (settings, column) {
                var type = column.sType ? column.sType.toLowerCase() : '';
                switch (type) {
                    case 'num-fmt':
                    case 'num':
                        return settings.typesEditor['number'];
                    default:
                        return settings.typesEditor['string'];
                }
            },
            getDefaultColumnOperators: function (settings, column) {
                var type = column.sType ? column.sType.toLowerCase() : '';
                switch (type) {
                    case 'num-fmt':
                    case 'num':
                        return settings.operators.types['number'];
                    default:
                        return settings.operators.types['undefined'];
                }
            },
            createFilterEditor: null,
            filterEditorCreated: null,
            ruleRemoving: null,
            remoteAdapter: null
        };
        return AdvancedFilter;
    })();
    dt.AdvancedFilter = AdvancedFilter;

    var JayDataAdvancedFilterAdapter = (function () {
        function JayDataAdvancedFilterAdapter(api, settings) {
            this.dt = {
                settings: null,
                api: null
            };
            this.paramIdx = 0;
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
        }
        JayDataAdvancedFilterAdapter.prototype.filter = function (query, data) {
            this.paramIdx = 0;
            var state = data.searchGroup;
            if (!state || (!state.rules.length && !state.groups.length))
                return query;
            var p = this.getGroupPredicate(state);
            if (!p || !p.expression)
                return query;
            return query.filter(p.expression, p.parameters);
        };

        JayDataAdvancedFilterAdapter.prototype.getRulePredicate = function (name, op, value) {
            var predicate = new JayDataPredicate();
            var paramName = 'p' + this.paramIdx;
            predicate.parameters[paramName] = value;
            this.paramIdx++;
            switch (op) {
                case 'nn':
                    predicate.expression = 'it.' + name + ' != null';
                    break;
                case 'nl':
                    predicate.expression = 'it.' + name + ' == null';
                    break;
                case 'eq':
                    predicate.expression = 'it.' + name + ' == this.' + paramName;
                    break;
                case 'ne':
                    predicate.expression = 'it.' + name + ' != this.' + paramName;
                    break;
                case 'lt':
                    predicate.expression = 'it.' + name + ' < this.' + paramName;
                    break;
                case 'le':
                    predicate.expression = 'it.' + name + ' <= this.' + paramName;
                    break;
                case 'gt':
                    predicate.expression = 'it.' + name + ' > this.' + paramName;
                    break;
                case 'ge':
                    predicate.expression = 'it.' + name + ' >= this.' + paramName;
                    break;
                case 'co':
                    predicate.expression = 'it.' + name + '.contains(this.' + paramName + ')';
                    break;
                case 'nc':
                    predicate.expression = '!it.' + name + '.contains(this.' + paramName + ')';
                    break;
                case 'sw':
                    predicate.expression = 'it.' + name + '.startsWith(this.' + paramName + ')';
                    break;
                case 'ew':
                    predicate.expression = 'it.' + name + '.endsWith(this.' + paramName + ')';
                    break;
                case 'in':
                    predicate.expression = 'it.' + name + ' in this.' + paramName;
                    break;
                default:
                    throw 'unknown operator for remoteFilter - ' + op;
            }
            return predicate;
        };

        JayDataAdvancedFilterAdapter.prototype.getGroupPredicate = function (groupData) {
            var index, rule, predicates = [], predicate;

            for (index = 0; index < groupData.rules.length; index++) {
                rule = groupData.rules[index];
                predicate = this.getRulePredicate(rule.data, rule.op, rule.value);
                if (predicate)
                    predicates.push(predicate);
            }

            for (index = 0; index < groupData.groups.length; index++) {
                predicate = this.getGroupPredicate(groupData.groups[index]);
                if (predicate)
                    predicates.push(predicate);
            }

            if (!predicates.length)
                return null;

            return groupData.groupOp === 'and' ? JayDataPredicate.and(predicates) : JayDataPredicate.or(predicates);
        };
        return JayDataAdvancedFilterAdapter;
    })();
    dt.JayDataAdvancedFilterAdapter = JayDataAdvancedFilterAdapter;

    var JayDataPredicate = (function () {
        function JayDataPredicate(expression, parameters) {
            this.parameters = {};
            this.expression = expression;
            this.parameters = parameters || {};
        }
        JayDataPredicate.and = function (predicates) {
            return JayDataPredicate.merge(predicates, '&&');
        };

        JayDataPredicate.or = function (predicates) {
            return JayDataPredicate.merge(predicates, '||');
        };

        JayDataPredicate.prototype.and = function (predicates) {
            predicates.unshift(this);
            return JayDataPredicate.and(predicates);
        };

        JayDataPredicate.prototype.or = function (predicates) {
            predicates.unshift(this);
            return JayDataPredicate.or(predicates);
        };

        JayDataPredicate.merge = function (predicates, op) {
            var newExpr = '';
            var params = {};
            for (var i = 0; i < predicates.length; i++) {
                if (i > 0)
                    newExpr += ' ' + op + ' ';
                newExpr += predicates[i].expression;
                $.extend(params, predicates[i].parameters);
            }
            if (predicates.length > 1)
                newExpr = '(' + newExpr + ')';
            return new JayDataPredicate(newExpr, params);
        };
        return JayDataPredicate;
    })();

    var BreezeAdvancedFilterAdapter = (function () {
        function BreezeAdvancedFilterAdapter(api, settings) {
            this.dt = {
                api: null,
                settings: null
            };
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
        }
        BreezeAdvancedFilterAdapter.prototype.filter = function (query, data) {
            var state = data.searchGroup;
            if (!state || (!state.rules.length && !state.groups.length))
                return query;

            var remoteFilterSettings = this.dt.settings.remoteFilter.settings;
            var clientToServerNameFn = remoteFilterSettings.entityManager.metadataStore.namingConvention.clientPropertyNameToServer;
            var p = this.getGroupPredicate(state, clientToServerNameFn);
            if (!p)
                return query;
            return query.where(p);
        };

        BreezeAdvancedFilterAdapter.prototype.getRulePredicate = function (name, op, value) {
            var operator = breeze.FilterQueryOp;
            switch (op) {
                case 'nn':
                    return breeze.Predicate.create(name, operator.NotEquals, null);
                case 'nl':
                    return breeze.Predicate.create(name, operator.Equals, null);
                case 'eq':
                    return breeze.Predicate.create(name, operator.Equals, value);
                case 'ne':
                    return breeze.Predicate.create(name, operator.NotEquals, value);
                case 'lt':
                    return breeze.Predicate.create(name, operator.LessThan, value);
                case 'le':
                    return breeze.Predicate.create(name, operator.LessThanOrEqual, value);
                case 'gt':
                    return breeze.Predicate.create(name, operator.GreaterThan, value);
                case 'ge':
                    return breeze.Predicate.create(name, operator.GreaterThanOrEqual, value);
                case 'co':
                    return breeze.Predicate.create(name, operator.Contains, value);
                case 'nc':
                    return breeze.Predicate.not(breeze.Predicate.create(name, operator.Contains, value));
                case 'sw':
                    return breeze.Predicate.create(name, operator.StartsWith, value);
                case 'ew':
                    return breeze.Predicate.create(name, operator.EndsWith, value);
                default:
                    throw 'unknown operator for remoteFilter - ' + op;
            }
        };

        BreezeAdvancedFilterAdapter.prototype.getGroupPredicate = function (groupData, clientToServerNameFn) {
            var index, rule, predicates = [], predicate;

            for (index = 0; index < groupData.rules.length; index++) {
                rule = groupData.rules[index];
                predicate = this.getRulePredicate(clientToServerNameFn(rule.data), rule.op, rule.value);
                if (predicate)
                    predicates.push(predicate);
            }

            for (index = 0; index < groupData.groups.length; index++) {
                predicate = this.getGroupPredicate(groupData.groups[index], clientToServerNameFn);
                if (predicate)
                    predicates.push(predicate);
            }

            if (!predicates.length)
                return null;

            return groupData.groupOp === 'and' ? breeze.Predicate.and(predicates) : breeze.Predicate.or(predicates);
        };
        return BreezeAdvancedFilterAdapter;
    })();
    dt.BreezeAdvancedFilterAdapter = BreezeAdvancedFilterAdapter;

    var GroupObject = (function () {
        function GroupObject(groupOp) {
            this.rules = [];
            this.groups = [];
            this.colFilter = null;
            this.groupOp = groupOp;
        }
        return GroupObject;
    })();

    var RuleObject = (function () {
        function RuleObject(data, op, value) {
            this.data = data;
            this.op = op;
            this.value = value;
        }
        return RuleObject;
    })();
})(dt || (dt = {}));

(function (window, document, undefined) {
    //Register events
    $.fn.DataTable.models.oSettings.advancedFilterInitCompleted = [];

    //#region Client side search engine implementation
    function clientSideFilter(oSettings, aFilterData, rowIdx, aData, counter) {
        if (oSettings.advancedFilter === undefined || !oSettings.oFeatures.bFilter)
            return true;
        var settings = oSettings.advancedFilter.settings;
        var operators = settings.operators;
        var columns;
        var state = oSettings.advancedFilter.stateData;
        if (!state || (!state.rules.length && !state.groups.length))
            return true;

        if (counter == 0) {
            columns = {};
            for (var i = 0; i < oSettings.aoColumns.length; i++) {
                var col = oSettings.aoColumns[i];
                var mData = $.isNumeric(col.mData) ? (oSettings.aoColumns[col.mData]._ColReorder_iOrigCol != null ? oSettings.aoColumns[col.mData]._ColReorder_iOrigCol : col.mData) : col.mData;
                columns[mData] = i;
            }
            oSettings.advancedFilter.columnIndexes = columns;
        } else {
            columns = oSettings.advancedFilter.columnIndexes;
        }

        function getGroupResult(groupData) {
            var index, rule, propValue, groupResult, groupOp, ruleValue, regex;
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
                } else {
                    if (propValue instanceof Date)
                        propValue = propValue.getTime();
                    if (ruleValue instanceof Date)
                        ruleValue = ruleValue.getTime();

                    switch (rule.op) {
                        case 'nn':
                            if (groupOp === 'and')
                                groupResult &= (propValue != null);
                            else
                                groupResult |= (propValue != null);
                            break;
                        case 'nl':
                            if (groupOp === 'and')
                                groupResult &= (propValue == null);
                            else
                                groupResult |= (propValue == null);
                            break;
                        case 'eq':
                            if (groupOp === 'and')
                                groupResult &= (propValue == ruleValue);
                            else
                                groupResult |= (propValue == ruleValue);
                            break;
                        case 'ne':
                            if (groupOp === 'and')
                                groupResult &= (propValue != ruleValue);
                            else
                                groupResult |= (propValue != ruleValue);
                            break;
                        case 'lt':
                            if (groupOp === 'and')
                                groupResult &= (propValue < ruleValue);
                            else
                                groupResult |= (propValue < ruleValue);
                            break;
                        case 'le':
                            if (groupOp === 'and')
                                groupResult &= (propValue <= ruleValue);
                            else
                                groupResult |= (propValue <= ruleValue);
                            break;
                        case 'gt':
                            if (groupOp === 'and')
                                groupResult &= (propValue > ruleValue);
                            else
                                groupResult |= (propValue > ruleValue);
                            break;
                        case 'ge':
                            if (groupOp === 'and')
                                groupResult &= (propValue >= ruleValue);
                            else
                                groupResult |= (propValue >= ruleValue);
                            break;
                        case 'co':
                            regex = new RegExp('^.*' + (ruleValue || '') + '.*$');
                            if (groupOp === 'and')
                                groupResult &= regex.test(propValue);
                            else
                                groupResult |= regex.test(propValue);
                            break;
                        case 'nc':
                            regex = new RegExp('^.*' + (ruleValue || '') + '.*$');
                            if (groupOp === 'and')
                                groupResult &= (!regex.test(propValue));
                            else
                                groupResult |= (!regex.test(propValue));
                            break;
                        case 'sw':
                            regex = new RegExp('^.*' + (ruleValue || ''));
                            if (groupOp === 'and')
                                groupResult &= regex.test(propValue);
                            else
                                groupResult |= regex.test(propValue);
                            break;
                        case 'ew':
                            regex = new RegExp((ruleValue || '') + '.*$');
                            if (groupOp === 'and')
                                groupResult &= regex.test(propValue);
                            else
                                groupResult |= regex.test(propValue);
                            break;
                        default:
                            break;
                    }
                }
                if (groupData.groupOp !== 'and' && groupResult) {
                    break;
                }
            }

            //if the current group rules returned false (groupOp is 'and') or if the current group rules returned true (groupOp is 'or') then we do not need to go deeper
            if ((!groupResult && groupOp === 'and') || (groupResult && groupOp !== 'and'))
                return groupResult;

            for (index = 0; index < groupData.groups.length; index++) {
                if (groupOp === 'and')
                    groupResult &= getGroupResult(groupData.groups[index]);
                else {
                    groupResult |= getGroupResult(groupData.groups[index]);
                    if (groupResult)
                        break;
                }
            }
            return groupResult;
        }

        return getGroupResult(state);
    }
    ;

    //Add clientSide filter to the global DataTables filters
    $.fn.DataTable.ext.search.push(clientSideFilter);

    //#endregion
    //Register api function
    $.fn.DataTable.Api.register('advancedFilter.init()', function (settings) {
        var advancedFilter = new dt.AdvancedFilter(this, settings);
        if (this.settings()[0]._bInitComplete)
            advancedFilter.initialize();
        else
            this.one('init.dt', function () {
                advancedFilter.initialize();
            });

        return advancedFilter.dom.globalFilter.container.get(0);
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().advancedFilter.init(oSettings.oInit.advancedFilter);
        },
        "cFeature": "A",
        "sFeature": "AdvancedFilter"
    });
}(window, document, undefined));
