//Breeze plugin
angular.module("dt").config([
    "dtSettings", function (dtSettings) {
        //Watch entity properties
        /*
        dtSettings.dtFillWatchedPropertiesActions.push((propArr, rowData) => {
        var idx = propArr.indexOf("entityAspect");
        if (idx < 0) return;
        propArr.splice(idx, 1);
        var store = rowData["_backingStore"] || {};
        angular.forEach(store, (val, key) => {
        if (propArr.indexOf(key) >= 0) return;
        propArr.push(key);
        });
        }); */
    }
]);
//# sourceMappingURL=angular.dataTables.breeze.js.map
