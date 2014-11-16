module dt {
    
    export interface IRowDetailsBindingAdapter {
        rowCreated(row, rowDetails): void;
        rowExpanded(row, rowDetails, iconCell): void;
        rowCollapsed(row, rowDetails, iconCell): void;
        destroyDetails(details): void;
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

        public rowCreated(row, rowDetails): void {
            var rowScope = angular.element(row.node()).scope();
            if (!rowScope) return;
            rowDetails.attr('dt-row-details', '');
            this.dt.settings.oInit.angular.$compile(rowDetails)(rowScope);
            if (!rowScope.$$phase) rowScope.$digest();
        }

        public rowExpanded(row, rowDetails, iconCell): void {
            var rowScope = angular.element(rowDetails).scope();
            if (!rowScope) return;
            rowScope.$emit('dt.rowExpanded', row, rowDetails, iconCell);
        }

        public rowCollapsed(row, rowDetails, iconCell): void {
            var rowScope = angular.element(rowDetails).scope();
            if (!rowScope) return;
            rowScope.$emit('dt.rowCollapsed', row, rowDetails, iconCell);
        }

        public cacheTemplate(url: string, template: string): void {
            this.$templateCache.put(url, template);
        }

        public getTemplate(url: string): string {
            return this.$templateCache.get(url);
        }

        public destroyDetails(details): void {
            var rowScope = angular.element(details).scope();
            if (!rowScope) return;
            rowScope.$destroy();
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
            cell: {
                className: 'no-focus',
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
            expandRow: {
                trClass: 'sub',
                tdClass: 'no-focus',
            },
            rowCreated: null,
            rowExpanded: null,
            rowDestroying: null,
            rowCollapsed: null,
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
        events:string[] = []

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
            this.setupEvents();

            $.each(this.dt.settings.aoColumns, (i, col) => {
                if (!col.iconColumn) return;
                col.orderable = false;
                col.searchable = false;
                col.type = "html";
            });
        }

        public static intergateWithBootstrap() {
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

        private setupEvents() {
            var api = this.dt.api;
            var settings = this.dt.settings;
            var namespace = '.dt.DT_RowDetails';
            var drawEvent = 'draw' + namespace;
            var colvisEvent = 'column-visibility' + namespace;
            var destroyEvent = 'destroy' + namespace;
            var data = settings.aoData;
            //this.events = [drawEvent, colvisEvent, destroyEvent];

            api.off(drawEvent + ' ' + colvisEvent + ' ' + destroyEvent);

            // On each draw, insert the required elements into the document
            api.on(drawEvent, (e, ctx) => {
                if (settings !== ctx) {
                    return;
                }

                api.rows({ page: 'current' }).eq(0).each((idx) => {
                    // Internal data grab
                    var row = data[idx];

                    if (row._detailsShow) {
                        api.row(idx).details.show();
                    }
                });
            });

            // Column visibility change - update the colspan
            api.on(colvisEvent, (e, ctx, idx, vis) => {
                if (settings !== ctx) {
                    return;
                }

                // Update the colspan for the details rows (note, only if it already has
                // a colspan)
                var row, visible = $.fn.DataTable.ext.internal._fnVisbleColumns(ctx);

                for (var i = 0, ien = data.length; i < ien; i++) {
                    row = data[i];

                    if (row._details) {
                        row._details.children('td[colspan]').attr('colspan', visible);
                    }
                }
            });

            // Table destroyed - nuke any child rows
            api.on(destroyEvent, (e, ctx) => {
                if (settings !== ctx) {
                    return;
                }

                for (var i = 0, ien = data.length; i < ien; i++) {
                    if (data[i]._DT_RowDetails) {
                        api.row(i).details.destroy();
                    }
                }
            });
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
                //if ($(e.target).closest('table').get(0) !== $tableNode.get(0))
                //    return; 
                e.preventDefault();
                e.stopPropagation(); //stop propagation in order to work toggle for nested tables
                var row = this.dt.api.row($(e.target).closest('tr'));
                if (row.length == 0) return; //happens when user click on header row
                row.details.toggle(this.settings);
                return;
            });

            var columns = this.dt.api.settings()[0].oInit.columns;
            $.each(columns, (idx, column) => {
                if (column.iconColumn !== true) return;
                var iconColumn = this.dt.settings.aoColumns[idx];

                iconColumn.mRender = column.render = (innerData, type, rowData, meta) => {
                    var hasIcon = true;

                    var dtSettings = meta.settings;

                    //add custom cell props
                    if (type === "display") {
                        var dtRow = dtSettings.aoData[meta.row];
                        if (dtRow.anCells && dtRow.anCells.length > meta.col) {
                            var dtCell = dtRow.anCells[meta.col];
                            $(dtCell).addClass(this.settings.cell.className);
                        }
                    }

                    if ($.isFunction(this.settings.icon.hasIcon))
                        hasIcon = this.settings.icon.hasIcon.call(this.dt.api, rowData);
                    if (!hasIcon)
                        return this.settings.icon.defaultHtml || '';

                    var openIcon = $('<div/>', {
                        'class': this.settings.icon.className + ' dt-open-icon',
                        'html': (this.settings.icon.openHtml || '')
                    });
                    var closeIcon = $('<div/>', {
                        'class': this.settings.icon.className + ' dt-close-icon',
                        'style': 'display: none',
                        'html': (this.settings.icon.closeHtml || '')
                    });

                    var cellTmpl = $('<div/>', { 'class': 'dt-cell-icon' });
                    cellTmpl.append(openIcon, closeIcon);
                    return cellTmpl.html();
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

    if (angular) {
        angular.module('dt')
            .directive('dtRowDetails', [
                () => {
                    return {
                        restrict: 'A',
                        scope: true, //whitin new scope
                        compile: (tElement, tAttrs) => {
                            //Post compile
                            return (scope, iElement, iAttrs) => {
                                //console.log('row details created!');
                            };
                        }
                    }
                }
            ]);
    }

    //Register events
    $.fn.DataTable.models.oSettings.rowDetailsInitCompleted = [];

    //Register functions
    $.fn.DataTable.Api.register('hasRows()', function () {
        return this.rows().nodes()[0] instanceof HTMLElement;
    });
    $.fn.DataTable.Api.register('row().details()', function () {
        var dtSettings = this.settings()[0];
        var dtRow = dtSettings.aoData[this.index()];
        if (dtRow._DT_RowDetails)
            return dtRow._DT_RowDetails;
        var child = this.child();
        if (child == null) return null;
        var details = child.filter('.dt-detail-row').first();
        if (!details.length) return null;
        return details;
    });
    $.fn.DataTable.Api.register('row().details.hide()', function () {
        var dtSettings = this.settings()[0];
        var rowDetails: dt.RowDetails = dtSettings.rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        var details = this.details();
        if (details == null) return false;
        details.hide().detach();
        var dtRow = dtSettings.aoData[this.index()];
        dtRow._details = dtRow._details.filter(':not(.dt-detail-row)');
        if (!dtRow._details.length) {
            dtRow._detailsShow = false;
        }
        return true;
    });
    $.fn.DataTable.Api.register('row().details.show()', function () {
        var dtSettings = this.settings()[0];
        var rowDetails: dt.RowDetails = dtSettings.rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        var details = this.details();
        if (details == null) return false;
        var dtRow = dtSettings.aoData[this.index()];
        if (dtRow._details) {
            var arr = [details[0]]; //add as a first child
            dtRow._details.filter(':not(.dt-detail-row)').each((i, tr) => {
                arr.push(tr);
            });
            dtRow._details = $(arr);
        }
        dtRow._detailsShow = true;
        $(dtRow.nTr).after(details);
        return true;

    });
    $.fn.DataTable.Api.register('row().details.destroy()', function () {
        var dtSettings = this.settings()[0];
        var rowDetails: dt.RowDetails = dtSettings.rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        var details = this.details();
        if (details == null) return false;
        if (rowDetails.bindingAdapterInstance)
            rowDetails.bindingAdapterInstance.destroyDetails(details);
        details.remove();
        var dtRow = dtSettings.aoData[this.index()];
        dtRow._DT_RowDetails = null;
        var childs = dtRow._details.filter(':not(.dt-detail-row)');
        if (childs.length) {
            dtRow._details = childs;
        } else {
            dtRow._details = undefined;
            dtRow._detailsShow = undefined;
        }
        return true;
    });
    $.fn.DataTable.Api.register('row().details.create()', function (content, settings) {
        var dtSettings = this.settings()[0];
        var rowDetails: dt.RowDetails = dtSettings.rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        settings = $.extend(true, {}, rowDetails.settings, settings);
        var ctx = this.settings()[0];
        var created = $('<tr><td/></tr>')
            .addClass('dt-detail-row')
            .addClass(settings.expandRow.trClass)
            .hide();
        $('td', created)
            .addClass(settings.expandRow.tdClass)
            .html(content)
            .attr('colspan', $.fn.DataTable.ext.internal._fnVisbleColumns(ctx));

        var dtRow = dtSettings.aoData[this.index()];
        dtRow._DT_RowDetails = created;
        if (dtRow._details) {
            var arr = [created[0]]; //add as a first child
            dtRow._details.each((i, tr) => {
                arr.push(tr);
            });
            dtRow._details = $(arr);
        } else
            dtRow._details = created;
        // If the children were already shown, that state should be retained
        if (dtRow._detailsShow) {
            dtRow._details.insertAfter(dtRow.nTr);
        }
        return created;
    });
    $.fn.DataTable.Api.register('row().details.isOpen()', function () {
        var child = this.details();
        if (child == null) return false;
        return child.length && child.closest('html').length > 0 && child.is(':visible');
    });
    $.fn.DataTable.Api.register('row().details.fill()', function (completeAction, settings) {
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
        var isOpen = row.details.isOpen();

        if (row.details() != null) {
            row.details.destroy(); //destroy the old one
        }
        var innerDetails = $('<div />', {
            'class': 'innerDetails',
            'style': 'display:none',
        });
        var details = row.details.create(innerDetails, settings);
        row.details.show(); //add to dom
        var detailsTd = $('td', details);
        //transfer padding, margin and border to the div so that animation will work as it should
        innerDetails.css({
            'padding': detailsTd.css('padding'),
            'margin': detailsTd.css('margin'),
            'border-color': detailsTd.css('border-color'),
            'border-width': detailsTd.css('border-width'),
            'border-style': detailsTd.css('border-style'),
        });
        detailsTd.css('padding', '0');
        detailsTd.css('margin', '0');
        detailsTd.css('border-width', '0');
        
        var createdAction = (content?) => {
            if (content)
                innerDetails.html(content);

            if (rowDetails.bindingAdapterInstance)
                rowDetails.bindingAdapterInstance.rowCreated(row, details);

            if ($.isFunction(settings.rowCreated))
                settings.rowCreated.call(rowDetails, row, details);

            if (isOpen) { //if row was open reopen it
                row.details.expand({ animation: 'none' });
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
    $.fn.DataTable.Api.register('row().details.expand()', function (settings) {
        var dtSettings = this.settings()[0];
        var rowDetails: dt.RowDetails = dtSettings.rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        settings = $.extend(true, {}, rowDetails.settings, settings);
        var behavior = rowDetails.settings.behavior;

        var row = this;
        var subRow = row.details();
        //var dtRow = dtSettings.aoData[row.index()];

        var filledAction = () => {
            if (row.details.isOpen()) return;

            var td = $(row.node()).find('.' + settings.icon.className).closest('td'); //Icon td
            subRow = row.details();
            if (!subRow) return; //fillDetails failed because of detached cell
            subRow.css('display', '');
            var details = $('div.innerDetails', subRow);

            if (behavior === 'accordion') {
                if (rowDetails.lastOpenedRow && rowDetails.lastOpenedRow.index() !== row.index())
                    rowDetails.lastOpenedRow.details.collapse();
            }
            dt.RowDetails.animateElement(details, settings.animation, 'open', () => {
                    if (rowDetails.bindingAdapterInstance)
                        rowDetails.bindingAdapterInstance.rowExpanded(row, subRow, td);

                    if ($.isFunction(settings.rowExpanded))
                        settings.rowExpanded.call(rowDetails, row, td);
                }
            );

            $('.dt-open-icon', td).hide();
            $('.dt-close-icon', td).show();

            rowDetails.lastOpenedRow = row;
        };

        if (!subRow) {
            this.details.fill(filledAction, settings);
        } else {
            row.details.show();
            filledAction();
        }
    });
    $.fn.DataTable.Api.register('row().details.collapse()', function (settings) {
        var rowDetails = this.settings()[0].rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        settings = $.extend(true, {}, rowDetails.settings, settings);
        if (!this.details.isOpen()) return;

        var td = $(this.node()).find('.' + settings.icon.className).closest('td'); //Icon td
        var row = this;

        var destroyOnClose = settings.destroyOnClose == true;
        var detailsRows = row.details();
        var details = $('div.innerDetails', detailsRows);

        var afterHideAction = () => {
            if (rowDetails.bindingAdapterInstance)
                rowDetails.bindingAdapterInstance.rowCollapsed(row, detailsRows, td);

            if ($.isFunction(settings.rowCollapsed))
                settings.rowCollapsed(rowDetails, row, td);

            if (destroyOnClose == true) { //When destroyOnClose is set to false the details tr element is never removed (remains hidden)
                if ($.isFunction(settings.rowDestroying))
                    settings.rowDestroying.call(rowDetails, row, td);
                row.details.destroy();
            } else {
                row.details.hide();
            }
        };
        dt.RowDetails.animateElement(details, settings.animation, 'close', afterHideAction);

        $('.dt-close-icon', td).hide();
        $('.dt-open-icon', td).show();

        
    });
    $.fn.DataTable.Api.register('row().details.toggle()', function (settings) {
        this.details.isOpen() ? this.details.collapse(settings) : this.details.expand(settings);
    });
    $.fn.DataTable.Api.register('rows().details.collapse()', function (settings) {
        var api = this;
        this.iterator('row', function (dtSettings, row, thatIdx) {
            api.row(row).details.collapse(settings);
        });
    });
    $.fn.DataTable.Api.register('rows().details.expand()', function (settings) {
        var rowDetails: dt.RowDetails = this.settings()[0].rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        if (rowDetails.settings.behavior === 'accordion')
            throw 'expandAll is not supported when behavior is set to accordion';
        var api = this;
        this.iterator('row', function (dtSettings, row, thatIdx) {
            api.row(row).details.expand(settings);
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
        dt.RowDetails.intergateWithBootstrap();
    }

} (window, document, undefined));