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
    setLibraryManagerOnly(value: boolean): void;


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
    setInstance(value?: commands_common_pb.Instance): void;

    clearPlatformsIndexErrorsList(): void;
    getPlatformsIndexErrorsList(): Array<string>;
    setPlatformsIndexErrorsList(value: Array<string>): void;
    addPlatformsIndexErrors(value: string, index?: number): string;

    getLibrariesIndexError(): string;
    setLibrariesIndexError(value: string): void;


    hasDownloadProgress(): boolean;
    clearDownloadProgress(): void;
    getDownloadProgress(): commands_common_pb.DownloadProgress | undefined;
    setDownloadProgress(value?: commands_common_pb.DownloadProgress): void;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): commands_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: commands_common_pb.TaskProgress): void;


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
    setInstance(value?: commands_common_pb.Instance): void;


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
    setInstance(value?: commands_common_pb.Instance): void;


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
    setPlatformsIndexErrorsList(value: Array<string>): void;
    addPlatformsIndexErrors(value: string, index?: number): string;

    getLibrariesIndexError(): string;
    setLibrariesIndexError(value: string): void;


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
    setInstance(value?: commands_common_pb.Instance): void;


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
    setDownloadProgress(value?: commands_common_pb.DownloadProgress): void;


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
    setInstance(value?: commands_common_pb.Instance): void;


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
    setDownloadProgress(value?: commands_common_pb.DownloadProgress): void;


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
    setVersion(value: string): void;


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
