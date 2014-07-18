module dt {
    
    export interface IEntityFilterAdapter {
        getStateName(item): string;
    }

    export class BreezeEntityFilterAdapter implements IEntityFilterAdapter {

        public getStateName(item): string {
            if (!item.entityAspect || !item.entityAspect.entityState) return 'NotTracked';
            return item.entityAspect.entityState.name;
        }
    }

    export class JayDataEntityFilterAdapter implements IEntityFilterAdapter {

        public getStateName(item): string {
            var state = item.entityState;
            switch (state) {
                case (<any>$data).EntityState.Detached:
                    return 'Detached';
                case (<any>$data).EntityState.Unchanged:
                    return 'Unchanged';
                case (<any>$data).EntityState.Added:
                    return 'Added';
                case (<any>$data).EntityState.Modified:
                    return 'Modified';
                case (<any>$data).EntityState.Deleted:
                    return 'Deleted';
                default:
                    return 'NotTracked';
            }
        }
    }


    export class EntityFilter {

        public static defaultSettings = {
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
        private adapterInstance: IEntityFilterAdapter;

        constructor(api, settings) {
            this.settings = $.extend(true, {}, EntityFilter.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.createDomElements();
            this.registerCallbacks();
            this.setupAdapter();
            this.dt.settings.entityFilter = this;
        }

        public initialize() {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'entityFilterInitCompleted', 'entityFilterInitCompleted', [this]);
        }

        private setupAdapter() {
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

        public static indexOfFor = (arr: any[], item: any): number => {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === item) return i;
            }
            return -1;
        }

        private registerCallbacks() {
            
        }
    }
}

(function (window, document) {

    //Register events
    $.fn.DataTable.models.oSettings.entityFilterInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.register('entityFilter.init()', function (settings) {
        var entityFilter = new dt.EntityFilter(this, settings);
        if (this.settings()[0]._bInitComplete)
            entityFilter.initialize();
        else
            this.one('init.dt', () => { entityFilter.initialize(); });

        return entityFilter.dom.container.get(0);
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().entityFilter.init(oSettings.oInit.entityFilter);
        },
        "cFeature": "G",
        "sFeature": "entityFilter"
    });


    //Filter
    $.fn.DataTable.ext.search.push(
        (oSettings, data, dataIndex, rowData) => {
            if (oSettings.entityFilter === undefined) return true;
            var eFilter = oSettings.entityFilter;
            var stateName = eFilter.adapterInstance.getStateName(rowData);
            if (!stateName) return false;
            var entityFilters = eFilter.currentFilter;
            if (!entityFilters || entityFilters.length == 0)
                return true;
            return dt.EntityFilter.indexOfFor(entityFilters, stateName) >= 0;
        });

} (window, document));