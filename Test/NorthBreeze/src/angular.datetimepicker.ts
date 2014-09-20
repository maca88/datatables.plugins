(function() {
    'use strict';

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


    if (!checkAngularModulePresence('angularMoment')) {
        angular.module('angularMoment', [])
            .constant('moment', (<any>window).moment);
    }

    angular.module('eonasdan', ['angularMoment'])
        .directive('bsDatetimePicker', [
            '$timeout', 'moment',
            ($timeout, moment) => {
            return {
                    restrict: 'AC',
                    require: "?ngModel",
                    compile: (tInput, tAttrs) => {
                        var dtInstance = null,
                            key,
                            propVal,
                            momentDate;

                    return {
                            pre: (scope, input, attrs, controller) => {
                                var wrapper;

                                if (attrs.bsIcon !== undefined || attrs.bsClearIcon !== undefined) {
                                    var clearIcon = tAttrs.bsClearIcon ? tAttrs.bsClearIcon : 'remove';
                                    var dateIcon = tAttrs.bsIcon ? tAttrs.bsIcon : 'calendar';

                                    wrapper = $('<div />')
                                        .addClass('input-group date');

                                    var leftIcon = '';
                                    var rightIcon = '';

                                    if (tAttrs.bsIcon !== undefined && tAttrs.bsClearIcon !== undefined) {
                                        leftIcon = '<span class="input-group-addon datepickerbutton">' +
                                        '<span class="glyphicon glyphicon-' + dateIcon + '" ></span>' +
                                        '</span>';
                                        rightIcon += '<span class="input-group-addon datepickerclear">' +
                                        '<span class="glyphicon glyphicon-' + clearIcon + '" ></span>' +
                                        '</span>';
                                    } else { //only one icon is present, position it to the left
                                        rightIcon = '<span class="input-group-addon ' + (tAttrs.bsClearIcon !== undefined ? 'datepickerclear' : '') + '">' +
                                        '<span class="glyphicon glyphicon-' + (tAttrs.bsClearIcon !== undefined ? clearIcon : dateIcon) + '" ></span>' +
                                        '</span>';
                                        if (tAttrs.bsClearIcon !== undefined)
                                            input.addClass('datepickerbutton');
                                    }

                                    if (leftIcon)
                                        wrapper.append(leftIcon);

                                    wrapper.insertBefore(input);
                                    input.appendTo(wrapper);
                                    wrapper.append(rightIcon);
                                }

                                var dpElem = wrapper ? wrapper : input;

                                dpElem.on('change', (e) => { //we have to stop popragating the change event so that we wont have string in the model
                                    e.stopImmediatePropagation();
                                });

                                if (!controller) return;

                                dpElem.on('dp.change', (e) => {
                                    e.stopImmediatePropagation(); //isolate

                                    if (scope.$$phase || scope.$root.$$phase) {
                                        return;
                                    }
                                    scope.$apply(() => {
                                        controller.$setViewValue(momentDate ? e.date : (e.date ? e.date.toDate() : null));
                                    });
                                });
                            },
                            post: (scope, input, attrs, controller) => {
                                var settings = attrs.bsSettings ? scope.$eval(attrs.bsSettings) : (attrs.bsDateTimePicker ? scope.$eval(attrs.bsDateTimePicker) : {}),
                                    dpElem = input.parent().is('div.date') ? input.parent() : input;

                                //attributes have higher priority
                                for (key in tAttrs) {
                                    if (!key || key.indexOf('dp') !== 0 || key.length < 3) continue;
                                    propVal = tAttrs[key];
                                    key = key.substring(2);
                                    key = key[0].toLowerCase() + key.slice(1); //lower the first letter
                                    if (propVal.toUpperCase() == 'TRUE')
                                        propVal = true;
                                    else if (propVal.toUpperCase() == 'FALSE')
                                        propVal = false;
                                    else if (propVal.length && (propVal[0] == '{' || propVal[0] == '['))
                                        propVal = scope.$eval(propVal);
                                    settings[key] = propVal;
                                }
                                //Eval options
                                if (settings.minDate)
                                    settings.minDate = scope.$eval(settings.minDate);
                                if (settings.maxDate)
                                    settings.maxDate = scope.$eval(settings.maxDate);
                                if (angular.isString(settings.disabledDates))
                                    settings.disabledDates = scope.$eval(settings.disabledDates);
                                if (angular.isString(settings.enabledDates))
                                    settings.enabledDates = scope.$eval(settings.enabledDates);

                                if (controller) {
                                    // viewValue -> $parsers -> modelValue
                                    controller.$parsers.unshift((viewValue) => {
                                        // console.warn('$parser("%s"): viewValue=%o', element.attr('ng-model'), viewValue);
                                        // Null values should correctly reset the model value & validity
                                        if (!viewValue) {
                                            controller.$setValidity('date', true);
                                            return null;
                                        }
                                        var parsedDate = moment(viewValue) || controller.$dateValue;
                                        if (!parsedDate || !parsedDate.isValid()) {
                                            controller.$setValidity('date', false);
                                            return null; 
                                        } else {
                                            var isMinValid = !settings.minDate || settings.minDate.isBefore(parsedDate);
                                            var isMaxValid = !settings.maxDate || settings.maxDate.isAfter(parsedDate);
                                            var isValid = isMinValid && isMaxValid;
                                            controller.$setValidity('date', isValid);
                                            controller.$setValidity('min', isMinValid);
                                            controller.$setValidity('max', isMaxValid);
                                            // Only update the model when we have a valid date
                                            if (isValid) controller.$dateValue = parsedDate;
                                        }
        
                                        return momentDate ? parsedDate : parsedDate.toDate();
                                    });

                                    // modelValue -> $formatters -> viewValue
                                    controller.$formatters.push((modelValue) => {
                                        // console.warn('$formatter("%s"): modelValue=%o (%o)', element.attr('ng-model'), modelValue, typeof modelValue);
                                        var date;
                                        if (angular.isUndefined(modelValue) || modelValue === null) {
                                            date = null;
                                        } else {
                                            date = moment(modelValue);
                                            date = date.isValid() ? date : null;
                                        }
                                        controller.$dateValue = date;
                                        return controller.$dateValue;
                                    });

                                    controller.$render = () => {
                                        if (dtInstance)
                                            dtInstance.setValue(controller.$viewValue !== undefined ? controller.$viewValue : null);
                                    };

                                    // Watch the model for programmatic changes
                                    scope.$watch(tAttrs.ngModel, (val) => {
                                        if (val === undefined)
                                            return;
                                        momentDate = val && val._isAMomentObject === true;
                                        controller.$render();
                                    });

                                    //watch for minDate changes
                                    if (tAttrs.dpMinDate) {
                                        scope.$watch(tAttrs.dpMinDate, (val) => {
                                            if (dtInstance)
                                                dtInstance.setMinDate(val);
                                        });
                                    }

                                    //watch for maxDate changes
                                    if (tAttrs.dpMaxDate) {
                                        scope.$watch(tAttrs.dpMaxDate, (val) => {
                                            if (dtInstance)
                                                dtInstance.setMaxDate(val);
                                        });
                                    }

                                    //watch for disabledDates changes
                                    if (tAttrs.dpDisabledDates) {
                                        scope.$watch(tAttrs.dpDisabledDates, (val) => {
                                            if (dtInstance)
                                                dtInstance.setDisabledDates(val);
                                        });
                                    }

                                    //watch for disabledDates changes
                                    if (tAttrs.dpEnabledDates) {
                                        scope.$watch(tAttrs.enabledDates, (val) => {
                                            if (dtInstance)
                                                dtInstance.setEnabledDates(val);
                                        });
                                    }
                                    
                                }

                                $timeout(() => {
                                    dpElem.datetimepicker(settings);
                                    dtInstance = dpElem.data("DateTimePicker");
                                    input.on("$destroy", () => {
                                        dtInstance.destroy();
                                    });

                                    if (controller)
                                        controller.$render();

                                    attrs.$observe('disabled', (value) => {
                                        if (value !== undefined)
                                            dtInstance.disable();
                                        else
                                            dtInstance.enable();
                                    });

                                    attrs.$observe('readonly', (value) => {
                                        if (!angular.isFunction(dtInstance.readonly)) return;
                                        if (value !== undefined)
                                            dtInstance.readonly(true);
                                        else
                                            dtInstance.readonly(false);
                                    });

                                    //watch the fieldset if present
                                    var fieldset = dpElem.closest('fieldset');
                                    if (fieldset.length && fieldset.attr('ng-disabled')) {
                                        scope.$watch(fieldset.attr('ng-disabled'), (newVal) => {
                                            if (newVal === undefined) return;
                                            newVal ? dtInstance.disable() : dtInstance.enable();
                                        });
                                    } else if (fieldset.length && fieldset.prop('disabled')) {
                                        dtInstance.disable();
                                    }
                                });
                            },
                        }
                    }
                }
        }
        ]);

})();





