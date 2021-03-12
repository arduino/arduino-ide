// package: cc.arduino.cli.commands
// file: commands/core.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as commands_common_pb from "../commands/common_pb";

export class PlatformInstallReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): PlatformInstallReq;

    getPlatformPackage(): string;
    setPlatformPackage(value: string): PlatformInstallReq;

    getArchitecture(): string;
    setArchitecture(value: string): PlatformInstallReq;

    getVersion(): string;
    setVersion(value: string): PlatformInstallReq;

    getSkippostinstall(): boolean;
    setSkippostinstall(value: boolean): PlatformInstallReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformInstallReq.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformInstallReq): PlatformInstallReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformInstallReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformInstallReq;
    static deserializeBinaryFromReader(message: PlatformInstallReq, reader: jspb.BinaryReader): PlatformInstallReq;
}

export namespace PlatformInstallReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        platformPackage: string,
        architecture: string,
        version: string,
        skippostinstall: boolean,
    }
}

export class PlatformInstallResp extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): commands_common_pb.DownloadProgress | undefined;
    setProgress(value?: commands_common_pb.DownloadProgress): PlatformInstallResp;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): commands_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: commands_common_pb.TaskProgress): PlatformInstallResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformInstallResp.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformInstallResp): PlatformInstallResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformInstallResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformInstallResp;
    static deserializeBinaryFromReader(message: PlatformInstallResp, reader: jspb.BinaryReader): PlatformInstallResp;
}

export namespace PlatformInstallResp {
    export type AsObject = {
        progress?: commands_common_pb.DownloadProgress.AsObject,
        taskProgress?: commands_common_pb.TaskProgress.AsObject,
    }
}

export class PlatformDownloadReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): PlatformDownloadReq;

    getPlatformPackage(): string;
    setPlatformPackage(value: string): PlatformDownloadReq;

    getArchitecture(): string;
    setArchitecture(value: string): PlatformDownloadReq;

    getVersion(): string;
    setVersion(value: string): PlatformDownloadReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformDownloadReq.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformDownloadReq): PlatformDownloadReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformDownloadReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformDownloadReq;
    static deserializeBinaryFromReader(message: PlatformDownloadReq, reader: jspb.BinaryReader): PlatformDownloadReq;
}

export namespace PlatformDownloadReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        platformPackage: string,
        architecture: string,
        version: string,
    }
}

export class PlatformDownloadResp extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): commands_common_pb.DownloadProgress | undefined;
    setProgress(value?: commands_common_pb.DownloadProgress): PlatformDownloadResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformDownloadResp.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformDownloadResp): PlatformDownloadResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformDownloadResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformDownloadResp;
    static deserializeBinaryFromReader(message: PlatformDownloadResp, reader: jspb.BinaryReader): PlatformDownloadResp;
}

export namespace PlatformDownloadResp {
    export type AsObject = {
        progress?: commands_common_pb.DownloadProgress.AsObject,
    }
}

export class PlatformUninstallReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): PlatformUninstallReq;

    getPlatformPackage(): string;
    setPlatformPackage(value: string): PlatformUninstallReq;

    getArchitecture(): string;
    setArchitecture(value: string): PlatformUninstallReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformUninstallReq.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformUninstallReq): PlatformUninstallReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformUninstallReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformUninstallReq;
    static deserializeBinaryFromReader(message: PlatformUninstallReq, reader: jspb.BinaryReader): PlatformUninstallReq;
}

export namespace PlatformUninstallReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        platformPackage: string,
        architecture: string,
    }
}

export class PlatformUninstallResp extends jspb.Message { 

    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): commands_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: commands_common_pb.TaskProgress): PlatformUninstallResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformUninstallResp.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformUninstallResp): PlatformUninstallResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformUninstallResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformUninstallResp;
    static deserializeBinaryFromReader(message: PlatformUninstallResp, reader: jspb.BinaryReader): PlatformUninstallResp;
}

export namespace PlatformUninstallResp {
    export type AsObject = {
        taskProgress?: commands_common_pb.TaskProgress.AsObject,
    }
}

export class PlatformUpgradeReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): PlatformUpgradeReq;

    getPlatformPackage(): string;
    setPlatformPackage(value: string): PlatformUpgradeReq;

    getArchitecture(): string;
    setArchitecture(value: string): PlatformUpgradeReq;

    getSkippostinstall(): boolean;
    setSkippostinstall(value: boolean): PlatformUpgradeReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformUpgradeReq.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformUpgradeReq): PlatformUpgradeReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformUpgradeReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformUpgradeReq;
    static deserializeBinaryFromReader(message: PlatformUpgradeReq, reader: jspb.BinaryReader): PlatformUpgradeReq;
}

export namespace PlatformUpgradeReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        platformPackage: string,
        architecture: string,
        skippostinstall: boolean,
    }
}

export class PlatformUpgradeResp extends jspb.Message { 

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): commands_common_pb.DownloadProgress | undefined;
    setProgress(value?: commands_common_pb.DownloadProgress): PlatformUpgradeResp;


    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): commands_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: commands_common_pb.TaskProgress): PlatformUpgradeResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformUpgradeResp.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformUpgradeResp): PlatformUpgradeResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformUpgradeResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformUpgradeResp;
    static deserializeBinaryFromReader(message: PlatformUpgradeResp, reader: jspb.BinaryReader): PlatformUpgradeResp;
}

export namespace PlatformUpgradeResp {
    export type AsObject = {
        progress?: commands_common_pb.DownloadProgress.AsObject,
        taskProgress?: commands_common_pb.TaskProgress.AsObject,
    }
}

export class PlatformSearchReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): PlatformSearchReq;

    getSearchArgs(): string;
    setSearchArgs(value: string): PlatformSearchReq;

    getAllVersions(): boolean;
    setAllVersions(value: boolean): PlatformSearchReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformSearchReq.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformSearchReq): PlatformSearchReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformSearchReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformSearchReq;
    static deserializeBinaryFromReader(message: PlatformSearchReq, reader: jspb.BinaryReader): PlatformSearchReq;
}

export namespace PlatformSearchReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        searchArgs: string,
        allVersions: boolean,
    }
}

export class PlatformSearchResp extends jspb.Message { 
    clearSearchOutputList(): void;
    getSearchOutputList(): Array<commands_common_pb.Platform>;
    setSearchOutputList(value: Array<commands_common_pb.Platform>): PlatformSearchResp;
    addSearchOutput(value?: commands_common_pb.Platform, index?: number): commands_common_pb.Platform;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformSearchResp.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformSearchResp): PlatformSearchResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformSearchResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformSearchResp;
    static deserializeBinaryFromReader(message: PlatformSearchResp, reader: jspb.BinaryReader): PlatformSearchResp;
}

export namespace PlatformSearchResp {
    export type AsObject = {
        searchOutputList: Array<commands_common_pb.Platform.AsObject>,
    }
}

export class PlatformListReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): PlatformListReq;

    getUpdatableOnly(): boolean;
    setUpdatableOnly(value: boolean): PlatformListReq;

    getAll(): boolean;
    setAll(value: boolean): PlatformListReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformListReq.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformListReq): PlatformListReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformListReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformListReq;
    static deserializeBinaryFromReader(message: PlatformListReq, reader: jspb.BinaryReader): PlatformListReq;
}

export namespace PlatformListReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        updatableOnly: boolean,
        all: boolean,
    }
}

export class PlatformListResp extends jspb.Message { 
    clearInstalledPlatformList(): void;
    getInstalledPlatformList(): Array<commands_common_pb.Platform>;
    setInstalledPlatformList(value: Array<commands_common_pb.Platform>): PlatformListResp;
    addInstalledPlatform(value?: commands_common_pb.Platform, index?: number): commands_common_pb.Platform;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformListResp.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformListResp): PlatformListResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformListResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformListResp;
    static deserializeBinaryFromReader(message: PlatformListResp, reader: jspb.BinaryReader): PlatformListResp;
}

export namespace PlatformListResp {
    export type AsObject = {
        installedPlatformList: Array<commands_common_pb.Platform.AsObject>,
    }
}
