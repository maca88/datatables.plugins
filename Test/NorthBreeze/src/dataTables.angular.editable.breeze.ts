module dt.editable.breeze {

    var b: any = (<any>window).breeze;
    var Editable = dt.editable.Editable;

    //#region Breeze data adapter

    export class DataService extends DefaultDataSerice {
        private deletedEntities = [];

        public static $inject = ['api', 'settings', 'i18Service']
        constructor(api, settings, i18Service) {
            super(api, settings, i18Service);
            if (!$.isFunction(this.settings.createItem))
                throw "'createItem' setting property must be provided in order to work with breeze DataAdapter";
        }

        public removeItems(items: any[]): any[] {
            var removed = [];
            for (var i = 0; i < items.length; i++) {
                var entity = items[i].data();
                entity.entityAspect.setDeleted();
                if (entity.entityAspect.entityState === b.EntityState.Detached) continue;
                //TODO: check if is an simple or breeze array if not simple we have to add to the deleted entities
                this.deletedEntities.push(entity);
                removed.push(items[i]);
            }
            return removed;
        }

        public restoreRemovedItems(): any[] {
            var restored = [];
            for (var i = 0; i < this.deletedEntities.length; i++) {
                var entity = this.deletedEntities[i];
                entity.entityAspect.rejectChanges();
                restored.push(entity);
            }
            return restored;
        }

        public rejectItems(items: any[]): any[] {
            var rejected = [];
            for (var i = 0; i < items.length; i++) {
                var entity = items[i].data();
                entity.entityAspect.rejectChanges();
                rejected.push(items[i]);
            }
            return rejected;
        }

        public validateItem(row): ValidationError[] {
            var errors: ValidationError[] = super.validateItem(row), i;
            //Validate each property
            var columns = this.getEditableColumns();
            var columnMap: any = {};
            for (i = 0; i < columns.length; i++) {
                errors = errors.concat(this.validateItemProperty(columns[i], row));
                columnMap[columns[i].mData] = columns[i];
            }

            //Validate the whole entity
            var entity = row.data();
            if (entity.entityType == null || entity.entityAspect == null)
                throw 'Editing non breeze entities is not supported!';
            if (entity.entityAspect.validateEntity()) return errors;
            var entityErrors = entity.entityAspect.getValidationErrors();
            //Add only errors that belongs to the entity as a whole or a property that is not specified in the dt columns
            for (i = 0; i < entityErrors.length; i++) {
                var error = entityErrors[i];
                var validator = error.validator;
                if (columnMap.hasOwnProperty(error.propertyName)) continue;
                errors.push(new ValidationError(error.errorMessage,
                    new Validator(validator.name, validator.context), error.propertyName));
            }
            return errors;
        }

        public validateItemProperty(column, row): ValidationError[] {
            var errors: ValidationError[] = super.validateItemProperty(column, row);
            var entity = row.data();
            if (entity.entityType == null || entity.entityAspect == null)
                throw 'Editing non breeze entities is not supported!';
            return errors.concat(this.validateEntityProperty(column, entity));
        }


        private validateEntityProperty(column, entity) {
            var errors: ValidationError[] = [];
            var subEntity = this.getEntityByPath(entity, column.mData);
            var propName = column.mData.split('.').pop();
            if (subEntity.entityAspect.validateProperty(propName))
                return errors;
            var entityErrors = subEntity.entityAspect.getValidationErrors();
            $.each(entityErrors, (idx, err) => {
                if (err.propertyName != propName) return;
                var validator = err.validator;
                errors.push(new ValidationError(err.errorMessage, new Validator(validator.name, validator.context, column), err.propertyName));
            });
            return errors;
        }

        //mData support: prop, prop.subProp.subSubProp, prop[1].subProp
        private getEntityByPath(entity, fullpath): any {
            var currentEntity = entity;
            var arrRegex = /([\w\d]+)\[([\d]+)\]/i;
            var paths = fullpath.split('.');
            for (var i = 0; i < paths.length; i++) {
                var path = paths[i];
                if (i == (paths.length - 1)) { //last iteration
                    return currentEntity;
                }
                var matches = path.match(arrRegex);
                currentEntity = (matches)
                ? currentEntity[matches[1]][parseInt(matches[2])]
                : currentEntity[path];
            }
            return null;
        }
    }

    //Register plugins
    Editable.defaultSettings.services.data.type = DataService;

    //#endregion

} 