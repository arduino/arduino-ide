export const ConfigServicePath = '/services/config-service';
export const ConfigService = Symbol('ConfigService');
export interface ConfigService {
    getVersion(): Promise<Readonly<{ version: string, commit: string, status?: string }>>;
    getConfiguration(): Promise<Config>;
    getCliConfigFileUri(): Promise<string>;
    getConfigurationFileSchemaUri(): Promise<string>;
    isInDataDir(uri: string): Promise<boolean>;
    isInSketchDir(uri: string): Promise<boolean>;
}

export interface Config {
    readonly sketchDirUri: string;
    readonly dataDirUri: string;
    readonly downloadsDirUri: string;
    readonly additionalUrls: string[];
}
