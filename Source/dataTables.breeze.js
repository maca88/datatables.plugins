$.fn.DataTable.Api.register('settings().hasFeature()', function (c) {
    return this[0].aanFeatures[c] !== undefined;
});

$.fn.DataTable.ext.feature.push({
    "fnInit": function (settings) {
        var dtInstance = settings.oInstance;

        if (settings.oInit.serverSide) {
            console.warn('This feature is not supported when serverSide is true');
            return null;
        }

        var options = settings.oInit.entityFilter || {
            'default': { 'text': 'Default', 'filter': ['Added', 'Modified', 'Unchanged', 'Detached'], 'selected': true },
            'all': { 'text': 'All', 'filter': [] },
            'added': { 'text': 'Added', 'filter': ['Added'] },
            'modified': { 'text': 'Modified', 'filter': ['Modified'] },
            'unchanged': { 'text': 'Unchanged', 'filter': ['Unchanged'] },
            'edited': { 'text': 'Edited', 'filter': ['Added', 'Modified'] },
            'detached': { 'text': 'Detached', 'filter': ['Detached'] },
            'deleted': { 'text': 'Deleted', 'filter': ['Deleted'] }
        };

        var select = $('<select/>', { 'class': 'classFilter' });

        $.each(options, function (value, option) {
            select.append($('<option/>', { 'value': value, 'text': option.text }).prop('selected', (option.selected != null && option.selected)));
        });

        $(settings.oInstance).data('entityFilter', select);

        select.change(function () {
            setFilter();
            dtInstance.fnFilter();
        });

        setFilter();

        return select.get(0);

        function setFilter() {
            dtInstance.data('entityFilter', options[select.val()].filter);
        }
    },
    "cFeature": "Y",
    "sFeature": "entityFilter"
});

$.fn.DataTable.ext.search.push(
    function (settings, data, dataIndex) {
        var dtInstance = settings.oInstance;
        var api = dtInstance.api();
        if (!api.settings().hasFeature('Y') || settings.oInit.serverSide) return true;
        var rowData = api.row(dataIndex).data();
        if (rowData.entityAspect == null || rowData.entityAspect.entityState == null) return true;

        var entityFilters = dtInstance.data('entityFilter');

        if (entityFilters.length == 0)
            return true;

        return entityFilters.indexOf(rowData.entityAspect.entityState.name) >= 0;
    }
);