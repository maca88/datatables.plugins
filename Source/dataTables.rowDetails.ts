module dt {
    
    export interface IRowDetailsBindingAdapter {
        rowExpanded(row, rowDetails): void;
        rowCollapsed(row, iconCell): void;
        cacheTemplate(url: string, template: string): void;
        getTemplate(url: string): string;
    }

    export class AngularRowDetailsAdapter implements IRowDetailsBindingAdapter {
        
        private dt = {
            settings: null,
            api: null
        }
        private settings;
        private $templateCache;

        constructor(api, settings) {
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
            this.$templateCache = this.dt.settings.oInit.angular.$templateCache;
        }

        public rowExpanded(row, rowDetails): void {
            var rowScope = angular.element(row.node()).scope();
            if (!rowScope) return;
            this.dt.settings.oInit.angular.$compile(row.child())(rowScope);
            if (!rowScope.$$phase) rowScope.$digest();
        }

        public rowCollapsed(row, iconCell): void {
            var rowScope = angular.element(row.node()).scope();
            if (!rowScope) return;
            if (!rowScope.$$phase) rowScope.$digest();
        }

        public cacheTemplate(url: string, template: string): void {
            this.$templateCache.put(url, template);
        }

        public getTemplate(url: string): string {
            return this.$templateCache.get(url);
        }
    }

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
            behavior: 'default', //accordion
            destroyOnClose: false,
            buttonPanel: {
                attrs: {},
                classes: []
            },
            buttons: {
                expandAll: {
                    visible: false,
                    tagName: 'button',
                    html: null,
                    attrs: {},
                    classes: [],
                    click: function(e) {
                        e.preventDefault();
                        if (!this.dt.api.table().hasRows()) return;
                        this.dt.api.table().rows().expandAll();
                    }
                },
                collapseAll: {
                    visible: false,
                    tagName: 'button',
                    html: null,
                    attrs: {},
                    classes: [],
                    click: function (e) {
                        e.preventDefault();
                        if (!this.dt.api.table().hasRows()) return;
                        this.dt.api.table().rows().collapseAll();
                    }
                },
            }, 
            trClass: 'sub',
            tdClass: '',
            created: null,
            opened: null,
            destroying: null,
            closed: null,
            bindingAdapter: null,
            template: null,
            language: {
                'collapseAll': 'Collapse all',
                'expandAll': 'Expand all'
            }


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
            buttons: []
        };
        public bindingAdapterInstance: IRowDetailsBindingAdapter;
        public lastOpenedRow;

        constructor(api, settings) {
            this.settings = $.extend(true, {}, RowDetails.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.rowDetails = this;
            this.setupAdapters();
            this.registerCallbacks();
            this.createDomElements();

            $.each(this.dt.settings.aoColumns, (i, col) => {
                if (!col.iconColumn) return;
                col.orderable = false;
                col.searchable = false;
                col.type = "html";
            });
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

        private setupAdapters() {
            this.setupBindingAdapter();
        }

        private setupBindingAdapter() {
            if (!this.settings.bindingAdapter) {
                if (angular !== undefined)
                    this.settings.bindingAdapter = dt.AngularRowDetailsAdapter;
            }
            if (!this.settings.bindingAdapter) return;
            this.bindingAdapterInstance = new this.settings.bindingAdapter(this.dt.api, this.settings);
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

            this.setupButtons();
        }

        private setupButtons() {
            var groupOpt = this.settings.buttonPanel;
            this.dom.btnGroup = $('<div/>')
                .addClass(groupOpt.classes.join(' '))
                .attr(<Object>groupOpt.attrs);
            var lang = this.settings.language;
            $.each(this.settings.buttons, (key, opt) => {
                if (!opt.visible) return;
                var btn = $('<' + opt.tagName + '/>')
                    .attr('title', lang[key])
                    .attr(<Object>opt.attrs)
                    .addClass(opt.classes.join(' '))
                    .on('click', (e) => opt.click.call(this, e))
                    .append(opt.html || lang[key]);
                this.dom.buttons.push(btn);
                this.dom.btnGroup.append(btn);
            });
        }

        public getFeatureElement() {
            if (this.dom.buttons.length)
                return this.dom.btnGroup[0];
            else
                return null;
        }

        public getTemplate(url): string {
            if (this.bindingAdapterInstance)
                return this.bindingAdapterInstance.getTemplate(url);
            else
                return dt.RowDetails.templates[url];
        }

        public hasTemplate(url): boolean {
            if (this.bindingAdapterInstance)
                return !!this.bindingAdapterInstance.getTemplate(url);
            else
                return dt.RowDetails.templates.hasOwnProperty(url);
        }

        public cacheTemplate(url, template) {
            if (this.bindingAdapterInstance)
                this.bindingAdapterInstance.cacheTemplate(url, template);
            else
                dt.RowDetails.templates[url] = template;
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

        var rowDetails: dt.RowDetails = this.settings()[0].rowDetails;
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

            if (rowDetails.bindingAdapterInstance)
                rowDetails.bindingAdapterInstance.rowExpanded(row, innerDetails);

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

            if (rowDetails.hasTemplate(tplUrl)) {
                //retirive template from cache
                createdAction(rowDetails.getTemplate(tplUrl));
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
                    rowDetails.cacheTemplate(tplUrl, msg);
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
        var rowDetails: dt.RowDetails = this.settings()[0].rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        settings = $.extend(true, {}, rowDetails.settings, settings);
        var behavior = rowDetails.settings.behavior;

        var row = this;

        var filledAction = () => {
            if (row.child.isShown() && row.child().is(':visible')) return;

            var td = $(row.node()).find('.' + settings.icon.className).closest('td'); //Icon td

            var subRow = row.child();
            if (!subRow) return; //fillDetails failed because of detached cell
            var detailsRows = subRow.css('display', '');
            $.each(detailsRows, (idx, item) => {
                dt.RowDetails.animateElement($(item), settings.animation, 'open');
                $(item).slideDown();
            });
            var details = $('div.innerDetails', detailsRows);

            if (behavior === 'accordion') {
                if (rowDetails.lastOpenedRow)
                    rowDetails.lastOpenedRow.closeDetails();
            }
            dt.RowDetails.animateElement(details, settings.animation, 'open');

            $('.dt-open-icon', td).hide();
            $('.dt-close-icon', td).show();

            rowDetails.lastOpenedRow = row;

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

        if (rowDetails.bindingAdapterInstance)
            rowDetails.bindingAdapterInstance.rowCollapsed(row, td);

        if ($.isFunction(settings.closed))
            settings.closed(rowDetails, row, td);
    });
    $.fn.DataTable.Api.register('row().toggleDetails()', function (settings) {
        this.isOpen() ? this.closeDetails(settings) : this.openDetails(settings);
    });
    $.fn.DataTable.Api.register('rows().collapseAll()', function (settings) {
        var api = this;
        this.iterator('row', function (dtSettings, row, thatIdx) {
            api.row(row).closeDetails();
        });
    });
    $.fn.DataTable.Api.register('rows().expandAll()', function (settings) {
        var rowDetails: dt.RowDetails = this.settings()[0].rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        if (rowDetails.settings.behavior === 'accordion')
            throw 'expandAll is not supported when behavior is set to accordion';
        var api = this;
        this.iterator('row', function (dtSettings, row, thatIdx) {
            api.row(row).openDetails();
        });
    });
    $.fn.DataTable.Api.register('rowDetails.init()', function (settings) {
        var rowDetails = new dt.RowDetails(this, settings);
        if (this.settings()[0]._bInitComplete)
            rowDetails.initialize();
        else
            this.one('init.dt', () => { rowDetails.initialize(); });

        return rowDetails.getFeatureElement();
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": (oSettings) => {
            return oSettings.oInstance.api().rowDetails.init(oSettings.oInit.rowDetails);
        },
        "cFeature": "D",
        "sFeature": "RowDetails"
    });


    var checkAngularModulePresence = (moduleName) => {
        if (angular === undefined)
            return false;
        try {
            angular.module(moduleName);
            return true;
        } catch (err) {
            return false;
        }
    };

    //Integrate with boostrap 3 if present
    if ((typeof (<any>$)().emulateTransitionEnd == 'function') || checkAngularModulePresence("ui.bootstrap") || checkAngularModulePresence("mgcrea.ngStrap")) {
        dt.RowDetails.defaultSettings.icon.openHtml = '<span class="glyphicon glyphicon-plus row-detail-icon"></span>';
        dt.RowDetails.defaultSettings.icon.closeHtml = '<span class="glyphicon glyphicon-minus row-detail-icon"></span>';
        dt.RowDetails.defaultSettings.buttonPanel.classes.push('btn-group');
        dt.RowDetails.defaultSettings.buttons.expandAll.tagName = 'div';
        dt.RowDetails.defaultSettings.buttons.expandAll.classes.push('btn btn-default btn-sm');
        dt.RowDetails.defaultSettings.buttons.expandAll.html = '<span class="glyphicon glyphicon-fullscreen"></span>';
        dt.RowDetails.defaultSettings.buttons.collapseAll.tagName = 'div';
        dt.RowDetails.defaultSettings.buttons.collapseAll.classes.push('btn btn-default btn-sm');
        dt.RowDetails.defaultSettings.buttons.collapseAll.html = '<span class="glyphicon glyphicon-move"></span>';
    }

} (window, document, undefined));