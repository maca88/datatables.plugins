(function( window, document ) {


    var defaultSettings = {

        selectedState: 'default',

        states: {
            'default': { 'filter': ['Added', 'Modified', 'Unchanged', 'Detached'] },
            'all': { 'filter': [] },
            'added': { 'filter': ['Added'] },
            'modified': { 'filter': ['Modified'] },
            'unchanged': { 'filter': ['Unchanged'] },
            'edited': { 'filter': ['Added', 'Modified'] },
            'detached': { 'filter': ['Detached'] },
            'deleted': { 'filter': ['Deleted'] }
        },

        dom: {
            containerClass: '',
            selectClass: 'form-control'  
        },

        language: {
            'entityFilter': 'Entity filter',
            'default': 'Default',
            'all': 'All',
            'added': 'Added',
            'modified': 'Modified',
            'unchanged': 'Unchanged',
            'edited': 'Edited',
            'detached': 'Detached',
            'deleted': 'Deleted'
        }
    };

    $.fn.DataTable.ext.feature.push({
        "fnInit": function (dtSettings) {
            var dtInstance = dtSettings.oInstance;

            if (dtSettings.oInit.serverSide) {
                console.warn('This feature is not supported when serverSide is true');
                return null;
            }

            var settings = $.extend(true, {}, dtSettings.oInit.entityFilter, defaultSettings);

            var select = $('<select/>')
                .addClass(settings.dom.selectClass);

            $.each(settings.states, function (value, option) {
                select.append($('<option/>', {
                    'value': value,
                    'text': !!option.text ? option.text : (!!settings.language[value] ? settings.language[value] : value)
                    })
                    .prop('selected', (!!option.selected || settings.selectedState == value)));
            });

            $(dtSettings.oInstance).data('entityFilter', select);

            select.change(function () {
                setFilter();
                dtInstance.fnFilter();
            });

            setFilter();

            var container = $('<div />')
                .addClass('dt-entity-filter')
                .addClass(settings.dom.containerClass);
            if (!!settings.language.entityFilter)
                container.append($('<label />').html(settings.language.entityFilter));
            container.append(select);

            return container.get(0);

            function setFilter() {
                dtInstance.data('entityFilter', settings.states[select.val()].filter);
            }
        },
        "cFeature": "G",
        "sFeature": "breezeFilter"
    });

    $.fn.DataTable.ext.search.push(
        function (dtSettings, data, dataIndex) {
            if (dtSettings.aanFeatures['Y'] === undefined) return true;
            var dtInstance = dtSettings.oInstance;
            var api = dtInstance.api();
            if (dtSettings.oInit.serverSide) return true;
            var rowData = api.row(dataIndex).data();
            if (rowData.entityAspect == null || rowData.entityAspect.entityState == null) return true;

            var entityFilters = dtInstance.data('entityFilter');

            if (entityFilters.length == 0)
                return true;

            return entityFilters.indexOf(rowData.entityAspect.entityState.name) >= 0;
        }
    );
}(window, document));