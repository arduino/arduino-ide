// package: cc.arduino.cli.commands
// file: commands/lib.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as commands_common_pb from "../commands/common_pb";

export class LibraryDownloadReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): LibraryDownloadReq;

    getName(): string;
    setName(value: string): LibraryDownloadReq;

    getVersion(): string;
    setVersion(value: string): LibraryDownloadReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryDownloadReq.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryDownloadReq): LibraryDownloadReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryDownloadReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryDownloadReq;
    static deserializeBinaryFromReader(message: LibraryDownloadReq, reader: jspb.BinaryReader): LibraryDownloadReq;
}

export namespace LibraryDownloadReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        name: string,
        version: string,
    }
}

export class LibraryDownloadResp extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): commands_common_pb.DownloadProgress | undefined;
    setProgress(value?: commands_common_pb.DownloadProgress): LibraryDownloadResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryDownloadResp.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryDownloadResp): LibraryDownloadResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryDownloadResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryDownloadResp;
    static deserializeBinaryFromReader(message: LibraryDownloadResp, reader: jspb.BinaryReader): LibraryDownloadResp;
}

export namespace LibraryDownloadResp {
    export type AsObject = {
        progress?: commands_common_pb.DownloadProgress.AsObject,
    }
}

export class LibraryInstallReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): LibraryInstallReq;

    getName(): string;
    setName(value: string): LibraryInstallReq;

    getVersion(): string;
    setVersion(value: string): LibraryInstallReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryInstallReq.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryInstallReq): LibraryInstallReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryInstallReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryInstallReq;
    static deserializeBinaryFromReader(message: LibraryInstallReq, reader: jspb.BinaryReader): LibraryInstallReq;
}

export namespace LibraryInstallReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        name: string,
        version: string,
    }
}

export class LibraryInstallResp extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): commands_common_pb.DownloadProgress | undefined;
    setProgress(value?: commands_common_pb.DownloadProgress): LibraryInstallResp;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): commands_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: commands_common_pb.TaskProgress): LibraryInstallResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryInstallResp.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryInstallResp): LibraryInstallResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryInstallResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryInstallResp;
    static deserializeBinaryFromReader(message: LibraryInstallResp, reader: jspb.BinaryReader): LibraryInstallResp;
}

export namespace LibraryInstallResp {
    export type AsObject = {
        progress?: commands_common_pb.DownloadProgress.AsObject,
        taskProgress?: commands_common_pb.TaskProgress.AsObject,
    }
}

export class LibraryUninstallReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): LibraryUninstallReq;

    getName(): string;
    setName(value: string): LibraryUninstallReq;

    getVersion(): string;
    setVersion(value: string): LibraryUninstallReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryUninstallReq.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryUninstallReq): LibraryUninstallReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryUninstallReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryUninstallReq;
    static deserializeBinaryFromReader(message: LibraryUninstallReq, reader: jspb.BinaryReader): LibraryUninstallReq;
}

export namespace LibraryUninstallReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        name: string,
        version: string,
    }
}

export class LibraryUninstallResp extends jspb.Message { 

    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): commands_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: commands_common_pb.TaskProgress): LibraryUninstallResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryUninstallResp.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryUninstallResp): LibraryUninstallResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryUninstallResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryUninstallResp;
    static deserializeBinaryFromReader(message: LibraryUninstallResp, reader: jspb.BinaryReader): LibraryUninstallResp;
}

export namespace LibraryUninstallResp {
    export type AsObject = {
        taskProgress?: commands_common_pb.TaskProgress.AsObject,
    }
}

export class LibraryUpgradeAllReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): LibraryUpgradeAllReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryUpgradeAllReq.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryUpgradeAllReq): LibraryUpgradeAllReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryUpgradeAllReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryUpgradeAllReq;
    static deserializeBinaryFromReader(message: LibraryUpgradeAllReq, reader: jspb.BinaryReader): LibraryUpgradeAllReq;
}

export namespace LibraryUpgradeAllReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
    }
}

export class LibraryUpgradeAllResp extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): commands_common_pb.DownloadProgress | undefined;
    setProgress(value?: commands_common_pb.DownloadProgress): LibraryUpgradeAllResp;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): commands_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: commands_common_pb.TaskProgress): LibraryUpgradeAllResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryUpgradeAllResp.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryUpgradeAllResp): LibraryUpgradeAllResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryUpgradeAllResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryUpgradeAllResp;
    static deserializeBinaryFromReader(message: LibraryUpgradeAllResp, reader: jspb.BinaryReader): LibraryUpgradeAllResp;
}

export namespace LibraryUpgradeAllResp {
    export type AsObject = {
        progress?: commands_common_pb.DownloadProgress.AsObject,
        taskProgress?: commands_common_pb.TaskProgress.AsObject,
    }
}

export class LibraryResolveDependenciesReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): LibraryResolveDependenciesReq;

    getName(): string;
    setName(value: string): LibraryResolveDependenciesReq;

    getVersion(): string;
    setVersion(value: string): LibraryResolveDependenciesReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryResolveDependenciesReq.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryResolveDependenciesReq): LibraryResolveDependenciesReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryResolveDependenciesReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryResolveDependenciesReq;
    static deserializeBinaryFromReader(message: LibraryResolveDependenciesReq, reader: jspb.BinaryReader): LibraryResolveDependenciesReq;
}

export namespace LibraryResolveDependenciesReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        name: string,
        version: string,
    }
}

export class LibraryResolveDependenciesResp extends jspb.Message { 
    clearDependenciesList(): void;
    getDependenciesList(): Array<LibraryDependencyStatus>;
    setDependenciesList(value: Array<LibraryDependencyStatus>): LibraryResolveDependenciesResp;
    addDependencies(value?: LibraryDependencyStatus, index?: number): LibraryDependencyStatus;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryResolveDependenciesResp.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryResolveDependenciesResp): LibraryResolveDependenciesResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryResolveDependenciesResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryResolveDependenciesResp;
    static deserializeBinaryFromReader(message: LibraryResolveDependenciesResp, reader: jspb.BinaryReader): LibraryResolveDependenciesResp;
}

export namespace LibraryResolveDependenciesResp {
    export type AsObject = {
        dependenciesList: Array<LibraryDependencyStatus.AsObject>,
    }
}

export class LibraryDependencyStatus extends jspb.Message { 
    getName(): string;
    setName(value: string): LibraryDependencyStatus;

    getVersionrequired(): string;
    setVersionrequired(value: string): LibraryDependencyStatus;

    getVersioninstalled(): string;
    setVersioninstalled(value: string): LibraryDependencyStatus;


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
        versionrequired: string,
        versioninstalled: string,
    }
}

export class LibrarySearchReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): LibrarySearchReq;

    getQuery(): string;
    setQuery(value: string): LibrarySearchReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibrarySearchReq.AsObject;
    static toObject(includeInstance: boolean, msg: LibrarySearchReq): LibrarySearchReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibrarySearchReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibrarySearchReq;
    static deserializeBinaryFromReader(message: LibrarySearchReq, reader: jspb.BinaryReader): LibrarySearchReq;
}

export namespace LibrarySearchReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        query: string,
    }
}

export class LibrarySearchResp extends jspb.Message { 
    clearLibrariesList(): void;
    getLibrariesList(): Array<SearchedLibrary>;
    setLibrariesList(value: Array<SearchedLibrary>): LibrarySearchResp;
    addLibraries(value?: SearchedLibrary, index?: number): SearchedLibrary;

    getStatus(): LibrarySearchStatus;
    setStatus(value: LibrarySearchStatus): LibrarySearchResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibrarySearchResp.AsObject;
    static toObject(includeInstance: boolean, msg: LibrarySearchResp): LibrarySearchResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibrarySearchResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibrarySearchResp;
    static deserializeBinaryFromReader(message: LibrarySearchResp, reader: jspb.BinaryReader): LibrarySearchResp;
}

export namespace LibrarySearchResp {
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

    getArchivefilename(): string;
    setArchivefilename(value: string): DownloadResource;

    getChecksum(): string;
    setChecksum(value: string): DownloadResource;

    getSize(): number;
    setSize(value: number): DownloadResource;

    getCachepath(): string;
    setCachepath(value: string): DownloadResource;


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
        archivefilename: string,
        checksum: string,
        size: number,
        cachepath: string,
    }
}

export class LibraryListReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): LibraryListReq;

    getAll(): boolean;
    setAll(value: boolean): LibraryListReq;

    getUpdatable(): boolean;
    setUpdatable(value: boolean): LibraryListReq;

    getName(): string;
    setName(value: string): LibraryListReq;

    getFqbn(): string;
    setFqbn(value: string): LibraryListReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryListReq.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryListReq): LibraryListReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryListReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryListReq;
    static deserializeBinaryFromReader(message: LibraryListReq, reader: jspb.BinaryReader): LibraryListReq;
}

export namespace LibraryListReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        all: boolean,
        updatable: boolean,
        name: string,
        fqbn: string,
    }
}

export class LibraryListResp extends jspb.Message { 
    clearInstalledLibraryList(): void;
    getInstalledLibraryList(): Array<InstalledLibrary>;
    setInstalledLibraryList(value: Array<InstalledLibrary>): LibraryListResp;
    addInstalledLibrary(value?: InstalledLibrary, index?: number): InstalledLibrary;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LibraryListResp.AsObject;
    static toObject(includeInstance: boolean, msg: LibraryListResp): LibraryListResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LibraryListResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LibraryListResp;
    static deserializeBinaryFromReader(message: LibraryListResp, reader: jspb.BinaryReader): LibraryListResp;
}

export namespace LibraryListResp {
    export type AsObject = {
        installedLibraryList: Array<InstalledLibrary.AsObject>,
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

export class ZipLibraryInstallReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): ZipLibraryInstallReq;

    getPath(): string;
    setPath(value: string): ZipLibraryInstallReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ZipLibraryInstallReq.AsObject;
    static toObject(includeInstance: boolean, msg: ZipLibraryInstallReq): ZipLibraryInstallReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ZipLibraryInstallReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ZipLibraryInstallReq;
    static deserializeBinaryFromReader(message: ZipLibraryInstallReq, reader: jspb.BinaryReader): ZipLibraryInstallReq;
}

export namespace ZipLibraryInstallReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        path: string,
    }
}

export class ZipLibraryInstallResp extends jspb.Message { 

    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): commands_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: commands_common_pb.TaskProgress): ZipLibraryInstallResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ZipLibraryInstallResp.AsObject;
    static toObject(includeInstance: boolean, msg: ZipLibraryInstallResp): ZipLibraryInstallResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ZipLibraryInstallResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ZipLibraryInstallResp;
    static deserializeBinaryFromReader(message: ZipLibraryInstallResp, reader: jspb.BinaryReader): ZipLibraryInstallResp;
}

export namespace ZipLibraryInstallResp {
    export type AsObject = {
        taskProgress?: commands_common_pb.TaskProgress.AsObject,
    }
}

export class GitLibraryInstallReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): GitLibraryInstallReq;

    getUrl(): string;
    setUrl(value: string): GitLibraryInstallReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GitLibraryInstallReq.AsObject;
    static toObject(includeInstance: boolean, msg: GitLibraryInstallReq): GitLibraryInstallReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GitLibraryInstallReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GitLibraryInstallReq;
    static deserializeBinaryFromReader(message: GitLibraryInstallReq, reader: jspb.BinaryReader): GitLibraryInstallReq;
}

export namespace GitLibraryInstallReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        url: string,
    }
}

export class GitLibraryInstallResp extends jspb.Message { 

    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): commands_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: commands_common_pb.TaskProgress): GitLibraryInstallResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GitLibraryInstallResp.AsObject;
    static toObject(includeInstance: boolean, msg: GitLibraryInstallResp): GitLibraryInstallResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GitLibraryInstallResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GitLibraryInstallResp;
    static deserializeBinaryFromReader(message: GitLibraryInstallResp, reader: jspb.BinaryReader): GitLibraryInstallResp;
}

export namespace GitLibraryInstallResp {
    export type AsObject = {
        taskProgress?: commands_common_pb.TaskProgress.AsObject,
    }
}

export enum LibrarySearchStatus {
    FAILED = 0,
    SUCCESS = 1,
}

export enum LibraryLayout {
    FLAT_LAYOUT = 0,
    RECURSIVE_LAYOUT = 1,
}

export enum LibraryLocation {
    IDE_BUILTIN = 0,
    USER = 1,
    PLATFORM_BUILTIN = 2,
    REFERENCED_PLATFORM_BUILTIN = 3,
}
