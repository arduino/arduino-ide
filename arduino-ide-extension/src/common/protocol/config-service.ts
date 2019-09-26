export const ConfigServicePath = '/services/config-service';
export const ConfigService = Symbol('ConfigService');

export interface ConfigService {
    getConfiguration(): Promise<Config>;
    isInDataDir(uri: string): Promise<boolean>;
    isInSketchDir(uri: string): Promise<boolean>;
}

export interface Config {
    sketchDirUri: string;
    dataDirUri: string;
}
