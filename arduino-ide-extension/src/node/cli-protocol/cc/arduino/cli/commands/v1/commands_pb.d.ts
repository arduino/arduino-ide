// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/commands.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as cc_arduino_cli_commands_v1_board_pb from "../../../../../cc/arduino/cli/commands/v1/board_pb";
import * as cc_arduino_cli_commands_v1_common_pb from "../../../../../cc/arduino/cli/commands/v1/common_pb";
import * as cc_arduino_cli_commands_v1_compile_pb from "../../../../../cc/arduino/cli/commands/v1/compile_pb";
import * as cc_arduino_cli_commands_v1_core_pb from "../../../../../cc/arduino/cli/commands/v1/core_pb";
import * as cc_arduino_cli_commands_v1_debug_pb from "../../../../../cc/arduino/cli/commands/v1/debug_pb";
import * as cc_arduino_cli_commands_v1_lib_pb from "../../../../../cc/arduino/cli/commands/v1/lib_pb";
import * as cc_arduino_cli_commands_v1_monitor_pb from "../../../../../cc/arduino/cli/commands/v1/monitor_pb";
import * as cc_arduino_cli_commands_v1_settings_pb from "../../../../../cc/arduino/cli/commands/v1/settings_pb";
import * as cc_arduino_cli_commands_v1_upload_pb from "../../../../../cc/arduino/cli/commands/v1/upload_pb";
import * as google_rpc_status_pb from "../../../../../google/rpc/status_pb";

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
    getProfile(): string;
    setProfile(value: string): InitRequest;
    getSketchPath(): string;
    setSketchPath(value: string): InitRequest;

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
        profile: string,
        sketchPath: string,
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

    hasProfile(): boolean;
    clearProfile(): void;
    getProfile(): cc_arduino_cli_commands_v1_common_pb.SketchProfile | undefined;
    setProfile(value?: cc_arduino_cli_commands_v1_common_pb.SketchProfile): InitResponse;

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
        profile?: cc_arduino_cli_commands_v1_common_pb.SketchProfile.AsObject,
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
        PROFILE = 3,
    }

}

export class FailedInstanceInitError extends jspb.Message { 
    getReason(): FailedInstanceInitReason;
    setReason(value: FailedInstanceInitReason): FailedInstanceInitError;
    getMessage(): string;
    setMessage(value: string): FailedInstanceInitError;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FailedInstanceInitError.AsObject;
    static toObject(includeInstance: boolean, msg: FailedInstanceInitError): FailedInstanceInitError.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FailedInstanceInitError, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FailedInstanceInitError;
    static deserializeBinaryFromReader(message: FailedInstanceInitError, reader: jspb.BinaryReader): FailedInstanceInitError;
}

export namespace FailedInstanceInitError {
    export type AsObject = {
        reason: FailedInstanceInitReason,
        message: string,
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
    getIgnoreCustomPackageIndexes(): boolean;
    setIgnoreCustomPackageIndexes(value: boolean): UpdateIndexRequest;
    getUpdateIfOlderThanSecs(): number;
    setUpdateIfOlderThanSecs(value: number): UpdateIndexRequest;

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
        ignoreCustomPackageIndexes: boolean,
        updateIfOlderThanSecs: number,
    }
}

export class UpdateIndexResponse extends jspb.Message { 

    hasDownloadProgress(): boolean;
    clearDownloadProgress(): void;
    getDownloadProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setDownloadProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): UpdateIndexResponse;

    hasResult(): boolean;
    clearResult(): void;
    getResult(): UpdateIndexResponse.Result | undefined;
    setResult(value?: UpdateIndexResponse.Result): UpdateIndexResponse;

    getMessageCase(): UpdateIndexResponse.MessageCase;

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
        result?: UpdateIndexResponse.Result.AsObject,
    }


    export class Result extends jspb.Message { 
        clearUpdatedIndexesList(): void;
        getUpdatedIndexesList(): Array<IndexUpdateReport>;
        setUpdatedIndexesList(value: Array<IndexUpdateReport>): Result;
        addUpdatedIndexes(value?: IndexUpdateReport, index?: number): IndexUpdateReport;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Result.AsObject;
        static toObject(includeInstance: boolean, msg: Result): Result.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Result, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Result;
        static deserializeBinaryFromReader(message: Result, reader: jspb.BinaryReader): Result;
    }

    export namespace Result {
        export type AsObject = {
            updatedIndexesList: Array<IndexUpdateReport.AsObject>,
        }
    }


    export enum MessageCase {
        MESSAGE_NOT_SET = 0,
        DOWNLOAD_PROGRESS = 1,
        RESULT = 2,
    }

}

export class UpdateLibrariesIndexRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): UpdateLibrariesIndexRequest;
    getUpdateIfOlderThanSecs(): number;
    setUpdateIfOlderThanSecs(value: number): UpdateLibrariesIndexRequest;

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
        updateIfOlderThanSecs: number,
    }
}

export class UpdateLibrariesIndexResponse extends jspb.Message { 

    hasDownloadProgress(): boolean;
    clearDownloadProgress(): void;
    getDownloadProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setDownloadProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): UpdateLibrariesIndexResponse;

    hasResult(): boolean;
    clearResult(): void;
    getResult(): UpdateLibrariesIndexResponse.Result | undefined;
    setResult(value?: UpdateLibrariesIndexResponse.Result): UpdateLibrariesIndexResponse;

    getMessageCase(): UpdateLibrariesIndexResponse.MessageCase;

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
        result?: UpdateLibrariesIndexResponse.Result.AsObject,
    }


    export class Result extends jspb.Message { 

        hasLibrariesIndex(): boolean;
        clearLibrariesIndex(): void;
        getLibrariesIndex(): IndexUpdateReport | undefined;
        setLibrariesIndex(value?: IndexUpdateReport): Result;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Result.AsObject;
        static toObject(includeInstance: boolean, msg: Result): Result.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Result, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Result;
        static deserializeBinaryFromReader(message: Result, reader: jspb.BinaryReader): Result;
    }

    export namespace Result {
        export type AsObject = {
            librariesIndex?: IndexUpdateReport.AsObject,
        }
    }


    export enum MessageCase {
        MESSAGE_NOT_SET = 0,
        DOWNLOAD_PROGRESS = 1,
        RESULT = 2,
    }

}

export class IndexUpdateReport extends jspb.Message { 
    getIndexUrl(): string;
    setIndexUrl(value: string): IndexUpdateReport;
    getStatus(): IndexUpdateReport.Status;
    setStatus(value: IndexUpdateReport.Status): IndexUpdateReport;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IndexUpdateReport.AsObject;
    static toObject(includeInstance: boolean, msg: IndexUpdateReport): IndexUpdateReport.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IndexUpdateReport, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IndexUpdateReport;
    static deserializeBinaryFromReader(message: IndexUpdateReport, reader: jspb.BinaryReader): IndexUpdateReport;
}

export namespace IndexUpdateReport {
    export type AsObject = {
        indexUrl: string,
        status: IndexUpdateReport.Status,
    }

    export enum Status {
    STATUS_UNSPECIFIED = 0,
    STATUS_UPDATED = 1,
    STATUS_ALREADY_UP_TO_DATE = 2,
    STATUS_FAILED = 3,
    STATUS_SKIPPED = 4,
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

export class NewSketchRequest extends jspb.Message { 
    getSketchName(): string;
    setSketchName(value: string): NewSketchRequest;
    getSketchDir(): string;
    setSketchDir(value: string): NewSketchRequest;
    getOverwrite(): boolean;
    setOverwrite(value: boolean): NewSketchRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NewSketchRequest.AsObject;
    static toObject(includeInstance: boolean, msg: NewSketchRequest): NewSketchRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NewSketchRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NewSketchRequest;
    static deserializeBinaryFromReader(message: NewSketchRequest, reader: jspb.BinaryReader): NewSketchRequest;
}

export namespace NewSketchRequest {
    export type AsObject = {
        sketchName: string,
        sketchDir: string,
        overwrite: boolean,
    }
}

export class NewSketchResponse extends jspb.Message { 
    getMainFile(): string;
    setMainFile(value: string): NewSketchResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NewSketchResponse.AsObject;
    static toObject(includeInstance: boolean, msg: NewSketchResponse): NewSketchResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NewSketchResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NewSketchResponse;
    static deserializeBinaryFromReader(message: NewSketchResponse, reader: jspb.BinaryReader): NewSketchResponse;
}

export namespace NewSketchResponse {
    export type AsObject = {
        mainFile: string,
    }
}

export class LoadSketchRequest extends jspb.Message { 
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
        sketchPath: string,
    }
}

export class LoadSketchResponse extends jspb.Message { 

    hasSketch(): boolean;
    clearSketch(): void;
    getSketch(): cc_arduino_cli_commands_v1_common_pb.Sketch | undefined;
    setSketch(value?: cc_arduino_cli_commands_v1_common_pb.Sketch): LoadSketchResponse;

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
        sketch?: cc_arduino_cli_commands_v1_common_pb.Sketch.AsObject,
    }
}

export class ArchiveSketchRequest extends jspb.Message { 
    getSketchPath(): string;
    setSketchPath(value: string): ArchiveSketchRequest;
    getArchivePath(): string;
    setArchivePath(value: string): ArchiveSketchRequest;
    getIncludeBuildDir(): boolean;
    setIncludeBuildDir(value: boolean): ArchiveSketchRequest;
    getOverwrite(): boolean;
    setOverwrite(value: boolean): ArchiveSketchRequest;

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
        overwrite: boolean,
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

export class SetSketchDefaultsRequest extends jspb.Message { 
    getSketchPath(): string;
    setSketchPath(value: string): SetSketchDefaultsRequest;
    getDefaultFqbn(): string;
    setDefaultFqbn(value: string): SetSketchDefaultsRequest;
    getDefaultPortAddress(): string;
    setDefaultPortAddress(value: string): SetSketchDefaultsRequest;
    getDefaultPortProtocol(): string;
    setDefaultPortProtocol(value: string): SetSketchDefaultsRequest;
    getDefaultProgrammer(): string;
    setDefaultProgrammer(value: string): SetSketchDefaultsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetSketchDefaultsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetSketchDefaultsRequest): SetSketchDefaultsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetSketchDefaultsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetSketchDefaultsRequest;
    static deserializeBinaryFromReader(message: SetSketchDefaultsRequest, reader: jspb.BinaryReader): SetSketchDefaultsRequest;
}

export namespace SetSketchDefaultsRequest {
    export type AsObject = {
        sketchPath: string,
        defaultFqbn: string,
        defaultPortAddress: string,
        defaultPortProtocol: string,
        defaultProgrammer: string,
    }
}

export class SetSketchDefaultsResponse extends jspb.Message { 
    getDefaultFqbn(): string;
    setDefaultFqbn(value: string): SetSketchDefaultsResponse;
    getDefaultPortAddress(): string;
    setDefaultPortAddress(value: string): SetSketchDefaultsResponse;
    getDefaultPortProtocol(): string;
    setDefaultPortProtocol(value: string): SetSketchDefaultsResponse;
    getDefaultProgrammer(): string;
    setDefaultProgrammer(value: string): SetSketchDefaultsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetSketchDefaultsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SetSketchDefaultsResponse): SetSketchDefaultsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetSketchDefaultsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetSketchDefaultsResponse;
    static deserializeBinaryFromReader(message: SetSketchDefaultsResponse, reader: jspb.BinaryReader): SetSketchDefaultsResponse;
}

export namespace SetSketchDefaultsResponse {
    export type AsObject = {
        defaultFqbn: string,
        defaultPortAddress: string,
        defaultPortProtocol: string,
        defaultProgrammer: string,
    }
}

export class CheckForArduinoCLIUpdatesRequest extends jspb.Message { 
    getForceCheck(): boolean;
    setForceCheck(value: boolean): CheckForArduinoCLIUpdatesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckForArduinoCLIUpdatesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CheckForArduinoCLIUpdatesRequest): CheckForArduinoCLIUpdatesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckForArduinoCLIUpdatesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckForArduinoCLIUpdatesRequest;
    static deserializeBinaryFromReader(message: CheckForArduinoCLIUpdatesRequest, reader: jspb.BinaryReader): CheckForArduinoCLIUpdatesRequest;
}

export namespace CheckForArduinoCLIUpdatesRequest {
    export type AsObject = {
        forceCheck: boolean,
    }
}

export class CheckForArduinoCLIUpdatesResponse extends jspb.Message { 
    getNewestVersion(): string;
    setNewestVersion(value: string): CheckForArduinoCLIUpdatesResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckForArduinoCLIUpdatesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CheckForArduinoCLIUpdatesResponse): CheckForArduinoCLIUpdatesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckForArduinoCLIUpdatesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckForArduinoCLIUpdatesResponse;
    static deserializeBinaryFromReader(message: CheckForArduinoCLIUpdatesResponse, reader: jspb.BinaryReader): CheckForArduinoCLIUpdatesResponse;
}

export namespace CheckForArduinoCLIUpdatesResponse {
    export type AsObject = {
        newestVersion: string,
    }
}

export class CleanDownloadCacheDirectoryRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): CleanDownloadCacheDirectoryRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CleanDownloadCacheDirectoryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CleanDownloadCacheDirectoryRequest): CleanDownloadCacheDirectoryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CleanDownloadCacheDirectoryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CleanDownloadCacheDirectoryRequest;
    static deserializeBinaryFromReader(message: CleanDownloadCacheDirectoryRequest, reader: jspb.BinaryReader): CleanDownloadCacheDirectoryRequest;
}

export namespace CleanDownloadCacheDirectoryRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
    }
}

export class CleanDownloadCacheDirectoryResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CleanDownloadCacheDirectoryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CleanDownloadCacheDirectoryResponse): CleanDownloadCacheDirectoryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CleanDownloadCacheDirectoryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CleanDownloadCacheDirectoryResponse;
    static deserializeBinaryFromReader(message: CleanDownloadCacheDirectoryResponse, reader: jspb.BinaryReader): CleanDownloadCacheDirectoryResponse;
}

export namespace CleanDownloadCacheDirectoryResponse {
    export type AsObject = {
    }
}

export enum FailedInstanceInitReason {
    FAILED_INSTANCE_INIT_REASON_UNSPECIFIED = 0,
    FAILED_INSTANCE_INIT_REASON_INVALID_INDEX_URL = 1,
    FAILED_INSTANCE_INIT_REASON_INDEX_LOAD_ERROR = 2,
    FAILED_INSTANCE_INIT_REASON_TOOL_LOAD_ERROR = 3,
    FAILED_INSTANCE_INIT_REASON_INDEX_DOWNLOAD_ERROR = 4,
}
