// package: arduino
// file: lib.proto

/* tslint:disable */

import * as jspb from "google-protobuf";
import * as common_pb from "./common_pb";

export class LibraryDownloadReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): common_pb.Instance | undefined;
    setInstance(value?: common_pb.Instance): void;

    getName(): string;
    setName(value: string): void;

    getVersion(): string;
    setVersion(value: string): void;


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
        instance?: common_pb.Instance.AsObject,
        name: string,
        version: string,
    }
}

export class LibraryDownloadResp extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): common_pb.DownloadProgress | undefined;
    setProgress(value?: common_pb.DownloadProgress): void;


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
        progress?: common_pb.DownloadProgress.AsObject,
    }
}

export class LibraryInstallReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): common_pb.Instance | undefined;
    setInstance(value?: common_pb.Instance): void;

    getName(): string;
    setName(value: string): void;

    getVersion(): string;
    setVersion(value: string): void;


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
        instance?: common_pb.Instance.AsObject,
        name: string,
        version: string,
    }
}

export class LibraryInstallResp extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): common_pb.DownloadProgress | undefined;
    setProgress(value?: common_pb.DownloadProgress): void;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): common_pb.TaskProgress | undefined;
    setTaskProgress(value?: common_pb.TaskProgress): void;


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
        progress?: common_pb.DownloadProgress.AsObject,
        taskProgress?: common_pb.TaskProgress.AsObject,
    }
}

export class LibraryUninstallReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): common_pb.Instance | undefined;
    setInstance(value?: common_pb.Instance): void;

    getName(): string;
    setName(value: string): void;

    getVersion(): string;
    setVersion(value: string): void;


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
        instance?: common_pb.Instance.AsObject,
        name: string,
        version: string,
    }
}

export class LibraryUninstallResp extends jspb.Message { 

    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): common_pb.TaskProgress | undefined;
    setTaskProgress(value?: common_pb.TaskProgress): void;


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
        taskProgress?: common_pb.TaskProgress.AsObject,
    }
}

export class LibraryUpgradeAllReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): common_pb.Instance | undefined;
    setInstance(value?: common_pb.Instance): void;


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
        instance?: common_pb.Instance.AsObject,
    }
}

export class LibraryUpgradeAllResp extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): common_pb.DownloadProgress | undefined;
    setProgress(value?: common_pb.DownloadProgress): void;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): common_pb.TaskProgress | undefined;
    setTaskProgress(value?: common_pb.TaskProgress): void;


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
        progress?: common_pb.DownloadProgress.AsObject,
        taskProgress?: common_pb.TaskProgress.AsObject,
    }
}

export class LibrarySearchReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): common_pb.Instance | undefined;
    setInstance(value?: common_pb.Instance): void;

    getNames(): boolean;
    setNames(value: boolean): void;

    getQuery(): string;
    setQuery(value: string): void;


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
        instance?: common_pb.Instance.AsObject,
        names: boolean,
        query: string,
    }
}

export class LibrarySearchResp extends jspb.Message { 
    clearSearchOutputList(): void;
    getSearchOutputList(): Array<SearchLibraryOutput>;
    setSearchOutputList(value: Array<SearchLibraryOutput>): void;
    addSearchOutput(value?: SearchLibraryOutput, index?: number): SearchLibraryOutput;


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
        searchOutputList: Array<SearchLibraryOutput.AsObject>,
    }
}

export class SearchLibraryOutput extends jspb.Message { 
    getName(): string;
    setName(value: string): void;


    getReleasesMap(): jspb.Map<string, LibraryRelease>;
    clearReleasesMap(): void;


    hasLatest(): boolean;
    clearLatest(): void;
    getLatest(): LibraryRelease | undefined;
    setLatest(value?: LibraryRelease): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SearchLibraryOutput.AsObject;
    static toObject(includeInstance: boolean, msg: SearchLibraryOutput): SearchLibraryOutput.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SearchLibraryOutput, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SearchLibraryOutput;
    static deserializeBinaryFromReader(message: SearchLibraryOutput, reader: jspb.BinaryReader): SearchLibraryOutput;
}

export namespace SearchLibraryOutput {
    export type AsObject = {
        name: string,

        releasesMap: Array<[string, LibraryRelease.AsObject]>,
        latest?: LibraryRelease.AsObject,
    }
}

export class LibraryRelease extends jspb.Message { 
    getAuthor(): string;
    setAuthor(value: string): void;

    getVersion(): string;
    setVersion(value: string): void;

    getMaintainer(): string;
    setMaintainer(value: string): void;

    getSentence(): string;
    setSentence(value: string): void;

    getParagraph(): string;
    setParagraph(value: string): void;

    getWebsite(): string;
    setWebsite(value: string): void;

    getCategory(): string;
    setCategory(value: string): void;

    clearArchitecturesList(): void;
    getArchitecturesList(): Array<string>;
    setArchitecturesList(value: Array<string>): void;
    addArchitectures(value: string, index?: number): string;

    clearTypesList(): void;
    getTypesList(): Array<string>;
    setTypesList(value: Array<string>): void;
    addTypes(value: string, index?: number): string;


    hasResources(): boolean;
    clearResources(): void;
    getResources(): DownloadResource | undefined;
    setResources(value?: DownloadResource): void;


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
    }
}

export class DownloadResource extends jspb.Message { 
    getUrl(): string;
    setUrl(value: string): void;

    getArchivefilename(): string;
    setArchivefilename(value: string): void;

    getChecksum(): string;
    setChecksum(value: string): void;

    getSize(): number;
    setSize(value: number): void;

    getCachepath(): string;
    setCachepath(value: string): void;


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
