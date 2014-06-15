module dt {
    
    export class BreezeFilter {

        public static defaultSettings = {
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
        public settings;
        public initialized: boolean = false;
        public dt ={
            api: null,
            settings: null    
        };
        public dom = {
            select: null,
            container: null
        };
        public currentFilter = null;

        constructor(api, settings) {
            this.settings = $.extend({}, BreezeFilter.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.createDomElements();
            this.registerCallbacks();
            this.dt.settings.breezeFilter = this;
        }

        public initialize() {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'breezeFilterInitCompleted', 'breezeFilterInitCompleted', [this]);
        }

        private createDomElements() {
            this.dom.select = $('<select/>')
                .addClass(this.settings.dom.selectClass);

            $.each(this.settings.states, (value, option) => {
                this.dom.select.append($('<option/>', {
                    'value': value,
                    'text': !!option.text ? option.text : (!!this.settings.language[value] ? this.settings.language[value] : value)
                })
                .prop('selected', (!!option.selected || this.settings.selectedState == value)));
            });

            this.dom.select.change(() => {
                this.setCurrentFilter();
                this.dt.settings.oInstance.fnFilter();
            });

            this.setCurrentFilter();

            this.dom.container = $('<div />')
                .addClass('dt-entity-filter')
                .addClass(this.settings.dom.containerClass);
            if (!!this.settings.language.entityFilter)
                this.dom.container.append($('<label />').html(this.settings.language.entityFilter));
            this.dom.container.append(this.dom.select);
        }

        private setCurrentFilter() {
            this.currentFilter = this.settings.states[this.dom.select.val()].filter;
        }

        private registerCallbacks() {
            
        }
    }
}

(function (window, document) {

    //Register events
    $.fn.DataTable.models.oSettings.breezeFilterInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.prototype.breezeFilter = function (settings) {
        var breezeFilter = new dt.BreezeFilter(this, settings);
        if (this.settings()[0].bInitialized)
            breezeFilter.initialize();
        else
            this.one('init.dt', () => { breezeFilter.initialize(); });

        return breezeFilter.dom.container.get(0);
    };

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().breezeFilter(oSettings.oInit.breezeFilter);
        },
        "cFeature": "G",
        "sFeature": "breezeFilter"
    });

    var indexOfFor = (arr: any[], item: any): number => {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    //Filter
    $.fn.DataTable.ext.search.push(
        (oSettings, data, dataIndex, rowData) => {
            if (oSettings.breezeFilter === undefined) return true;
            if (!rowData.entityAspect || !rowData.entityAspect.entityState) return true;
            var entityFilters = oSettings.breezeFilter.currentFilter;
            if (!entityFilters || entityFilters.length == 0)
                return true;
            return indexOfFor(entityFilters, rowData.entityAspect.entityState.name) >= 0;
        });

} (window, document));