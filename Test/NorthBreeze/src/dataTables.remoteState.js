(function( window, document, undefined ) {

    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().remoteState(oSettings.oInit.remoteState);
        },
        "cFeature": "B",
        "sFeature": "Remote state"
    });

    var defaultSettings = {
        storeId: null,
        defaultState: '',
        currentState: null,
        minStateLength: 2,
        defaultTableState: 'Default',
        states: null,
        getStatesFromServer: false,
        sendCurrentStateToServer: 'currentState',
        dom: {
            inputWidth: '200px',
            stateSelectClass: 'form-control',
            setDefaultButton: {
                'class': 'btn btn-default btn-sm',
                'icon': 'glyphicon glyphicon-star-empty'
            },
            settingButton: {
                'class': 'btn btn-default btn-sm',
                'icon': 'glyphicon glyphicon-list-alt'
            },
            deleteButton: {
                'class': 'btn btn-default btn-sm',
                'icon': 'glyphicon glyphicon-remove'
            },
            saveButton: {
                'class': 'btn btn-default btn-sm',
                'icon': 'glyphicon glyphicon-floppy-disk'
            },
            deleteForm: {
                'class': 'form-horizontal',
                'groupClass': 'form-group',
                'labelClass': 'col-sm-2 control-label',
                'selectDivClass': 'col-sm-10'
            },
            saveForm: {
                'class': 'form-horizontal',
                'inputClass': 'form-control',
                'groupClass': 'form-group',
                'labelClass': 'col-sm-2 control-label',
                'selectDivClass': 'col-sm-10'
            }
        },
        language: {
            'settings': 'Settings',
            'default': 'Default',
            'load': 'Load',
            'save': 'Save',
            'add': 'Add',
            'delete': 'Delete',
            'setDefault': 'Set default',
            'createNew': 'Create new',
            'state': 'State'
        },
        settingsDisplayAction: null,
        ajax: {
            'getAll': {
                url: null,
                type: 'POST',
                beforeSendAction: null,
                doneAction: null,
                failAction: null
            },
            'save': {
                url: null,
                type: 'POST',
                beforeSendAction: null,
                doneAction: null,
                failAction: null
            },
            'delete': {
                url: null,
                type: 'POST',
                beforeSendAction: null,
                doneAction: null,
                failAction: null
            },
            'setDefault': {
                url: null,
                type: 'POST',
                beforeSendAction: null,
                doneAction: null,
                failAction: null
            }
        }
    };

    var createRequest = function(settings, data, doneAction, failAction) {
        var ajaxSettings = {
            data: JSON.stringify(data),
            url: settings.url,
            type: settings.type,
            contentType: 'application/json; charset=utf-8',
            dataType: 'json'
        };

        if ($.isFunction(settings.beforeSendAction))
            settings.beforeSendAction(ajaxSettings);

        $.ajax(ajaxSettings)
            .done(function (msg, textStatus, jqXhr) {
                if ($.isFunction(settings.doneAction))
                    settings.doneAction(settings, msg, textStatus, jqXhr);
                else {
                    if ($.isFunction(doneAction))
                        doneAction(msg, textStatus, jqXhr);
                }
            })
            .fail(function (jqXhr, textStatus, errorThrown) {
                if ($.isFunction(settings.failAction))
                    settings.failAction(jqXhr, textStatus, errorThrown);
                else {
                    if ($.isFunction(failAction))
                        failAction(jqXhr, textStatus, errorThrown);
                    else
                        throw errorThrown;
                }
            });
    };

    var stateSelects = [];

    var createSelectStates = function (settings, excludeDefault) {
        var curState = settings.currentState;
        var stateOptions = [];
        $.each(settings.states, function (key) {
            if (key.lastIndexOf('$', 0) == 0) return; //skip all values that startswith $ (i.e. $type, $id)
            if (excludeDefault && settings.defaultTableState == key) return;
            stateOptions.push($('<option/>', {
                'value': key,
                'text': settings.defaultTableState == key ? settings.language.default: key,
                selected: key == (!curState ? settings.defaultTableState : curState)
            }));
        });
        var select = $('<select />', {})
            .addClass(settings.dom.stateSelectClass)
            .css('width', settings.dom.inputWidth)
            .append(stateOptions);
        stateSelects.push(select);
        return select;
    };

    var getState = function(settings, name) {
        var state = settings.states[name];
        if (state == null)
            throw 'state with name "' + name + '" is not present';
        return state;
    };

    var generateStateData = function (oSettings, oInstance) {
        var i, iLen;
        var api = oInstance.api();
        
        var data = {
            "created": new Date().getTime(),
            "displayStart": oSettings._iDisplayStart,
            "pageLength": oSettings._iDisplayLength,
            "order": $.extend(true, [], oSettings.aaSorting),
            "filter": $.extend(true, {}, oSettings.oPreviousSearch),
            "searchCols": $.extend(true, [], oSettings.aoPreSearchCols),
            "visCols": [],
            "colReorder": [],
            "colData": [],
            "colNames": [],
            "searchable": [],
            "orderable": []
        };

        for (i = 0, iLen = oSettings.aoColumns.length; i < iLen; i++) {
            data.colData.push(oSettings.aoColumns[i].mData);
            data.colNames.push(oSettings.aoColumns[i].sName);
            data.visCols.push(oSettings.aoColumns[i].bVisible);
            data.searchable.push(oSettings.aoColumns[i].bSearchable);
            data.orderable.push(oSettings.aoColumns[i].bSortable);
        }

        if (api.colReorder != null) {
            /* Sorting */
            for (i = 0 ; i < data.order.length ; i++) {
                var origColIdx = oSettings.aoColumns[data.order[i][0]]._ColReorder_iOrigCol;
                data.order[i][0] = origColIdx != null ? origColIdx : i;
            }

            var aSearchCopy = $.extend(true, [], data.searchCols);
            data.colReorder = [];

            for (i = 0, iLen = oSettings.aoColumns.length ; i < iLen ; i++) {
                var iOrigColumn = oSettings.aoColumns[i]._ColReorder_iOrigCol;
                if (iOrigColumn == null)
                    iOrigColumn = i;

                /*Column orderable*/
                data.orderable[iOrigColumn] = oSettings.aoColumns[i].bSortable;

                /*Column searchable*/
                data.searchable[iOrigColumn] = oSettings.aoColumns[i].bSearchable;

                /*Column name*/
                data.colNames[iOrigColumn] = oSettings.aoColumns[i].sName;

                /*Column data*/
                data.colData[iOrigColumn] = oSettings.aoColumns[i].mData;

                /* Column filter */
                data.searchCols[iOrigColumn] = aSearchCopy[i];

                /* Visibility */
                data.visCols[iOrigColumn] = oSettings.aoColumns[i].bVisible;

                /* Column reordering */
                data.colReorder.push(iOrigColumn);

                
            }
        }

        return data;
    }

    var saveState = function (oSettings, storeId, name, requestSettings, doneAction, failAction) {
        /* Store the interesting variables */
        var $table = $(oSettings.nTable);
        var settings = oSettings.remoteState;
        var data = generateStateData(oSettings, oSettings.oInstance);

        $table.trigger('remoteStateSaveParams.dt', [oSettings, data]);


        var requestData = {
            'storeId': storeId,
            'stateName': name,
            'data': data,
            'action': 'save'
        };

        createRequest(requestSettings, requestData,
            function () {
                if ($.isFunction(doneAction))
                    doneAction(data);
            },
            failAction);
    };

    var setDefaultStateData = function (oSettings, settings) {
        var toClone = {
            aoColumns: oSettings.aoColumns,
            _iDisplayStart: oSettings._iDisplayStart,
            iInitDisplayStart: oSettings.iInitDisplayStart,
            _iDisplayLength: oSettings._iDisplayLength,
            aaSorting: oSettings.aaSorting,
            oPreviousSearch: oSettings.oPreviousSearch,
            aoPreSearchCols: oSettings.aoPreSearchCols,
            aaSortingFixed: oSettings.aaSortingFixed,
        };
        var initialSettings = $.extend(true, {}, toClone);
        settings.states[settings.defaultTableState] = generateStateData(initialSettings, oSettings.oInstance);
    };

    var loadState = function (oSettings, data, dtInitialized) {
        var i, ien;
        var columns = oSettings.aoColumns;
        var api = oSettings.oInstance.api();
        var $table = $(oSettings.nTable);
        $table.trigger('remoteStateLoadParams.dt', [oSettings, data, dtInitialized]);

        // Number of columns have changed - reset filters
        if (columns.length !== data.searchCols.length) {
            data.searchCols = [];
            data.visCols = [];
            for (i = 0; i < columns.length; i++) {
                data.searchCols.push(null);
                data.visCols.push(true);
            }
        }

        oSettings._iDisplayStart = data.displayStart;
        oSettings.iInitDisplayStart = data.displayStart;
        oSettings._iDisplayLength = data.pageLength;
    
        /*ColReorder*/
        if ($.isArray(data.colReorder) && data.colReorder.length == columns.length) {
            if (dtInitialized) {
                api.colReorder.reset(); //We have to reset columns positions so that ordering will work as it should 
            }
        }

        /* Column visibility state */
        for (i = 0, ien = data.visCols.length ; i < ien ; i++) {
            if (dtInitialized)
                api.column(i).visible(data.visCols[i]);
            else
                columns[i].bVisible = data.visCols[i];
        }

        /*Order*/
        var savedSort = data.order;
        oSettings.aaSorting = [];
        for (i = 0, ien = savedSort.length; i < ien; i++) {
            oSettings.aaSorting.push(savedSort[i][0] >= columns.length ?
                [0, savedSort[i][1]] :
                savedSort[i]
            );
        }

        /*ColReorder*/
        if ($.isArray(data.colReorder) && data.colReorder.length == columns.length) {
            if (dtInitialized) {
                api.colReorder.order(data.colReorder);
            } else { //This feature must be defined before R (ColReoder) in order to work properly
                oSettings.oInit.colReorder = oSettings.oInit.colReorder || {};
                oSettings.oInit.oColReorder = oSettings.oInit.oColReorder || {};
                oSettings.oInit.oColReorder.aiOrder =
                    oSettings.oInit.colReorder.order = data.colReorder;
            }
        }
    
        /* Search filtering  */
        $.extend(oSettings.oPreviousSearch, data.filter);
        $.extend(true, oSettings.aoPreSearchCols, data.searchCols); //TODO: verify if we need to do something more if dt is initialized
        //Find the search input and set the value
        if (dtInitialized) {
            var filterClass = oSettings.oClasses.sFilterInput;
            var filterInput = $table.find('input[type="search"]');
            if (filterClass != "") {
                filterInput = filterInput.filter(function () {
                    return $(this).hasClass(filterClass);
                });
            }
            filterInput.val(data.filter.sSearch.replace('"', '&quot;'));
        }

        if (dtInitialized) {
            api.draw(false);
        }
    };

    var getRemoteStates = function (settings, api) {
        var getAllSettings = $.extend({}, defaultSettings.ajax.getAll, settings.ajax.getAll);
        if (getAllSettings.url == null)
            throw 'ajax.getAll.url must be defined.';

        if ($.isFunction(getAllSettings.beforeSendAction))
            getAllSettings.beforeSendAction(api);

        try {
            var result = $.parseJSON($.ajax({
                data: JSON.stringify({
                    storeId: settings.storeId,
                    action: 'getAll',
                    stateName: null,
                    data: null
                }),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                type: getAllSettings.type,
                url: getAllSettings.url,
                async: false
            }).responseText);

            settings.states = result.states;
            settings.defaultState = result.defaultState;

        } catch (err) {
            if ($.isFunction(getAllSettings.doneAction))
                getAllSettings.failAction(err, api);
            throw err;
        }

        if ($.isFunction(getAllSettings.doneAction))
            getAllSettings.doneAction(states, api);
    };

    var setDefaultState = function(name, settings) {
        dom.setDefaultButton.prop('disabled', true);
        var requestData = {
            'storeId': settings.storeId,
            'stateName': name,
            'action': 'setDefault',
            'data': null
        };
        createRequest(settings.ajax.setDefault,
            requestData,
            function() {
                settings.defaultState = name;
            },
            function(jqXhr, textStatus, errorThrown) {
                dom.setDefaultButton.prop('disabled', false);
                throw errorThrown;
            });
    };

    var deleteState = function(name, settings) {
        dom.deleteButton.prop('disabled', true);
        var requestData = {
            'storeId': settings.storeId,
            'stateName': name,
            'action': 'delete',
            'data': null
        };
        createRequest(settings.ajax.delete,
            requestData,
            function () {
                delete settings.states[name];
                var selStateRemoved = null;
                $.each(stateSelects, function () {
                    var option = $(this).find('option[value="' + name + '"]');
                    if (dom.stateSelect.get(0) == this.get(0) && option.prop('selected') == true) {
                        selStateRemoved = name;
                    }
                    option.remove();
                });
                if (selStateRemoved != null) {
                    if (settings.defaultState == selStateRemoved)
                        setDefaultState(null, settings); //We have to remove the defalult state on the server
                    var noStateOpt = $('<option />').attr({ 'value': '', 'text': '', selected: true });
                    dom.stateSelect.append(noStateOpt);
                    dom.stateSelect.data('noStateOption', noStateOpt);
                }
                dom.deleteButton.prop('disabled', false);
            },
            function (jqXhr, textStatus, errorThrown) {
                dom.deleteButton.prop('disabled', false);
                throw errorThrown;
            });
    };

    var dom = {
        container: null,

        settingsContainer: null,

        background: null,

        settingButton: null,

        setDefaultButton: null,

        stateSelect: null,

        deleteButton: null,

        saveButton: null

    };

    /*
    *  settings: {
    *       saveUrl: string,
    *       name: string,
    *       defaultState: string,
    *       states: dictionary
    *  }
    *
    *  states: {
    *       key: string,
    *       value: state,
    *  }
    *
    *  state: {
    *       "created":      int
    *       "displayStart":       int
    *       "pageLength":      int
    *       "order":    2d array
    *       "filter":      object
    *       "searchCols": array of object
    *       "visCols":    array of bool
    *
    */
    $.fn.DataTable.Api.prototype.remoteState = function (settings) {
        var api = this;
        var dtSettings = this.context[0];
        var $table = $(dtSettings.nTable);
        settings = $.extend(true, {}, defaultSettings, settings);
        dtSettings.remoteState = settings;
        var loc = settings.language;

        if (settings.getStatesFromServer == true) { //We have to get them from the remote source
            getRemoteStates(settings, api);
        }

        settings.states = settings.states || {};

        //Set default state
        setDefaultStateData(dtSettings, settings);

        //If current state is not set and default value is set then we need to load the default state
        if (settings.currentState == null && !!settings.defaultState && settings.defaultTableState != settings.defaultState) {
            var stateData = getState(settings, settings.defaultState);
            $table.css('visibility', 'hidden');
            api.on('init.dt', function() {
                loadState(dtSettings, stateData, true);
                settings.currentState = settings.defaultState;
                dom.stateSelect.val(settings.currentState);
                $table.css('visibility', 'visible');
            });
            //loadState(dtSettings, stateData, false);
            //settings.currentState = settings.defaultState;
        }

        //Change and set default
        dom.stateSelect = createSelectStates(settings);
        dom.setDefaultButton = 
            $('<button />')
            .addClass(settings.dom.setDefaultButton.class)
            .addClass('state-setdefault')
            .prop('disabled', true)
            .attr('title', loc.setDefault)
            .append($('<span/>').addClass(settings.dom.setDefaultButton.icon));
        dom.settingButton =
            $('<button />')
            .addClass(settings.dom.settingButton.class)
            .addClass('state-settings')
            .attr('title', loc.settings).append($('<span/>').addClass(settings.dom.settingButton.icon));
        dom.container =
            $('<div />')
            .addClass('state-main-control');
        if (!!loc.state)
            dom.container.append($('<label />').html(loc.state));
        dom.container.append(dom.stateSelect, dom.setDefaultButton, dom.settingButton);

        //Event handlers
        dom.stateSelect.on('change', function () {
            var name = $(this).val();
            var noStateOpt = dom.stateSelect.data('noStateOption');
            if (noStateOpt != null) {
                dom.stateSelect.data('noStateOption', null);
                noStateOpt.remove();
            }
            var data = getState(settings, name);
            dom.setDefaultButton.prop('disabled', settings.defaultState == name);
            loadState(dtSettings, data, true);
            settings.currentState = name;
        });

        //SetDefault
        dom.container.on('click', '.state-setdefault:not(.disabled)', function () {
            setDefaultState(dom.stateSelect.val(), settings);
        });
    
        //#region Settings

        //#region Delete
        var stateDeleteSelect = createSelectStates(settings, true);
        dom.deleteButton = $('<button />')
            .addClass(settings.dom.deleteButton.class)
            .addClass('state-delete')
            .attr('title', loc.delete)
            .append($('<span/>').addClass(settings.dom.deleteButton.icon));
        var deleteContainer =
            $('<form />')
            .addClass(settings.dom.deleteForm.class)
            .addClass('state-delete-control')
            .append(
                $('<div />')
                .addClass(settings.dom.deleteForm.groupClass)
                .append(
                    $('<label />')
                    .addClass(settings.dom.deleteForm.labelClass)
                    .html(loc.delete)
                )
                .append(
                    $('<div />')
                    .addClass(settings.dom.deleteForm.selectDivClass)
                    .append(stateDeleteSelect.css({'display': 'inline-block'}))
                    .append(dom.deleteButton)
                )
            );
        //Event handlers
        deleteContainer.on('click', '.state-delete:not(.disabled)', function () {
            deleteState(stateDeleteSelect.val(), settings);
        });
        //#endregion

        //#region Save
        var stateSaveSelect = createSelectStates(settings, true)
            .css({ 'display': 'inline-block' });
        var stateSaveInput = $('<input />')
            .attr('type', 'text')
            .addClass(settings.dom.saveForm.inputClass)
            .keyup(function() {
                if ($(this).val().length < settings.minStateLength)
                    dom.saveButton.prop('disabled', true);
                else
                    dom.saveButton.prop('disabled', false);
            })
            .css({ 'width': settings.dom.inputWidth })
            .hide();
        var stateSaveCheckbox = $('<input />')
            .attr('type', 'checkbox');
        dom.saveButton = $('<button />')
            .addClass(settings.dom.saveButton.class)
            .addClass('state-save')
            .attr('title', loc.save)
            .append($('<span/>').addClass(settings.dom.saveButton.icon));
        var saveContainer =
            $('<form />')
            .addClass(settings.dom.saveForm.class)
            .addClass('state-save-control')
            .append(
                $('<div />')
                .addClass('checkbox')
                .append(
                    $('<label />')
                    .append(stateSaveCheckbox, loc.createNew)
                )
            )
            .append(
                $('<div />')
                .addClass(settings.dom.saveForm.groupClass)
                .append(
                    $('<label />')
                    .addClass(settings.dom.saveForm.labelClass)
                    .html('State')
                )
                .append(
                    $('<div />')
                    .addClass(settings.dom.saveForm.selectDivClass)
                    .append(stateSaveInput, stateSaveSelect, dom.saveButton)
                )
            );
        //Event handlers
        saveContainer.on('change', 'input[type="checkbox"]', function() {
            if ($(this).is(':checked')) {
                stateSaveSelect.hide();
                stateSaveInput.css({ 'display': 'inline-block' }).keyup();
            } else {
                stateSaveSelect.css({ 'display': 'inline-block' });
                stateSaveInput.hide();
                if (stateSaveSelect.children().length > 0)
                    dom.saveButton.prop('disabled', false);
                else
                    dom.saveButton.prop('disabled', true);
            }
        });
        saveContainer.on('click', '.state-save:not(.disabled)', function () {
            dom.saveButton.prop('disabled', true);
            var name = stateSaveCheckbox.is(':checked') ? stateSaveInput.val() : stateDeleteSelect.val();
            saveState(dtSettings, settings.storeId, name, settings.ajax.save,
                function (data) {
                    settings.states[name] = data;
                    $.each(stateSelects, function () {
                        var select = $(this);
                        $('option:selected', select).prop('selected', false);
                        select.append($("<option />", { 'value': name, 'text': name, selected: true }));
                    });
                    dom.setDefaultButton.prop('disabled', false);
                    dom.saveButton.prop('disabled', false);
                },
                function (jqXhr, textStatus, errorThrown) {
                    dom.saveButton.prop('disabled', false);
                    throw errorThrown;
                });
        });

        //#endregion

        dom.container.on('click', '.state-settings', function () {
            if (dom.background == null) {
                dom.background =
                    $('<div />')
                    .addClass('remote-state-background')
                    .click(function (e) {
                        dom.background.detach();
                        dom.settingsContainer.detach();
                        dom.background = dom.settingsContainer = null;
                    });
            }
            dom.background.appendTo(document.body);

            if (dom.settingsContainer == null) {
                dom.settingsContainer =
                    $('<div />')
                    .addClass('remote-state-container')
                    .css({
                        'opacity': 0,
                        'position': 'absolute',
                    })
                    .append(deleteContainer, saveContainer);
            }
            dom.settingsContainer.appendTo(document.body);

            if ($.isFunction(settings.settingsDisplayAction))
                settings.settingsDisplayAction(dom.settingsContainer);
            else {
                var pos = $(dom.settingButton).offset();
                var divX = parseInt(pos.left, 10);
                var divY = parseInt(pos.top + $(dom.settingButton).outerHeight(), 10);
                dom.settingsContainer.css({ top: divY + 'px', left: divX + 'px' });
                dom.settingsContainer.animate({ "opacity": 1 }, 500);
            }   
        });

        //#endregion

        if (!!settings.sendCurrentStateToServer) {
            api.on('serverParams.dt', function(e, data) {
                data[settings.sendCurrentStateToServer] = settings.currentState;
            });
        }
    
        return dom.container.get(0);
    };

}(window, document));