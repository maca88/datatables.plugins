(function( window, document, undefined ) {
    var defaultSettings = {
        animation: 'slide',
        icon: {
            'class': 'row-detail-icon',
            'closeHtml': '<button><span class="row-detail-icon">Close</span></button>',
            'openHtml': '<button><span class="row-detail-icon">Open</span></button>',
            'defaultHtml': '',
            'hasIcon': function (row) { return true; }
        },
        destroyOnClose: false,
        trClass: 'sub',
        tdClass: ''
    };

    $.fn.DataTable.Api.register('settings().init()', function () {
        return this[0].oInit;
    });

    $.fn.DataTable.Api.register('hasRows()', function () {
        return this.rows().nodes()[0] instanceof HTMLElement;
    });

    var animateElement = function(elem, animation, action, completeAction) {
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
                throw 'not valid animation ' + settings.animation;
        }
    };

    $.fn.DataTable.Api.register('row().isOpen()', function () {
        var child = this.child();
        return child != null && child.closest('html').length > 0 && child.is(':visible');
    });

    $.fn.DataTable.Api.register('row().fillDetails()', function (completeAction, settings) {
        if ($(this.node()).closest('html').length == 0) {
            if ($.isFunction(completeAction))
                completeAction(false);
            return;
        } //we will not fill rows that are detached
        settings = $.extend({}, defaultSettings, settings);
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

        var init = this.settings().init();
        if (init != null && $.isFunction(init.rowDetailCreated))
            init.rowDetailCreated(row, innerDetails, settings);
    
        $(row.node()).data('detailsFilled', true); //set 
        row.child().trigger('detailsFilled.dt');
        if (isOpen) { //if row was open reopen it
            row.openDetails({ animation: 'none' });
        }
        if ($.isFunction(completeAction))
            completeAction(true);
    });

    $.fn.DataTable.Api.register('row().openDetails()', function (settings) {
        settings = $.extend({}, defaultSettings, settings);

        var filledAction = function () {
            if (this.child.isShown() && this.child().is(':visible')) return;

            var td = $(this.node()).find('.' + settings.icon.class).closest('td'); //Icon td
            var detailsRows = this.child().css('display', '');
            $.each(detailsRows, function (idx, item) {
                animateElement($(item), settings.animation, 'open');
                $(item).slideDown();
            });
            var details = $('div.innerDetails', detailsRows);
            animateElement(details, settings.animation, 'open');

            $('.dt-open-icon', td).hide();
            $('.dt-close-icon', td).show();
       
            var init = this.settings().init();
            if (init != null && $.isFunction(init.rowDetailOpened))
                init.rowDetailOpened(this, td, settings);
        }.bind(this);

        if ($(this.node()).data('detailsFilled') !== true) {
            this.fillDetails(filledAction, settings);
        } else {
            filledAction();
        }
    });

    $.fn.DataTable.Api.register('row().closeDetails()', function (settings) {
        settings = $.extend({}, defaultSettings, settings);
        if (!this.child.isShown() || !this.child().is(':visible')) return;

        var td = $(this.node()).find('.' + settings.icon.class).closest('td'); //Icon td
        var row = this;

        var destroyOnClose = settings.destroyOnClose == true;
        var detailsRows = row.child();
        var details = $('div.innerDetails', detailsRows);
        var init = this.settings().init() || {};


        var afterHideAction = function () {
            if (destroyOnClose == true) { //When destroyOnClose is set to false the details tr element is never removed (remains hidden)
                if ($.isFunction(init.rowDetailDestroying))
                    init.rowDetailDestroying(row, td, settings);
                row.child.hide(); //this actually remove the children
                $(row.node()).data('detailsFilled', false);
            } else {
                details.hide();
                $.each(detailsRows, function (idx, item) {
                    $(item).hide(); //this will hide the children
                });
            }
        };
        animateElement(details, settings.animation, 'close', afterHideAction);

        $('.dt-close-icon', td).hide();
        $('.dt-open-icon', td).show();

        
        if ($.isFunction(init.rowDetailClosed))
            init.rowDetailClosed(this, td, settings);
    });

    $.fn.DataTable.Api.register('row().toggleDetails()', function (settings) {
        this.isOpen() ? this.closeDetails(settings) : this.openDetails(settings);
    });

    $.fn.DataTable.Api.prototype.rowDetails = function (settings) {
        settings = $.extend({}, defaultSettings, settings);
        var table = this.table();
        var $tableNode = $(this.table().node());
        $tableNode.on('click', '.' + settings.icon.class, function (e) {
            e.preventDefault();
            var row = table.row($(e.target).closest('tr'));
            if (row.length == 0) return; //happens when user click on header row
            row.toggleDetails(settings);
            return;
        });

    
        var columns = this.settings().init().columns || this.settings().init().columnDefs;
        $.each(columns, function (idx, column) {
            if (column.iconColumn !== true) return;
            var iconColumn = table.settings()[0].aoColumns[idx];

            iconColumn.mRender = column.render = function (innerData, sSpecific, oData) {
                var hasIcon = true;
                if ($.isFunction(settings.icon.hasIcon))
                    hasIcon = settings.icon.hasIcon(oData, table);
                if (!hasIcon)
                    return settings.icon.defaultHtml || '';

                var openIcon = $('<div/>', {
                    'class': settings.class + ' dt-open-icon',
                    'html': (settings.icon.openHtml || '')
                });
                var closeIcon = $('<div/>', {
                    'class': settings.class + ' dt-close-icon',
                    'style': 'display: none',
                    'html': (settings.icon.closeHtml || '')
                });

                var cell = $('<div/>', { 'class': 'dt-cell-icon' });
                cell.append(openIcon, closeIcon);
                return cell.html();
            };

            iconColumn.fnGetData = function (oData, sSpecific) {
                return iconColumn.mRender(null, sSpecific, oData);
            };

        });


        var btnGroup = $('<div/>', { 'class': 'btn-group' });

        var btnCollapseAll = $('<div/>', { 'class': 'btn btn-default btn-sm', 'title': 'Collapse all' }).append(
            $('<span/>', { 'class': 'glyphicon glyphicon-move' })
        );
    

        btnCollapseAll.click(function (e) {
            e.preventDefault();
            if (!this.table().hasRows()) return;
            table.rows({ page: 'current' }).nodes().each(function (tr) {
                table.row(tr).closeDetails();
            });
        }.bind(this));

        var btnExpandAll = $('<div/>', { 'class': 'btn btn-default btn-sm', 'title': 'Expand all' }).append(
            $('<span/>', { 'class': 'glyphicon glyphicon-fullscreen' })
        );
        btnExpandAll.click(function (e) {
            e.preventDefault();

            if (!this.table().hasRows()) return;
            this.table().rows({ page: 'current' }).nodes().each(function (tr) {
                table.row(tr).openDetails();
            });
        }.bind(this));

        btnGroup.append(btnCollapseAll, btnExpandAll);

        return btnGroup.get(0);
    };

    $.fn.dataTable.ext.feature.push({
        "fnInit": function (oSettings) {
            return oSettings.oInstance.api().rowDetails(oSettings.oInit.rowDetails);
        },
        "cFeature": "D",
        "sFeature": "RowDetails"
    });

}(window, document));