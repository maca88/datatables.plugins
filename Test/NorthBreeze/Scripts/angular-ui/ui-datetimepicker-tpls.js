angular.module("template/datetimepicker/datetimepicker.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/datetimepicker/datetimepicker.html",
    "<div ng-switch=\"datetimepickerMode\" role=\"application\" ng-keydown=\"keydown($event)\">\n" +
    "    <dt-timepicker ng-switch-when=\"time\" tabindex=\"0\"></dt-timepicker>\n" +
    "    <dt-daypicker ng-switch-when=\"day\" tabindex=\"0\"></dt-daypicker>\n" +
    "    <dt-monthpicker ng-switch-when=\"month\" tabindex=\"0\"></dt-monthpicker>\n" +
    "    <dt-yearpicker ng-switch-when=\"year\" tabindex=\"0\"></dt-yearpicker>\n" +
    "</div>");
}]);

angular.module("template/datetimepicker/day.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/datetimepicker/day.html",
    "<table role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
    "    <thead>\n" +
    "        <tr>\n" +
    "            <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-left\"></i></button></th>\n" +
    "            <th colspan=\"{{5 + showWeeks}}\"><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title}}</strong></button></th>\n" +
    "            <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-right\"></i></button></th>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <th ng-show=\"showWeeks\" class=\"text-center\"></th>\n" +
    "            <th ng-repeat=\"label in labels track by $index\" class=\"text-center\"><small aria-label=\"{{label.full}}\">{{label.abbr}}</small></th>\n" +
    "        </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "        <tr ng-repeat=\"row in rows track by $index\">\n" +
    "            <td ng-show=\"showWeeks\" class=\"text-center h6\"><em>{{ weekNumbers[$index] }}</em></td>\n" +
    "            <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
    "                <button type=\"button\" style=\"width:100%;\" class=\"btn btn-default btn-sm\" ng-class=\"{'btn-info': dt.selected, active: isActive(dt)}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"{'text-muted': dt.secondary, 'text-info': dt.current}\">{{dt.label}}</span></button>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "    <tfoot ng-if=\"showTime\">\n" +
    "        <tr>\n" +
    "            <th colspan=\"{{7 + showWeeks}}\">\n" +
    "                <div calss=\"text-center\" style=\"padding:10px 9px 2px\">\n" +
    "                    <a ng-click=\"toggleMode(-1)\" class=\"btn\" style=\"width:100%\"><span class=\"glyphicon glyphicon-time\"></span></a>\n" +
    "                </div>\n" +
    "            </th>\n" +
    "        </tr>\n" +
    "    </tfoot>\n" +
    "</table>");
}]);

angular.module("template/datetimepicker/time.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/datetimepicker/time.html",
    "<table class=\"text-center\" style=\"margin: 20px;\">\n" +
    "    <thead>\n" +
    "        <tr>\n" +
    "            <th colspan=\"5\">\n" +
    "                <div calss=\"text-center\" style=\"padding:10px 9px 2px\">\n" +
    "                    <a ng-click=\"toggleMode()\" class=\"btn\" style=\"width:100%\"><span class=\"glyphicon glyphicon-calendar\"></span></a>\n" +
    "                </div>\n" +
    "            </th>\n" +
    "        </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "        <tr>\n" +
    "            <td><a ng-click=\"time.incrementHours()\" class=\"btn btn-link\"><span class=\"glyphicon glyphicon-chevron-up\"></span></a></td>\n" +
    "            <td>&nbsp;</td>\n" +
    "            <td><a ng-click=\"time.incrementMinutes()\" class=\"btn btn-link\"><span class=\"glyphicon glyphicon-chevron-up\"></span></a></td>\n" +
    "            <td>&nbsp;</td>\n" +
    "            <td ng-show=\"time.showMeridian\"></td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td style=\"width:50px;\"  class=\"form-group\" ng-class=\"{'has-error': time.invalidHours}\">\n" +
    "                <input style=\"width:50px;\" type=\"text\" ng-model=\"time.hours\" data-part=\"hour\" ng-change=\"time.updateHours()\" class=\"form-control text-center\" ng-mousewheel=\"time.incrementHours()\" ng-readonly=\"time.readonlyInput\" maxlength=\"2\">\n" +
    "            </td>\n" +
    "            <td style=\"width:50px;\">:</td>\n" +
    "            <td style=\"width:50px;\" class=\"form-group\" ng-class=\"{'has-error': time.invalidMinutes}\">\n" +
    "                <input style=\"width:50px;\" type=\"text\" ng-model=\"time.minutes\" data-part=\"minute\" ng-change=\"time.updateMinutes()\" class=\"form-control text-center\" ng-readonly=\"time.readonlyInput\" maxlength=\"2\">\n" +
    "            </td>\n" +
    "            <td style=\"width:20px;\">&nbsp;</td>\n" +
    "            <td style=\"width:50px;\" ng-show=\"time.showMeridian\" ><button type=\"button\" class=\"btn btn-primary text-center\" ng-click=\"time.toggleMeridian()\">{{time.meridian}}</button></td>\n" +
    "        </tr>\n" +
    "        <tr class=\"text-center\">\n" +
    "            <td><a ng-click=\"time.decrementHours()\" class=\"btn btn-link\"><span class=\"glyphicon glyphicon-chevron-down\"></span></a></td>\n" +
    "            <td>&nbsp;</td>\n" +
    "            <td><a ng-click=\"time.decrementMinutes()\" class=\"btn btn-link\"><span class=\"glyphicon glyphicon-chevron-down\"></span></a></td>\n" +
    "            <td>&nbsp;</td>\n" +
    "            <td ng-show=\"time.showMeridian\"></td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table>");
}]);