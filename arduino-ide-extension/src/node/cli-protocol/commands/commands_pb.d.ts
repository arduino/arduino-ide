// package: cc.arduino.cli.commands
// file: commands/commands.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as commands_common_pb from "../commands/common_pb";
import * as commands_board_pb from "../commands/board_pb";
import * as commands_compile_pb from "../commands/compile_pb";
import * as commands_core_pb from "../commands/core_pb";
import * as commands_upload_pb from "../commands/upload_pb";
import * as commands_lib_pb from "../commands/lib_pb";

export class InitReq extends jspb.Message { 
    getLibraryManagerOnly(): boolean;
    setLibraryManagerOnly(value: boolean): InitReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InitReq.AsObject;
    static toObject(includeInstance: boolean, msg: InitReq): InitReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InitReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InitReq;
    static deserializeBinaryFromReader(message: InitReq, reader: jspb.BinaryReader): InitReq;
}

export namespace InitReq {
    export type AsObject = {
        libraryManagerOnly: boolean,
    }
}

export class InitResp extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): InitResp;

    clearPlatformsIndexErrorsList(): void;
    getPlatformsIndexErrorsList(): Array<string>;
    setPlatformsIndexErrorsList(value: Array<string>): InitResp;
    addPlatformsIndexErrors(value: string, index?: number): string;

    getLibrariesIndexError(): string;
    setLibrariesIndexError(value: string): InitResp;


    hasDownloadProgress(): boolean;
    clearDownloadProgress(): void;
    getDownloadProgress(): commands_common_pb.DownloadProgress | undefined;
    setDownloadProgress(value?: commands_common_pb.DownloadProgress): InitResp;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): commands_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: commands_common_pb.TaskProgress): InitResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InitResp.AsObject;
    static toObject(includeInstance: boolean, msg: InitResp): InitResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InitResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InitResp;
    static deserializeBinaryFromReader(message: InitResp, reader: jspb.BinaryReader): InitResp;
}

export namespace InitResp {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        platformsIndexErrorsList: Array<string>,
        librariesIndexError: string,
        downloadProgress?: commands_common_pb.DownloadProgress.AsObject,
        taskProgress?: commands_common_pb.TaskProgress.AsObject,
    }
}

export class DestroyReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): DestroyReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DestroyReq.AsObject;
    static toObject(includeInstance: boolean, msg: DestroyReq): DestroyReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DestroyReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DestroyReq;
    static deserializeBinaryFromReader(message: DestroyReq, reader: jspb.BinaryReader): DestroyReq;
}

export namespace DestroyReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
    }
}

export class DestroyResp extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DestroyResp.AsObject;
    static toObject(includeInstance: boolean, msg: DestroyResp): DestroyResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DestroyResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DestroyResp;
    static deserializeBinaryFromReader(message: DestroyResp, reader: jspb.BinaryReader): DestroyResp;
}

export namespace DestroyResp {
    export type AsObject = {
    }
}

export class RescanReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): RescanReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RescanReq.AsObject;
    static toObject(includeInstance: boolean, msg: RescanReq): RescanReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RescanReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RescanReq;
    static deserializeBinaryFromReader(message: RescanReq, reader: jspb.BinaryReader): RescanReq;
}

export namespace RescanReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
    }
}

export class RescanResp extends jspb.Message { 
    clearPlatformsIndexErrorsList(): void;
    getPlatformsIndexErrorsList(): Array<string>;
    setPlatformsIndexErrorsList(value: Array<string>): RescanResp;
    addPlatformsIndexErrors(value: string, index?: number): string;

    getLibrariesIndexError(): string;
    setLibrariesIndexError(value: string): RescanResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RescanResp.AsObject;
    static toObject(includeInstance: boolean, msg: RescanResp): RescanResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RescanResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RescanResp;
    static deserializeBinaryFromReader(message: RescanResp, reader: jspb.BinaryReader): RescanResp;
}

export namespace RescanResp {
    export type AsObject = {
        platformsIndexErrorsList: Array<string>,
        librariesIndexError: string,
    }
}

export class UpdateIndexReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): UpdateIndexReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateIndexReq.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateIndexReq): UpdateIndexReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateIndexReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateIndexReq;
    static deserializeBinaryFromReader(message: UpdateIndexReq, reader: jspb.BinaryReader): UpdateIndexReq;
}

export namespace UpdateIndexReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
    }
}

export class UpdateIndexResp extends jspb.Message { 

    hasDownloadProgress(): boolean;
    clearDownloadProgress(): void;
    getDownloadProgress(): commands_common_pb.DownloadProgress | undefined;
    setDownloadProgress(value?: commands_common_pb.DownloadProgress): UpdateIndexResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateIndexResp.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateIndexResp): UpdateIndexResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateIndexResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateIndexResp;
    static deserializeBinaryFromReader(message: UpdateIndexResp, reader: jspb.BinaryReader): UpdateIndexResp;
}

export namespace UpdateIndexResp {
    export type AsObject = {
        downloadProgress?: commands_common_pb.DownloadProgress.AsObject,
    }
}

export class UpdateLibrariesIndexReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): UpdateLibrariesIndexReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateLibrariesIndexReq.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateLibrariesIndexReq): UpdateLibrariesIndexReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateLibrariesIndexReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateLibrariesIndexReq;
    static deserializeBinaryFromReader(message: UpdateLibrariesIndexReq, reader: jspb.BinaryReader): UpdateLibrariesIndexReq;
}

export namespace UpdateLibrariesIndexReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
    }
}

export class UpdateLibrariesIndexResp extends jspb.Message { 

    hasDownloadProgress(): boolean;
    clearDownloadProgress(): void;
    getDownloadProgress(): commands_common_pb.DownloadProgress | undefined;
    setDownloadProgress(value?: commands_common_pb.DownloadProgress): UpdateLibrariesIndexResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateLibrariesIndexResp.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateLibrariesIndexResp): UpdateLibrariesIndexResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateLibrariesIndexResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateLibrariesIndexResp;
    static deserializeBinaryFromReader(message: UpdateLibrariesIndexResp, reader: jspb.BinaryReader): UpdateLibrariesIndexResp;
}

export namespace UpdateLibrariesIndexResp {
    export type AsObject = {
        downloadProgress?: commands_common_pb.DownloadProgress.AsObject,
    }
}

export class UpdateCoreLibrariesIndexReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): UpdateCoreLibrariesIndexReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateCoreLibrariesIndexReq.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateCoreLibrariesIndexReq): UpdateCoreLibrariesIndexReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateCoreLibrariesIndexReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateCoreLibrariesIndexReq;
    static deserializeBinaryFromReader(message: UpdateCoreLibrariesIndexReq, reader: jspb.BinaryReader): UpdateCoreLibrariesIndexReq;
}

export namespace UpdateCoreLibrariesIndexReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
    }
}

export class UpdateCoreLibrariesIndexResp extends jspb.Message { 

    hasDownloadProgress(): boolean;
    clearDownloadProgress(): void;
    getDownloadProgress(): commands_common_pb.DownloadProgress | undefined;
    setDownloadProgress(value?: commands_common_pb.DownloadProgress): UpdateCoreLibrariesIndexResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateCoreLibrariesIndexResp.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateCoreLibrariesIndexResp): UpdateCoreLibrariesIndexResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateCoreLibrariesIndexResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateCoreLibrariesIndexResp;
    static deserializeBinaryFromReader(message: UpdateCoreLibrariesIndexResp, reader: jspb.BinaryReader): UpdateCoreLibrariesIndexResp;
}

export namespace UpdateCoreLibrariesIndexResp {
    export type AsObject = {
        downloadProgress?: commands_common_pb.DownloadProgress.AsObject,
    }
}

export class OutdatedReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): OutdatedReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OutdatedReq.AsObject;
    static toObject(includeInstance: boolean, msg: OutdatedReq): OutdatedReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: OutdatedReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OutdatedReq;
    static deserializeBinaryFromReader(message: OutdatedReq, reader: jspb.BinaryReader): OutdatedReq;
}

export namespace OutdatedReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
    }
}

export class OutdatedResp extends jspb.Message { 
    clearOutdatedLibraryList(): void;
    getOutdatedLibraryList(): Array<commands_lib_pb.InstalledLibrary>;
    setOutdatedLibraryList(value: Array<commands_lib_pb.InstalledLibrary>): OutdatedResp;
    addOutdatedLibrary(value?: commands_lib_pb.InstalledLibrary, index?: number): commands_lib_pb.InstalledLibrary;

    clearOutdatedPlatformList(): void;
    getOutdatedPlatformList(): Array<commands_common_pb.Platform>;
    setOutdatedPlatformList(value: Array<commands_common_pb.Platform>): OutdatedResp;
    addOutdatedPlatform(value?: commands_common_pb.Platform, index?: number): commands_common_pb.Platform;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OutdatedResp.AsObject;
    static toObject(includeInstance: boolean, msg: OutdatedResp): OutdatedResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: OutdatedResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OutdatedResp;
    static deserializeBinaryFromReader(message: OutdatedResp, reader: jspb.BinaryReader): OutdatedResp;
}

export namespace OutdatedResp {
    export type AsObject = {
        outdatedLibraryList: Array<commands_lib_pb.InstalledLibrary.AsObject>,
        outdatedPlatformList: Array<commands_common_pb.Platform.AsObject>,
    }
}

export class UpgradeReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): UpgradeReq;

    getSkippostinstall(): boolean;
    setSkippostinstall(value: boolean): UpgradeReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpgradeReq.AsObject;
    static toObject(includeInstance: boolean, msg: UpgradeReq): UpgradeReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpgradeReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpgradeReq;
    static deserializeBinaryFromReader(message: UpgradeReq, reader: jspb.BinaryReader): UpgradeReq;
}

export namespace UpgradeReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        skippostinstall: boolean,
    }
}

export class UpgradeResp extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): commands_common_pb.DownloadProgress | undefined;
    setProgress(value?: commands_common_pb.DownloadProgress): UpgradeResp;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): commands_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: commands_common_pb.TaskProgress): UpgradeResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpgradeResp.AsObject;
    static toObject(includeInstance: boolean, msg: UpgradeResp): UpgradeResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpgradeResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpgradeResp;
    static deserializeBinaryFromReader(message: UpgradeResp, reader: jspb.BinaryReader): UpgradeResp;
}

export namespace UpgradeResp {
    export type AsObject = {
        progress?: commands_common_pb.DownloadProgress.AsObject,
        taskProgress?: commands_common_pb.TaskProgress.AsObject,
    }
}

export class VersionReq extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VersionReq.AsObject;
    static toObject(includeInstance: boolean, msg: VersionReq): VersionReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VersionReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VersionReq;
    static deserializeBinaryFromReader(message: VersionReq, reader: jspb.BinaryReader): VersionReq;
}

export namespace VersionReq {
    export type AsObject = {
    }
}

export class VersionResp extends jspb.Message { 
    getVersion(): string;
    setVersion(value: string): VersionResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VersionResp.AsObject;
    static toObject(includeInstance: boolean, msg: VersionResp): VersionResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VersionResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VersionResp;
    static deserializeBinaryFromReader(message: VersionResp, reader: jspb.BinaryReader): VersionResp;
}

export namespace VersionResp {
    export type AsObject = {
        version: string,
    }
}

export class LoadSketchReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): LoadSketchReq;

    getSketchPath(): string;
    setSketchPath(value: string): LoadSketchReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LoadSketchReq.AsObject;
    static toObject(includeInstance: boolean, msg: LoadSketchReq): LoadSketchReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LoadSketchReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LoadSketchReq;
    static deserializeBinaryFromReader(message: LoadSketchReq, reader: jspb.BinaryReader): LoadSketchReq;
}

export namespace LoadSketchReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        sketchPath: string,
    }
}

export class LoadSketchResp extends jspb.Message { 
    getMainFile(): string;
    setMainFile(value: string): LoadSketchResp;

    getLocationPath(): string;
    setLocationPath(value: string): LoadSketchResp;

    clearOtherSketchFilesList(): void;
    getOtherSketchFilesList(): Array<string>;
    setOtherSketchFilesList(value: Array<string>): LoadSketchResp;
    addOtherSketchFiles(value: string, index?: number): string;

    clearAdditionalFilesList(): void;
    getAdditionalFilesList(): Array<string>;
    setAdditionalFilesList(value: Array<string>): LoadSketchResp;
    addAdditionalFiles(value: string, index?: number): string;

    clearRootFolderFilesList(): void;
    getRootFolderFilesList(): Array<string>;
    setRootFolderFilesList(value: Array<string>): LoadSketchResp;
    addRootFolderFiles(value: string, index?: number): string;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LoadSketchResp.AsObject;
    static toObject(includeInstance: boolean, msg: LoadSketchResp): LoadSketchResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LoadSketchResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LoadSketchResp;
    static deserializeBinaryFromReader(message: LoadSketchResp, reader: jspb.BinaryReader): LoadSketchResp;
}

export namespace LoadSketchResp {
    export type AsObject = {
        mainFile: string,
        locationPath: string,
        otherSketchFilesList: Array<string>,
        additionalFilesList: Array<string>,
        rootFolderFilesList: Array<string>,
    }
}

export class ArchiveSketchReq extends jspb.Message { 
    getSketchPath(): string;
    setSketchPath(value: string): ArchiveSketchReq;

    getArchivePath(): string;
    setArchivePath(value: string): ArchiveSketchReq;

    getIncludeBuildDir(): boolean;
    setIncludeBuildDir(value: boolean): ArchiveSketchReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ArchiveSketchReq.AsObject;
    static toObject(includeInstance: boolean, msg: ArchiveSketchReq): ArchiveSketchReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ArchiveSketchReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ArchiveSketchReq;
    static deserializeBinaryFromReader(message: ArchiveSketchReq, reader: jspb.BinaryReader): ArchiveSketchReq;
}

export namespace ArchiveSketchReq {
    export type AsObject = {
        sketchPath: string,
        archivePath: string,
        includeBuildDir: boolean,
    }
}

export class ArchiveSketchResp extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ArchiveSketchResp.AsObject;
    static toObject(includeInstance: boolean, msg: ArchiveSketchResp): ArchiveSketchResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ArchiveSketchResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ArchiveSketchResp;
    static deserializeBinaryFromReader(message: ArchiveSketchResp, reader: jspb.BinaryReader): ArchiveSketchResp;
}

export namespace ArchiveSketchResp {
    export type AsObject = {
    }
}
