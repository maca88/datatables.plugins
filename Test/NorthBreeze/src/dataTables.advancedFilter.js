(function (window, document, undefined) {

    var defaultSettings = {
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
                getFilterValue: function() {
                    return this.get(0).valueAsDate;
                },
                setFilterValue: function(date) {
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
                attr: { },
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
        getDefaultColumnOperators: function (settings, column) { //this will execute for types that are not defined in operators.types and in the column itself
            var type = column.sType ? column.sType.toLowerCase() : '';
            switch (type) {
                case 'num-fmt':
                case 'num':
                    return settings.operators.types['number'];
                default :
                    return settings.operators.types['undefined'];
            }
        },
        createFilterEditor: null, //function(column, operator, value): editor - this -> api
        filterEditorCreated: null, //function(editor, column, operator, value): void - this -> api
        ruleRemoving: null, //function(table): void - this -> api
    }


    //#region public functions
    function isColumnFilterable(oSettings, column) {
        return column.bSearchable && (!oSettings.serverSide || (oSettings.serverSide && !$.isNumeric(column.mData)));
    }

    function getOrigColumnIndex(oSettings, currIdx) {
        return oSettings.aoColumns[currIdx]._ColReorder_iOrigCol || currIdx;
    }

    function getColumnData(oSettings, column) {
        return $.isNumeric(column.mData) ? getOrigColumnIndex(oSettings, column.mData) : column.mData;
    }
    //#endregion

    var columnsByOrigData = {};


    var advancedFilter = function (settings) {
        var api = this;
        var col;
        var dtSettings = api.settings();
        var oSettings = dtSettings[0];
        settings = $.extend(true, {}, defaultSettings, settings);
        var lang = settings.language;
        oSettings.advFilterSettings = settings;
        oSettings.advFilterState = settings.stateData;
        if (!oSettings.advFilterState) {
            oSettings.advFilterState = getDefaultGroupState();
        }

        //Create a map for faster getting the column information by the original mData
        for (var i = 0; i < oSettings.aoColumns.length; i++) {
            col = oSettings.aoColumns[i];
            columnsByOrigData[getColumnData(oSettings, col)] = col;
        }


        //#region private variables
        var modalId = oSettings.sTableId + '_FilterSettings_Modal';
        var modalContentDiv = $('<div/>').addClass('modal-content');
        var modalHeaderDiv = $('<div/>')
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
            .append($('<h4 />').addClass('modal-title').html(lang.filterSettings)
        );
        var modalBodyDiv = $('<div/>').addClass('modal-body');
        var modalFooterDiv = $('<div/>').addClass('modal-footer');
        var modalDiv = $('<div />')
            .attr({
                'id': modalId,
                'role': 'dialog',
                'aria-hidden': 'true'
            })
            .on('hide.bs.modal', function () {
                saveGlobalFilterState();
            })
            .addClass('modal fade')
            .append(
                $('<div/>')
                .addClass('modal-dialog modal-lg')
                .append(
                    modalContentDiv
                    .append(modalHeaderDiv, modalBodyDiv, modalFooterDiv)
                )
            );

        var filterSettingsButton = $('<button />');
        var filterSettings =
            $('<div />')
                .addClass(settings.dom.settingButtonDiv.className)
                .append(
                    filterSettingsButton
                    .attr('title', lang.filterSettings)
                    .addClass(settings.dom.settingButton.buttonClass)
                    .append(
                        $('<span />')
                        .addClass(settings.dom.settingButton.spanClass)
                        .on('click', function (e) {
                            closeAllColumnFilters();
                            populateGlobalFilter();
                            modalDiv.modal('show');
                        })
                    )
                )
                .append(modalDiv);
        //#endregion

        //#region private functions

        function saveGlobalFilterState() {
            var state = modalBodyDiv.filtersToJson();
            oSettings.advFilterState = state;

            var cols = {};

            $.each(state.groups, function(idx, group) {
                if (group.colFilter == null) return;
                col = columnsByOrigData[group.colFilter];
                col.advFilterState = group;
                cols[group.colFilter] = true;
            });

            $.each(oSettings.aoColumns, function(i, colOpts) {
                if (cols.hasOwnProperty(getColumnData(oSettings, colOpts))) return;
                colOpts.advFilterState = getDefaultGroupState();
                removeActiveColumnClass(colOpts);
            });

            if (state.groups.length || state.rules.length)
                addActiveGlobalFilterClass();
            else
                removeActiveGlobalFilterClass();
        }

        function populateGlobalFilter() {
            var filterDom = createFilters({
                data: oSettings.advFilterState
            });
            filterDom.filterBtn.on('click', function () {
                saveGlobalFilterState();
                modalDiv.modal('hide');
                api.draw(true);
            });
            filterDom.clearBtn.on('click', function () {
                clearGlobalFilterState();
                api.draw(true);
            });

            modalBodyDiv.html(filterDom.groups);
            modalFooterDiv.empty();
            modalFooterDiv.append(filterDom.clearBtn, filterDom.filterBtn);
        }

        function clearGlobalFilterState() {
            oSettings.advFilterState = getDefaultGroupState();
            removeActiveGlobalFilterClass();
            $.each(oSettings.aoColumns, function(idx, colOpts) {
                colOpts.advFilterState = getDefaultGroupState();
                removeActiveColumnClass(colOpts);
            });
            var filterDom = createFilters({
                data: oSettings.advFilterState
            });
            modalBodyDiv.html(filterDom.groups);
        }

        function closeAllColumnFilters() {
            $.each(oSettings.aoColumns, function(idx, colOpts) {
                if (!colOpts.advFilterIcon || !colOpts.advFilterIcon.next('div.popover').length) return;
                
                colOpts.advFilterIcon.popover('hide');
            });
        }

        function addActiveGlobalFilterClass() {
            filterSettingsButton.addClass('dt-global-filter-active');
        }

        function removeActiveGlobalFilterClass() {
            filterSettingsButton.removeClass('dt-global-filter-active');
        }

        function addActiveColumnClass(colOpts) {
            var icon = colOpts.advFilterIcon;
            if (!icon) {
                colOpts.advFilterIconActive = true;
                return;
            }
            icon.addClass('dt-column-filter-active');
        }

        function removeActiveColumnClass(colOpts) {
            var icon = colOpts.advFilterIcon;
            if (!icon) return;
            icon.removeClass('dt-column-filter-active');
        }

        function saveColumnFilterState(colOpts, columnFilterDiv, state) {
            colOpts.advFilterState = state || columnFilterDiv.filtersToJson();
            colOpts.advFilterState.colFilter = getColumnData(oSettings, colOpts); //mark as column filter
            var gIdx = -1;
            $.each(oSettings.advFilterState.groups, function (idx, group) {
                if (group.colFilter == null) return;
                if (group.colFilter === colOpts.advFilterState.colFilter)
                    gIdx = idx;
            });
            if (colOpts.advFilterState.rules.length > 0) { //append column filter to the global filter
                if (gIdx < 0)
                    oSettings.advFilterState.groups.push(colOpts.advFilterState);
                else
                    oSettings.advFilterState.groups[gIdx] = colOpts.advFilterState;
                addActiveColumnClass(colOpts);
            }
            else if (gIdx >= 0) {//remove the column filter
                oSettings.advFilterState.groups.splice(gIdx, 1);
                removeActiveColumnClass(colOpts);
            }
            
            if (oSettings.advFilterState.rules.length || oSettings.advFilterState.groups.length)
                addActiveGlobalFilterClass();
            else
                removeActiveGlobalFilterClass();
        }

        function clearColumnFilterState(colOpts, columnFilterDiv) {
            saveColumnFilterState(colOpts, columnFilterDiv, getDefaultGroupState());
        }

        function populateColumnFilter(colOpts, columnFilterDiv) {
            var filterDom = createFilters({
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
            filterDom.clearBtn.on('click', function () {
                colOpts.advFilterIcon.popover('hide');
                clearColumnFilterState(colOpts, columnFilterDiv);
                api.draw(true);
            });
            filterDom.filterBtn.on('click', function () {
                colOpts.advFilterIcon.popover('hide');
                api.draw(true);
            });

            columnFilterDiv
                .html(filterDom.groups)
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

        function getDefaultGroupState() {
            return {
                groupOp: 'and',
                rules: [],
                groups: []
            };
        }

        function getOperators(column) {
            var filter = column.filter || {};
            var operators = filter.operators;
            if (operators) return operators;

            var colType = filter.type || column.sType || column.type || 'undefined';
            var type = colType.toLowerCase();
            if (settings.operators.types.hasOwnProperty(type)) {
                return settings.operators.types[type];
            } else if ($.isFunction(settings.getDefaultColumnOperators))
                return settings.getDefaultColumnOperators.call(api, settings, column);
            else
                return settings.operators.types['undefined'];
        }

        function drawColumnFilters() {
            $.each(oSettings.aoColumns, function () {
                var colOpts = this;
                if (!isColumnFilterable(oSettings, colOpts)) return;
                colOpts.advFilterState = colOpts.advFilterState || getDefaultGroupState();
                var columnFilterDiv = $('<div />')
                    .on('click', function(e) {
                        e.stopPropagation(); //We have to do this in order to skip dt ordering 
                    })
                    .on('mousedown', function(e) {
                        e.stopPropagation(); //We have to do this in order to focus to work right (ColReorder)
                    });
                var link = $('<a />');
                link.popover({
                    content: columnFilterDiv,
                    placement: 'bottom',
                    html: true
                });
                link
                    .attr('title', lang.columnFilter)
                    .on('hide.bs.popover', function () {
                        saveColumnFilterState(colOpts, columnFilterDiv);
                    })
                    .append(
                        $('<span />')
                        .addClass(settings.dom.columnFilterIcon.className)
                        .on('click', function(e) {
                            e.stopPropagation(); //We have to do this in order to skip dt ordering 
                            populateColumnFilter(colOpts, columnFilterDiv);
                            link.popover('toggle');
                        })
                    );
                colOpts.advFilterIcon = link;
                if (colOpts.advFilterIconActive) { //when remote state load a state
                    addActiveColumnClass(colOpts);
                    delete colOpts['advFilterIconActive'];
                }

                $(colOpts.nTh).append(link);
            });
            
        }

        var defaultOpts = {
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

        function createFilters(opts) {
            //We must not clone columns and data!
            var notDeepClone = { data: opts.data, columns: opts.columns };
            delete opts['data'];
            delete opts['columns'];
            opts = $.extend(true, {}, defaultOpts, opts);
            $.extend(opts, notDeepClone);

            opts.columns = opts.columns || oSettings.aoColumns;
            var group = createGroup(opts, null, true);

            var filterBtn = $('<button/>')
                .addClass(settings.dom.filterButton.className)
                .append(
                    $('<span />')
                    .html(lang.filter)
                );
            var clearBtn = $('<button/>')
                .addClass(settings.dom.clearButton.className)
                .append(
                    $('<span />')
                    .html(lang.clear)
                );

            return {
                groups: group,
                filterBtn: filterBtn,
                clearBtn: clearBtn
            }; 
        }

        function createGroup(opts, data, init) {
            var group = $('<table/>')
                .css(opts.group.table.css)
                .addClass('dt-filter-group');
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
                            .html(lang.filterFor + ': ' + columnsByOrigData[data.colFilter].sTitle)
                        )
                    )
                );
            }

            var rules = data.rules ? data.rules : null;
            var groups = data.groups ? data.groups : null;

            var headerRow = createHeaderRow(opts, data, init);
            if (!opts.group.visible)
                headerRow.hide();
            group.append(headerRow);

            if (rules) {
                $.each(rules, function (i, rule) {
                    group.append(createFilterRow(opts, i, rule, data));
                });
            }
            else {
                group.append(createFilterRow(opts, 0, null, data));
            }
           
            if (groups) {
                $.each(groups, function (i, child) {
                    var groupRow = createGroupRow(opts, child);
                    group.append(groupRow);
                });
            }
            return group;
        }

        function createGroupRow(opts, groupObject) {
            var cell = $('<td/>').attr({ 'colspan': 4 });
            var group = createGroup(opts, groupObject);
            cell.append(group);
            return $('<tr/>').addClass('group-row').append(cell);
        }

        function createHeaderRow(opts, data, init) {
            var cell = $('<th/>').attr({ 'colspan': 4 });
            data = data || {};
            var groupOp = data.groupOp != null ? data.groupOp : 'and';

            var selectOperator = $('<select/>')
                .attr({ 'name': 'groupOperator' })
                .addClass(settings.dom.groupOperatorSelect.className)
                .append(
                    $('<option/>')
                        .attr({ 'value': 'and' })
                        .html(lang.and),
                    $('<option/>')
                        .attr({ 'value': 'or' })
                        .html(lang.or)
                );

            selectOperator.val(groupOp);

            cell.append(selectOperator);

            if (opts.group.add !== false && data.colFilter == null) //do not support adding new group for column filter
                cell.append(createAddGroupButton(opts));
            
            if (opts.rule.add !== false)
                cell.append(createAddRuleButton(opts, data));

            if (init !== true && opts.group.remove !== false) {
                cell.append(createRemoveGroupButton());
            }

            return $('<tr/>').append(cell);
        }

        function createFilterRow(opts, idx, rule, data) {
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
                        .css(opts.rule.table.css)
                        .append(body)
                    )
                );
            
            var colSelectSepRow = opts.rule.columnSelect.separateRow;
            var opSelectSepRow = opts.rule.operatorSelect.separateRow;
            var fInputSepRow = opts.rule.filterInput.separateRow;
            var rButtonSepRow = opts.rule.removeButton.separateRow;

            //#region columns
            if (opts.columns.length == 1 || data.colFilter != null) { //if only one column is in the list we do not need to create a select box
                column = data.colFilter != null ? columnsByOrigData[data.colFilter] : opts.columns[0];
                td = $('<td/>').addClass('columns')
                    .append(
                        $('<input/>')
                        .attr({ 'name': 'column', 'type': 'hidden' })
                        .val(getColumnData(oSettings, column))
                    );
                if (colSelectSepRow) {
                    rows.push($('<tr/>').append(td.attr({ 'colspan': 4 })).hide());
                } else {
                    row.append(td.attr({ 'colspan': opts.rule.columnSelect.colSpan }).hide());
                }
            } else {
                var columnSelect = createColumnSelect(opts, rule.data);
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
                var operatorSelect = createOperatorSelect(opts, column, rule.op);
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
                var filterInput = createFilterInput(column, rule.op, rule.value);
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
                td.append(createRemoveRuleButton());
            }
            //#endregion

            if (!colSelectSepRow || !opSelectSepRow || !fInputSepRow || !rButtonSepRow)
                rows.push(row);
            body.append(rows);

            return result;
        }

        function createColumnSelect(opts, selectedValue) {
            var select = $('<select/>')
                .addClass(settings.dom.columnSelect.className)
                .attr(opts.rule.columnSelect.attr)
                .css(opts.rule.columnSelect.css)
                .attr({ 'name': 'column' });

            var selected;
            $.each(opts.columns, function (i, column) {
                if (isColumnFilterable(oSettings, column)) {
                    selected = (selectedValue != null) ? (getColumnData(oSettings, column) == selectedValue) : false;
                    select.append(createColumnOption(column, selected));
                }
            });

            addDefaultOption(select, selectedValue == null);

            select.change(function () {
                var cell = $(this).parent();
                var option = $('option:selected', this);
                var value = option.val();

                cell.nextUntil('.remove').empty();

                if (value != null && value != '') {
                    var column = option.data('_DT_ColumnOpt');
                    var operatorSelect = createOperatorSelect(opts, column, null);

                    cell.next().append(operatorSelect);
                }
            });

            return select;
        }

        function createColumnOption(column, selected) {
            var option = $('<option/>', {
                'value': getColumnData(oSettings, column),
                'text': column.sTitle
            }).data(
                '_DT_ColumnOpt', column
            );
            if (selected)
                option.prop('selected', true);

            return option;
        }

        function createRemoveGroupButton() {
            var button = $('<button/>')
                .addClass(settings.dom.removeGroupButton.buttonClass)
                .addClass('remove-group')
                .append($('<span/>')
                    .addClass(settings.dom.removeGroupButton.spanClass)
                    .attr('title', lang.removeGroup)
                );
            button.click(function () {
                $(this).closest('table').parent().remove();
            });

            return button;
        }

        function createAddGroupButton(opts) {
            var button = $('<button/>')
                .addClass(settings.dom.addGroupButton.buttonClass)
                .addClass('add-group')
                .append($('<span/>')
                    .addClass(settings.dom.addGroupButton.spanClass)
                    .attr('title', lang.addGroup)
                );

            button.click(function () {
                var cell = $('<td/>').attr({ 'colspan': 4 });
                cell.append(createGroup(opts, {}));

                var row = $('<tr/>').addClass('group-row').append(cell);
                $(this).closest('tbody').append(row);
            });

            return button;
        }

        function createAddRuleButton(opts, data) {
            var button = $('<button/>')
                .addClass(settings.dom.addRuleButton.buttonClass)
                .addClass('add-rule')
                .append($('<span/>')
                    .addClass(settings.dom.addRuleButton.spanClass)
                    .attr('title', lang.addRule)
                );
            button.click(function () {
                var tbody = $(this).closest('tbody');
                var groups = $('> .group-row', tbody);
                var idx = $('tr:not(.row-group)', tbody).length;
                var row = createFilterRow(opts, idx, null, data);

                if (groups.length)
                    groups.first().before(row);
                else
                    tbody.append(row);
            });

            return button;
        }

        function createRemoveRuleButton() {
            var button = $('<button/>')
                .addClass(settings.dom.removeRuleButton.buttonClass)
                .addClass('remove-rule')
                .append($('<span/>')
                    .addClass(settings.dom.removeRuleButton.spanClass)
                    .attr('title', lang.removeRule)
                );
            button.click(function () {
                var ruleTable = button.closest('table');
                if ($.isFunction(settings.ruleRemoving))
                    settings.ruleRemoving.call(api, ruleTable);

                ruleTable.remove();
            });
            return button;
        }

        function createOperatorSelect(opts, column, selectedValue) {
            var select = $('<select/>')
                .addClass(settings.dom.ruleOperatorSelect.className)
                .attr(opts.rule.operatorSelect.attr)
                .css(opts.rule.operatorSelect.css)
                .attr({ 'name': 'ruleOperator' });
            var operators = getOperators(column);
            var selected, option;
            $.each(operators, function (i) {
                selected = (selectedValue != null) ? (operators[i] == selectedValue) : false;
                option = createOperatorOption(operators[i], selected);
                if (option !== null)
                    select.append(option);
            });

            addDefaultOption(select, selectedValue == null);

            select.change(function () {
                var cell = $(this).parent();
                var value = $('option:selected', this).val();

                if (!opts.rule.operatorSelect.separateRow)
                    cell.nextUntil('.remove').empty();
                else
                    $('td.data', cell.parent('tr').next('tr')).empty();

                if (value != null && value != '') {
                    var filterInput = createFilterInput(column, select.val(), null);

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

        function createOperatorOption(operator, selected) {
            var optionOperators = lang.operators;
            if (!optionOperators.hasOwnProperty(operator))
                return null;
            var option = $('<option/>', {
                'value': operator,
                'text': optionOperators[operator] || 'Missing translation'
            });
            if (selected)
                option.prop('selected', true);
            return option;
        }

        function createFilterInput(column, operator, value) {
            var element;
            if (operator === 'nl' || operator === 'nn') return {};

            //If a custom function for creating the filter editor is not provided
            var typeOptions = settings.typesEditor;
            var filter = column.filter || {};
            var colType = filter.type || column.sType || 'undefined';
            var options = typeOptions[colType.toLowerCase()];
            if (!options && $.isFunction(settings.getDefaultFilterEditor))
                options = settings.getDefaultFilterEditor.call(api, settings, column);
            else if (!options)
                options = typeOptions['string'];

            if ($.isFunction(options.customCreationFn))
                element = options.call(api, column, operator, value, settings);
            else {
                element = $('<' + options.tag + '/>')
                .attr('name', 'data')
                .attr(options.attr)
                .addClass(options.className);

                if (options.tag == 'select') {
                    var values = [];
                    if (!filter.values) {
                        if (!!column.mData) { //TODO: always true
                            var uniq = {};
                            for (var i = 0, len = oSettings.aoData.length; i < len; i++) {
                                var val = oSettings.aoData[i]._aData[column.mData]; //TODO: FIX
                                if (uniq.hasOwnProperty(val)) continue;
                                uniq[val] = i;
                                values.push(val);
                            }
                        }
                    } else {
                        values = filter.values;
                    }

                    $.each(values, function (idx, option) {
                        element.append($('<option/>')
                            .attr({
                                'text': option.name,
                                'value': option.value,
                            }));
                    });
                    addDefaultOption(element);
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
                
            if ($.isFunction(settings.filterEditorCreated))
                settings.filterEditorCreated.call(api, element, column, operator, value, settings);
            return {
                control: element,
                getValue: getControlValue,
                setValue: setControlValue
            };
        }

        function addDefaultOption(select, selected) {
            var option = $('<option/>');
            if (selected)
                option.prop('selected', true);
            return select.prepend(option);
        }

        function loadState(e, s, data) {
            if (!data.advFilter) {
                oSettings.advFilterState = getDefaultGroupState();
                $.each(oSettings.aoColumns, function() {
                    this.advFilterState = getDefaultGroupState();
                    removeActiveColumnClass(this);
                });
            } else
                oSettings.advFilterState = data.advFilter;

            if (oSettings.advFilterState.groups.length || oSettings.advFilterState.rules.length)
                addActiveGlobalFilterClass();
            else
                removeActiveGlobalFilterClass();

            $.each(oSettings.advFilterState.groups, function() {
                if (this.colFilter == null) return;
                col = columnsByOrigData[this.colFilter];
                if (!col) return;
                col.advFilterState = this;
                if (this.rules.length)
                    addActiveColumnClass(col);
            });
        }

        function saveState(e, s, data) {
            data.advFilter = oSettings.advFilterState;
        }

        //#endregion

        //Integrate with remote state
        api.on('remoteStateLoadParams.dt', loadState);
        api.on('remoteStateSaveParams.dt', saveState);

        
        //Execute the needed functions
        if (oSettings.bInitialized)
            drawColumnFilters();
        else {
            api.on('init.dt', drawColumnFilters);
        }

        //Server side
        if (oSettings.oInit.bServerSide || oSettings.oInit.serverSide) {
            api.on('serverParams.dt', function (e, data) {
                data['searchGroup'] = oSettings.advFilterState;
            });

            //If breezeRemote is used integrate advanceFilter with it
            if (oSettings.oInit.breezeRemote) {
                var origBeforeQueryExecution;
                var breezeRemoteSettings;
                //check if breezeRemote was already initialized
                breezeRemoteSettings = oSettings.breezeRemote
                    ? oSettings.breezeRemote
                    : oSettings.oInit.breezeRemote;
                origBeforeQueryExecution = breezeRemoteSettings.beforeQueryExecution;

                breezeRemoteSettings.beforeQueryExecution = function (query, data) {
                    query = serverSideBreezeRemoteFilter.call(this, query, data);
                    return $.isFunction(origBeforeQueryExecution)
                        ? origBeforeQueryExecution.call(this, query, data)
                        : query;
                };
            }

        }

        return filterSettings.get(0);

        
    };

    //#region Server side implementation for breezeRemote plugin

    function getRuleBreezePredicate(name, op, value) {
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

    function getGroupBreezePredicate(groupData, clientToServerNameFn) {
        var index, rule, predicates = [], predicate;

        for (index = 0; index < groupData.rules.length; index++) {
            rule = groupData.rules[index];
            predicate = getRuleBreezePredicate(clientToServerNameFn(rule.data), rule.op, rule.value);
            if (predicate)
                predicates.push(predicate);
        }

        for (index = 0; index < groupData.groups.length; index++) {
            predicate = getGroupBreezePredicate(groupData.groups[index], clientToServerNameFn);
            if (predicate)
                predicates.push(predicate);
        }

        if (!predicates.length) return null;

        return groupData.groupOp === 'and'
            ? breeze.Predicate.and(predicates)
            : breeze.Predicate.or(predicates);
    }

    function serverSideBreezeRemoteFilter(query, data) {
        var state = data.searchGroup;
        if (!state || (!state.rules.length && !state.groups.length)) return query;

        var breezeRemoteSettings = this.breezeRemote;
        var clientToServerNameFn = breezeRemoteSettings.entityManager.metadataStore.namingConvention.clientPropertyNameToServer;
        var p = getGroupBreezePredicate(state, clientToServerNameFn);
        if (!p) return query;
        return query.where(p);
    };

    //#endregion

    //#region Client side search engine implementation
    function clientSideFilter(oSettings, aFilterData, rowIdx, aData) {
        if (!oSettings.aanFeatures.hasOwnProperty('A') || !oSettings.oFeatures.bFilter) return true;
        var settings = oSettings.advFilterSettings;
        var operators = settings.operators;
        var state = oSettings.advFilterState;
        if (!state || (!state.rules.length && !state.groups.length)) return true;

        //TODO: do it only once
        var columns = {};
        for (var i = 0; i < oSettings.aoColumns.length; i++) {
            columns[getColumnData(oSettings, oSettings.aoColumns[i])] = i;
        }

        function getGroupResult(groupData) {
            var index, rule, propValue, groupResult, groupOp, ruleValue, regex;
            groupOp = groupData.groupOp;
            groupResult = groupData.groupOp === 'and' ? true : false; //for or operator we will start with false in order to know if one of the rules will return true
            for (index = 0; index < groupData.rules.length; index++) {
                rule = groupData.rules[index];
                propValue = aFilterData[columns[rule.data]];
                ruleValue = rule.value;
                if (operators.hasOwnProperty(rule.op) &&  (typeof(operators[rule.op].fn) == 'function')) {
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
                                groupResult &= propValue != null;
                            else
                                groupResult |= propValue != null;
                            break;
                        case 'nl': //IsNull
                            if (groupOp === 'and')
                                groupResult &= propValue == null;
                            else
                                groupResult |= propValue == null;
                            break;
                        case 'eq': //Equal
                            if (groupOp === 'and')
                                groupResult &= propValue == ruleValue;
                            else
                                groupResult |= propValue == ruleValue;
                            break;
                        case 'ne': //NotEqual
                            if (groupOp === 'and')
                                groupResult &= propValue != ruleValue;
                            else
                                groupResult |= propValue != ruleValue;
                            break;
                        case 'lt': //LessThan
                            if (groupOp === 'and')
                                groupResult &= propValue < ruleValue;
                            else
                                groupResult |= propValue < ruleValue;
                            break;
                        case 'le': //LessOrEqual
                            if (groupOp === 'and')
                                groupResult &= propValue <= ruleValue;
                            else
                                groupResult |= propValue <= ruleValue;
                            break;
                        case 'gt': //GreaterThan
                            if (groupOp === 'and')
                                groupResult &= propValue > ruleValue;
                            else
                                groupResult |= propValue > ruleValue;
                            break;
                        case 'ge': //GreaterOrEqual
                            if (groupOp === 'and')
                                groupResult &= propValue >= ruleValue;
                            else
                                groupResult |= propValue >= ruleValue;
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
                                groupResult &= !regex.test(propValue);
                            else
                                groupResult |= !regex.test(propValue);
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


    $.fn.filtersToJson = function() {
        var filterGroup = $('> .dt-filter-group', this);
        var filter = groupToObject(filterGroup);
        
        return filter;

        function groupToObject(group) {
            var groupOperator = $('> tbody > tr > th > select[name="groupOperator"] :selected', group).val();
            var rules = $('> tbody > tr > td > table > tbody > tr > td.columns', group).closest('table');
            var groups = $('> tbody > tr > td > table.dt-filter-group', group);

            var object = new groupObject(groupOperator);
            object.colFilter = group.data('colFilter');

            rules.each(function () {
                var columnElement = $('td.columns input[type="hidden"], .columns select :selected', this);
                var operatorElement = $('td.operators select :selected', this);
                var dataElement = $('td.data', this);

                if (!columnElement.length || !operatorElement.length)
                    return;

                var column = columnElement.val(); 
                var operator = operatorElement.val();
                var data = null;
                if (dataElement.length) {
                    var getValue = dataElement.data('_DT_GetFilterValue');
                    if (getValue)
                        data = getValue();
                }
                if (!column || !operator)
                    return;

                object.rules.push(
                    new ruleObject(column, operator, data)
                );
            });

            groups.each(function () {
                object.groups.push(
                    groupToObject($(this))
                );
            });

            return object;
        }

        function groupObject(groupOperator) {
            this.groupOp = groupOperator;
            this.rules = [];
            this.groups = [];
            this.colFilter = null;
        }

        function ruleObject(data, op, value) {
            this.data = data;
            this.op = op;
            this.value = value;
        }
    };

    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return advancedFilter.call(oSettings.oInstance.api(), oSettings.oInit.advancedFilter);
        },
        "cFeature": "A",
        "sFeature": "AdvancedFilter"
    });

}(window, document));