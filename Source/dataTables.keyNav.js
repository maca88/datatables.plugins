var dt;
(function (dt) {
    var KeyNav = (function () {
        function KeyNav(api, settings) {
            this.initialized = false;
            this.dt = {
                settings: null,
                api: null
            };
            this.dom = {};
            this.settings = $.extend(true, {}, KeyNav.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.keyNav = this;
            this.registerCallbacks();
        }
        KeyNav.prototype.initialize = function () {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'keyNavInitCompleted', 'keyNavInitCompleted', [this]);
        };

        KeyNav.prototype.registerCallbacks = function () {
            var $table = $(this.dt.settings.nTable);
        };
        KeyNav.defaultSettings = {};
        return KeyNav;
    })();
    dt.KeyNav = KeyNav;
})(dt || (dt = {}));

(function (window, document, undefined) {
    //Register events
    $.fn.DataTable.models.oSettings.keyNavInitCompleted = [];

    //Register api function
    $.fn.DataTable.Api.register('keyNav.init()', function (settings) {
        var colPin = new dt.KeyNav(this, settings);
        if (this.settings()[0]._bInitComplete)
            colPin.initialize();
        else
            this.one('init.dt', function () {
                colPin.initialize();
            });

        return null;
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().keyNav.init(oSettings.oInit.keyNav);
        },
        "cFeature": "K",
        "sFeature": "KeyNav"
    });
}(window, document, undefined));
//# sourceMappingURL=dataTables.keyNav.js.map
