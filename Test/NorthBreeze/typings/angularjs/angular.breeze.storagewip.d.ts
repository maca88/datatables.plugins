declare module breeze.z {

    export interface EventNames {
        error: string;
        storeChanged: string;
        wipChanged: string;
    }

    export interface StorageConfig {
        enabled: boolean;
        key: string;
        events: EventNames;
        wipKey: string;
        appErrorPrefix: string;
        newGuid(): string;
        version: string;
    }

    export interface StorageConfigProvider {
        config: StorageConfig;
    }
}