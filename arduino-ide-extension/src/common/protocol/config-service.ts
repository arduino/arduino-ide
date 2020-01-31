import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';

export const ConfigServiceClient = Symbol('ConfigServiceClient');
export interface ConfigServiceClient {
    notifyConfigChanged(config: Config): void;
    notifyInvalidConfig(): void;
}

export const ConfigServicePath = '/services/config-service';
export const ConfigService = Symbol('ConfigService');
export interface ConfigService extends JsonRpcServer<ConfigServiceClient> {
    getVersion(): Promise<string>;
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
