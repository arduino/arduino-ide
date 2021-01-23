export const ConfigServicePath = '/services/config-service';
export const ConfigService = Symbol('ConfigService');
export interface ConfigService {
    getVersion(): Promise<Readonly<{ version: string, commit: string, status?: string }>>;
    getConfiguration(): Promise<Config>;
    setConfiguration(config: Config): Promise<void>;
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
export namespace Config {
    export function sameAs(left: Config, right: Config): boolean {
        const leftUrls = left.additionalUrls.sort();
        const rightUrls = right.additionalUrls.sort();
        if (leftUrls.length !== rightUrls.length) {
            return false;
        }
        for (let i = 0; i < leftUrls.length; i++) {
            if (leftUrls[i] !== rightUrls[i]) {
                return false;
            }
        }
        return left.dataDirUri === right.dataDirUri
            && left.downloadsDirUri === right.downloadsDirUri
            && left.sketchDirUri === right.sketchDirUri;
    }
}
