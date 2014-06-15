module dt {
    
    export class FormFilter {
        
        public static defaultSettings = {
            formSelectors: [],
            getFormData: (form) => { return form.serializeArray(); },
            setFormData: (form, data) => { $.each(data, (i, item) => { $('input[name="' + item.name + '"], select[name="' + item.name + '"], textarea[name="' + item.name + '"]', form).val(item.value); }); },
            mergeFormData: (data, fData) => { return !$.isArray(fData) ? data : (data || []).concat(fData); },
            resetForm: (form) => { $(':input', form).not(':button, :submit, :reset, :hidden').removeAttr('checked').removeAttr('selected').not(':checkbox, :radio, select').val(''); },
            clientFilter: null, //function(currentFormsData, data, dataIndex, rowData)
        };
        public settings;
        public initialized: boolean = false;
        public dt = {
            api: null,
            settings: null
        };
        public currentFormsData = null;

        constructor(api, settings) {
            this.settings = $.extend({}, FormFilter.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.registerCallbacks();
            this.dt.settings.formFilter = this;
        }

        private registerCallbacks() {
            if (this.dt.settings.oInit.bServerSide || this.dt.settings.oInit.serverSide) 
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoServerParams', this.setServerParams.bind(this), "FormFilter_ServerParam");
            this.dt.api.on('preSearch.dt', (e) => {
                if (e.target !== this.dt.settings.nTable) return;
                this.currentFormsData = this.getFormsData();
            });
            /* State saving */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateSaveParams', (oS, oData) => {
                this.saveState(oData);
            }, "FormFilter_StateSave");

            /* State loading */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateLoadParams', (oS, oData) => {
                this.loadState(oData);
            }, "FormFilter_StateLoad");

            if ($.fn.DataTable.models.oSettings.remoteStateInitCompleted !== undefined) {
                //Integrate with remote state
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateLoadedParams', (s, data) => {
                    this.loadState(data);
                }, "FormFilter_StateLoad");
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateSaveParams', (s, data) => {
                    this.saveState(data);
                }, "FormFilter_StateSave");
            }
        }

        private saveState(data) {
            data.formFilter = this.getFormsData(true);
        }

        private loadState(data) {
            if (!data.formFilter) 
                this.resetForms();
            else
                this.setFormsData(data.formFilter);
        }

        public resetForms() {
            $.each(this.settings.formSelectors, (i, selector) => {
                var form = $(selector);
                if (!form.length) return;
                this.settings.resetForm(form);
            });
        }

        public setFormsData(data) {
            $.each(data, (selector, val) => {
                var form = $(selector);
                if (!form.length) return;
                this.settings.setFormData(form, val);
            });
        }

        public getFormsData(separateForms = false) {
            var data = null;
            $.each(this.settings.formSelectors, (i, selector) => {
                var form = $(selector);
                if (!form.length) return;
                if (separateForms) {
                    (data = data || {})[selector] = this.settings.getFormData(form);
                } else
                    data = this.settings.mergeFormData(data, this.settings.getFormData(form));
            });
            return data;
        }

        private setServerParams(data) {
            data['formFilter'] = this.getFormsData();
        }

        public initialize() {
            this.setupForms();

            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'formFilterInitCompleted', 'formFilterInitCompleted', [this]);
        }

        private setupForms() {
            $.each(this.settings.formSelectors, (i, selector) => {
                $(selector).submit(e => {
                    e.preventDefault();
                    this.dt.api.draw(true);
                });
            });
        }
    }
} 

(function (window, document) {

    //Register events
    $.fn.DataTable.models.oSettings.formFilterInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.prototype.formFilter = function (settings) {
        var formFilter = new dt.FormFilter(this, settings);
        if (this.settings()[0].bInitialized)
            formFilter.initialize();
        else
            this.one('init.dt', () => { formFilter.initialize(); });

        return null;
    };

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().formFilter(oSettings.oInit.formFilter);
        },
        "cFeature": "K",
        "sFeature": "formFilter"
    });

    //Filter
    $.fn.DataTable.ext.search.push(
        (oSettings, data, dataIndex, rowData) => {
            if (oSettings.formFilter === undefined || !oSettings.oFeatures.bFilter) return true;
            var fn = oSettings.formFilter.settings.clientFilter;
            if (!fn || !$.isFunction(fn)) return true;
            return fn.call(oSettings.formFilter, oSettings.formFilter.currentFormsData, data, dataIndex, rowData);
        });

} (window, document));
