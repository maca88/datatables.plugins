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
        states: null,
        getStatesFromServer: false,
        language: {
            'settings': 'Settings',
            'load': 'Load',
            'save': 'Save',
            'add': 'Add',
            'delete': 'Delete',
            'setDefault': 'Set default',
            'createNew': 'Create new'
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

    var createSelectStates = function (settings) {
        var curState = settings.currentState;
        var stateOptions = [];
        stateOptions.push($('<option/>', { 'value': '', 'text': 'None' }));
        $.each(settings.states, function (key) {
            if (key.lastIndexOf('$', 0) == 0) return; //skip all values that startswith $ (i.e. $type, $id)
            stateOptions.push($('<option/>', { 'value': key, 'text': key, selected: curState == key }));
        });
        var select = $('<select />', {}).append(stateOptions);
        stateSelects.push(select);
        return select;
    };

    var getState = function(settings, name) {
        var state = settings.states[name];
        if (state == null)
            throw 'state with name "' + name + '" is not present';
        return state;
    };

    var saveState = function (oSettings, storeId, name, requestSettings, doneAction, failAction) {
        /* Store the interesting variables */
        var i, iLen;
        var api = oSettings.oInstance.api();
        var $table = $(oSettings.nTable);
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
                data.order[i][0] = oSettings.aoColumns[data.order[i][0]]._ColReorder_iOrigCol;
            }

            var aSearchCopy = $.extend(true, [], data.searchCols);
            data.colReorder = [];

            for (i = 0, iLen = oSettings.aoColumns.length ; i < iLen ; i++) {
                var iOrigColumn = oSettings.aoColumns[i]._ColReorder_iOrigCol;

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

        $table.trigger(event + 'remoteStateSaveParams.dt', oSettings, data);

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

    var loadState = function (oSettings, data, dtInitialized) {
        var i, ien;
        var columns = oSettings.aoColumns;
        var api = oSettings.oInstance.api();
        var $table = $(oSettings.nTable);
        $table.trigger(event + 'remoteStateLoadParams.dt', oSettings, data, dtInitialized);

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
                api.colReorder.reset();
                api.colReorder.order(data.colReorder);
            } else { //This feature must be defined before R (ColReoder) in order to work properly
                oSettings.oInit.colReorder =
                    oSettings.oInit.oColReorder = data.colReorder;
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

        /* Column visibility state */
        for (i = 0, ien = data.visCols.length ; i < ien ; i++) {
            if (dtInitialized)
                api.column(i).visible(data.visCols[i]);
            else
                columns[i].bVisible = data.visCols[i];
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
        settings = $.extend({}, defaultSettings, settings);
        var loc = settings.language;

        if (settings.getStatesFromServer == true) { //We have to get them from the remote source
            getRemoteStates(settings, api);
        }

        settings.states = settings.states || {};

        //Change and set default
        var changeSelect = createSelectStates(settings);
        var btnSetDefault = $('<button />', { 'class': 'btn btn-default btn-sm state-setdefault', 'title': loc.setDefault }).append(
            $('<span/>', { 'class': 'glyphicon glyphicon-print' })
        );
        var btnSettings = $('<button />', { 'class': 'btn btn-default btn-sm state-settings', 'title': loc.settings }).append(
            $('<span/>', { 'class': 'glyphicon glyphicon-print' })
        );
        var changeContainer = $('<div />', { 'class': 'state-main-control' }).append(changeSelect, btnSetDefault, btnSettings);
        //Event handlers
        changeSelect.on('change', function () {
            var name = $(this).val();
            var data = getState(settings, name);
            btnSetDefault.prop('disabled', settings.defaultState == name);
            loadState(dtSettings, data, true);
        });
        changeContainer.on('click', '.state-setdefault:not(.disabled)', function () {
            btnSetDefault.prop('disabled', true);
            var name = changeSelect.val();
            var requestData = {
                'storeId': settings.storeId,
                'stateName': name,
                'action': 'setDefault',
                'data': null
            };
            createRequest($.extend({}, defaultSettings.ajax.setDefault, settings.ajax.setDefault),
                requestData,
                function () {
                    settings.defaultState = name;
                },
                function (jqXhr, textStatus, errorThrown) {
                    btnSetDefault.prop('disabled', false);
                    throw errorThrown;
                });
        });
    
        //Delete
        var stateDeleteSelect = createSelectStates(settings);
        var btnDelete = $('<button />', { 'class': 'btn btn-default btn-sm state-delete', 'title': loc.delete }).append(
            $('<span/>', { 'class': 'glyphicon glyphicon-print' })
        );
        var deleteContainer = $('<div />', { 'class': 'state-delete-control' }).append(stateDeleteSelect, btnDelete);
        //Event handlers
        deleteContainer.on('click', '.state-delete:not(.disabled)', function () {
            btnDelete.prop('disabled', true);
            var name = stateDeleteSelect.val();
            var requestData = {
                'storeId': settings.storeId,
                'stateName': name,
                'action': 'delete',
                'data': null
            };
            createRequest($.extend({}, defaultSettings.ajax.delete, settings.ajax.delete),
                requestData,
                function () {
                    delete settings.states[name];
                    $.each(stateSelects, function () {
                        $(this).find('option[value="' + name + '"]').remove();
                    });
                    btnDelete.prop('disabled', false);
                },
                function (jqXhr, textStatus, errorThrown) {
                    btnDelete.prop('disabled', false);
                    throw errorThrown;
                });
        });
    
        //Save
        var stateSaveSelect = createSelectStates(settings);
        var stateSaveInput = $('<input />', { 'type': 'text', 'style': 'display:none' });
        var stateSaveCheckbox = $('<input />', { 'type': 'checkbox' }).after(loc.createNew);
        var btnSave = $('<button />', { 'class': 'btn btn-default btn-sm state-save', 'title': loc.save }).append(
            $('<span/>', { 'class': 'glyphicon glyphicon-print' })
        );
        var saveContainer = $('<div />', { 'class': 'state-save-control' }).append(stateSaveCheckbox, stateSaveInput, stateSaveSelect, btnSave);
        //Event handlers
        saveContainer.on('change', 'input[type="checkbox"]', function() {
            if ($(this).is(':checked')) {
                stateSaveSelect.hide();
                stateSaveInput.show();
            } else {
                stateSaveSelect.show();
                stateSaveInput.hide();
            }
        });
        saveContainer.on('click', '.state-save:not(.disabled)', function () {
            btnSave.prop('disabled', true);
            var name = stateSaveCheckbox.is(':checked') ? stateSaveInput.val() : stateDeleteSelect.val();
            saveState(dtSettings, settings.storeId, name, $.extend({}, defaultSettings.ajax.save, settings.ajax.save),
                function (data) {
                    settings.states[name] = data;
                    $.each(stateSelects, function () {
                        $(this).append($("<option />", { 'value': name, 'text': name }));
                    });
                    btnSave.prop('disabled', false);
                },
                function (jqXhr, textStatus, errorThrown) {
                    btnSave.prop('disabled', false);
                    throw errorThrown;
                });
        });

        var settingsContainer = $('<div />').append(deleteContainer, saveContainer);
        changeContainer.on('click', '.state-settings', function () {
            if ($.isFunction(settings.settingsDisplayAction))
                settings.settingsDisplayAction(settingsContainer);
            else
                changeContainer.after(settingsContainer);
        });

        api.on('serverParams.dt', function (e, data) {
            data.currentState = settings.defaultState;
        });
    
        return changeContainer.get(0);
    };

}(window, document));