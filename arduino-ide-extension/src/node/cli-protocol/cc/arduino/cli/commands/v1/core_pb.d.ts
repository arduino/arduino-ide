// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/core.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as cc_arduino_cli_commands_v1_common_pb from "../../../../../cc/arduino/cli/commands/v1/common_pb";

export class PlatformInstallRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): PlatformInstallRequest;
    getPlatformPackage(): string;
    setPlatformPackage(value: string): PlatformInstallRequest;
    getArchitecture(): string;
    setArchitecture(value: string): PlatformInstallRequest;
    getVersion(): string;
    setVersion(value: string): PlatformInstallRequest;
    getSkipPostInstall(): boolean;
    setSkipPostInstall(value: boolean): PlatformInstallRequest;
    getNoOverwrite(): boolean;
    setNoOverwrite(value: boolean): PlatformInstallRequest;
    getSkipPreUninstall(): boolean;
    setSkipPreUninstall(value: boolean): PlatformInstallRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformInstallRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformInstallRequest): PlatformInstallRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformInstallRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformInstallRequest;
    static deserializeBinaryFromReader(message: PlatformInstallRequest, reader: jspb.BinaryReader): PlatformInstallRequest;
}

export namespace PlatformInstallRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        platformPackage: string,
        architecture: string,
        version: string,
        skipPostInstall: boolean,
        noOverwrite: boolean,
        skipPreUninstall: boolean,
    }
}

export class PlatformInstallResponse extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): PlatformInstallResponse;

    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): PlatformInstallResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformInstallResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformInstallResponse): PlatformInstallResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformInstallResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformInstallResponse;
    static deserializeBinaryFromReader(message: PlatformInstallResponse, reader: jspb.BinaryReader): PlatformInstallResponse;
}

export namespace PlatformInstallResponse {
    export type AsObject = {
        progress?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress.AsObject,
        taskProgress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
    }
}

export class PlatformLoadingError extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformLoadingError.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformLoadingError): PlatformLoadingError.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformLoadingError, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformLoadingError;
    static deserializeBinaryFromReader(message: PlatformLoadingError, reader: jspb.BinaryReader): PlatformLoadingError;
}

export namespace PlatformLoadingError {
    export type AsObject = {
    }
}

export class PlatformDownloadRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): PlatformDownloadRequest;
    getPlatformPackage(): string;
    setPlatformPackage(value: string): PlatformDownloadRequest;
    getArchitecture(): string;
    setArchitecture(value: string): PlatformDownloadRequest;
    getVersion(): string;
    setVersion(value: string): PlatformDownloadRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformDownloadRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformDownloadRequest): PlatformDownloadRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformDownloadRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformDownloadRequest;
    static deserializeBinaryFromReader(message: PlatformDownloadRequest, reader: jspb.BinaryReader): PlatformDownloadRequest;
}

export namespace PlatformDownloadRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        platformPackage: string,
        architecture: string,
        version: string,
    }
}

export class PlatformDownloadResponse extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): PlatformDownloadResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformDownloadResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformDownloadResponse): PlatformDownloadResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformDownloadResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformDownloadResponse;
    static deserializeBinaryFromReader(message: PlatformDownloadResponse, reader: jspb.BinaryReader): PlatformDownloadResponse;
}

export namespace PlatformDownloadResponse {
    export type AsObject = {
        progress?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress.AsObject,
    }
}

export class PlatformUninstallRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): PlatformUninstallRequest;
    getPlatformPackage(): string;
    setPlatformPackage(value: string): PlatformUninstallRequest;
    getArchitecture(): string;
    setArchitecture(value: string): PlatformUninstallRequest;
    getSkipPreUninstall(): boolean;
    setSkipPreUninstall(value: boolean): PlatformUninstallRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformUninstallRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformUninstallRequest): PlatformUninstallRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformUninstallRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformUninstallRequest;
    static deserializeBinaryFromReader(message: PlatformUninstallRequest, reader: jspb.BinaryReader): PlatformUninstallRequest;
}

export namespace PlatformUninstallRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        platformPackage: string,
        architecture: string,
        skipPreUninstall: boolean,
    }
}

export class PlatformUninstallResponse extends jspb.Message { 

    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): PlatformUninstallResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformUninstallResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformUninstallResponse): PlatformUninstallResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformUninstallResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformUninstallResponse;
    static deserializeBinaryFromReader(message: PlatformUninstallResponse, reader: jspb.BinaryReader): PlatformUninstallResponse;
}

export namespace PlatformUninstallResponse {
    export type AsObject = {
        taskProgress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
    }
}

export class AlreadyAtLatestVersionError extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AlreadyAtLatestVersionError.AsObject;
    static toObject(includeInstance: boolean, msg: AlreadyAtLatestVersionError): AlreadyAtLatestVersionError.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AlreadyAtLatestVersionError, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AlreadyAtLatestVersionError;
    static deserializeBinaryFromReader(message: AlreadyAtLatestVersionError, reader: jspb.BinaryReader): AlreadyAtLatestVersionError;
}

export namespace AlreadyAtLatestVersionError {
    export type AsObject = {
    }
}

export class PlatformUpgradeRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): PlatformUpgradeRequest;
    getPlatformPackage(): string;
    setPlatformPackage(value: string): PlatformUpgradeRequest;
    getArchitecture(): string;
    setArchitecture(value: string): PlatformUpgradeRequest;
    getSkipPostInstall(): boolean;
    setSkipPostInstall(value: boolean): PlatformUpgradeRequest;
    getSkipPreUninstall(): boolean;
    setSkipPreUninstall(value: boolean): PlatformUpgradeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformUpgradeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformUpgradeRequest): PlatformUpgradeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformUpgradeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformUpgradeRequest;
    static deserializeBinaryFromReader(message: PlatformUpgradeRequest, reader: jspb.BinaryReader): PlatformUpgradeRequest;
}

export namespace PlatformUpgradeRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        platformPackage: string,
        architecture: string,
        skipPostInstall: boolean,
        skipPreUninstall: boolean,
    }
}

export class PlatformUpgradeResponse extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): cc_arduino_cli_commands_v1_common_pb.DownloadProgress | undefined;
    setProgress(value?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress): PlatformUpgradeResponse;

    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): PlatformUpgradeResponse;

    hasPlatform(): boolean;
    clearPlatform(): void;
    getPlatform(): cc_arduino_cli_commands_v1_common_pb.Platform | undefined;
    setPlatform(value?: cc_arduino_cli_commands_v1_common_pb.Platform): PlatformUpgradeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformUpgradeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformUpgradeResponse): PlatformUpgradeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformUpgradeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformUpgradeResponse;
    static deserializeBinaryFromReader(message: PlatformUpgradeResponse, reader: jspb.BinaryReader): PlatformUpgradeResponse;
}

export namespace PlatformUpgradeResponse {
    export type AsObject = {
        progress?: cc_arduino_cli_commands_v1_common_pb.DownloadProgress.AsObject,
        taskProgress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
        platform?: cc_arduino_cli_commands_v1_common_pb.Platform.AsObject,
    }
}

export class PlatformSearchRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): PlatformSearchRequest;
    getSearchArgs(): string;
    setSearchArgs(value: string): PlatformSearchRequest;
    getAllVersions(): boolean;
    setAllVersions(value: boolean): PlatformSearchRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformSearchRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformSearchRequest): PlatformSearchRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformSearchRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformSearchRequest;
    static deserializeBinaryFromReader(message: PlatformSearchRequest, reader: jspb.BinaryReader): PlatformSearchRequest;
}

export namespace PlatformSearchRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        searchArgs: string,
        allVersions: boolean,
    }
}

export class PlatformSearchResponse extends jspb.Message { 
    clearSearchOutputList(): void;
    getSearchOutputList(): Array<cc_arduino_cli_commands_v1_common_pb.Platform>;
    setSearchOutputList(value: Array<cc_arduino_cli_commands_v1_common_pb.Platform>): PlatformSearchResponse;
    addSearchOutput(value?: cc_arduino_cli_commands_v1_common_pb.Platform, index?: number): cc_arduino_cli_commands_v1_common_pb.Platform;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformSearchResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformSearchResponse): PlatformSearchResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformSearchResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformSearchResponse;
    static deserializeBinaryFromReader(message: PlatformSearchResponse, reader: jspb.BinaryReader): PlatformSearchResponse;
}

export namespace PlatformSearchResponse {
    export type AsObject = {
        searchOutputList: Array<cc_arduino_cli_commands_v1_common_pb.Platform.AsObject>,
    }
}

export class PlatformListRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): PlatformListRequest;
    getUpdatableOnly(): boolean;
    setUpdatableOnly(value: boolean): PlatformListRequest;
    getAll(): boolean;
    setAll(value: boolean): PlatformListRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformListRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformListRequest): PlatformListRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformListRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformListRequest;
    static deserializeBinaryFromReader(message: PlatformListRequest, reader: jspb.BinaryReader): PlatformListRequest;
}

export namespace PlatformListRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        updatableOnly: boolean,
        all: boolean,
    }
}

export class PlatformListResponse extends jspb.Message { 
    clearInstalledPlatformsList(): void;
    getInstalledPlatformsList(): Array<cc_arduino_cli_commands_v1_common_pb.Platform>;
    setInstalledPlatformsList(value: Array<cc_arduino_cli_commands_v1_common_pb.Platform>): PlatformListResponse;
    addInstalledPlatforms(value?: cc_arduino_cli_commands_v1_common_pb.Platform, index?: number): cc_arduino_cli_commands_v1_common_pb.Platform;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformListResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformListResponse): PlatformListResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformListResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformListResponse;
    static deserializeBinaryFromReader(message: PlatformListResponse, reader: jspb.BinaryReader): PlatformListResponse;
}

export namespace PlatformListResponse {
    export type AsObject = {
        installedPlatformsList: Array<cc_arduino_cli_commands_v1_common_pb.Platform.AsObject>,
    }
}
