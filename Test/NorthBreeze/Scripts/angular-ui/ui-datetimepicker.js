angular.module('ui.bootstrap.datetimepicker', [
        'ui.bootstrap.dateparser', 'ui.bootstrap.position',
        'template/datetimepicker/datetimepicker.html', 'template/datetimepicker/day.html',
        'template/datetimepicker/time.html'
    ])
    .constant('datetimepickerConfig', {
        formatDay: 'dd',
        formatMonth: 'MMMM',
        formatYear: 'yyyy',
        formatDayHeader: 'EEE',
        formatDayTitle: 'MMMM yyyy',
        formatMonthTitle: 'yyyy',
        datetimepickerMode: 'day',
        minMode: 'time',
        maxMode: 'year',
        showWeeks: true,
        startingDay: 0,
        yearRange: 20,
        minDate: null,
        maxDate: null,

        //timepicker
        hourStep: 1,
        minuteStep: 1,
        showMeridian: true,
        meridians: null,
        readonlyInput: false,
        mousewheel: true,

        //extra
        showTime: true,
        showDate: true,
    })
    .controller('DatetimepickerController', [
        '$scope', '$attrs', '$parse', '$interpolate', '$timeout', '$log', '$locale', 'dateFilter', 'datetimepickerConfig',
        function($scope, $attrs, $parse, $interpolate, $timeout, $log, $locale, dateFilter, datetimepickerConfig) {
            var self = this,
                ngModelCtrl = { $setViewValue: angular.noop }; // nullModelCtrl;

            // Modes chain
            this.modes = ['time', 'day', 'month', 'year'];

            // Configuration attributes
            angular.forEach([
                'formatDay', 'formatMonth', 'formatYear', 'formatDayHeader', 'formatDayTitle', 'formatMonthTitle',
                'minMode', 'maxMode', 'showWeeks', 'startingDay', 'yearRange', 'showTime', 'showDate'
            ], function(key, index) {
                self[key] = angular.isDefined($attrs[key]) ? (index < 8 ? $interpolate($attrs[key])($scope.$parent) : $scope.$parent.$eval($attrs[key])) : datetimepickerConfig[key];
            });

            // Watchable date attributes
            angular.forEach(['minDate', 'maxDate'], function(key) {
                if ($attrs[key]) {
                    $scope.$parent.$watch($parse($attrs[key]), function(value) {
                        self[key] = value ? new Date(value) : null;
                        self.refreshView();
                    });
                } else {
                    self[key] = datetimepickerConfig[key] ? new Date(datetimepickerConfig[key]) : null;
                }
            });

            $scope.showTime = self.showTime;
            $scope.showDate = self.showDate;
            angular.forEach(['showTime', 'showDate'], function(key) {
                if ($attrs[key]) {
                    $scope.$parent.$watch($parse($attrs[key]), function(value) {
                        $scope[key] = value;
                        if (key == 'showTime') {
                            self.minMode = value ? 'time' : 'day';
                            if (self.modes.indexOf($scope.datetimepickerMode) < self.modes.indexOf(self.minMode)) {
                                $scope.datetimepickerMode = self.minMode;
                            }
                        }
                        else if (key == 'showDate') {
                            self.maxMode = value ? 'year' : 'time';
                            if (self.modes.indexOf($scope.datetimepickerMode) > self.modes.indexOf(self.maxMode)) {
                                $scope.datetimepickerMode = self.maxMode;
                            }
                        }
                        self.refreshView();
                    });
                }
            });

            $scope.datetimepickerMode = $scope.datetimepickerMode || datetimepickerConfig.datetimepickerMode;
            $scope.uniqueId = 'datetimepicker-' + $scope.$id + '-' + Math.floor(Math.random() * 10000);
            this.activeDate = angular.isDefined($attrs.initDate) ? $scope.$parent.$eval($attrs.initDate) : new Date();

            $scope.isActive = function(dateObject) {
                if (self.compare(dateObject.date, self.activeDate) === 0) {
                    $scope.activeDateId = dateObject.uid;
                    return true;
                }
                return false;
            };

            this.init = function(ngModelCtrl_) {
                ngModelCtrl = ngModelCtrl_;

                ngModelCtrl.$render = function() {
                    self.render();
                };
            };

            this.render = function() {
                if (ngModelCtrl.$modelValue) {
                    var date = new Date(ngModelCtrl.$modelValue),
                        isValid = !isNaN(date);

                    if (isValid) {
                        this.activeDate = date;
                    } else {
                        $log.error('Datepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
                    }
                    ngModelCtrl.$setValidity('date', isValid);
                    ngModelCtrl.$setValidity('time', isValid);
                }
                this.refreshView();
            };

            this.refreshView = function() {
                if (this.element) {
                    this._refreshView();

                    var date = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
                    ngModelCtrl.$setValidity('date-disabled', !date || (this.element && !this.isDisabled(date)));
                }
            };

            this.createDateObject = function(date, format) {
                var model = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
                return {
                    date: date,
                    label: dateFilter(date, format),
                    selected: model && this.compare(date, model) === 0,
                    disabled: this.isDisabled(date),
                    current: this.compare(date, new Date()) === 0
                };
            };

            this.isDisabled = function(date) {
                return ((this.minDate && this.compare(date, this.minDate) < 0) || (this.maxDate && this.compare(date, this.maxDate) > 0) || ($attrs.dateDisabled && $scope.dateDisabled({ date: date, mode: $scope.datetimepickerMode })));
            };

            // Split array into smaller arrays
            this.split = function(arr, size) {
                var arrays = [];
                while (arr.length > 0) {
                    arrays.push(arr.splice(0, size));
                }
                return arrays;
            };

            $scope.select = function(date) {
                if ($scope.datetimepickerMode == 'day' || $scope.datetimepickerMode === self.minMode) {
                    var dt = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : new Date(0, 0, 0, 0, 0, 0, 0);
                    dt.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                    ngModelCtrl.$setViewValue(dt);
                    ngModelCtrl.$render();
                } else {
                    self.activeDate = date;
                    $scope.datetimepickerMode = self.modes[self.modes.indexOf($scope.datetimepickerMode) - 1];
                }
            };

            $scope.move = function(direction) {
                var year = self.activeDate.getFullYear() + direction * (self.step.years || 0),
                    month = self.activeDate.getMonth() + direction * (self.step.months || 0);
                self.activeDate.setFullYear(year, month, 1);
                self.refreshView();
            };

            $scope.toggleMode = function(direction) {
                direction = direction || 1;

                if (($scope.datetimepickerMode === self.maxMode && direction === 1) || ($scope.datetimepickerMode === self.minMode && direction === -1)) {
                    return;
                }

                $scope.datetimepickerMode = self.modes[self.modes.indexOf($scope.datetimepickerMode) + direction];
            };

            // Key event mapper
            $scope.keys = { 13: 'enter', 32: 'space', 33: 'pageup', 34: 'pagedown', 35: 'end', 36: 'home', 37: 'left', 38: 'up', 39: 'right', 40: 'down' };

            var focusElement = function() {
                $timeout(function() {
                    self.element[0].focus();
                }, 0, false);
            };

            // Listen for focus requests from popup directive
            $scope.$on('datetimepicker.focus', focusElement);

            $scope.keydown = function(evt) {
                var key = $scope.keys[evt.which];

                if (!key || evt.shiftKey || evt.altKey) {
                    return;
                }

                evt.preventDefault();
                evt.stopPropagation();

                if (key === 'enter' || key === 'space') {
                    if (self.isDisabled(self.activeDate)) {
                        return; // do nothing
                    }
                    $scope.select(self.activeDate);
                    focusElement();
                } else if (evt.ctrlKey && (key === 'up' || key === 'down')) {
                    $scope.toggleMode(key === 'up' ? 1 : -1);
                    focusElement();
                } else {
                    self.handleKeyDown(key, evt);
                    self.refreshView();
                }
            };


            //TIMEPICKER
            var meridians = angular.isDefined($attrs.meridians) ? $scope.$parent.$eval($attrs.meridians) : datetimepickerConfig.meridians || $locale.DATETIME_FORMATS.AMPMS;

            var time = $scope.time = {};

            this.initTime = function(inputs) {
                var hoursInputEl = inputs.eq(0),
                    minutesInputEl = inputs.eq(1);

                var mousewheel = angular.isDefined($attrs.mousewheel) ? $scope.$parent.$eval($attrs.mousewheel) : datetimepickerConfig.mousewheel;
                if (mousewheel) {
                    this.setupMousewheelEvents(hoursInputEl, minutesInputEl);
                }

                time.readonlyInput = angular.isDefined($attrs.readonlyInput) ? $scope.$parent.$eval($attrs.readonlyInput) : datetimepickerConfig.readonlyInput;
                this.setupInputEvents(hoursInputEl, minutesInputEl);
            };

            var hourStep = datetimepickerConfig.hourStep;
            if ($attrs.hourStep) {
                $scope.$parent.$watch($parse($attrs.hourStep), function(value) {
                    hourStep = parseInt(value, 10);
                });
            }

            var minuteStep = datetimepickerConfig.minuteStep;
            if ($attrs.minuteStep) {
                $scope.$parent.$watch($parse($attrs.minuteStep), function(value) {
                    minuteStep = parseInt(value, 10);
                });
            }

            // 12H / 24H mode
            time.showMeridian = datetimepickerConfig.showMeridian;
            if ($attrs.showMeridian) {
                $scope.$parent.$watch($parse($attrs.showMeridian), function(value) {
                    time.showMeridian = !!value;

                    if (ngModelCtrl.$error.time) {
                        // Evaluate from template
                        var hours = getHoursFromTemplate(), minutes = getMinutesFromTemplate();
                        if (angular.isDefined(hours) && angular.isDefined(minutes)) {
                            self.activeDate.setHours(hours);
                            self.refreshTime();
                        }
                    } else {
                        self.updateTimeTemplate();
                    }
                });
            }


            // Get $scope.hours in 24H mode if valid
            function getHoursFromTemplate() {
                var hours = parseInt(time.hours, 10);
                var valid = (time.showMeridian) ? (hours > 0 && hours < 13) : (hours >= 0 && hours < 24);
                if (!valid) {
                    return undefined;
                }

                if (time.showMeridian) {
                    if (hours === 12) {
                        hours = 0;
                    }
                    if (time.meridian === meridians[1]) {
                        hours = hours + 12;
                    }
                }
                return hours;
            }

            function getMinutesFromTemplate() {
                var minutes = parseInt(time.minutes, 10);
                return (minutes >= 0 && minutes < 60) ? minutes : undefined;
            }

            function pad(value) {
                return (angular.isDefined(value) && value.toString().length < 2) ? '0' + value : value;
            }

            // Respond on mousewheel spin
            this.setupMousewheelEvents = function(hoursInputEl, minutesInputEl) {
                var isScrollingUp = function(e) {
                    if (e.originalEvent) {
                        e = e.originalEvent;
                    }
                    //pick correct delta variable depending on event
                    var delta = (e.wheelDelta) ? e.wheelDelta : -e.deltaY;
                    return (e.detail || delta > 0);
                };

                hoursInputEl.bind('mousewheel wheel', function(e) {
                    $scope.$apply((isScrollingUp(e)) ? time.incrementHours() : time.decrementHours());
                    e.preventDefault();
                });

                minutesInputEl.bind('mousewheel wheel', function(e) {
                    $scope.$apply((isScrollingUp(e)) ? time.incrementMinutes() : time.decrementMinutes());
                    e.preventDefault();
                });

            };

            this.setupInputEvents = function(hoursInputEl, minutesInputEl) {
                if (time.readonlyInput) {
                    time.updateHours = angular.noop;
                    time.updateMinutes = angular.noop;
                    return;
                }

                var invalidate = function(invalidHours, invalidMinutes) {
                    ngModelCtrl.$setViewValue(null);
                    ngModelCtrl.$setValidity('time', false);
                    if (angular.isDefined(invalidHours)) {
                        time.invalidHours = invalidHours;
                    }
                    if (angular.isDefined(invalidMinutes)) {
                        time.invalidMinutes = invalidMinutes;
                    }
                };

                time.updateHours = function() {
                    var hours = getHoursFromTemplate();

                    if (angular.isDefined(hours)) {
                        self.activeDate.setHours(hours);
                        self.refreshTime('h');
                    } else {
                        invalidate(true);
                    }
                };

                hoursInputEl.bind('blur', function(e) {
                    if (!time.invalidHours && time.hours < 10) {
                        $scope.$apply(function() {
                            time.hours = pad(time.hours);
                        });
                    }
                });

                time.updateMinutes = function() {
                    var minutes = getMinutesFromTemplate();

                    if (angular.isDefined(minutes)) {
                        self.activeDate.setMinutes(minutes);
                        self.refreshTime('m');
                    } else {
                        invalidate(undefined, true);
                    }
                };

                minutesInputEl.bind('blur', function(e) {
                    if (!time.invalidMinutes && time.minutes < 10) {
                        $scope.$apply(function() {
                            time.minutes = pad(time.minutes);
                        });
                    }
                });

            };

            // Call internally when we know that model is valid.
            this.refreshTime = function(keyboardChange) {
                self.makeValidTime();
                ngModelCtrl.$setViewValue(new Date(self.activeDate));
                self.updateTimeTemplate(keyboardChange);
            };

            this.makeValidTime = function() {
                ngModelCtrl.$setValidity('time', true);
                time.invalidHours = false;
                time.invalidMinutes = false;
            };

            this.updateTimeTemplate = function(keyboardChange) {
                var hours = self.activeDate.getHours(), minutes = self.activeDate.getMinutes();

                if (time.showMeridian) {
                    hours = (hours === 0 || hours === 12) ? 12 : hours % 12; // Convert 24 to 12 hour system
                }

                time.hours = keyboardChange === 'h' ? hours : pad(hours);
                time.minutes = keyboardChange === 'm' ? minutes : pad(minutes);
                time.meridian = self.activeDate.getHours() < 12 ? meridians[0] : meridians[1];
            };

            function addMinutes(minutes) {
                var dt = new Date(self.activeDate.getTime() + minutes * 60000);
                self.activeDate.setHours(dt.getHours(), dt.getMinutes());
                self.refreshTime();
            }

            time.incrementHours = function() {
                addMinutes(hourStep * 60);
            };
            time.decrementHours = function() {
                addMinutes(- hourStep * 60);
            };
            time.incrementMinutes = function() {
                addMinutes(minuteStep);
            };
            time.decrementMinutes = function() {
                addMinutes(- minuteStep);
            };
            time.toggleMeridian = function() {
                addMinutes(12 * 60 * ((self.activeDate.getHours() < 12) ? 1 : -1));
            };
        }
    ])
    .directive('datetimepicker', function() {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'template/datetimepicker/datetimepicker.html',
            scope: {
                datetimepickerMode: '=?',
                dateDisabled: '&'
            },
            require: ['datetimepicker', '?^ngModel'],
            controller: 'DatetimepickerController',
            link: function(scope, element, attrs, ctrls) {
                var datepickerCtrl = ctrls[0], ngModelCtrl = ctrls[1];
                datepickerCtrl.ngModelCtrl = ngModelCtrl;
                if (ngModelCtrl) {
                    datepickerCtrl.init(ngModelCtrl);
                }
            }
        };
    })
    .directive('dtTimepicker', ['$timeout',
        function($timeout) {
            return {
                restrict: 'EA',
                require: '^datetimepicker',
                replace: true,
                templateUrl: 'template/datetimepicker/time.html',
                link: function(scope, element, attrs, ctrl) {
                    var inputs = element.find('input');
                    ctrl.step = {};
                    ctrl.element = element;

                    ctrl._refreshView = function() {
                        ctrl.makeValidTime();
                        ctrl.updateTimeTemplate();
                    };
                    ctrl.compare = function(date1, date2) {
                        return date1.getFullYear() - date2.getFullYear();
                    };

                    ctrl.handleKeyDown = function(key, evt) {
                        if (evt.target.nodeName.toLowerCase() !== 'input') {
                            if (key == 'left') {
                                $timeout(function() {
                                    inputs.last().focus();
                                });
                            } else if (key == 'right') {
                                $timeout(function() {
                                    inputs.first().focus();
                                });
                            }
                            return;
                        }
                        var input = $(evt.target);
                        var part = input.data('part');
                        if (key == 'up') {
                            if(part == 'hour') {
                                scope.time.incrementHours();
                            } else {
                                scope.time.incrementMinutes();
                            }
                        } else if (key == 'down') {
                            if(part == 'hour') {
                                scope.time.decrementHours();
                            } else {
                                scope.time.decrementMinutes();
                            }
                        } else if (key == 'left' || key == 'right') {
                            $timeout(function() {
                                inputs.not(evt.target).focus();
                            });
                        }
                    };
                    
                    ctrl.initTime(inputs);
                    ctrl.refreshView();
                }
            };
        }
    ])
    .directive('dtDaypicker', [
        'daypickerDirective', function(daypickerDirective) {
            var dir = angular.extend({}, daypickerDirective['0']);
            dir.name = 'dtDaypicker';
            dir.templateUrl = 'template/datetimepicker/day.html';
            dir.require = '^datetimepicker';

            return dir;
        }
    ])
    .directive('dtMonthpicker', [
        'monthpickerDirective', function(monthpickerDirective) {
            var dir = angular.extend({}, monthpickerDirective['0']);
            dir.name = 'dtMonthpicker';
            dir.require = '^datetimepicker';

            return dir;
        }
    ])
    .directive('dtYearpicker', [
        'yearpickerDirective', function(yearpickerDirective) {
            var dir = angular.extend({}, yearpickerDirective['0']);
            dir.name = 'dtYearpicker';
            dir.require = '^datetimepicker';

            return dir;
        }
    ])
    .constant('datetimepickerPopupConfig', {
        datetimepickerPopup: 'yyyy-MM-dd',
        currentText: 'Current',
        clearText: 'Clear',
        closeText: 'Done',
        closeOnDateSelection: false,
        appendToBody: false,
        showButtonBar: true
    })
    .directive('datetimepickerPopup', [
        '$compile', '$parse', '$document', '$position', '$timeout', 'dateFilter', 'dateParser', 'datetimepickerPopupConfig',
        function($compile, $parse, $document, $position, $timeout, dateFilter, dateParser, datetimepickerPopupConfig) {
            return {
                restrict: 'EA',
                require: 'ngModel',
                scope: {
                    isOpen: '=?',
                    currentText: '@',
                    clearText: '@',
                    closeText: '@',
                    dateDisabled: '&',
                    openOnFocus: '@'
                },
                link: function(scope, element, attrs, ngModel) {
                    var dateFormat,
                        closeOnDateSelection = angular.isDefined(attrs.closeOnDateSelection) ? scope.$parent.$eval(attrs.closeOnDateSelection) : datetimepickerPopupConfig.closeOnDateSelection,
                        appendToBody = angular.isDefined(attrs.datepickerAppendToBody) ? scope.$parent.$eval(attrs.datepickerAppendToBody) : datetimepickerPopupConfig.appendToBody;

                    scope.showButtonBar = angular.isDefined(attrs.showButtonBar) ? scope.$parent.$eval(attrs.showButtonBar) : datetimepickerPopupConfig.showButtonBar;

                    scope.getText = function(key) {
                        return scope[key + 'Text'] || datetimepickerPopupConfig[key + 'Text'];
                    };


                    var isEnabled = function(granularity) {
                        if (typeof granularity !== 'string' || granularity.length > 1) {
                            throw new TypeError('isEnabled expects a single character string parameter');
                        }
                        switch (granularity) {
                        case 'y':
                            return dateFormat.indexOf('Y') !== -1;
                        case 'M':
                            return dateFormat.indexOf('M') !== -1;
                        case 'd':
                            return dateFormat.toLowerCase().indexOf('d') !== -1;
                        case 'h':
                        case 'H':
                            return dateFormat.toLowerCase().indexOf('h') !== -1;
                        case 'm':
                            return dateFormat.indexOf('m') !== -1;
                        case 's':
                            return dateFormat.indexOf('s') !== -1;
                        default:
                            return false;
                        }
                    };

                    var hasTime = function() {
                        return (isEnabled('h') || isEnabled('m') || isEnabled('s'));
                    };

                    var hasDate = function() {
                        return (isEnabled('y') || isEnabled('M') || isEnabled('d'));
                    };

                    // popup element used to display calendar
                    var popupEl = angular.element('<div datetimepicker-popup-wrap><div datetimepicker></div></div>');
                    popupEl.attr({
                        'ng-model': 'date',
                        'ng-change': 'dateSelection()'
                    });

                    function cameltoDash(string) {
                        return string.replace(/([A-Z])/g, function($1) { return '-' + $1.toLowerCase(); });
                    }

                    // datepicker element
                    var datepickerEl = angular.element(popupEl.children()[0]);
                    if (attrs.datepickerOptions) {
                        angular.forEach(scope.$parent.$eval(attrs.datepickerOptions), function(value, option) {
                            datepickerEl.attr(cameltoDash(option), value);
                        });
                    }

                    scope.watchData = {
                        showTime: true,
                        showDate: true,
                    };
                    datepickerEl.attr('show-time', 'watchData.showTime');
                    datepickerEl.attr('show-date', 'watchData.showDate');

                    angular.forEach(['minDate', 'maxDate', 'datetimepickerMode'], function(key) {
                        if (attrs[key]) {
                            var getAttribute = $parse(attrs[key]);
                            scope.$parent.$watch(getAttribute, function(value) {
                                scope.watchData[key] = value;
                            });
                            datepickerEl.attr(cameltoDash(key), 'watchData.' + key);

                            // Propagate changes from datepicker to outside
                            if (key === 'datetimepickerMode') {
                                var setAttribute = getAttribute.assign;
                                scope.$watch('watchData.' + key, function(value, oldvalue) {
                                    if (value !== oldvalue) {
                                        setAttribute(scope.$parent, value);
                                    }
                                });
                            }
                        }
                    });

                    attrs.$observe('datetimepickerPopup', function(value) {
                        dateFormat = value || datetimepickerPopupConfig.datetimepickerPopup;
                        scope.watchData.showTime = hasTime();
                        scope.watchData.showDate = hasDate();
                        ngModel.$render();
                    });


                    
                    if (attrs.dateDisabled) {
                        datepickerEl.attr('date-disabled', 'dateDisabled({ date: date, mode: mode })');
                    }

                    function parseDate(viewValue) {
                        if (!viewValue) {
                            ngModel.$setValidity('date', true);
                            return null;
                        } else if (angular.isDate(viewValue) && !isNaN(viewValue)) {
                            ngModel.$setValidity('date', true);
                            return viewValue;
                        } else if (angular.isString(viewValue)) {
                            var date = dateParser.parse(viewValue, dateFormat) || new Date(viewValue);
                            if (isNaN(date)) {
                                ngModel.$setValidity('date', false);
                                return undefined;
                            } else {
                                ngModel.$setValidity('date', true);
                                return date;
                            }
                        } else {
                            ngModel.$setValidity('date', false);
                            return undefined;
                        }
                    }

                    ngModel.$parsers.unshift(parseDate);

                    // Inner change
                    scope.dateSelection = function(dt) {
                        if (angular.isDefined(dt)) {
                            scope.date = dt;
                        }
                        ngModel.$setViewValue(scope.date);
                        ngModel.$render();

                        if (closeOnDateSelection) {
                            scope.isOpen = false;
                            element[0].focus();
                        }
                    };

                    element.bind('input change keyup', function() {
                        scope.$apply(function() {
                            scope.date = ngModel.$modelValue;
                        });
                    });

                    // Outter change
                    ngModel.$render = function() {
                        var date = ngModel.$viewValue ? dateFilter(ngModel.$viewValue, dateFormat) : '';
                        element.val(date);
                        scope.date = parseDate(ngModel.$modelValue);
                    };

                    var documentClickBind = function(event) {
                        if (scope.isOpen && event.target !== element[0]) {
                            scope.$apply(function() {
                                scope.isOpen = false;
                            });
                        }
                    };

                    var canOpenOnFocus = true;
                    var focus = function(evt) {
                        if (!canOpenOnFocus) {
                            canOpenOnFocus = true;
                            return;
                        }
                        $timeout(function() {
                            scope.isOpen = true;
                        });
                    };

                    if (scope.openOnFocus) {
                        element.bind('focus', focus);
                    }

                    var keydown = function(evt, noApply) {
                        scope.keydown(evt);
                    };

                    element.bind('keydown', keydown);

                    scope.keydown = function(evt) {
                        if (evt.which === 27) {
                            canOpenOnFocus = false;
                            evt.preventDefault();
                            evt.stopPropagation();
                            scope.close();
                        } else if (evt.which === 40 && !scope.isOpen) {
                            scope.isOpen = true;
                            evt.stopPropagation();
                        }
                    };

                    scope.$watch('isOpen', function(value) {
                        if (value) {
                            scope.$broadcast('datetimepicker.focus');
                            scope.position = appendToBody ? $position.offset(element) : $position.position(element);
                            scope.position.top = scope.position.top + element.prop('offsetHeight');

                            $document.bind('click', documentClickBind);
                        } else {
                            $document.unbind('click', documentClickBind);
                        }
                    });

                    scope.select = function(date) {
                        if (date === 'today') {
                            var today = new Date();
                            if (angular.isDate(ngModel.$modelValue)) {
                                date = new Date(ngModel.$modelValue);
                                date.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
                                date.setHours(today.getHours(), today.getMinutes(), today.getSeconds());
                            } else {
                                date = new Date();
                            }
                        }
                        scope.dateSelection(date);
                    };

                    scope.close = function() {
                        scope.isOpen = false;
                        element[0].focus();
                    };

                    var $popup = $compile(popupEl)(scope);
                    // Prevent jQuery cache memory leak (template is now redundant after linking)
                    popupEl.remove();

                    if (appendToBody) {
                        $document.find('body').append($popup);
                    } else {
                        element.after($popup);
                    }

                    scope.$on('$destroy', function() {
                        $popup.remove();
                        element.unbind('keydown', keydown);
                        element.unbind('focus', focus);
                        $document.unbind('click', documentClickBind);
                    });
                }
            };
        }
    ])
    .directive('datetimepickerPopupWrap', function() {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            templateUrl: 'template/datepicker/popup.html',
            link: function(scope, element, attrs) {
                element.bind('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                });
            }
        };
    });
