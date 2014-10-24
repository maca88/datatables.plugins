declare module app.AngularExamples {
    class EditableUiSelect2Controller {
        public data: any[];
        public objVersions: {
            id: number;
            text: string;
        }[];
        public versions: number[];
        public versionGroups: {
            label: string;
            items: number[];
        }[];
        public options: any;
        static $inject: string[];
        constructor($scope: any);
    }
}
