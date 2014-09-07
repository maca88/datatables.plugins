var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var dt;
(function (dt) {
    (function (editable) {
        (function (breeze) {
            var b = window.breeze;
            var Editable = dt.editable.Editable;

            //#region Breeze data adapter
            var DataService = (function (_super) {
                __extends(DataService, _super);
                function DataService(api, settings, i18Service) {
                    _super.call(this, api, settings, i18Service);
                    if (!$.isFunction(this.settings.createItem))
                        throw "'createItem' setting property must be provided in order to work with breeze DataAdapter";
                }
                DataService.prototype.removeItems = function (items) {
                    var removed = [];
                    for (var i = 0; i < items.length; i++) {
                        var entity = items[i].data();
                        entity.entityAspect.setDeleted();
                        if (entity.entityAspect.entityState === b.EntityState.Detached)
                            continue;

                        //TODO: check if is an simple or breeze array if not simple we have to add to the deleted entities
                        this.removedItems.push(entity);
                        removed.push(items[i]);
                    }
                    return removed;
                };

                DataService.prototype.restoreRemovedItems = function () {
                    var restored = [];
                    for (var i = 0; i < this.removedItems.length; i++) {
                        var entity = this.removedItems[i];
                        entity.entityAspect.rejectChanges();

                        //TODO: check if is an simple or breeze array if not simple we have to add to the deleted entities
                        restored.push(entity);
                    }
                    this.removedItems.length = 0;
                    return restored;
                };

                DataService.prototype.rejectItems = function (items) {
                    var rejected = [];
                    for (var i = 0; i < items.length; i++) {
                        var entity = items[i].data();
                        entity.entityAspect.rejectChanges();
                        rejected.push(items[i]);
                    }
                    return rejected;
                };

                DataService.prototype.validateItem = function (row) {
                    var errors = _super.prototype.validateItem.call(this, row), i;

                    //Validate each property
                    var columns = this.getEditableColumns();
                    var columnMap = {};
                    for (i = 0; i < columns.length; i++) {
                        errors = errors.concat(this.validateItemProperty(columns[i], row));
                        columnMap[columns[i].mData] = columns[i];
                    }

                    //Validate the whole entity
                    var entity = row.data();
                    if (entity.entityType == null || entity.entityAspect == null)
                        throw 'Editing non breeze entities is not supported!';
                    if (entity.entityAspect.validateEntity())
                        return errors;
                    var entityErrors = entity.entityAspect.getValidationErrors();

                    for (i = 0; i < entityErrors.length; i++) {
                        var error = entityErrors[i];
                        var validator = error.validator;
                        if (columnMap.hasOwnProperty(error.propertyName))
                            continue;
                        errors.push(new editable.ValidationError(error.errorMessage, new editable.Validator(validator.name, validator.context), error.propertyName));
                    }
                    return errors;
                };

                DataService.prototype.validateItemProperty = function (column, row) {
                    var errors = _super.prototype.validateItemProperty.call(this, column, row);
                    var entity = row.data();
                    if (entity.entityType == null || entity.entityAspect == null)
                        throw 'Editing non breeze entities is not supported!';
                    return errors.concat(this.validateEntityProperty(column, entity));
                };

                DataService.prototype.validateEntityProperty = function (column, entity) {
                    var errors = [];
                    var subEntity = this.getEntityByPath(entity, column.mData);
                    var propName = column.mData.split('.').pop();
                    if (subEntity.entityAspect.validateProperty(propName))
                        return errors;
                    var entityErrors = subEntity.entityAspect.getValidationErrors();
                    $.each(entityErrors, function (idx, err) {
                        if (err.propertyName != propName)
                            return;
                        var validator = err.validator;
                        errors.push(new editable.ValidationError(err.errorMessage, new editable.Validator(validator.name, validator.context, column), err.propertyName));
                    });
                    return errors;
                };

                //mData support: prop, prop.subProp.subSubProp, prop[1].subProp
                DataService.prototype.getEntityByPath = function (entity, fullpath) {
                    var currentEntity = entity;
                    var arrRegex = /([\w\d]+)\[([\d]+)\]/i;
                    var paths = fullpath.split('.');
                    for (var i = 0; i < paths.length; i++) {
                        var path = paths[i];
                        if (i == (paths.length - 1)) {
                            return currentEntity;
                        }
                        var matches = path.match(arrRegex);
                        currentEntity = (matches) ? currentEntity[matches[1]][parseInt(matches[2])] : currentEntity[path];
                    }
                    return null;
                };
                DataService.$inject = ['api', 'settings', 'i18Service'];
                return DataService;
            })(editable.DefaultDataSerice);
            breeze.DataService = DataService;

            //Register plugins
            Editable.defaultSettings.services.data.type = DataService;
        })(editable.breeze || (editable.breeze = {}));
        var breeze = editable.breeze;
    })(dt.editable || (dt.editable = {}));
    var editable = dt.editable;
})(dt || (dt = {}));
//# sourceMappingURL=dataTables.angular.editable.breeze.js.map
