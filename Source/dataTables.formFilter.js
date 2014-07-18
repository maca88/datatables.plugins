var dt;
(function (dt) {
    var FormFilter = (function () {
        function FormFilter(api, settings) {
            this.initialized = false;
            this.dt = {
                api: null,
                settings: null
            };
            this.currentFormsData = null;
            this.settings = $.extend({}, FormFilter.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.registerCallbacks();
            this.dt.settings.formFilter = this;
        }
        FormFilter.prototype.registerCallbacks = function () {
            var _this = this;
            if (this.dt.settings.oInit.bServerSide || this.dt.settings.oInit.serverSide)
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoServerParams', this.setServerParams.bind(this), "FormFilter_ServerParam");

            /* State saving */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateSaveParams', function (oS, oData) {
                _this.saveState(oData);
            }, "FormFilter_StateSave");

            /* State loading */
            this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'aoStateLoadParams', function (oS, oData) {
                _this.loadState(oData);
            }, "FormFilter_StateLoad");

            if ($.fn.DataTable.models.oSettings.remoteStateInitCompleted !== undefined) {
                //Integrate with remote state
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateLoadedParams', function (s, data) {
                    _this.loadState(data);
                }, "FormFilter_StateLoad");
                this.dt.settings.oApi._fnCallbackReg(this.dt.settings, 'remoteStateSaveParams', function (s, data) {
                    _this.saveState(data);
                }, "FormFilter_StateSave");
            }
        };

        FormFilter.prototype.saveState = function (data) {
            data.formFilter = this.getFormsData(true);
        };

        FormFilter.prototype.loadState = function (data) {
            if (!data.formFilter)
                this.resetForms();
            else
                this.setFormsData(data.formFilter);
        };

        FormFilter.prototype.resetForms = function () {
            var _this = this;
            $.each(this.settings.formSelectors, function (i, selector) {
                var form = $(selector);
                if (!form.length)
                    return;
                _this.settings.resetForm(form);
            });
        };

        FormFilter.prototype.setFormsData = function (data) {
            var _this = this;
            $.each(data, function (selector, val) {
                var form = $(selector);
                if (!form.length)
                    return;
                _this.settings.setFormData(form, val);
            });
        };

        FormFilter.prototype.getFormsData = function (separateForms) {
            var _this = this;
            if (typeof separateForms === "undefined") { separateForms = false; }
            var data = null;
            $.each(this.settings.formSelectors, function (i, selector) {
                var form = $(selector);
                if (!form.length)
                    return;
                if (separateForms) {
                    (data = data || {})[selector] = _this.settings.getFormData(form);
                } else
                    data = _this.settings.mergeFormData(data, _this.settings.getFormData(form));
            });
            return data;
        };

        FormFilter.prototype.setServerParams = function (data) {
            data['formFilter'] = this.getFormsData();
        };

        FormFilter.prototype.initialize = function () {
            this.setupForms();

            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'formFilterInitCompleted', 'formFilterInitCompleted', [this]);
        };

        FormFilter.prototype.setupForms = function () {
            var _this = this;
            $.each(this.settings.formSelectors, function (i, selector) {
                $(selector).submit(function (e) {
                    e.preventDefault();
                    _this.dt.api.draw(true);
                });
            });
        };
        FormFilter.defaultSettings = {
            formSelectors: [],
            getFormData: function (form) {
                return form.serializeArray();
            },
            setFormData: function (form, data) {
                $.each(data, function (i, item) {
                    $('input[name="' + item.name + '"], select[name="' + item.name + '"], textarea[name="' + item.name + '"]', form).val(item.value);
                });
            },
            mergeFormData: function (data, fData) {
                return !$.isArray(fData) ? data : (data || []).concat(fData);
            },
            resetForm: function (form) {
                $(':input', form).not(':button, :submit, :reset, :hidden').removeAttr('checked').removeAttr('selected').not(':checkbox, :radio, select').val('');
            },
            clientFilter: null
        };
        return FormFilter;
    })();
    dt.FormFilter = FormFilter;
})(dt || (dt = {}));

(function (window, document) {
    //Register events
    $.fn.DataTable.models.oSettings.formFilterInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.register('formFilter.init()', function (settings) {
        var formFilter = new dt.FormFilter(this, settings);
        if (this.settings()[0]._bInitComplete)
            formFilter.initialize();
        else
            this.one('init.dt', function () {
                formFilter.initialize();
            });

        return null;
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().formFilter.init(oSettings.oInit.formFilter);
        },
        "cFeature": "K",
        "sFeature": "formFilter"
    });

    //Filter
    $.fn.DataTable.ext.search.push(function (oSettings, data, dataIndex, rowData, counter) {
        if (oSettings.formFilter === undefined || !oSettings.oFeatures.bFilter)
            return true;

        if (counter === 0) {
            oSettings.formFilter.currentFormsData = oSettings.formFilter.getFormsData();
        }

        var fn = oSettings.formFilter.settings.clientFilter;
        if (!fn || !$.isFunction(fn))
            return true;
        return fn.call(oSettings.formFilter, oSettings.formFilter.currentFormsData, data, dataIndex, rowData);
    });
}(window, document));
//# sourceMappingURL=dataTables.formFilter.js.map
