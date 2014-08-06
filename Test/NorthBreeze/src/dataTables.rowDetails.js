var dt;
(function (dt) {
    var AngularRowDetailsAdapter = (function () {
        function AngularRowDetailsAdapter(api, settings) {
            this.dt = {
                settings: null,
                api: null
            };
            this.dt.api = api;
            this.dt.settings = api.settings()[0];
            this.settings = settings;
            this.$templateCache = this.dt.settings.oInit.angular.$templateCache;
        }
        AngularRowDetailsAdapter.prototype.rowExpanded = function (row, rowDetails) {
            var rowScope = angular.element(row.node()).scope();
            if (!rowScope)
                return;
            this.dt.settings.oInit.angular.$compile(row.child())(rowScope);
            if (!rowScope.$$phase)
                rowScope.$digest();
        };

        AngularRowDetailsAdapter.prototype.rowCollapsed = function (row, iconCell) {
            var rowScope = angular.element(row.node()).scope();
            if (!rowScope)
                return;
            if (!rowScope.$$phase)
                rowScope.$digest();
        };

        AngularRowDetailsAdapter.prototype.cacheTemplate = function (url, template) {
            this.$templateCache.put(url, template);
        };

        AngularRowDetailsAdapter.prototype.getTemplate = function (url) {
            return this.$templateCache.get(url);
        };
        return AngularRowDetailsAdapter;
    })();
    dt.AngularRowDetailsAdapter = AngularRowDetailsAdapter;

    var RowDetails = (function () {
        function RowDetails(api, settings) {
            this.dt = {
                settings: null,
                api: null
            };
            this.initialized = false;
            this.dom = {
                btnGroup: null,
                buttons: []
            };
            this.settings = $.extend(true, {}, RowDetails.defaultSettings, settings);
            this.dt.settings = api.settings()[0];
            this.dt.api = api;
            this.dt.settings.rowDetails = this;
            this.setupAdapters();
            this.registerCallbacks();
            this.createDomElements();

            $.each(this.dt.settings.aoColumns, function (i, col) {
                if (!col.iconColumn)
                    return;
                col.orderable = false;
                col.searchable = false;
                col.type = "html";
            });
        }
        RowDetails.animateElement = function (elem, animation, action, completeAction) {
            if (typeof completeAction === "undefined") { completeAction = null; }
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
        };

        RowDetails.prototype.setupAdapters = function () {
            this.setupBindingAdapter();
        };

        RowDetails.prototype.setupBindingAdapter = function () {
            if (!this.settings.bindingAdapter) {
                if (angular !== undefined)
                    this.settings.bindingAdapter = dt.AngularRowDetailsAdapter;
            }
            if (!this.settings.bindingAdapter)
                return;
            this.bindingAdapterInstance = new this.settings.bindingAdapter(this.dt.api, this.settings);
        };

        RowDetails.prototype.createDomElements = function () {
            var _this = this;
            var $tableNode = $(this.dt.api.table().node());
            $tableNode.on('click', '.' + this.settings.icon.className, function (e) {
                if ($(e.target).closest('table').get(0) !== $tableNode.get(0))
                    return;
                e.preventDefault();
                var row = _this.dt.api.row($(e.target).closest('tr'));
                if (row.length == 0)
                    return;
                row.toggleDetails(_this.settings);
                return;
            });

            var columns = this.dt.api.settings()[0].oInit.columns;
            $.each(columns, function (idx, column) {
                if (column.iconColumn !== true)
                    return;
                var iconColumn = _this.dt.settings.aoColumns[idx];

                iconColumn.mRender = column.render = function (innerData, type, rowData, meta) {
                    var hasIcon = true;
                    if ($.isFunction(_this.settings.icon.hasIcon))
                        hasIcon = _this.settings.icon.hasIcon.call(_this.dt.api, rowData);
                    if (!hasIcon)
                        return _this.settings.icon.defaultHtml || '';

                    var openIcon = $('<div/>', {
                        'class': _this.settings.className + ' dt-open-icon',
                        'html': (_this.settings.icon.openHtml || '')
                    });
                    var closeIcon = $('<div/>', {
                        'class': _this.settings.className + ' dt-close-icon',
                        'style': 'display: none',
                        'html': (_this.settings.icon.closeHtml || '')
                    });

                    var cell = $('<div/>', { 'class': 'dt-cell-icon' });
                    cell.append(openIcon, closeIcon);
                    return cell.html();
                };
                iconColumn.fnGetData = function (rowData, type, meta) {
                    return iconColumn.mRender(null, type, rowData, meta);
                };
            });

            this.setupButtons();
        };

        RowDetails.prototype.setupButtons = function () {
            var _this = this;
            var groupOpt = this.settings.buttonPanel;
            this.dom.btnGroup = $('<div/>').addClass(groupOpt.classes.join(' ')).attr(groupOpt.attrs);
            var lang = this.settings.language;
            $.each(this.settings.buttons, function (key, opt) {
                if (!opt.visible)
                    return;
                var btn = $('<' + opt.tagName + '/>').attr('title', lang[key]).attr(opt.attrs).addClass(opt.classes.join(' ')).on('click', function (e) {
                    return opt.click.call(_this, e);
                }).append(opt.html || lang[key]);
                _this.dom.buttons.push(btn);
                _this.dom.btnGroup.append(btn);
            });
        };

        RowDetails.prototype.getFeatureElement = function () {
            if (this.dom.buttons.length)
                return this.dom.btnGroup[0];
            else
                return null;
        };

        RowDetails.prototype.getTemplate = function (url) {
            if (this.bindingAdapterInstance)
                return this.bindingAdapterInstance.getTemplate(url);
            else
                return dt.RowDetails.templates[url];
        };

        RowDetails.prototype.hasTemplate = function (url) {
            if (this.bindingAdapterInstance)
                return !!this.bindingAdapterInstance.getTemplate(url);
            else
                return dt.RowDetails.templates.hasOwnProperty(url);
        };

        RowDetails.prototype.cacheTemplate = function (url, template) {
            if (this.bindingAdapterInstance)
                this.bindingAdapterInstance.cacheTemplate(url, template);
            else
                dt.RowDetails.templates[url] = template;
        };

        RowDetails.prototype.registerCallbacks = function () {
        };

        RowDetails.prototype.initialize = function () {
            this.initialized = true;
            this.dt.settings.oApi._fnCallbackFire(this.dt.settings, 'rowDetailsInitCompleted', 'rowDetailsInitCompleted', [this]);
        };
        RowDetails.defaultSettings = {
            animation: 'slide',
            icon: {
                className: 'row-detail-icon',
                closeHtml: '<button><span class="row-detail-icon">Close</span></button>',
                openHtml: '<button><span class="row-detail-icon">Open</span></button>',
                defaultHtml: '',
                hasIcon: function (row) {
                    return true;
                }
            },
            behavior: 'default',
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
                    click: function (e) {
                        e.preventDefault();
                        if (!this.dt.api.table().hasRows())
                            return;
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
                        if (!this.dt.api.table().hasRows())
                            return;
                        this.dt.api.table().rows().collapseAll();
                    }
                }
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
        };
        RowDetails.templates = {};
        return RowDetails;
    })();
    dt.RowDetails = RowDetails;
})(dt || (dt = {}));

(function (window, document, undefined) {
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
        if ($(this.node()).closest('html').length == 0) {
            if ($.isFunction(completeAction))
                completeAction(false);
            return;
        }

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
            'style': 'display:none'
        });
        row.child(innerDetails, settings.tdClass); //create child
        row.child().addClass(settings.trClass).css('display', 'none'); //add attributes
        row.child.show(); //add to dom

        var createdAction = function (content) {
            if (content)
                innerDetails.html(content);

            if (rowDetails.bindingAdapterInstance)
                rowDetails.bindingAdapterInstance.rowExpanded(row, innerDetails);

            if ($.isFunction(settings.created))
                settings.created.call(rowDetails, row, innerDetails);

            $(row.node()).data('detailsFilled', true); //set
            row.child().trigger('detailsFilled.dt');
            if (isOpen) {
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

            $.ajax(ajaxSettings).done(function (msg) {
                rowDetails.cacheTemplate(tplUrl, msg);
                createdAction(msg);
            });
        } else if ($.isFunction(settings.template)) {
            createdAction(settings.template.call(rowDetails, row));
        } else if ($.type(settings.template) === 'string') {
            var tpl = settings.template;
            if (tpl.charAt(0) === "<" && tpl.charAt(tpl.length - 1) === ">" && tpl.length >= 3) {
                createdAction(tpl);
            } else {
                createdAction($(tpl).html());
            }
        }
    });
    $.fn.DataTable.Api.register('row().openDetails()', function (settings) {
        var rowDetails = this.settings()[0].rowDetails;
        if (!rowDetails)
            throw 'RowDetails plugin is not initialized';
        settings = $.extend(true, {}, rowDetails.settings, settings);
        var behavior = rowDetails.settings.behavior;

        var row = this;

        var filledAction = function () {
            if (row.child.isShown() && row.child().is(':visible'))
                return;

            var td = $(row.node()).find('.' + settings.icon.className).closest('td');

            var subRow = row.child();
            if (!subRow)
                return;
            var detailsRows = subRow.css('display', '');
            $.each(detailsRows, function (idx, item) {
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
        if (!this.child.isShown() || !this.child().is(':visible'))
            return;

        var td = $(this.node()).find('.' + settings.icon.className).closest('td');
        var row = this;

        var destroyOnClose = settings.destroyOnClose == true;
        var detailsRows = row.child();
        var details = $('div.innerDetails', detailsRows);

        var afterHideAction = function () {
            if (destroyOnClose == true) {
                if ($.isFunction(settings.destroying))
                    settings.destroying.call(rowDetails, row, td);
                row.child.hide(); //this actually remove the children
                $(row.node()).data('detailsFilled', false);
            } else {
                details.hide();
                $.each(detailsRows, function (idx, item) {
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
        var rowDetails = this.settings()[0].rowDetails;
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
            this.one('init.dt', function () {
                rowDetails.initialize();
            });

        return rowDetails.getFeatureElement();
    });

    //Add as feature
    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().rowDetails.init(oSettings.oInit.rowDetails);
        },
        "cFeature": "D",
        "sFeature": "RowDetails"
    });

    var checkAngularModulePresence = function (moduleName) {
        if (angular === undefined)
            return false;
        try  {
            angular.module(moduleName);
            return true;
        } catch (err) {
            return false;
        }
    };

    //Integrate with boostrap 3 if present
    if ((typeof $().emulateTransitionEnd == 'function') || checkAngularModulePresence("ui.bootstrap") || checkAngularModulePresence("mgcrea.ngStrap")) {
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
}(window, document, undefined));
//# sourceMappingURL=dataTables.rowDetails.js.map
