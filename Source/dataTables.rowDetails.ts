module dt {
    
    export class RowDetails {
        
        public static defaultSettings = {
            animation: 'slide',
            icon: {
                className: 'row-detail-icon',
                closeHtml: '<button><span class="row-detail-icon">Close</span></button>',
                openHtml: '<button><span class="row-detail-icon">Open</span></button>',
                defaultHtml: '',
                hasIcon: (row) => { return true; }
            },
            destroyOnClose: false,
            trClass: 'sub',
            tdClass: '',
            created: null,
            opened: null,
            destroying: null,
            closed: null,
            template: null,
            /*
            template: {
                url: null,
                requesting: null,
                cache: null,
                ajax: null
            }*/
        };
        public static templates = {};
        public settings: any;
        public dt:any = {
            settings: null,
            api: null
        };
        public initialized: boolean = false;
        public dom: any = {
            btnGroup: null,
            btnCollapseAll: null,
            btnExpandAll: null,
        };

        constructor(api, settings) {
            this.settings = $.extend(true, {}, RowDetails.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.rowDetails = this;
            this.registerCallbacks();
            this.createDomElements();
        }

        public static animateElement(elem, animation, action, completeAction = null) {
            switch (animation) {
                case 'slide':
                    if (action == 'open')
                        elem.slideDown(completeAction);
                    else
                        elem.slideUp(completeAction);
                    return;
                case 'none':
                    if (action == 'open')
                        elem.show();
                    else
                        elem.hide();

                    if ($.isFunction(completeAction))
                        completeAction();
                    return;
                default:
                    throw 'not valid animation ' + animation;
            }
        }

        private createDomElements() {
            var $tableNode = $(this.dt.api.table().node());
            $tableNode.on('click', '.' + this.settings.icon.className, (e) => {
                if ($(e.target).closest('table').get(0) !== $tableNode.get(0)) return;
                e.preventDefault();
                var row = this.dt.api.row($(e.target).closest('tr'));
                if (row.length == 0) return; //happens when user click on header row
                row.toggleDetails(this.settings);
                return;
            });


            var columns = this.dt.api.settings()[0].oInit.columns;
            $.each(columns, (idx, column) => {
                if (column.iconColumn !== true) return;
                var iconColumn =  this.dt.settings.aoColumns[idx];

                iconColumn.mRender = column.render = (innerData, type, rowData, meta) => {
                    var hasIcon = true;
                    if ($.isFunction(this.settings.icon.hasIcon))
                        hasIcon = this.settings.icon.hasIcon.call(this.dt.api, rowData);
                    if (!hasIcon)
                        return this.settings.icon.defaultHtml || '';

                    var openIcon = $('<div/>', {
                        'class': this.settings.className + ' dt-open-icon',
                        'html': (this.settings.icon.openHtml || '')
                    });
                    var closeIcon = $('<div/>', {
                        'class': this.settings.className + ' dt-close-icon',
                        'style': 'display: none',
                        'html': (this.settings.icon.closeHtml || '')
                    });

                    var cell = $('<div/>', { 'class': 'dt-cell-icon' });
                    cell.append(openIcon, closeIcon);
                    return cell.html();
                };
                iconColumn.fnGetData = (rowData, type, meta) => {
                    return iconColumn.mRender(null, type, rowData, meta);
                };
            });

            this.dom.btnGroup = $('<div/>', { 'class': 'btn-group' });

            this.dom.btnCollapseAll = $('<div/>', { 'class': 'btn btn-default btn-sm', 'title': 'Collapse all' })
                .append($('<span/>', { 'class': 'glyphicon glyphicon-move' }));
            this.dom.btnCollapseAll.click((e) => {
                e.preventDefault();
                if (!this.dt.api.table().hasRows()) return;
                this.dt.api.rows({ page: 'current' }).nodes().each((i, tr) => {
                    this.dt.api.row(tr).closeDetails();
                });
            });

            this.dom.btnExpandAll = $('<div/>', { 'class': 'btn btn-default btn-sm', 'title': 'Expand all' })
                .append($('<span/>', { 'class': 'glyphicon glyphicon-fullscreen' }));
            this.dom.btnExpandAll.click((e) => {
                e.preventDefault();
                if (!this.dt.api.table().hasRows()) return;
                this.dt.api.table().rows({ page: 'current' }).nodes().each((i, tr) => {
                    this.dt.api.row(tr).openDetails();
                });
            });

            this.dom.btnGroup.append(this.dom.btnCollapseAll, this.dom.btnExpandAll);
        }

        private registerCallbacks() {
            
        }

        public initialize() {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'rowDetailsInitCompleted', 'rowDetailsInitCompleted', [this]);
        }
    }

}

(function(window, document, undefined) {

    //Register events
    $.fn.DataTable.models.oSettings.rowDetailsInitCompleted = [];

    //Register functions
    $.fn.DataTable.Api.register('hasRows()', function () {
        return this.rows().nodes()[0] instanceof HTMLElement;
    });
    $.fn.DataTable.Api.register('row().isOpen()', function () {
        var child = this.child();
        return child != null && child.closest('html').length > 0 && child.is(':visible');
    });
    $.fn.DataTable.Api.register('row().fillDetails()', function (completeAction, settings) {
        if ($(this.node()).closest('html').length == 0) { //skip detached rows
            if ($.isFunction(completeAction))
                completeAction(false);
            return;
        } //we will not fill rows that are detached

        var rowDetails = this.settings()[0].rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        settings = $.extend(true, {}, rowDetails.settings, settings);
        var row = this;
        var isOpen = row.isOpen();

        if (row.child() != null) {
            row.child.hide(); //destroy the old one
        }
        var innerDetails = $('<div />', {
            'class': 'innerDetails',
            'style': 'display:none',
        });
        row.child(innerDetails, settings.tdClass); //create child
        row.child().addClass(settings.trClass).css('display', 'none'); //add attributes
        row.child.show(); //add to dom

        var createdAction = (content?) => {
            if (content)
                innerDetails.html(content);
            if ($.isFunction(settings.created))
                settings.created.call(rowDetails, row, innerDetails);

            $(row.node()).data('detailsFilled', true); //set 
            row.child().trigger('detailsFilled.dt');
            if (isOpen) { //if row was open reopen it
                row.openDetails({ animation: 'none' });
            }
            if ($.isFunction(completeAction))
                completeAction(true);
        };

        if (!settings.template) {
            createdAction();
            return;
        }

        //remote template
        if ($.isPlainObject(settings.template)) {
            var tplSetttings = settings.template;

            var tplUrl = tplSetttings.url;
            if ($.isFunction(tplSetttings.url))
                tplUrl = tplSetttings.url.call(rowDetails, row);

            if (tplSetttings !== false && dt.RowDetails.templates.hasOwnProperty(tplUrl)) {
                //retirive template from cache
                createdAction(dt.RowDetails.templates[tplUrl]);
                return;
            }

            //get from the server
            var defaultAjaxSettings = {
                url: tplUrl,
                type: 'GET',
                dataType: 'html'
            };
            var ajaxSettings = $.extend({}, defaultAjaxSettings, tplSetttings.ajax);

            if ($.isFunction(tplSetttings.requesting))
                tplSetttings.requesting.call(rowDetails, row, innerDetails);

            $.ajax(ajaxSettings)
                .done((msg) => {
                    dt.RowDetails.templates[tplUrl] = msg;
                    createdAction(msg);
                });
        } else if ($.isFunction(settings.template)) {
            createdAction(settings.template.call(rowDetails, row));
        } else if ($.type(settings.template) === 'string') { //selector or template html
            var tpl = settings.template;
            if (tpl.charAt(0) === "<" && tpl.charAt(tpl.length - 1) === ">" && tpl.length >= 3) { //is template html
                createdAction(tpl);
            } else { //selector
                createdAction($(tpl).html());
            }
        } 
    });
    $.fn.DataTable.Api.register('row().openDetails()', function (settings) {
        var rowDetails = this.settings()[0].rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        settings = $.extend(true, {}, rowDetails.settings, settings);
        var row = this;

        var filledAction = () => {
            if (row.child.isShown() && row.child().is(':visible')) return;

            var td = $(row.node()).find('.' + settings.icon.className).closest('td'); //Icon td
            var detailsRows = row.child().css('display', '');
            $.each(detailsRows, (idx, item) => {
                dt.RowDetails.animateElement($(item), settings.animation, 'open');
                $(item).slideDown();
            });
            var details = $('div.innerDetails', detailsRows);
            dt.RowDetails.animateElement(details, settings.animation, 'open');

            $('.dt-open-icon', td).hide();
            $('.dt-close-icon', td).show();

            if ($.isFunction(settings.opened))
                settings.opened.call(rowDetails, row, td);
        };

        if ($(this.node()).data('detailsFilled') !== true) {
            this.fillDetails(filledAction, settings);
        } else {
            filledAction();
        }
    });
    $.fn.DataTable.Api.register('row().closeDetails()', function (settings) {
        var rowDetails = this.settings()[0].rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        settings = $.extend(true, {}, rowDetails.settings, settings);
        if (!this.child.isShown() || !this.child().is(':visible')) return;

        var td = $(this.node()).find('.' + settings.icon.className).closest('td'); //Icon td
        var row = this;

        var destroyOnClose = settings.destroyOnClose == true;
        var detailsRows = row.child();
        var details = $('div.innerDetails', detailsRows);

        var afterHideAction = () => {
            if (destroyOnClose == true) { //When destroyOnClose is set to false the details tr element is never removed (remains hidden)
                if ($.isFunction(settings.destroying))
                    settings.destroying.call(rowDetails, row, td);
                row.child.hide(); //this actually remove the children
                $(row.node()).data('detailsFilled', false);
            } else {
                details.hide();
                $.each(detailsRows, (idx, item) => {
                    $(item).hide(); //this will hide the children
                });
            }
        };
        dt.RowDetails.animateElement(details, settings.animation, 'close', afterHideAction);

        $('.dt-close-icon', td).hide();
        $('.dt-open-icon', td).show();

        if ($.isFunction(settings.closed))
            settings.closed(rowDetails, row, td);
    });
    $.fn.DataTable.Api.register('row().toggleDetails()', function (settings) {
        this.isOpen() ? this.closeDetails(settings) : this.openDetails(settings);
    });

    $.fn.DataTable.Api.prototype.rowDetails = function (settings) {
        var rowDetails = new dt.RowDetails(this, settings);
        if (this.settings()[0].bInitialized)
            rowDetails.initialize();
        else
            this.one('init.dt', () => { rowDetails.initialize(); });

        return rowDetails.dom.btnGroup;
    };

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().rowDetails(oSettings.oInit.rowDetails);
        },
        "cFeature": "D",
        "sFeature": "RowDetails"
    });

} (window, document, undefined));