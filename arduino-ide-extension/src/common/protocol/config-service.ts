export const ConfigServicePath = '/services/config-service';
export const ConfigService = Symbol('ConfigService');

export interface ConfigService {
    getConfiguration(): Promise<Config>;
}

export interface Config {
    sketchDirUri: string;
    dataDirUri: string;
}
