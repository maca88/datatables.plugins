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
                var form = this.executeSelector(selector);
                if (!form.length) return;
                this.settings.resetForm.call(this, form);
            });
        }

        public setFormsData(data) {
            $.each(data, (selector, val) => {
                var form = this.executeSelector(selector);
                if (!form.length) return;
                this.settings.setFormData.call(this, form, val);
            });
        }

        public getFormsData(separateForms = false) {
            var data = null;
            $.each(this.settings.formSelectors, (i, selector) => {
                var form = this.executeSelector(selector);
                if (!form.length) return;
                if (separateForms) {
                    (data = data || {})[selector] = this.settings.getFormData.call(this, form);
                } else
                    data = this.settings.mergeFormData.call(this, data, this.settings.getFormData.call(this, form));
            });
            return data;
        }

        private executeSelector(selector: string) {
            var parent = null;
            var currentNode: Node = this.dt.settings.nTable;
            while (currentNode) {
                parent = currentNode;
                currentNode = currentNode.parentNode;
            }
            if (parent instanceof DocumentFragment)
                parent = parent.children;
            var elem = $(selector, parent);
            if (!elem.length) 
                elem = $(selector);
            return elem;
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
                this.executeSelector(selector).submit(e => {
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
    $.fn.DataTable.Api.register('formFilter.init()', function (settings) {
        var formFilter = new dt.FormFilter(this, settings);
        if (this.settings()[0]._bInitComplete)
            formFilter.initialize();
        else
            this.one('init.dt', () => { formFilter.initialize(); });

        return null;
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().formFilter.init(oSettings.oInit.formFilter);
        },
        "cFeature": "K",
        "sFeature": "formFilter"
    });

    //Filter
    $.fn.DataTable.ext.search.push(
        (oSettings, data, dataIndex, rowData, counter) => {
            if (oSettings.formFilter === undefined || !oSettings.oFeatures.bFilter) return true;

            if (counter === 0) {
                oSettings.formFilter.currentFormsData = oSettings.formFilter.getFormsData();
            }

            var fn = oSettings.formFilter.settings.clientFilter;
            if (!fn || !$.isFunction(fn)) return true;
            return fn.call(oSettings.formFilter, oSettings.formFilter.currentFormsData, data, dataIndex, rowData);
        });

} (window, document));
