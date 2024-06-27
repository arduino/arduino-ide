// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/settings.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class Configuration extends jspb.Message { 

    hasDirectories(): boolean;
    clearDirectories(): void;
    getDirectories(): Configuration.Directories | undefined;
    setDirectories(value?: Configuration.Directories): Configuration;

    hasNetwork(): boolean;
    clearNetwork(): void;
    getNetwork(): Configuration.Network | undefined;
    setNetwork(value?: Configuration.Network): Configuration;

    hasSketch(): boolean;
    clearSketch(): void;
    getSketch(): Configuration.Sketch | undefined;
    setSketch(value?: Configuration.Sketch): Configuration;

    hasBuildCache(): boolean;
    clearBuildCache(): void;
    getBuildCache(): Configuration.BuildCache | undefined;
    setBuildCache(value?: Configuration.BuildCache): Configuration;

    hasBoardManager(): boolean;
    clearBoardManager(): void;
    getBoardManager(): Configuration.BoardManager | undefined;
    setBoardManager(value?: Configuration.BoardManager): Configuration;

    hasDaemon(): boolean;
    clearDaemon(): void;
    getDaemon(): Configuration.Daemon | undefined;
    setDaemon(value?: Configuration.Daemon): Configuration;

    hasOutput(): boolean;
    clearOutput(): void;
    getOutput(): Configuration.Output | undefined;
    setOutput(value?: Configuration.Output): Configuration;

    hasLogging(): boolean;
    clearLogging(): void;
    getLogging(): Configuration.Logging | undefined;
    setLogging(value?: Configuration.Logging): Configuration;

    hasLibrary(): boolean;
    clearLibrary(): void;
    getLibrary(): Configuration.Library | undefined;
    setLibrary(value?: Configuration.Library): Configuration;

    hasUpdater(): boolean;
    clearUpdater(): void;
    getUpdater(): Configuration.Updater | undefined;
    setUpdater(value?: Configuration.Updater): Configuration;

    hasLocale(): boolean;
    clearLocale(): void;
    getLocale(): string | undefined;
    setLocale(value: string): Configuration;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Configuration.AsObject;
    static toObject(includeInstance: boolean, msg: Configuration): Configuration.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Configuration, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Configuration;
    static deserializeBinaryFromReader(message: Configuration, reader: jspb.BinaryReader): Configuration;
}

export namespace Configuration {
    export type AsObject = {
        directories?: Configuration.Directories.AsObject,
        network?: Configuration.Network.AsObject,
        sketch?: Configuration.Sketch.AsObject,
        buildCache?: Configuration.BuildCache.AsObject,
        boardManager?: Configuration.BoardManager.AsObject,
        daemon?: Configuration.Daemon.AsObject,
        output?: Configuration.Output.AsObject,
        logging?: Configuration.Logging.AsObject,
        library?: Configuration.Library.AsObject,
        updater?: Configuration.Updater.AsObject,
        locale?: string,
    }


    export class Directories extends jspb.Message { 
        getData(): string;
        setData(value: string): Directories;
        getUser(): string;
        setUser(value: string): Directories;
        getDownloads(): string;
        setDownloads(value: string): Directories;

        hasBuiltin(): boolean;
        clearBuiltin(): void;
        getBuiltin(): Configuration.Directories.Builtin | undefined;
        setBuiltin(value?: Configuration.Directories.Builtin): Directories;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Directories.AsObject;
        static toObject(includeInstance: boolean, msg: Directories): Directories.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Directories, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Directories;
        static deserializeBinaryFromReader(message: Directories, reader: jspb.BinaryReader): Directories;
    }

    export namespace Directories {
        export type AsObject = {
            data: string,
            user: string,
            downloads: string,
            builtin?: Configuration.Directories.Builtin.AsObject,
        }


        export class Builtin extends jspb.Message { 

            hasLibraries(): boolean;
            clearLibraries(): void;
            getLibraries(): string | undefined;
            setLibraries(value: string): Builtin;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Builtin.AsObject;
            static toObject(includeInstance: boolean, msg: Builtin): Builtin.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Builtin, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Builtin;
            static deserializeBinaryFromReader(message: Builtin, reader: jspb.BinaryReader): Builtin;
        }

        export namespace Builtin {
            export type AsObject = {
                libraries?: string,
            }
        }

    }

    export class Network extends jspb.Message { 

        hasExtraUserAgent(): boolean;
        clearExtraUserAgent(): void;
        getExtraUserAgent(): string | undefined;
        setExtraUserAgent(value: string): Network;

        hasProxy(): boolean;
        clearProxy(): void;
        getProxy(): string | undefined;
        setProxy(value: string): Network;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Network.AsObject;
        static toObject(includeInstance: boolean, msg: Network): Network.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Network, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Network;
        static deserializeBinaryFromReader(message: Network, reader: jspb.BinaryReader): Network;
    }

    export namespace Network {
        export type AsObject = {
            extraUserAgent?: string,
            proxy?: string,
        }
    }

    export class Sketch extends jspb.Message { 
        getAlwaysExportBinaries(): boolean;
        setAlwaysExportBinaries(value: boolean): Sketch;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Sketch.AsObject;
        static toObject(includeInstance: boolean, msg: Sketch): Sketch.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Sketch, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Sketch;
        static deserializeBinaryFromReader(message: Sketch, reader: jspb.BinaryReader): Sketch;
    }

    export namespace Sketch {
        export type AsObject = {
            alwaysExportBinaries: boolean,
        }
    }

    export class BuildCache extends jspb.Message { 
        getCompilationsBeforePurge(): number;
        setCompilationsBeforePurge(value: number): BuildCache;
        getTtlSecs(): number;
        setTtlSecs(value: number): BuildCache;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): BuildCache.AsObject;
        static toObject(includeInstance: boolean, msg: BuildCache): BuildCache.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: BuildCache, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): BuildCache;
        static deserializeBinaryFromReader(message: BuildCache, reader: jspb.BinaryReader): BuildCache;
    }

    export namespace BuildCache {
        export type AsObject = {
            compilationsBeforePurge: number,
            ttlSecs: number,
        }
    }

    export class BoardManager extends jspb.Message { 
        clearAdditionalUrlsList(): void;
        getAdditionalUrlsList(): Array<string>;
        setAdditionalUrlsList(value: Array<string>): BoardManager;
        addAdditionalUrls(value: string, index?: number): string;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): BoardManager.AsObject;
        static toObject(includeInstance: boolean, msg: BoardManager): BoardManager.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: BoardManager, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): BoardManager;
        static deserializeBinaryFromReader(message: BoardManager, reader: jspb.BinaryReader): BoardManager;
    }

    export namespace BoardManager {
        export type AsObject = {
            additionalUrlsList: Array<string>,
        }
    }

    export class Daemon extends jspb.Message { 
        getPort(): string;
        setPort(value: string): Daemon;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Daemon.AsObject;
        static toObject(includeInstance: boolean, msg: Daemon): Daemon.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Daemon, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Daemon;
        static deserializeBinaryFromReader(message: Daemon, reader: jspb.BinaryReader): Daemon;
    }

    export namespace Daemon {
        export type AsObject = {
            port: string,
        }
    }

    export class Output extends jspb.Message { 
        getNoColor(): boolean;
        setNoColor(value: boolean): Output;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Output.AsObject;
        static toObject(includeInstance: boolean, msg: Output): Output.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Output, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Output;
        static deserializeBinaryFromReader(message: Output, reader: jspb.BinaryReader): Output;
    }

    export namespace Output {
        export type AsObject = {
            noColor: boolean,
        }
    }

    export class Logging extends jspb.Message { 
        getLevel(): string;
        setLevel(value: string): Logging;
        getFormat(): string;
        setFormat(value: string): Logging;

        hasFile(): boolean;
        clearFile(): void;
        getFile(): string | undefined;
        setFile(value: string): Logging;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Logging.AsObject;
        static toObject(includeInstance: boolean, msg: Logging): Logging.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Logging, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Logging;
        static deserializeBinaryFromReader(message: Logging, reader: jspb.BinaryReader): Logging;
    }

    export namespace Logging {
        export type AsObject = {
            level: string,
            format: string,
            file?: string,
        }
    }

    export class Library extends jspb.Message { 
        getEnableUnsafeInstall(): boolean;
        setEnableUnsafeInstall(value: boolean): Library;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Library.AsObject;
        static toObject(includeInstance: boolean, msg: Library): Library.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Library, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Library;
        static deserializeBinaryFromReader(message: Library, reader: jspb.BinaryReader): Library;
    }

    export namespace Library {
        export type AsObject = {
            enableUnsafeInstall: boolean,
        }
    }

    export class Updater extends jspb.Message { 
        getEnableNotification(): boolean;
        setEnableNotification(value: boolean): Updater;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Updater.AsObject;
        static toObject(includeInstance: boolean, msg: Updater): Updater.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Updater, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Updater;
        static deserializeBinaryFromReader(message: Updater, reader: jspb.BinaryReader): Updater;
    }

    export namespace Updater {
        export type AsObject = {
            enableNotification: boolean,
        }
    }

}

export class ConfigurationGetRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConfigurationGetRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ConfigurationGetRequest): ConfigurationGetRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConfigurationGetRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConfigurationGetRequest;
    static deserializeBinaryFromReader(message: ConfigurationGetRequest, reader: jspb.BinaryReader): ConfigurationGetRequest;
}

export namespace ConfigurationGetRequest {
    export type AsObject = {
    }
}

export class ConfigurationGetResponse extends jspb.Message { 

    hasConfiguration(): boolean;
    clearConfiguration(): void;
    getConfiguration(): Configuration | undefined;
    setConfiguration(value?: Configuration): ConfigurationGetResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConfigurationGetResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ConfigurationGetResponse): ConfigurationGetResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConfigurationGetResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConfigurationGetResponse;
    static deserializeBinaryFromReader(message: ConfigurationGetResponse, reader: jspb.BinaryReader): ConfigurationGetResponse;
}

export namespace ConfigurationGetResponse {
    export type AsObject = {
        configuration?: Configuration.AsObject,
    }
}

export class ConfigurationSaveRequest extends jspb.Message { 
    getSettingsFormat(): string;
    setSettingsFormat(value: string): ConfigurationSaveRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConfigurationSaveRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ConfigurationSaveRequest): ConfigurationSaveRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConfigurationSaveRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConfigurationSaveRequest;
    static deserializeBinaryFromReader(message: ConfigurationSaveRequest, reader: jspb.BinaryReader): ConfigurationSaveRequest;
}

export namespace ConfigurationSaveRequest {
    export type AsObject = {
        settingsFormat: string,
    }
}

export class ConfigurationSaveResponse extends jspb.Message { 
    getEncodedSettings(): string;
    setEncodedSettings(value: string): ConfigurationSaveResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConfigurationSaveResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ConfigurationSaveResponse): ConfigurationSaveResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConfigurationSaveResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConfigurationSaveResponse;
    static deserializeBinaryFromReader(message: ConfigurationSaveResponse, reader: jspb.BinaryReader): ConfigurationSaveResponse;
}

export namespace ConfigurationSaveResponse {
    export type AsObject = {
        encodedSettings: string,
    }
}

export class ConfigurationOpenRequest extends jspb.Message { 
    getEncodedSettings(): string;
    setEncodedSettings(value: string): ConfigurationOpenRequest;
    getSettingsFormat(): string;
    setSettingsFormat(value: string): ConfigurationOpenRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConfigurationOpenRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ConfigurationOpenRequest): ConfigurationOpenRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConfigurationOpenRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConfigurationOpenRequest;
    static deserializeBinaryFromReader(message: ConfigurationOpenRequest, reader: jspb.BinaryReader): ConfigurationOpenRequest;
}

export namespace ConfigurationOpenRequest {
    export type AsObject = {
        encodedSettings: string,
        settingsFormat: string,
    }
}

export class ConfigurationOpenResponse extends jspb.Message { 
    clearWarningsList(): void;
    getWarningsList(): Array<string>;
    setWarningsList(value: Array<string>): ConfigurationOpenResponse;
    addWarnings(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConfigurationOpenResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ConfigurationOpenResponse): ConfigurationOpenResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConfigurationOpenResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConfigurationOpenResponse;
    static deserializeBinaryFromReader(message: ConfigurationOpenResponse, reader: jspb.BinaryReader): ConfigurationOpenResponse;
}

export namespace ConfigurationOpenResponse {
    export type AsObject = {
        warningsList: Array<string>,
    }
}

export class SettingsGetValueRequest extends jspb.Message { 
    getKey(): string;
    setKey(value: string): SettingsGetValueRequest;
    getValueFormat(): string;
    setValueFormat(value: string): SettingsGetValueRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsGetValueRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsGetValueRequest): SettingsGetValueRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsGetValueRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsGetValueRequest;
    static deserializeBinaryFromReader(message: SettingsGetValueRequest, reader: jspb.BinaryReader): SettingsGetValueRequest;
}

export namespace SettingsGetValueRequest {
    export type AsObject = {
        key: string,
        valueFormat: string,
    }
}

export class SettingsGetValueResponse extends jspb.Message { 
    getEncodedValue(): string;
    setEncodedValue(value: string): SettingsGetValueResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsGetValueResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsGetValueResponse): SettingsGetValueResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsGetValueResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsGetValueResponse;
    static deserializeBinaryFromReader(message: SettingsGetValueResponse, reader: jspb.BinaryReader): SettingsGetValueResponse;
}

export namespace SettingsGetValueResponse {
    export type AsObject = {
        encodedValue: string,
    }
}

export class SettingsSetValueRequest extends jspb.Message { 
    getKey(): string;
    setKey(value: string): SettingsSetValueRequest;
    getEncodedValue(): string;
    setEncodedValue(value: string): SettingsSetValueRequest;
    getValueFormat(): string;
    setValueFormat(value: string): SettingsSetValueRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsSetValueRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsSetValueRequest): SettingsSetValueRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsSetValueRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsSetValueRequest;
    static deserializeBinaryFromReader(message: SettingsSetValueRequest, reader: jspb.BinaryReader): SettingsSetValueRequest;
}

export namespace SettingsSetValueRequest {
    export type AsObject = {
        key: string,
        encodedValue: string,
        valueFormat: string,
    }
}

export class SettingsSetValueResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsSetValueResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsSetValueResponse): SettingsSetValueResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsSetValueResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsSetValueResponse;
    static deserializeBinaryFromReader(message: SettingsSetValueResponse, reader: jspb.BinaryReader): SettingsSetValueResponse;
}

export namespace SettingsSetValueResponse {
    export type AsObject = {
    }
}

export class SettingsEnumerateRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsEnumerateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsEnumerateRequest): SettingsEnumerateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsEnumerateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsEnumerateRequest;
    static deserializeBinaryFromReader(message: SettingsEnumerateRequest, reader: jspb.BinaryReader): SettingsEnumerateRequest;
}

export namespace SettingsEnumerateRequest {
    export type AsObject = {
    }
}

export class SettingsEnumerateResponse extends jspb.Message { 
    clearEntriesList(): void;
    getEntriesList(): Array<SettingsEnumerateResponse.Entry>;
    setEntriesList(value: Array<SettingsEnumerateResponse.Entry>): SettingsEnumerateResponse;
    addEntries(value?: SettingsEnumerateResponse.Entry, index?: number): SettingsEnumerateResponse.Entry;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsEnumerateResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsEnumerateResponse): SettingsEnumerateResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsEnumerateResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsEnumerateResponse;
    static deserializeBinaryFromReader(message: SettingsEnumerateResponse, reader: jspb.BinaryReader): SettingsEnumerateResponse;
}

export namespace SettingsEnumerateResponse {
    export type AsObject = {
        entriesList: Array<SettingsEnumerateResponse.Entry.AsObject>,
    }


    export class Entry extends jspb.Message { 
        getKey(): string;
        setKey(value: string): Entry;
        getType(): string;
        setType(value: string): Entry;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Entry.AsObject;
        static toObject(includeInstance: boolean, msg: Entry): Entry.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Entry, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Entry;
        static deserializeBinaryFromReader(message: Entry, reader: jspb.BinaryReader): Entry;
    }

    export namespace Entry {
        export type AsObject = {
            key: string,
            type: string,
        }
    }

}
