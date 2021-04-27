// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/commands.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_rpc_status_pb from "../../../../../google/rpc/status_pb";
import * as cc_arduino_cli_commands_v1_common_pb from "../../../../../cc/arduino/cli/commands/v1/common_pb";
import * as cc_arduino_cli_commands_v1_board_pb from "../../../../../cc/arduino/cli/commands/v1/board_pb";
import * as cc_arduino_cli_commands_v1_compile_pb from "../../../../../cc/arduino/cli/commands/v1/compile_pb";
import * as cc_arduino_cli_commands_v1_core_pb from "../../../../../cc/arduino/cli/commands/v1/core_pb";
import * as cc_arduino_cli_commands_v1_upload_pb from "../../../../../cc/arduino/cli/commands/v1/upload_pb";
import * as cc_arduino_cli_commands_v1_lib_pb from "../../../../../cc/arduino/cli/commands/v1/lib_pb";

export class CreateRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateRequest): CreateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateRequest;
    static deserializeBinaryFromReader(message: CreateRequest, reader: jspb.BinaryReader): CreateRequest;
}

export namespace CreateRequest {
    export type AsObject = {
    }
}

export class CreateResponse extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): CreateResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateResponse): CreateResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateResponse;
    static deserializeBinaryFromReader(message: CreateResponse, reader: jspb.BinaryReader): CreateResponse;
}

export namespace CreateResponse {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
    }
}

export class InitRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): InitRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InitRequest.AsObject;
    static toObject(includeInstance: boolean, msg: InitRequest): InitRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InitRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InitRequest;
    static deserializeBinaryFromReader(message: InitRequest, reader: jspb.BinaryReader): InitRequest;
}

export namespace InitRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
    }
}

export class InitResponse extends jspb.Message { 

    hasInitProgress(): boolean;
    clearInitProgress(): void;
    getInitProgress(): InitResponse.Progress | undefined;
    setInitProgress(value?: InitResponse.Progress): InitResponse;


    hasError(): boolean;
    clearError(): void;
    getError(): google_rpc_status_pb.Status | undefined;
    setError(value?: google_rpc_status_pb.Status): InitResponse;


    getMessageCase(): InitResponse.MessageCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InitResponse.AsObject;
    static toObject(includeInstance: boolean, msg: InitResponse): InitResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InitResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InitResponse;
    static deserializeBinaryFromReader(message: InitResponse, reader: jspb.BinaryReader): InitResponse;
}

export namespace InitResponse {
    export type AsObject = {
        initProgress?: InitResponse.Progress.AsObject,
        error?: google_rpc_status_pb.Status.AsObject,
    }


    export class Progress extends jspb.Message { 

        hasDownloadProgress(): boolean;
        clearDownloadProgress(): void;
        getDownloadProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
        setDownloadProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): Progress;


        hasTaskProgress(): boolean;
        clearTaskProgress(): void;
        getTaskProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
        setTaskProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): Progress;


        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Progress.AsObject;
        static toObject(includeInstance: boolean, msg: Progress): Progress.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Progress, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Progress;
        static deserializeBinaryFromReader(message: Progress, reader: jspb.BinaryReader): Progress;
    }

    export namespace Progress {
        export type AsObject = {
            downloadProgress?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress.AsObject,
            taskProgress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
        }
    }


    export enum MessageCase {
        MESSAGE_NOT_SET = 0,
    
    INIT_PROGRESS = 1,

    ERROR = 2,

    }

}

export class DestroyRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): DestroyRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DestroyRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DestroyRequest): DestroyRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DestroyRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DestroyRequest;
    static deserializeBinaryFromReader(message: DestroyRequest, reader: jspb.BinaryReader): DestroyRequest;
}

export namespace DestroyRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
    }
}

export class DestroyResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DestroyResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DestroyResponse): DestroyResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DestroyResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DestroyResponse;
    static deserializeBinaryFromReader(message: DestroyResponse, reader: jspb.BinaryReader): DestroyResponse;
}

export namespace DestroyResponse {
    export type AsObject = {
    }
}

export class UpdateIndexRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): UpdateIndexRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateIndexRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateIndexRequest): UpdateIndexRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateIndexRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateIndexRequest;
    static deserializeBinaryFromReader(message: UpdateIndexRequest, reader: jspb.BinaryReader): UpdateIndexRequest;
}

export namespace UpdateIndexRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
    }
}

export class UpdateIndexResponse extends jspb.Message { 

    hasDownloadProgress(): boolean;
    clearDownloadProgress(): void;
    getDownloadProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setDownloadProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): UpdateIndexResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateIndexResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateIndexResponse): UpdateIndexResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateIndexResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateIndexResponse;
    static deserializeBinaryFromReader(message: UpdateIndexResponse, reader: jspb.BinaryReader): UpdateIndexResponse;
}

export namespace UpdateIndexResponse {
    export type AsObject = {
        downloadProgress?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress.AsObject,
    }
}

export class UpdateLibrariesIndexRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): UpdateLibrariesIndexRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateLibrariesIndexRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateLibrariesIndexRequest): UpdateLibrariesIndexRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateLibrariesIndexRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateLibrariesIndexRequest;
    static deserializeBinaryFromReader(message: UpdateLibrariesIndexRequest, reader: jspb.BinaryReader): UpdateLibrariesIndexRequest;
}

export namespace UpdateLibrariesIndexRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
    }
}

export class UpdateLibrariesIndexResponse extends jspb.Message { 

    hasDownloadProgress(): boolean;
    clearDownloadProgress(): void;
    getDownloadProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setDownloadProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): UpdateLibrariesIndexResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateLibrariesIndexResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateLibrariesIndexResponse): UpdateLibrariesIndexResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateLibrariesIndexResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateLibrariesIndexResponse;
    static deserializeBinaryFromReader(message: UpdateLibrariesIndexResponse, reader: jspb.BinaryReader): UpdateLibrariesIndexResponse;
}

export namespace UpdateLibrariesIndexResponse {
    export type AsObject = {
        downloadProgress?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress.AsObject,
    }
}

export class UpdateCoreLibrariesIndexRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): UpdateCoreLibrariesIndexRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateCoreLibrariesIndexRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateCoreLibrariesIndexRequest): UpdateCoreLibrariesIndexRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateCoreLibrariesIndexRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateCoreLibrariesIndexRequest;
    static deserializeBinaryFromReader(message: UpdateCoreLibrariesIndexRequest, reader: jspb.BinaryReader): UpdateCoreLibrariesIndexRequest;
}

export namespace UpdateCoreLibrariesIndexRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
    }
}

export class UpdateCoreLibrariesIndexResponse extends jspb.Message { 

    hasDownloadProgress(): boolean;
    clearDownloadProgress(): void;
    getDownloadProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setDownloadProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): UpdateCoreLibrariesIndexResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateCoreLibrariesIndexResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateCoreLibrariesIndexResponse): UpdateCoreLibrariesIndexResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateCoreLibrariesIndexResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateCoreLibrariesIndexResponse;
    static deserializeBinaryFromReader(message: UpdateCoreLibrariesIndexResponse, reader: jspb.BinaryReader): UpdateCoreLibrariesIndexResponse;
}

export namespace UpdateCoreLibrariesIndexResponse {
    export type AsObject = {
        downloadProgress?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress.AsObject,
    }
}

export class OutdatedRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): OutdatedRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OutdatedRequest.AsObject;
    static toObject(includeInstance: boolean, msg: OutdatedRequest): OutdatedRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: OutdatedRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OutdatedRequest;
    static deserializeBinaryFromReader(message: OutdatedRequest, reader: jspb.BinaryReader): OutdatedRequest;
}

export namespace OutdatedRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
    }
}

export class OutdatedResponse extends jspb.Message { 
    clearOutdatedLibrariesList(): void;
    getOutdatedLibrariesList(): Array<cc_arduino_cli_commands_v1_lib_pb.InstalledLibrary>;
    setOutdatedLibrariesList(value: Array<cc_arduino_cli_commands_v1_lib_pb.InstalledLibrary>): OutdatedResponse;
    addOutdatedLibraries(value?: cc_arduino_cli_commands_v1_lib_pb.InstalledLibrary, index?: number): cc_arduino_cli_commands_v1_lib_pb.InstalledLibrary;

    clearOutdatedPlatformsList(): void;
    getOutdatedPlatformsList(): Array<cc_arduino_cli_commands_v1_common_pb.Platform>;
    setOutdatedPlatformsList(value: Array<cc_arduino_cli_commands_v1_common_pb.Platform>): OutdatedResponse;
    addOutdatedPlatforms(value?: cc_arduino_cli_commands_v1_common_pb.Platform, index?: number): cc_arduino_cli_commands_v1_common_pb.Platform;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OutdatedResponse.AsObject;
    static toObject(includeInstance: boolean, msg: OutdatedResponse): OutdatedResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: OutdatedResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OutdatedResponse;
    static deserializeBinaryFromReader(message: OutdatedResponse, reader: jspb.BinaryReader): OutdatedResponse;
}

export namespace OutdatedResponse {
    export type AsObject = {
        outdatedLibrariesList: Array<cc_arduino_cli_commands_v1_lib_pb.InstalledLibrary.AsObject>,
        outdatedPlatformsList: Array<cc_arduino_cli_commands_v1_common_pb.Platform.AsObject>,
    }
}

export class UpgradeRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): UpgradeRequest;

    getSkipPostInstall(): boolean;
    setSkipPostInstall(value: boolean): UpgradeRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpgradeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpgradeRequest): UpgradeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpgradeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpgradeRequest;
    static deserializeBinaryFromReader(message: UpgradeRequest, reader: jspb.BinaryReader): UpgradeRequest;
}

export namespace UpgradeRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        skipPostInstall: boolean,
    }
}

export class UpgradeResponse extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): UpgradeResponse;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): UpgradeResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpgradeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpgradeResponse): UpgradeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpgradeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpgradeResponse;
    static deserializeBinaryFromReader(message: UpgradeResponse, reader: jspb.BinaryReader): UpgradeResponse;
}

export namespace UpgradeResponse {
    export type AsObject = {
        progress?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress.AsObject,
        taskProgress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
    }
}

export class VersionRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VersionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: VersionRequest): VersionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VersionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VersionRequest;
    static deserializeBinaryFromReader(message: VersionRequest, reader: jspb.BinaryReader): VersionRequest;
}

export namespace VersionRequest {
    export type AsObject = {
    }
}

export class VersionResponse extends jspb.Message { 
    getVersion(): string;
    setVersion(value: string): VersionResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VersionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: VersionResponse): VersionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VersionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VersionResponse;
    static deserializeBinaryFromReader(message: VersionResponse, reader: jspb.BinaryReader): VersionResponse;
}

export namespace VersionResponse {
    export type AsObject = {
        version: string,
    }
}

export class LoadSketchRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): LoadSketchRequest;

    getSketchPath(): string;
    setSketchPath(value: string): LoadSketchRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LoadSketchRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LoadSketchRequest): LoadSketchRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LoadSketchRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LoadSketchRequest;
    static deserializeBinaryFromReader(message: LoadSketchRequest, reader: jspb.BinaryReader): LoadSketchRequest;
}

export namespace LoadSketchRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        sketchPath: string,
    }
}

export class LoadSketchResponse extends jspb.Message { 
    getMainFile(): string;
    setMainFile(value: string): LoadSketchResponse;

    getLocationPath(): string;
    setLocationPath(value: string): LoadSketchResponse;

    clearOtherSketchFilesList(): void;
    getOtherSketchFilesList(): Array<string>;
    setOtherSketchFilesList(value: Array<string>): LoadSketchResponse;
    addOtherSketchFiles(value: string, index?: number): string;

    clearAdditionalFilesList(): void;
    getAdditionalFilesList(): Array<string>;
    setAdditionalFilesList(value: Array<string>): LoadSketchResponse;
    addAdditionalFiles(value: string, index?: number): string;

    clearRootFolderFilesList(): void;
    getRootFolderFilesList(): Array<string>;
    setRootFolderFilesList(value: Array<string>): LoadSketchResponse;
    addRootFolderFiles(value: string, index?: number): string;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LoadSketchResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LoadSketchResponse): LoadSketchResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LoadSketchResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LoadSketchResponse;
    static deserializeBinaryFromReader(message: LoadSketchResponse, reader: jspb.BinaryReader): LoadSketchResponse;
}

export namespace LoadSketchResponse {
    export type AsObject = {
        mainFile: string,
        locationPath: string,
        otherSketchFilesList: Array<string>,
        additionalFilesList: Array<string>,
        rootFolderFilesList: Array<string>,
    }
}

export class ArchiveSketchRequest extends jspb.Message { 
    getSketchPath(): string;
    setSketchPath(value: string): ArchiveSketchRequest;

    getArchivePath(): string;
    setArchivePath(value: string): ArchiveSketchRequest;

    getIncludeBuildDir(): boolean;
    setIncludeBuildDir(value: boolean): ArchiveSketchRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ArchiveSketchRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ArchiveSketchRequest): ArchiveSketchRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ArchiveSketchRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ArchiveSketchRequest;
    static deserializeBinaryFromReader(message: ArchiveSketchRequest, reader: jspb.BinaryReader): ArchiveSketchRequest;
}

export namespace ArchiveSketchRequest {
    export type AsObject = {
        sketchPath: string,
        archivePath: string,
        includeBuildDir: boolean,
    }
}

export class ArchiveSketchResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ArchiveSketchResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ArchiveSketchResponse): ArchiveSketchResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ArchiveSketchResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ArchiveSketchResponse;
    static deserializeBinaryFromReader(message: ArchiveSketchResponse, reader: jspb.BinaryReader): ArchiveSketchResponse;
}

export namespace ArchiveSketchResponse {
    export type AsObject = {
    }
}
