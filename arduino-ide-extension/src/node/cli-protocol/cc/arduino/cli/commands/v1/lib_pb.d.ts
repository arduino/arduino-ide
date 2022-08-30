// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/lib.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as cc_arduino_cli_commands_v1_common_pb from "../../../../../cc/arduino/cli/commands/v1/common_pb";

export class LibraryDownloadRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): LibraryDownloadRequest;

    getName(): string;
    setName(value: string): LibraryDownloadRequest;

    getVersion(): string;
    setVersion(value: string): LibraryDownloadRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryDownloadRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryDownloadRequest): LibraryDownloadRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryDownloadRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryDownloadRequest;
    static deserializeBinaryFromReader(message: LibraryDownloadRequest, reader: jspb.BinaryReader): LibraryDownloadRequest;
}

export namespace LibraryDownloadRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        name: string,
        version: string,
    }
}

export class LibraryDownloadResponse extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): LibraryDownloadResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryDownloadResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryDownloadResponse): LibraryDownloadResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryDownloadResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryDownloadResponse;
    static deserializeBinaryFromReader(message: LibraryDownloadResponse, reader: jspb.BinaryReader): LibraryDownloadResponse;
}

export namespace LibraryDownloadResponse {
    export type AsObject = {
        progress?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress.AsObject,
    }
}

export class LibraryInstallRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): LibraryInstallRequest;

    getName(): string;
    setName(value: string): LibraryInstallRequest;

    getVersion(): string;
    setVersion(value: string): LibraryInstallRequest;

    getNoDeps(): boolean;
    setNoDeps(value: boolean): LibraryInstallRequest;

    getNoOverwrite(): boolean;
    setNoOverwrite(value: boolean): LibraryInstallRequest;

    getInstallLocation(): LibraryInstallLocation;
    setInstallLocation(value: LibraryInstallLocation): LibraryInstallRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryInstallRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryInstallRequest): LibraryInstallRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryInstallRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryInstallRequest;
    static deserializeBinaryFromReader(message: LibraryInstallRequest, reader: jspb.BinaryReader): LibraryInstallRequest;
}

export namespace LibraryInstallRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        name: string,
        version: string,
        noDeps: boolean,
        noOverwrite: boolean,
        installLocation: LibraryInstallLocation,
    }
}

export class LibraryInstallResponse extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): LibraryInstallResponse;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): LibraryInstallResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryInstallResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryInstallResponse): LibraryInstallResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryInstallResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryInstallResponse;
    static deserializeBinaryFromReader(message: LibraryInstallResponse, reader: jspb.BinaryReader): LibraryInstallResponse;
}

export namespace LibraryInstallResponse {
    export type AsObject = {
        progress?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress.AsObject,
        taskProgress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
    }
}

export class LibraryUpgradeRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): LibraryUpgradeRequest;

    getName(): string;
    setName(value: string): LibraryUpgradeRequest;

    getNoDeps(): boolean;
    setNoDeps(value: boolean): LibraryUpgradeRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryUpgradeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryUpgradeRequest): LibraryUpgradeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryUpgradeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryUpgradeRequest;
    static deserializeBinaryFromReader(message: LibraryUpgradeRequest, reader: jspb.BinaryReader): LibraryUpgradeRequest;
}

export namespace LibraryUpgradeRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        name: string,
        noDeps: boolean,
    }
}

export class LibraryUpgradeResponse extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): LibraryUpgradeResponse;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): LibraryUpgradeResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryUpgradeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryUpgradeResponse): LibraryUpgradeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryUpgradeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryUpgradeResponse;
    static deserializeBinaryFromReader(message: LibraryUpgradeResponse, reader: jspb.BinaryReader): LibraryUpgradeResponse;
}

export namespace LibraryUpgradeResponse {
    export type AsObject = {
        progress?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress.AsObject,
        taskProgress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
    }
}

export class LibraryUninstallRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): LibraryUninstallRequest;

    getName(): string;
    setName(value: string): LibraryUninstallRequest;

    getVersion(): string;
    setVersion(value: string): LibraryUninstallRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryUninstallRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryUninstallRequest): LibraryUninstallRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryUninstallRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryUninstallRequest;
    static deserializeBinaryFromReader(message: LibraryUninstallRequest, reader: jspb.BinaryReader): LibraryUninstallRequest;
}

export namespace LibraryUninstallRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        name: string,
        version: string,
    }
}

export class LibraryUninstallResponse extends jspb.Message { 

    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): LibraryUninstallResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryUninstallResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryUninstallResponse): LibraryUninstallResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryUninstallResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryUninstallResponse;
    static deserializeBinaryFromReader(message: LibraryUninstallResponse, reader: jspb.BinaryReader): LibraryUninstallResponse;
}

export namespace LibraryUninstallResponse {
    export type AsObject = {
        taskProgress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
    }
}

export class LibraryUpgradeAllRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): LibraryUpgradeAllRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryUpgradeAllRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryUpgradeAllRequest): LibraryUpgradeAllRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryUpgradeAllRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryUpgradeAllRequest;
    static deserializeBinaryFromReader(message: LibraryUpgradeAllRequest, reader: jspb.BinaryReader): LibraryUpgradeAllRequest;
}

export namespace LibraryUpgradeAllRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
    }
}

export class LibraryUpgradeAllResponse extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): LibraryUpgradeAllResponse;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): LibraryUpgradeAllResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryUpgradeAllResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryUpgradeAllResponse): LibraryUpgradeAllResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryUpgradeAllResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryUpgradeAllResponse;
    static deserializeBinaryFromReader(message: LibraryUpgradeAllResponse, reader: jspb.BinaryReader): LibraryUpgradeAllResponse;
}

export namespace LibraryUpgradeAllResponse {
    export type AsObject = {
        progress?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress.AsObject,
        taskProgress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
    }
}

export class LibraryResolveDependenciesRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): LibraryResolveDependenciesRequest;

    getName(): string;
    setName(value: string): LibraryResolveDependenciesRequest;

    getVersion(): string;
    setVersion(value: string): LibraryResolveDependenciesRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryResolveDependenciesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryResolveDependenciesRequest): LibraryResolveDependenciesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryResolveDependenciesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryResolveDependenciesRequest;
    static deserializeBinaryFromReader(message: LibraryResolveDependenciesRequest, reader: jspb.BinaryReader): LibraryResolveDependenciesRequest;
}

export namespace LibraryResolveDependenciesRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        name: string,
        version: string,
    }
}

export class LibraryResolveDependenciesResponse extends jspb.Message { 
    clearDependenciesList(): void;
    getDependenciesList(): Array<LibraryDependencyStatus>;
    setDependenciesList(value: Array<LibraryDependencyStatus>): LibraryResolveDependenciesResponse;
    addDependencies(value?: LibraryDependencyStatus, index?: number): LibraryDependencyStatus;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryResolveDependenciesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryResolveDependenciesResponse): LibraryResolveDependenciesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryResolveDependenciesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryResolveDependenciesResponse;
    static deserializeBinaryFromReader(message: LibraryResolveDependenciesResponse, reader: jspb.BinaryReader): LibraryResolveDependenciesResponse;
}

export namespace LibraryResolveDependenciesResponse {
    export type AsObject = {
        dependenciesList: Array<LibraryDependencyStatus.AsObject>,
    }
}

export class LibraryDependencyStatus extends jspb.Message { 
    getName(): string;
    setName(value: string): LibraryDependencyStatus;

    getVersionRequired(): string;
    setVersionRequired(value: string): LibraryDependencyStatus;

    getVersionInstalled(): string;
    setVersionInstalled(value: string): LibraryDependencyStatus;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryDependencyStatus.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryDependencyStatus): LibraryDependencyStatus.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryDependencyStatus, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryDependencyStatus;
    static deserializeBinaryFromReader(message: LibraryDependencyStatus, reader: jspb.BinaryReader): LibraryDependencyStatus;
}

export namespace LibraryDependencyStatus {
    export type AsObject = {
        name: string,
        versionRequired: string,
        versionInstalled: string,
    }
}

export class LibrarySearchRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): LibrarySearchRequest;

    getQuery(): string;
    setQuery(value: string): LibrarySearchRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibrarySearchRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LibrarySearchRequest): LibrarySearchRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibrarySearchRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibrarySearchRequest;
    static deserializeBinaryFromReader(message: LibrarySearchRequest, reader: jspb.BinaryReader): LibrarySearchRequest;
}

export namespace LibrarySearchRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        query: string,
    }
}

export class LibrarySearchResponse extends jspb.Message { 
    clearLibrariesList(): void;
    getLibrariesList(): Array<SearchedLibrary>;
    setLibrariesList(value: Array<SearchedLibrary>): LibrarySearchResponse;
    addLibraries(value?: SearchedLibrary, index?: number): SearchedLibrary;

    getStatus(): LibrarySearchStatus;
    setStatus(value: LibrarySearchStatus): LibrarySearchResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibrarySearchResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LibrarySearchResponse): LibrarySearchResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibrarySearchResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibrarySearchResponse;
    static deserializeBinaryFromReader(message: LibrarySearchResponse, reader: jspb.BinaryReader): LibrarySearchResponse;
}

export namespace LibrarySearchResponse {
    export type AsObject = {
        librariesList: Array<SearchedLibrary.AsObject>,
        status: LibrarySearchStatus,
    }
}

export class SearchedLibrary extends jspb.Message { 
    getName(): string;
    setName(value: string): SearchedLibrary;


    getReleasesMap(): jspb.Map<string, LibraryRelease>;
    clearReleasesMap(): void;


    hasLatest(): boolean;
    clearLatest(): void;
    getLatest(): LibraryRelease | undefined;
    setLatest(value?: LibraryRelease): SearchedLibrary;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SearchedLibrary.AsObject;
    static toObject(includeInstance: boolean, msg: SearchedLibrary): SearchedLibrary.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SearchedLibrary, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SearchedLibrary;
    static deserializeBinaryFromReader(message: SearchedLibrary, reader: jspb.BinaryReader): SearchedLibrary;
}

export namespace SearchedLibrary {
    export type AsObject = {
        name: string,

        releasesMap: Array<[string, LibraryRelease.AsObject]>,
        latest?: LibraryRelease.AsObject,
    }
}

export class LibraryRelease extends jspb.Message { 
    getAuthor(): string;
    setAuthor(value: string): LibraryRelease;

    getVersion(): string;
    setVersion(value: string): LibraryRelease;

    getMaintainer(): string;
    setMaintainer(value: string): LibraryRelease;

    getSentence(): string;
    setSentence(value: string): LibraryRelease;

    getParagraph(): string;
    setParagraph(value: string): LibraryRelease;

    getWebsite(): string;
    setWebsite(value: string): LibraryRelease;

    getCategory(): string;
    setCategory(value: string): LibraryRelease;

    clearArchitecturesList(): void;
    getArchitecturesList(): Array<string>;
    setArchitecturesList(value: Array<string>): LibraryRelease;
    addArchitectures(value: string, index?: number): string;

    clearTypesList(): void;
    getTypesList(): Array<string>;
    setTypesList(value: Array<string>): LibraryRelease;
    addTypes(value: string, index?: number): string;


    hasResources(): boolean;
    clearResources(): void;
    getResources(): DownloadResource | undefined;
    setResources(value?: DownloadResource): LibraryRelease;

    getLicense(): string;
    setLicense(value: string): LibraryRelease;

    clearProvidesIncludesList(): void;
    getProvidesIncludesList(): Array<string>;
    setProvidesIncludesList(value: Array<string>): LibraryRelease;
    addProvidesIncludes(value: string, index?: number): string;

    clearDependenciesList(): void;
    getDependenciesList(): Array<LibraryDependency>;
    setDependenciesList(value: Array<LibraryDependency>): LibraryRelease;
    addDependencies(value?: LibraryDependency, index?: number): LibraryDependency;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryRelease.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryRelease): LibraryRelease.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryRelease, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryRelease;
    static deserializeBinaryFromReader(message: LibraryRelease, reader: jspb.BinaryReader): LibraryRelease;
}

export namespace LibraryRelease {
    export type AsObject = {
        author: string,
        version: string,
        maintainer: string,
        sentence: string,
        paragraph: string,
        website: string,
        category: string,
        architecturesList: Array<string>,
        typesList: Array<string>,
        resources?: DownloadResource.AsObject,
        license: string,
        providesIncludesList: Array<string>,
        dependenciesList: Array<LibraryDependency.AsObject>,
    }
}

export class LibraryDependency extends jspb.Message { 
    getName(): string;
    setName(value: string): LibraryDependency;

    getVersionConstraint(): string;
    setVersionConstraint(value: string): LibraryDependency;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryDependency.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryDependency): LibraryDependency.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryDependency, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryDependency;
    static deserializeBinaryFromReader(message: LibraryDependency, reader: jspb.BinaryReader): LibraryDependency;
}

export namespace LibraryDependency {
    export type AsObject = {
        name: string,
        versionConstraint: string,
    }
}

export class DownloadResource extends jspb.Message { 
    getUrl(): string;
    setUrl(value: string): DownloadResource;

    getArchiveFilename(): string;
    setArchiveFilename(value: string): DownloadResource;

    getChecksum(): string;
    setChecksum(value: string): DownloadResource;

    getSize(): number;
    setSize(value: number): DownloadResource;

    getCachePath(): string;
    setCachePath(value: string): DownloadResource;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DownloadResource.AsObject;
    static toObject(includeInstance: boolean, msg: DownloadResource): DownloadResource.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DownloadResource, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DownloadResource;
    static deserializeBinaryFromReader(message: DownloadResource, reader: jspb.BinaryReader): DownloadResource;
}

export namespace DownloadResource {
    export type AsObject = {
        url: string,
        archiveFilename: string,
        checksum: string,
        size: number,
        cachePath: string,
    }
}

export class LibraryListRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): LibraryListRequest;

    getAll(): boolean;
    setAll(value: boolean): LibraryListRequest;

    getUpdatable(): boolean;
    setUpdatable(value: boolean): LibraryListRequest;

    getName(): string;
    setName(value: string): LibraryListRequest;

    getFqbn(): string;
    setFqbn(value: string): LibraryListRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryListRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryListRequest): LibraryListRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryListRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryListRequest;
    static deserializeBinaryFromReader(message: LibraryListRequest, reader: jspb.BinaryReader): LibraryListRequest;
}

export namespace LibraryListRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        all: boolean,
        updatable: boolean,
        name: string,
        fqbn: string,
    }
}

export class LibraryListResponse extends jspb.Message { 
    clearInstalledLibrariesList(): void;
    getInstalledLibrariesList(): Array<InstalledLibrary>;
    setInstalledLibrariesList(value: Array<InstalledLibrary>): LibraryListResponse;
    addInstalledLibraries(value?: InstalledLibrary, index?: number): InstalledLibrary;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryListResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryListResponse): LibraryListResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryListResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryListResponse;
    static deserializeBinaryFromReader(message: LibraryListResponse, reader: jspb.BinaryReader): LibraryListResponse;
}

export namespace LibraryListResponse {
    export type AsObject = {
        installedLibrariesList: Array<InstalledLibrary.AsObject>,
    }
}

export class InstalledLibrary extends jspb.Message { 

    hasLibrary(): boolean;
    clearLibrary(): void;
    getLibrary(): Library | undefined;
    setLibrary(value?: Library): InstalledLibrary;


    hasRelease(): boolean;
    clearRelease(): void;
    getRelease(): LibraryRelease | undefined;
    setRelease(value?: LibraryRelease): InstalledLibrary;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InstalledLibrary.AsObject;
    static toObject(includeInstance: boolean, msg: InstalledLibrary): InstalledLibrary.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InstalledLibrary, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InstalledLibrary;
    static deserializeBinaryFromReader(message: InstalledLibrary, reader: jspb.BinaryReader): InstalledLibrary;
}

export namespace InstalledLibrary {
    export type AsObject = {
        library?: Library.AsObject,
        release?: LibraryRelease.AsObject,
    }
}

export class Library extends jspb.Message { 
    getName(): string;
    setName(value: string): Library;

    getAuthor(): string;
    setAuthor(value: string): Library;

    getMaintainer(): string;
    setMaintainer(value: string): Library;

    getSentence(): string;
    setSentence(value: string): Library;

    getParagraph(): string;
    setParagraph(value: string): Library;

    getWebsite(): string;
    setWebsite(value: string): Library;

    getCategory(): string;
    setCategory(value: string): Library;

    clearArchitecturesList(): void;
    getArchitecturesList(): Array<string>;
    setArchitecturesList(value: Array<string>): Library;
    addArchitectures(value: string, index?: number): string;

    clearTypesList(): void;
    getTypesList(): Array<string>;
    setTypesList(value: Array<string>): Library;
    addTypes(value: string, index?: number): string;

    getInstallDir(): string;
    setInstallDir(value: string): Library;

    getSourceDir(): string;
    setSourceDir(value: string): Library;

    getUtilityDir(): string;
    setUtilityDir(value: string): Library;

    getContainerPlatform(): string;
    setContainerPlatform(value: string): Library;

    getRealName(): string;
    setRealName(value: string): Library;

    getDotALinkage(): boolean;
    setDotALinkage(value: boolean): Library;

    getPrecompiled(): boolean;
    setPrecompiled(value: boolean): Library;

    getLdFlags(): string;
    setLdFlags(value: string): Library;

    getIsLegacy(): boolean;
    setIsLegacy(value: boolean): Library;

    getVersion(): string;
    setVersion(value: string): Library;

    getLicense(): string;
    setLicense(value: string): Library;


    getPropertiesMap(): jspb.Map<string, string>;
    clearPropertiesMap(): void;

    getLocation(): LibraryLocation;
    setLocation(value: LibraryLocation): Library;

    getLayout(): LibraryLayout;
    setLayout(value: LibraryLayout): Library;

    clearExamplesList(): void;
    getExamplesList(): Array<string>;
    setExamplesList(value: Array<string>): Library;
    addExamples(value: string, index?: number): string;

    clearProvidesIncludesList(): void;
    getProvidesIncludesList(): Array<string>;
    setProvidesIncludesList(value: Array<string>): Library;
    addProvidesIncludes(value: string, index?: number): string;


    getCompatibleWithMap(): jspb.Map<string, boolean>;
    clearCompatibleWithMap(): void;


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
        name: string,
        author: string,
        maintainer: string,
        sentence: string,
        paragraph: string,
        website: string,
        category: string,
        architecturesList: Array<string>,
        typesList: Array<string>,
        installDir: string,
        sourceDir: string,
        utilityDir: string,
        containerPlatform: string,
        realName: string,
        dotALinkage: boolean,
        precompiled: boolean,
        ldFlags: string,
        isLegacy: boolean,
        version: string,
        license: string,

        propertiesMap: Array<[string, string]>,
        location: LibraryLocation,
        layout: LibraryLayout,
        examplesList: Array<string>,
        providesIncludesList: Array<string>,

        compatibleWithMap: Array<[string, boolean]>,
    }
}

export class ZipLibraryInstallRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): ZipLibraryInstallRequest;

    getPath(): string;
    setPath(value: string): ZipLibraryInstallRequest;

    getOverwrite(): boolean;
    setOverwrite(value: boolean): ZipLibraryInstallRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ZipLibraryInstallRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ZipLibraryInstallRequest): ZipLibraryInstallRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ZipLibraryInstallRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ZipLibraryInstallRequest;
    static deserializeBinaryFromReader(message: ZipLibraryInstallRequest, reader: jspb.BinaryReader): ZipLibraryInstallRequest;
}

export namespace ZipLibraryInstallRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        path: string,
        overwrite: boolean,
    }
}

export class ZipLibraryInstallResponse extends jspb.Message { 

    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): ZipLibraryInstallResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ZipLibraryInstallResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ZipLibraryInstallResponse): ZipLibraryInstallResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ZipLibraryInstallResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ZipLibraryInstallResponse;
    static deserializeBinaryFromReader(message: ZipLibraryInstallResponse, reader: jspb.BinaryReader): ZipLibraryInstallResponse;
}

export namespace ZipLibraryInstallResponse {
    export type AsObject = {
        taskProgress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
    }
}

export class GitLibraryInstallRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): GitLibraryInstallRequest;

    getUrl(): string;
    setUrl(value: string): GitLibraryInstallRequest;

    getOverwrite(): boolean;
    setOverwrite(value: boolean): GitLibraryInstallRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GitLibraryInstallRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GitLibraryInstallRequest): GitLibraryInstallRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GitLibraryInstallRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GitLibraryInstallRequest;
    static deserializeBinaryFromReader(message: GitLibraryInstallRequest, reader: jspb.BinaryReader): GitLibraryInstallRequest;
}

export namespace GitLibraryInstallRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        url: string,
        overwrite: boolean,
    }
}

export class GitLibraryInstallResponse extends jspb.Message { 

    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): GitLibraryInstallResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GitLibraryInstallResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GitLibraryInstallResponse): GitLibraryInstallResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GitLibraryInstallResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GitLibraryInstallResponse;
    static deserializeBinaryFromReader(message: GitLibraryInstallResponse, reader: jspb.BinaryReader): GitLibraryInstallResponse;
}

export namespace GitLibraryInstallResponse {
    export type AsObject = {
        taskProgress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
    }
}

export enum LibraryInstallLocation {
    LIBRARY_INSTALL_LOCATION_USER = 0,
    LIBRARY_INSTALL_LOCATION_BUILTIN = 1,
}

export enum LibrarySearchStatus {
    LIBRARY_SEARCH_STATUS_FAILED = 0,
    LIBRARY_SEARCH_STATUS_SUCCESS = 1,
}

export enum LibraryLayout {
    LIBRARY_LAYOUT_FLAT = 0,
    LIBRARY_LAYOUT_RECURSIVE = 1,
}

export enum LibraryLocation {
    LIBRARY_LOCATION_BUILTIN = 0,
    LIBRARY_LOCATION_USER = 1,
    LIBRARY_LOCATION_PLATFORM_BUILTIN = 2,
    LIBRARY_LOCATION_REFERENCED_PLATFORM_BUILTIN = 3,
    LIBRARY_LOCATION_UNMANAGED = 4,
}
