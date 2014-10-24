var dt;
(function (dt) {
    var BreezeEntityFilterAdapter = (function () {
        function BreezeEntityFilterAdapter() {
        }
        BreezeEntityFilterAdapter.prototype.getStateName = function (item) {
            if (!item.entityAspect || !item.entityAspect.entityState)
                return 'NotTracked';
            return item.entityAspect.entityState.name;
        };
        return BreezeEntityFilterAdapter;
    })();
    dt.BreezeEntityFilterAdapter = BreezeEntityFilterAdapter;

    var JayDataEntityFilterAdapter = (function () {
        function JayDataEntityFilterAdapter() {
        }
        JayDataEntityFilterAdapter.prototype.getStateName = function (item) {
            var state = item.entityState;
            switch (state) {
                case $data.EntityState.Detached:
                    return 'Detached';
                case $data.EntityState.Unchanged:
                    return 'Unchanged';
                case $data.EntityState.Added:
                    return 'Added';
                case $data.EntityState.Modified:
                    return 'Modified';
                case $data.EntityState.Deleted:
                    return 'Deleted';
                default:
                    return 'NotTracked';
            }
        };
        return JayDataEntityFilterAdapter;
    })();
    dt.JayDataEntityFilterAdapter = JayDataEntityFilterAdapter;

    var EntityFilter = (function () {
        function EntityFilter(api, settings) {
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
            this.settings = $.extend(true, {}, EntityFilter.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.createDomElements();
            this.registerCallbacks();
            this.setupAdapter();
            this.dt.settings.entityFilter = this;
        }
        EntityFilter.prototype.initialize = function () {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'entityFilterInitCompleted', 'entityFilterInitCompleted', [this]);
        };

        EntityFilter.prototype.setupAdapter = function () {
            if (!this.settings.adapter) {
                if (breeze !== undefined && $data != undefined)
                    throw 'adapter must be specified';
                if (breeze !== undefined)
                    this.settings.adapter = dt.BreezeEntityFilterAdapter;
                else if ($data !== undefined)
                    this.settings.adapter = dt.JayDataEntityFilterAdapter;
            }
            if (!this.settings.adapter)
                throw 'adapter must be specified';
            this.adapterInstance = new this.settings.adapter();
        };

        EntityFilter.prototype.createDomElements = function () {
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

        EntityFilter.prototype.setCurrentFilter = function () {
            this.currentFilter = this.settings.states[this.dom.select.val()].filter;
        };

        EntityFilter.prototype.registerCallbacks = function () {
        };
        EntityFilter.defaultSettings = {
            selectedState: 'default',
            adapter: null,
            states: {
                'default': { 'filter': ['Added', 'Modified', 'Unchanged', 'Detached', 'NotTracked'] },
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

        EntityFilter.indexOfFor = function (arr, item) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === item)
                    return i;
            }
            return -1;
        };
        return EntityFilter;
    })();
    dt.EntityFilter = EntityFilter;
})(dt || (dt = {}));

(function (window, document) {
    //Register events
    $.fn.DataTable.models.oSettings.entityFilterInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.register('entityFilter.init()', function (settings) {
        var entityFilter = new dt.EntityFilter(this, settings);
        if (this.settings()[0]._bInitComplete)
            entityFilter.initialize();
        else
            this.one('init.dt', function () {
                entityFilter.initialize();
            });

        return entityFilter.dom.container.get(0);
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().entityFilter.init(oSettings.oInit.entityFilter);
        },
        "cFeature": "G",
        "sFeature": "entityFilter"
    });

    //Filter
    $.fn.DataTable.ext.search.push(function (oSettings, data, dataIndex, rowData) {
        if (oSettings.entityFilter === undefined)
            return true;
        var eFilter = oSettings.entityFilter;
        var stateName = eFilter.adapterInstance.getStateName(rowData);
        if (!stateName)
            return false;
        var entityFilters = eFilter.currentFilter;
        if (!entityFilters || entityFilters.length == 0)
            return true;
        return dt.EntityFilter.indexOfFor(entityFilters, stateName) >= 0;
    });
}(window, document));
