var dt;
(function (dt) {
    var BreezeFilter = (function () {
        function BreezeFilter(api, settings) {
            this.initialized = false;
            this.dt = {
                api: null,
                settings: null
            };
            this.dom = {
                select: null,
                container: null
            };
            this.currentFilter = null;
            this.settings = $.extend({}, BreezeFilter.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.createDomElements();
            this.registerCallbacks();
            this.dt.settings.breezeFilter = this;
        }
        BreezeFilter.prototype.initialize = function () {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'breezeFilterInitCompleted', 'breezeFilterInitCompleted', [this]);
        };

        BreezeFilter.prototype.createDomElements = function () {
            var _this = this;
            this.dom.select = $('<select/>').addClass(this.settings.dom.selectClass);

            $.each(this.settings.states, function (value, option) {
                _this.dom.select.append($('<option/>', {
                    'value': value,
                    'text': !!option.text ? option.text : (!!_this.settings.language[value] ? _this.settings.language[value] : value)
                }).prop('selected', (!!option.selected || _this.settings.selectedState == value)));
            });

            this.dom.select.change(function () {
                _this.setCurrentFilter();
                _this.dt.settings.oInstance.fnFilter();
            });

            this.setCurrentFilter();

            this.dom.container = $('<div />').addClass('dt-entity-filter').addClass(this.settings.dom.containerClass);
            if (!!this.settings.language.entityFilter)
                this.dom.container.append($('<label />').html(this.settings.language.entityFilter));
            this.dom.container.append(this.dom.select);
        };

        BreezeFilter.prototype.setCurrentFilter = function () {
            this.currentFilter = this.settings.states[this.dom.select.val()].filter;
        };

        BreezeFilter.prototype.registerCallbacks = function () {
        };
        BreezeFilter.defaultSettings = {
            selectedState: 'default',
            states: {
                'default': { 'filter': ['Added', 'Modified', 'Unchanged', 'Detached'] },
                'all': { 'filter': [] },
                'added': { 'filter': ['Added'] },
                'modified': { 'filter': ['Modified'] },
                'unchanged': { 'filter': ['Unchanged'] },
                'edited': { 'filter': ['Added', 'Modified'] },
                'detached': { 'filter': ['Detached'] },
                'deleted': { 'filter': ['Deleted'] }
            },
            dom: {
                containerClass: '',
                selectClass: 'form-control'
            },
            language: {
                'entityFilter': 'Entity filter',
                'default': 'Default',
                'all': 'All',
                'added': 'Added',
                'modified': 'Modified',
                'unchanged': 'Unchanged',
                'edited': 'Edited',
                'detached': 'Detached',
                'deleted': 'Deleted'
            }
        };
        return BreezeFilter;
    })();
    dt.BreezeFilter = BreezeFilter;
})(dt || (dt = {}));

(function (window, document) {
    //Register events
    $.fn.DataTable.models.oSettings.breezeFilterInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.prototype.breezeFilter = function (settings) {
        var breezeFilter = new dt.BreezeFilter(this, settings);
        if (this.settings()[0]._bInitComplete)
            breezeFilter.initialize();
        else
            this.one('init.dt', function () {
                breezeFilter.initialize();
            });

        return breezeFilter.dom.container.get(0);
    };

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().breezeFilter(oSettings.oInit.breezeFilter);
        },
        "cFeature": "G",
        "sFeature": "breezeFilter"
    });

    var indexOfFor = function (arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item)
                return i;
        }
        return -1;
    };

    //Filter
    $.fn.DataTable.ext.search.push(function (oSettings, data, dataIndex, rowData) {
        if (oSettings.breezeFilter === undefined)
            return true;
        if (!rowData.entityAspect || !rowData.entityAspect.entityState)
            return true;
        var entityFilters = oSettings.breezeFilter.currentFilter;
        if (!entityFilters || entityFilters.length == 0)
            return true;
        return indexOfFor(entityFilters, rowData.entityAspect.entityState.name) >= 0;
    });
}(window, document));
//# sourceMappingURL=dataTables.breezeFilter.js.map
