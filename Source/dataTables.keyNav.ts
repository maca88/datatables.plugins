module dt {
    
    export class KeyNav {
        
        public static defaultSettings: any = {
        };

        private settings: any;
        private initialized: boolean = false;
        private dt: any = {
            settings: null,
            api: null
        };
        private dom = {
        };
        public bindingAdapterInstance: IColPinBindingAdapter;

        constructor(api, settings) {
            this.settings = $.extend(true, {}, KeyNav.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.keyNav = this;
            this.registerCallbacks();
        }

        public initialize(): void {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'keyNavInitCompleted', 'keyNavInitCompleted', [this]);
        }

        private registerCallbacks() {
            var $table = $(this.dt.settings.nTable);

        }
    }

} 


(function (window, document, undefined) {

    //Register events
    $.fn.DataTable.models.oSettings.keyNavInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.register('keyNav.init()', function (settings) {
        var colPin = new dt.KeyNav(this, settings);
        if (this.settings()[0]._bInitComplete)
            colPin.initialize();
        else
            this.one('init.dt', () => { colPin.initialize(); });

        return null;
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().keyNav.init(oSettings.oInit.keyNav);
        },
        "cFeature": "K",
        "sFeature": "KeyNav"
    });

} (window, document, undefined));