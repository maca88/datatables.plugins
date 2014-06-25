module dt {
    
    export class RemoteState {
        
        public static defaultSettings = {
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
        private settings:any;
        public dt= {
            settings: null,
            api: null
        };
        public initialized: boolean = false;
        public dom = {
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

        constructor(api, settings) {
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

        private addState(name, data, mainOnly = false, selected = true) {
            if (name.lastIndexOf('$', 0) == 0) return;
            var stateExist = this.settings.states.hasOwnProperty(name);
            this.settings.states[name] = data;
            if (!stateExist) {
                if (mainOnly) {
                    if (selected)
                        $('option:selected', this.dom.stateSelect).prop('selected', false);
                    this.dom.stateSelect.append($("<option />", { 'value': name, 'text': name, selected: selected }));
                } else {
                    $.each(this.dom.stateSelects, (i, sel) => {
                        var select = $(sel);
                        if (selected)
                            $('option:selected', select).prop('selected', false);
                        select.append($("<option />", { 'value': name, 'text': name, selected: selected }));
                    }); 
                }

                this.dom.setDefaultButton.prop('disabled', false);
                this.dom.saveButton.prop('disabled', false);
            }
        }

        private createDomElements() {
            //Change and set default
            this.dom.stateSelect = this.createSelectStates();
            this.dom.setDefaultButton = 
                $('<button />')
                .addClass(this.settings.dom.setDefaultButton.className)
                .addClass('state-setdefault')
                .prop('disabled', true)
                .attr('title', this.getTranslation('setDefault'))
                .append($('<span/>').addClass(this.settings.dom.setDefaultButton.icon));
            this.dom.settingButton =
                $('<button />')
                .addClass(this.settings.dom.settingButton.className)
                .addClass('state-settings')
                .attr('title', this.getTranslation('settings')).append($('<span/>').addClass(this.settings.dom.settingButton.icon));
            this.dom.container =
                $('<div />')
                .addClass('state-main-control');
            if (!!this.settings.language.state)
                this.dom.container.append($('<label />').html(this.getTranslation('state')));
            this.dom.container.append(this.dom.stateSelect, this.dom.setDefaultButton, this.dom.settingButton);

            //Event handlers
            this.dom.stateSelect.on('change', (e) => {
                var name = $(e.target).val();
                var noStateOpt = this.dom.stateSelect.data('noStateOption');
                if (noStateOpt != null) {
                    this.dom.stateSelect.data('noStateOption', null);
                    noStateOpt.remove();
                }
                var data = this.getState(name);
                this.dom.setDefaultButton.prop('disabled', this.settings.defaultState == name);
                this.loadState(data, true);
                this.settings.currentState = name;
            });

            //SetDefault
            this.dom.container.on('click', '.state-setdefault:not(.disabled)', () => {
                this.setDefaultState(this.dom.stateSelect.val());
            });
    
            //#region Settings

            //#region Remove
            var stateRemoveSelect = this.createSelectStates(true);
            this.dom.removeButton = $('<button />')
                .addClass(this.settings.dom.removeButton.className)
                .addClass('state-remove')
                .attr('title', this.getTranslation('remove'))
                .append($('<span/>').addClass(this.settings.dom.removeButton.icon));
            var removeContainer =
                $('<form />')
                .addClass(this.settings.dom.removeForm.className)
                .addClass('state-remove-control')
                .append(
                    $('<div />')
                    .addClass(this.settings.dom.removeForm.groupClass)
                    .append(
                        $('<label />')
                        .addClass(this.settings.dom.removeForm.labelClass)
                        .html(this.getTranslation('remove'))
                    )
                    .append(
                        $('<div />')
                        .addClass(this.settings.dom.removeForm.selectDivClass)
                        .append(stateRemoveSelect.css({'display': 'inline-block'}))
                        .append(this.dom.removeButton)
                    )
                );
            //Event handlers
            removeContainer.on('click', '.state-remove:not(.disabled)', () => {
                this.removeState(stateRemoveSelect.val());
            });
            //#endregion

            //#region Save
            var stateSaveSelect = this.createSelectStates(true)
                .css({ 'display': 'inline-block' });
            var stateSaveInput = $('<input />')
                .attr('type', 'text')
                .addClass(this.settings.dom.saveForm.inputClass)
                .keyup((e) => {
                    if ($(e.target).val().length < this.settings.minStateLength)
                        this.dom.saveButton.prop('disabled', true);
                    else
                        this.dom.saveButton.prop('disabled', false);
                })
                .css({ 'width': this.settings.dom.inputWidth })
                .hide();
            var stateSaveCheckbox = $('<input />')
                .attr('type', 'checkbox');
            this.dom.saveButton = $('<button />')
                .addClass(this.settings.dom.saveButton.className)
                .addClass('state-save')
                .attr('title', this.getTranslation('save'))
                .append($('<span/>').addClass(this.settings.dom.saveButton.icon));
            var saveContainer =
                $('<form />')
                .addClass(this.settings.dom.saveForm.className)
                .addClass('state-save-control')
                .append(
                    $('<div />')
                    .addClass('checkbox')
                    .append(
                        $('<label />')
                        .append(stateSaveCheckbox, this.getTranslation('createNew'))
                    )
                )
                .append(
                    $('<div />')
                    .addClass(this.settings.dom.saveForm.groupClass)
                    .append(
                        $('<label />')
                        .addClass(this.settings.dom.saveForm.labelClass)
                        .html('State')
                    )
                    .append(
                        $('<div />')
                        .addClass(this.settings.dom.saveForm.selectDivClass)
                        .append(stateSaveInput, stateSaveSelect, this.dom.saveButton)
                    )
                );
            //Event handlers
            saveContainer.on('change', 'input[type="checkbox"]', (e) => {
                if ($(e.target).is(':checked')) {
                    stateSaveSelect.hide();
                    stateSaveInput.css({ 'display': 'inline-block' }).keyup();
                } else {
                    stateSaveSelect.css({ 'display': 'inline-block' });
                    stateSaveInput.hide();
                    if (stateSaveSelect.children().length > 0)
                        this.dom.saveButton.prop('disabled', false);
                    else
                        this.dom.saveButton.prop('disabled', true);
                }
            });
            saveContainer.on('click', '.state-save:not(.disabled)', () => {
                this.dom.saveButton.prop('disabled', true);
                var name = stateSaveCheckbox.is(':checked') ? stateSaveInput.val() : stateRemoveSelect.val();
                console.log('Step1');
                this.saveState(this.settings.storeId, name, this.settings.ajax.save,
                    (data) => {
                        console.log('Step2');
                        this.addState(name, data);
                    },
                    (jqXhr, textStatus, errorThrown) => {
                        this.dom.saveButton.prop('disabled', false);
                        throw errorThrown;
                    });
            });

            //#endregion

            this.dom.container.on('click', '.state-settings', () => {
                if (this.dom.background == null) {
                    this.dom.background =
                        $('<div />')
                        .addClass('remote-state-background')
                        .click((e) => {
                            this.dom.background.detach();
                            this.dom.settingsContainer.detach();
                            this.dom.background = this.dom.settingsContainer = null;
                        });
                }
                this.dom.background.appendTo(document.body);

                if (this.dom.settingsContainer == null) {
                    this.dom.settingsContainer =
                        $('<div />')
                        .addClass('remote-state-container')
                        .css({
                            'opacity': 0,
                            'position': 'absolute',
                        })
                        .append(removeContainer, saveContainer);
                }
                this.dom.settingsContainer.appendTo(document.body);

                if ($.isFunction(this.settings.settingsDisplayAction))
                    this.settings.settingsDisplayAction(this.dom.settingsContainer);
                else {
                    var pos = this.dom.settingButton.offset();
                    var divX = parseInt(pos.left, 10);
                    var divY = parseInt(pos.top + this.dom.settingButton.outerHeight(), 10);
                    this.dom.settingsContainer.css({ top: divY + 'px', left: divX + 'px' });
                    this.dom.settingsContainer.animate({ "opacity": 1 }, 500);
                }   
            });

            //#endregion
        }

        public initialize() {
            if (this.settings.getStatesFromServer == true) { //We have to get them from the remote source
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
        }

        private hideTableWrapper() {
            $(this.dt.settings.nTableWrapper).css('visibility', 'hidden');
        }

        private showTableWrapper() {
             $(this.dt.settings.nTableWrapper).css('visibility', 'visible');
        }

        private registerCallbacks() {
            if (this.settings.sendCurrentStateToServer) {
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoServerParams', this.setServerParams.bind(this), "RemoteState_ServerParam");
            }
        }

        private setServerParams(data) {
            data[this.settings.sendCurrentStateToServer] = this.settings.currentState;
        }

        private getTranslation(key: string, prefix: string = null): string {
            var lang = this.settings.language;
            if (prefix)
                lang = lang[prefix] || {};
            return lang[key] || key;
        }

        private createRequest(settings, data, doneAction, failAction) {
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
                .done((msg, textStatus, jqXhr) => {
                    if ($.isFunction(settings.doneAction))
                        settings.doneAction(settings, msg, textStatus, jqXhr);
                    else {
                        if ($.isFunction(doneAction))
                            doneAction(msg, textStatus, jqXhr);
                    }
                })
                .fail((jqXhr, textStatus, errorThrown) => {
                    if ($.isFunction(settings.failAction))
                        settings.failAction(jqXhr, textStatus, errorThrown);
                    else {
                        if ($.isFunction(failAction))
                            failAction(jqXhr, textStatus, errorThrown);
                        else
                            throw errorThrown;
                    }
                });
        }

        private createSelectStates(excludeDefault = false) {
            var curState = this.settings.currentState;
            var stateOptions = [];
            $.each(this.settings.states, (key) => {
                if (key.lastIndexOf('$', 0) == 0) return; //skip all values that startswith $ (i.e. $type, $id)
                if (excludeDefault && this.settings.defaultTableState == key) return;
                stateOptions.push($('<option/>', {
                    'value': key,
                    'text': this.settings.defaultTableState == key ? this.getTranslation('default') : key,
                    selected: key == (!curState ? this.settings.defaultTableState : curState)
                }));
            });
            var select = $('<select />', {})
                .addClass(this.settings.dom.stateSelectClass)
                .css('width', this.settings.dom.inputWidth)
                .append(stateOptions);
            this.dom.stateSelects.push(select);
            return select;
        }

        private getState(name) {
            var state = this.settings.states[name];
            if (state == null)
                throw 'state with name "' + name + '" is not present';
            return state;
        }

        private generateStateData(oSettings) {
            var i, iLen;
            var api = this.dt.api;
            //var oSettings = this.dt.settings;
        
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

        private saveState(storeId, name, requestSettings, doneAction, failAction) {
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

            this.createRequest(requestSettings, requestData,
                 () => {
                    if ($.isFunction(doneAction))
                        doneAction(data);
                },
                failAction);
        }

        private setDefaultStateData() {
            var oSettings = this.dt.settings;
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
            this.addState(this.settings.defaultTableState, this.generateStateData(initialSettings), true);
        }

        private loadState(data, dtInitialized) {
            var oSettings = this.dt.settings;
            var i, ien;
            var columns = oSettings.aoColumns;
            var api = oSettings.oInstance.api();

            oSettings.oApi._fnCallbackFire(oSettings, 'remoteStateLoadingParams', 'remoteStateLoadingParams', [oSettings, data, dtInitialized]);

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
                var filterInput = $('input[type="search"]', oSettings.nTableWrapper);
                if (filterClass != "") {
                    var clses = filterClass.split(' ');
                    filterInput = filterInput.filter((e, input) => {
                        var result = true;
                        for (i = 0; i < clses.length; i++) {
                            result = $(input).hasClass(clses[i]);
                            if(!result) break;
                        }
                        return result;
                    });
                }
                filterInput.val(data.filter.sSearch.replace('"', '&quot;'));
            }

            oSettings.oApi._fnCallbackFire(oSettings, 'remoteStateLoadedParams', 'remoteStateLoadedParams', [oSettings, data, dtInitialized]);

            if (dtInitialized) {
                api.draw(false);
            }
        }

        private getRemoteStates() {
            var getAllSettings = this.settings.ajax.getAll;
            var api = this.dt.api;
            if (getAllSettings.url == null)
                throw 'ajax.getAll.url must be defined.';

            if ($.isFunction(getAllSettings.beforeSendAction))
                getAllSettings.beforeSendAction(api);

            try {
                var result:any = $.parseJSON($.ajax({
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
                    $.each(result.states, (key, val) => {
                        this.addState(key, val);
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
        }

        private setDefaultState(name) {
            this.dom.setDefaultButton.prop('disabled', true);
            var requestData = {
                'storeId': this.settings.storeId,
                'stateName': name,
                'action': 'setDefault',
                'data': null
            };
            this.createRequest(this.settings.ajax.setDefault,
                requestData,
                () => {
                    this.settings.defaultState = name;
                },
                (jqXhr, textStatus, errorThrown) => {
                    this.dom.setDefaultButton.prop('disabled', false);
                    throw errorThrown;
                });
        }

        private removeState(name) {
            this.dom.removeButton.prop('disabled', true);
            var requestData = {
                'storeId': this.settings.storeId,
                'stateName': name,
                'action': 'remove',
                'data': null
            };
            this.createRequest(this.settings.ajax.remove,
                requestData,
                () => {
                    delete this.settings.states[name];
                    var selStateRemoved = null;
                    $.each(this.dom.stateSelects, (i, select) => {
                        var option = $('option[value="' + name + '"]', select);
                        if (this.dom.stateSelect.get(0) == select.get(0) && option.prop('selected') == true) {
                            selStateRemoved = name;
                        }
                        option.remove();
                    });
                    if (selStateRemoved != null) {
                        if (this.settings.defaultState == selStateRemoved)
                            this.setDefaultState(null); //We have to remove the defalult state on the server
                        var noStateOpt = $('<option />').attr({ 'value': '', 'text': '', selected: true });
                        this.dom.stateSelect.append(noStateOpt);
                        this.dom.stateSelect.data('noStateOption', noStateOpt);
                    }
                    this.dom.removeButton.prop('disabled', false);
                },
                (jqXhr, textStatus, errorThrown) => {
                    this.dom.removeButton.prop('disabled', false);
                    throw errorThrown;
                });
        }
    }
}
(function( window, document, undefined ) {

    //Register events
    $.fn.DataTable.models.oSettings.remoteStateInitCompleted = [];
    $.fn.DataTable.models.oSettings.remoteStateSaveParams = [];
    $.fn.DataTable.models.oSettings.remoteStateLoadedParams = [];
    $.fn.DataTable.models.oSettings.remoteStateLoadingParams = [];

    $.fn.DataTable.Api.prototype.remoteState = function (settings) {
        var remoteState = new dt.RemoteState(this, settings);
        if (this.settings()[0]._bInitComplete)
            remoteState.initialize();
        else
            this.one('init.dt', () => { remoteState.initialize(); });
        return remoteState.dom.container.get(0);
    };

    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().remoteState(oSettings.oInit.remoteState);
        },
        "cFeature": "B",
        "sFeature": "Remote state"
    });



}(window, document, undefined));