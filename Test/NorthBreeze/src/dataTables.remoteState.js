var dt;
(function (dt) {
    var RemoteState = (function () {
        function RemoteState(api, settings) {
            this.dt = {
                settings: null,
                api: null
            };
            this.initialized = false;
            this.dom = {
                stateSelects: [],
                container: null,
                settingsContainer: null,
                background: null,
                settingButton: null,
                setDefaultButton: null,
                stateSelect: null,
                removeButton: null,
                saveButton: null
            };
            var states = settings.states || {};
            delete settings.states; //do not deep clone states
            this.settings = $.extend(true, {}, RemoteState.defaultSettings, settings);
            this.settings.states = states;
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.remoteState = this;
            this.registerCallbacks();
            this.createDomElements();
            this.hideTableWrapper();
        }
        RemoteState.prototype.addState = function (name, data, mainOnly, selected) {
            if (typeof mainOnly === "undefined") { mainOnly = false; }
            if (typeof selected === "undefined") { selected = true; }
            if (name.lastIndexOf('$', 0) == 0)
                return;
            var stateExist = this.settings.states.hasOwnProperty(name);
            this.settings.states[name] = data;
            if (!stateExist) {
                if (mainOnly) {
                    if (selected)
                        $('option:selected', this.dom.stateSelect).prop('selected', false);
                    this.dom.stateSelect.append($("<option />", { 'value': name, 'text': name, selected: selected }));
                } else {
                    $.each(this.dom.stateSelects, function (i, sel) {
                        var select = $(sel);
                        if (selected)
                            $('option:selected', select).prop('selected', false);
                        select.append($("<option />", { 'value': name, 'text': name, selected: selected }));
                    });
                }

                this.dom.setDefaultButton.prop('disabled', false);
                this.dom.saveButton.prop('disabled', false);
            }
        };

        RemoteState.prototype.createDomElements = function () {
            var _this = this;
            //Change and set default
            this.dom.stateSelect = this.createSelectStates();
            this.dom.setDefaultButton = $('<button />').addClass(this.settings.dom.setDefaultButton.className).addClass('state-setdefault').prop('disabled', true).attr('title', this.getTranslation('setDefault')).append($('<span/>').addClass(this.settings.dom.setDefaultButton.icon));
            this.dom.settingButton = $('<button />').addClass(this.settings.dom.settingButton.className).addClass('state-settings').attr('title', this.getTranslation('settings')).append($('<span/>').addClass(this.settings.dom.settingButton.icon));
            this.dom.container = $('<div />').addClass('state-main-control');
            if (!!this.settings.language.state)
                this.dom.container.append($('<label />').html(this.getTranslation('state')));
            this.dom.container.append(this.dom.stateSelect, this.dom.setDefaultButton, this.dom.settingButton);

            //Event handlers
            this.dom.stateSelect.on('change', function (e) {
                var name = $(e.target).val();
                var noStateOpt = _this.dom.stateSelect.data('noStateOption');
                if (noStateOpt != null) {
                    _this.dom.stateSelect.data('noStateOption', null);
                    noStateOpt.remove();
                }
                var data = _this.getState(name);
                _this.dom.setDefaultButton.prop('disabled', _this.settings.defaultState == name);
                _this.loadState(data, true);
                _this.settings.currentState = name;
            });

            //SetDefault
            this.dom.container.on('click', '.state-setdefault:not(.disabled)', function () {
                _this.setDefaultState(_this.dom.stateSelect.val());
            });

            //#region Settings
            //#region Remove
            var stateRemoveSelect = this.createSelectStates(true);
            this.dom.removeButton = $('<button />').addClass(this.settings.dom.removeButton.className).addClass('state-remove').attr('title', this.getTranslation('remove')).append($('<span/>').addClass(this.settings.dom.removeButton.icon));
            var removeContainer = $('<form />').addClass(this.settings.dom.removeForm.className).addClass('state-remove-control').append($('<div />').addClass(this.settings.dom.removeForm.groupClass).append($('<label />').addClass(this.settings.dom.removeForm.labelClass).html(this.getTranslation('remove'))).append($('<div />').addClass(this.settings.dom.removeForm.selectDivClass).append(stateRemoveSelect.css({ 'display': 'inline-block' })).append(this.dom.removeButton)));

            //Event handlers
            removeContainer.on('click', '.state-remove:not(.disabled)', function () {
                _this.removeState(stateRemoveSelect.val());
            });

            //#endregion
            //#region Save
            var stateSaveSelect = this.createSelectStates(true).css({ 'display': 'inline-block' });
            var stateSaveInput = $('<input />').attr('type', 'text').addClass(this.settings.dom.saveForm.inputClass).keyup(function (e) {
                if ($(e.target).val().length < _this.settings.minStateLength)
                    _this.dom.saveButton.prop('disabled', true);
                else
                    _this.dom.saveButton.prop('disabled', false);
            }).css({ 'width': this.settings.dom.inputWidth }).hide();
            var stateSaveCheckbox = $('<input />').attr('type', 'checkbox');
            this.dom.saveButton = $('<button />').addClass(this.settings.dom.saveButton.className).addClass('state-save').attr('title', this.getTranslation('save')).append($('<span/>').addClass(this.settings.dom.saveButton.icon));
            var saveContainer = $('<form />').addClass(this.settings.dom.saveForm.className).addClass('state-save-control').append($('<div />').addClass('checkbox').append($('<label />').append(stateSaveCheckbox, this.getTranslation('createNew')))).append($('<div />').addClass(this.settings.dom.saveForm.groupClass).append($('<label />').addClass(this.settings.dom.saveForm.labelClass).html('State')).append($('<div />').addClass(this.settings.dom.saveForm.selectDivClass).append(stateSaveInput, stateSaveSelect, this.dom.saveButton)));

            //Event handlers
            saveContainer.on('change', 'input[type="checkbox"]', function (e) {
                if ($(e.target).is(':checked')) {
                    stateSaveSelect.hide();
                    stateSaveInput.css({ 'display': 'inline-block' }).keyup();
                } else {
                    stateSaveSelect.css({ 'display': 'inline-block' });
                    stateSaveInput.hide();
                    if (stateSaveSelect.children().length > 0)
                        _this.dom.saveButton.prop('disabled', false);
                    else
                        _this.dom.saveButton.prop('disabled', true);
                }
            });
            saveContainer.on('click', '.state-save:not(.disabled)', function () {
                _this.dom.saveButton.prop('disabled', true);
                var name = stateSaveCheckbox.is(':checked') ? stateSaveInput.val() : stateRemoveSelect.val();
                console.log('Step1');
                _this.saveState(_this.settings.storeId, name, _this.settings.ajax.save, function (data) {
                    console.log('Step2');
                    _this.addState(name, data);
                }, function (jqXhr, textStatus, errorThrown) {
                    _this.dom.saveButton.prop('disabled', false);
                    throw errorThrown;
                });
            });

            //#endregion
            this.dom.container.on('click', '.state-settings', function () {
                if (_this.dom.background == null) {
                    _this.dom.background = $('<div />').addClass('remote-state-background').click(function (e) {
                        _this.dom.background.detach();
                        _this.dom.settingsContainer.detach();
                        _this.dom.background = _this.dom.settingsContainer = null;
                    });
                }
                _this.dom.background.appendTo(document.body);

                if (_this.dom.settingsContainer == null) {
                    _this.dom.settingsContainer = $('<div />').addClass('remote-state-container').css({
                        'opacity': 0,
                        'position': 'absolute'
                    }).append(removeContainer, saveContainer);
                }
                _this.dom.settingsContainer.appendTo(document.body);

                if ($.isFunction(_this.settings.settingsDisplayAction))
                    _this.settings.settingsDisplayAction(_this.dom.settingsContainer);
                else {
                    var pos = _this.dom.settingButton.offset();
                    var divX = parseInt(pos.left, 10);
                    var divY = parseInt(pos.top + _this.dom.settingButton.outerHeight(), 10);
                    _this.dom.settingsContainer.css({ top: divY + 'px', left: divX + 'px' });
                    _this.dom.settingsContainer.animate({ "opacity": 1 }, 500);
                }
            });
            //#endregion
        };

        RemoteState.prototype.initialize = function () {
            if (this.settings.getStatesFromServer == true) {
                this.getRemoteStates(); //TODO: async
            }
            this.settings.states = this.settings.states || {};

            //Set default state
            this.setDefaultStateData();

            //If current state is not set and default value is set then we need to load the default state
            if (this.settings.currentState == null && !!this.settings.defaultState && this.settings.defaultTableState != this.settings.defaultState) {
                var stateData = this.getState(this.settings.defaultState);
                this.loadState(stateData, true);
                this.settings.currentState = this.settings.defaultState;
                this.dom.stateSelect.val(this.settings.currentState);
            }
            this.initialized = true;
            this.showTableWrapper();
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'remoteStateInitCompleted', 'remoteStateInitCompleted', [this]);
        };

        RemoteState.prototype.hideTableWrapper = function () {
            $(this.dt.settings.nTableWrapper).css('visibility', 'hidden');
        };

        RemoteState.prototype.showTableWrapper = function () {
            $(this.dt.settings.nTableWrapper).css('visibility', 'visible');
        };

        RemoteState.prototype.registerCallbacks = function () {
            if (this.settings.sendCurrentStateToServer) {
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoServerParams', this.setServerParams.bind(this), "RemoteState_ServerParam");
            }
        };

        RemoteState.prototype.setServerParams = function (data) {
            data[this.settings.sendCurrentStateToServer] = this.settings.currentState;
        };

        RemoteState.prototype.getTranslation = function (key, prefix) {
            if (typeof prefix === "undefined") { prefix = null; }
            var lang = this.settings.language;
            if (prefix)
                lang = lang[prefix] || {};
            return lang[key] || key;
        };

        RemoteState.prototype.createRequest = function (settings, data, doneAction, failAction) {
            var ajaxSettings = {
                data: JSON.stringify(data),
                url: settings.url,
                type: settings.type,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            };

            if ($.isFunction(settings.beforeSendAction))
                settings.beforeSendAction(ajaxSettings);

            $.ajax(ajaxSettings).done(function (msg, textStatus, jqXhr) {
                if ($.isFunction(settings.doneAction))
                    settings.doneAction(settings, msg, textStatus, jqXhr);
                else {
                    if ($.isFunction(doneAction))
                        doneAction(msg, textStatus, jqXhr);
                }
            }).fail(function (jqXhr, textStatus, errorThrown) {
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

        RemoteState.prototype.createSelectStates = function (excludeDefault) {
            var _this = this;
            if (typeof excludeDefault === "undefined") { excludeDefault = false; }
            var curState = this.settings.currentState;
            var stateOptions = [];
            $.each(this.settings.states, function (key) {
                if (key.lastIndexOf('$', 0) == 0)
                    return;
                if (excludeDefault && _this.settings.defaultTableState == key)
                    return;
                stateOptions.push($('<option/>', {
                    'value': key,
                    'text': _this.settings.defaultTableState == key ? _this.getTranslation('default') : key,
                    selected: key == (!curState ? _this.settings.defaultTableState : curState)
                }));
            });
            var select = $('<select />', {}).addClass(this.settings.dom.stateSelectClass).css('width', this.settings.dom.inputWidth).append(stateOptions);
            this.dom.stateSelects.push(select);
            return select;
        };

        RemoteState.prototype.getState = function (name) {
            var state = this.settings.states[name];
            if (state == null)
                throw 'state with name "' + name + '" is not present';
            return state;
        };

        RemoteState.prototype.generateStateData = function (settings) {
            var i, iLen;
            var api = this.dt.api;
            var columns = settings.aoColumns;

            //var oSettings = this.dt.settings;
            var searchToCamel = function (obj) {
                return {
                    search: obj.sSearch,
                    smart: obj.bSmart,
                    regex: obj.bRegex,
                    caseInsensitive: obj.bCaseInsensitive
                };
            };

            var state = {
                time: +new Date(),
                start: settings._iDisplayStart,
                length: settings._iDisplayLength,
                order: $.extend(true, [], settings.aaSorting),
                search: searchToCamel(settings.oPreviousSearch),
                columns: $.map(columns, function (col, j) {
                    return {
                        visible: col.bVisible,
                        search: searchToCamel(settings.aoPreSearchCols[j]),
                        data: col.mData,
                        name: col.sName,
                        searchable: col.bSearchable,
                        orderable: col.bSortable
                    };
                }),
                ColReorder: []
            };

            if (api.colReorder != null) {
                for (i = 0; i < state.order.length; i++) {
                    state.order[i][0] = columns[state.order[i][0]]._ColReorder_iOrigCol;
                }

                var stateColumnsCopy = $.extend(true, [], state.columns);

                for (i = 0, iLen = columns.length; i < iLen; i++) {
                    var origIdx = columns[i]._ColReorder_iOrigCol;

                    /* Columns */
                    state.columns[origIdx] = stateColumnsCopy[i];

                    /* Column reordering */
                    state.ColReorder.push(origIdx);
                }
            }

            return state;
        };

        RemoteState.prototype.saveState = function (storeId, name, requestSettings, doneAction, failAction) {
            /* Store the interesting variables */
            var oSettings = this.dt.settings;
            var data = this.generateStateData(oSettings);

            oSettings.oApi._fnCallbackFire(oSettings, 'remoteStateSaveParams', 'remoteStateSaveParams', [oSettings, data]);

            var requestData = {
                'storeId': storeId,
                'stateName': name,
                'data': data,
                'action': 'save'
            };

            this.createRequest(requestSettings, requestData, function () {
                if ($.isFunction(doneAction))
                    doneAction(data);
            }, failAction);
        };

        RemoteState.prototype.setDefaultStateData = function () {
            var oSettings = this.dt.settings;
            var toClone = {
                aoColumns: oSettings.aoColumns,
                _iDisplayStart: oSettings._iDisplayStart,
                iInitDisplayStart: oSettings.iInitDisplayStart,
                _iDisplayLength: oSettings._iDisplayLength,
                aaSorting: oSettings.aaSorting,
                oPreviousSearch: oSettings.oPreviousSearch,
                aoPreSearchCols: oSettings.aoPreSearchCols,
                aaSortingFixed: oSettings.aaSortingFixed
            };
            var initialSettings = $.extend(true, {}, toClone);
            this.addState(this.settings.defaultTableState, this.generateStateData(initialSettings), true);
        };

        RemoteState.prototype.loadState = function (state, dtInitialized) {
            var settings = this.dt.settings;
            var i, ien, col;
            var columns = settings.aoColumns;
            var api = settings.oInstance.api();

            var searchToHung = function (obj) {
                return {
                    sSearch: obj.search,
                    bSmart: obj.smart,
                    bRegex: obj.regex,
                    bCaseInsensitive: obj.caseInsensitive
                };
            };

            settings.oApi._fnCallbackFire(settings, 'remoteStateLoadingParams', 'remoteStateLoadingParams', [settings, state, dtInitialized]);

            // Number of columns have changed - reset filters
            if (columns.length !== state.columns.length) {
                throw 'The number of the columns in the state do not match with the number in the current table (current table: ' + columns.length + ', state: ' + state.columns.length;
            }

            settings._iDisplayStart = state.start;
            settings.iInitDisplayStart = state.start;
            settings._iDisplayLength = state.length;
            settings.aaSorting = [];

            /*ColReorder*/
            if ($.isArray(state.ColReorder) && state.ColReorder.length == columns.length) {
                if (dtInitialized) {
                    api.colReorder.reset(); //We have to reset columns positions so that ordering will work as it should
                }
            }

            for (i = 0, ien = state.columns.length; i < ien; i++) {
                col = state.columns[i];

                // Visibility
                if (dtInitialized)
                    api.column(i).visible(col.visible);
                else
                    columns[i].bVisible = col.visible;

                // Search
                $.extend(settings.aoPreSearchCols[i], searchToHung(col.search));
            }

            for (i = 0; i < state.order.length; i++) {
                col = state.order[i];
                settings.aaSorting.push(col[0] >= columns.length ? [0, col[1]] : col);
            }

            // Search
            $.extend(settings.oPreviousSearch, searchToHung(state.search));

            /*ColReorder*/
            if ($.isArray(state.ColReorder) && state.ColReorder.length == columns.length) {
                if (dtInitialized) {
                    api.colReorder.order(state.ColReorder);
                } else {
                    settings.oInit.colReorder = settings.oInit.colReorder || {};
                    settings.oInit.oColReorder = settings.oInit.oColReorder || {};
                    settings.oInit.oColReorder.aiOrder = settings.oInit.colReorder.order = state.ColReorder;
                }
            }

            //Find the search input and set the value
            if (dtInitialized) {
                var filterClass = settings.oClasses.sFilterInput;
                var filterInput = $('input[type="search"]', settings.nTableWrapper);
                if (filterClass != "") {
                    var clses = filterClass.split(' ');
                    filterInput = filterInput.filter(function (e, input) {
                        var result = true;
                        for (i = 0; i < clses.length; i++) {
                            result = $(input).hasClass(clses[i]);
                            if (!result)
                                break;
                        }
                        return result;
                    });
                }
                filterInput.val(state.search.search.replace('"', '&quot;'));
            }

            settings.oApi._fnCallbackFire(settings, 'remoteStateLoadedParams', 'remoteStateLoadedParams', [settings, state, dtInitialized]);

            if (dtInitialized) {
                api.draw(false);
            }
        };

        RemoteState.prototype.getRemoteStates = function () {
            var _this = this;
            var getAllSettings = this.settings.ajax.getAll;
            var api = this.dt.api;
            if (getAllSettings.url == null)
                throw 'ajax.getAll.url must be defined.';

            if ($.isFunction(getAllSettings.beforeSendAction))
                getAllSettings.beforeSendAction(api);

            try  {
                var result = $.parseJSON($.ajax({
                    data: JSON.stringify({
                        storeId: this.settings.storeId,
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

                if (result.states) {
                    $.each(result.states, function (key, val) {
                        _this.addState(key, val);
                    });
                }
                this.settings.defaultState = result.defaultState;
            } catch (err) {
                if ($.isFunction(getAllSettings.doneAction))
                    getAllSettings.failAction(err, api);
                throw err;
            }

            if ($.isFunction(getAllSettings.doneAction))
                getAllSettings.doneAction(this.settings.states, api);
        };

        RemoteState.prototype.setDefaultState = function (name) {
            var _this = this;
            this.dom.setDefaultButton.prop('disabled', true);
            var requestData = {
                'storeId': this.settings.storeId,
                'stateName': name,
                'action': 'setDefault',
                'data': null
            };
            this.createRequest(this.settings.ajax.setDefault, requestData, function () {
                _this.settings.defaultState = name;
            }, function (jqXhr, textStatus, errorThrown) {
                _this.dom.setDefaultButton.prop('disabled', false);
                throw errorThrown;
            });
        };

        RemoteState.prototype.removeState = function (name) {
            var _this = this;
            this.dom.removeButton.prop('disabled', true);
            var requestData = {
                'storeId': this.settings.storeId,
                'stateName': name,
                'action': 'remove',
                'data': null
            };
            this.createRequest(this.settings.ajax.remove, requestData, function () {
                delete _this.settings.states[name];
                var selStateRemoved = null;
                $.each(_this.dom.stateSelects, function (i, select) {
                    var option = $('option[value="' + name + '"]', select);
                    if (_this.dom.stateSelect.get(0) == select.get(0) && option.prop('selected') == true) {
                        selStateRemoved = name;
                    }
                    option.remove();
                });
                if (selStateRemoved != null) {
                    if (_this.settings.defaultState == selStateRemoved)
                        _this.setDefaultState(null); //We have to remove the defalult state on the server
                    var noStateOpt = $('<option />').attr({ 'value': '', 'text': '', selected: true });
                    _this.dom.stateSelect.append(noStateOpt);
                    _this.dom.stateSelect.data('noStateOption', noStateOpt);
                }
                _this.dom.removeButton.prop('disabled', false);
            }, function (jqXhr, textStatus, errorThrown) {
                _this.dom.removeButton.prop('disabled', false);
                throw errorThrown;
            });
        };
        RemoteState.defaultSettings = {
            storeId: null,
            defaultState: '',
            currentState: null,
            minStateLength: 2,
            defaultTableState: 'Default',
            states: null,
            getStatesFromServer: false,
            sendCurrentStateToServer: null,
            dom: {
                inputWidth: '200px',
                stateSelectClass: 'form-control',
                setDefaultButton: {
                    className: 'btn btn-default btn-sm',
                    icon: 'glyphicon glyphicon-star-empty'
                },
                settingButton: {
                    className: 'btn btn-default btn-sm',
                    icon: 'glyphicon glyphicon-list-alt'
                },
                removeButton: {
                    className: 'btn btn-default btn-sm',
                    icon: 'glyphicon glyphicon-remove'
                },
                saveButton: {
                    className: 'btn btn-default btn-sm',
                    icon: 'glyphicon glyphicon-floppy-disk'
                },
                removeForm: {
                    className: 'form-horizontal',
                    groupClass: 'form-group',
                    labelClass: 'col-sm-2 control-label',
                    selectDivClass: 'col-sm-10'
                },
                saveForm: {
                    className: 'form-horizontal',
                    inputClass: 'form-control',
                    groupClass: 'form-group',
                    labelClass: 'col-sm-2 control-label',
                    selectDivClass: 'col-sm-10'
                }
            },
            language: {
                'settings': 'Settings',
                'default': 'Default',
                'load': 'Load',
                'save': 'Save',
                'add': 'Add',
                'remove': 'Remove',
                'setDefault': 'Set default',
                'createNew': 'Create new',
                'state': 'State'
            },
            settingsDisplayAction: null,
            ajax: {
                getAll: {
                    url: null,
                    type: 'POST',
                    beforeSendAction: null,
                    doneAction: null,
                    failAction: null
                },
                save: {
                    url: null,
                    type: 'POST',
                    beforeSendAction: null,
                    doneAction: null,
                    failAction: null
                },
                remove: {
                    url: null,
                    type: 'POST',
                    beforeSendAction: null,
                    doneAction: null,
                    failAction: null
                },
                setDefault: {
                    url: null,
                    type: 'POST',
                    beforeSendAction: null,
                    doneAction: null,
                    failAction: null
                }
            }
        };
        return RemoteState;
    })();
    dt.RemoteState = RemoteState;
})(dt || (dt = {}));
(function (window, document, undefined) {
    //Register events
    $.fn.DataTable.models.oSettings.remoteStateInitCompleted = [];
    $.fn.DataTable.models.oSettings.remoteStateSaveParams = [];
    $.fn.DataTable.models.oSettings.remoteStateLoadedParams = [];
    $.fn.DataTable.models.oSettings.remoteStateLoadingParams = [];

    $.fn.DataTable.Api.register('remoteState.init()', function (settings) {
        var remoteState = new dt.RemoteState(this, settings);
        if (this.settings()[0]._bInitComplete)
            remoteState.initialize();
        else
            this.one('init.dt', function () {
                remoteState.initialize();
            });
        return remoteState.dom.container.get(0);
    });

    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().remoteState.init(oSettings.oInit.remoteState);
        },
        "cFeature": "B",
        "sFeature": "Remote state"
    });
}(window, document, undefined));
//# sourceMappingURL=dataTables.remoteState.js.map
