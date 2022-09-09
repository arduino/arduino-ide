// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class Instance extends jspb.Message { 
    getId(): number;
    setId(value: number): Instance;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Instance.AsObject;
    static toObject(includeInstance: boolean, msg: Instance): Instance.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Instance, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Instance;
    static deserializeBinaryFromReader(message: Instance, reader: jspb.BinaryReader): Instance;
}

export namespace Instance {
    export type AsObject = {
        id: number,
    }
}

export class DownloadProgress extends jspb.Message { 

    hasStart(): boolean;
    clearStart(): void;
    getStart(): DownloadProgressStart | undefined;
    setStart(value?: DownloadProgressStart): DownloadProgress;


    hasUpdate(): boolean;
    clearUpdate(): void;
    getUpdate(): DownloadProgressUpdate | undefined;
    setUpdate(value?: DownloadProgressUpdate): DownloadProgress;


    hasEnd(): boolean;
    clearEnd(): void;
    getEnd(): DownloadProgressEnd | undefined;
    setEnd(value?: DownloadProgressEnd): DownloadProgress;


    getMessageCase(): DownloadProgress.MessageCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DownloadProgress.AsObject;
    static toObject(includeInstance: boolean, msg: DownloadProgress): DownloadProgress.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DownloadProgress, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DownloadProgress;
    static deserializeBinaryFromReader(message: DownloadProgress, reader: jspb.BinaryReader): DownloadProgress;
}

export namespace DownloadProgress {
    export type AsObject = {
        start?: DownloadProgressStart.AsObject,
        update?: DownloadProgressUpdate.AsObject,
        end?: DownloadProgressEnd.AsObject,
    }

    export enum MessageCase {
        MESSAGE_NOT_SET = 0,
    
    START = 1,

    UPDATE = 2,

    END = 3,

    }

}

export class DownloadProgressStart extends jspb.Message { 
    getUrl(): string;
    setUrl(value: string): DownloadProgressStart;

    getLabel(): string;
    setLabel(value: string): DownloadProgressStart;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DownloadProgressStart.AsObject;
    static toObject(includeInstance: boolean, msg: DownloadProgressStart): DownloadProgressStart.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DownloadProgressStart, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DownloadProgressStart;
    static deserializeBinaryFromReader(message: DownloadProgressStart, reader: jspb.BinaryReader): DownloadProgressStart;
}

export namespace DownloadProgressStart {
    export type AsObject = {
        url: string,
        label: string,
    }
}

export class DownloadProgressUpdate extends jspb.Message { 
    getDownloaded(): number;
    setDownloaded(value: number): DownloadProgressUpdate;

    getTotalSize(): number;
    setTotalSize(value: number): DownloadProgressUpdate;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DownloadProgressUpdate.AsObject;
    static toObject(includeInstance: boolean, msg: DownloadProgressUpdate): DownloadProgressUpdate.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DownloadProgressUpdate, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DownloadProgressUpdate;
    static deserializeBinaryFromReader(message: DownloadProgressUpdate, reader: jspb.BinaryReader): DownloadProgressUpdate;
}

export namespace DownloadProgressUpdate {
    export type AsObject = {
        downloaded: number,
        totalSize: number,
    }
}

export class DownloadProgressEnd extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DownloadProgressEnd;

    getMessage(): string;
    setMessage(value: string): DownloadProgressEnd;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DownloadProgressEnd.AsObject;
    static toObject(includeInstance: boolean, msg: DownloadProgressEnd): DownloadProgressEnd.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DownloadProgressEnd, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DownloadProgressEnd;
    static deserializeBinaryFromReader(message: DownloadProgressEnd, reader: jspb.BinaryReader): DownloadProgressEnd;
}

export namespace DownloadProgressEnd {
    export type AsObject = {
        success: boolean,
        message: string,
    }
}

export class TaskProgress extends jspb.Message { 
    getName(): string;
    setName(value: string): TaskProgress;

    getMessage(): string;
    setMessage(value: string): TaskProgress;

    getCompleted(): boolean;
    setCompleted(value: boolean): TaskProgress;

    getPercent(): number;
    setPercent(value: number): TaskProgress;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TaskProgress.AsObject;
    static toObject(includeInstance: boolean, msg: TaskProgress): TaskProgress.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TaskProgress, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TaskProgress;
    static deserializeBinaryFromReader(message: TaskProgress, reader: jspb.BinaryReader): TaskProgress;
}

export namespace TaskProgress {
    export type AsObject = {
        name: string,
        message: string,
        completed: boolean,
        percent: number,
    }
}

export class Programmer extends jspb.Message { 
    getPlatform(): string;
    setPlatform(value: string): Programmer;

    getId(): string;
    setId(value: string): Programmer;

    getName(): string;
    setName(value: string): Programmer;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Programmer.AsObject;
    static toObject(includeInstance: boolean, msg: Programmer): Programmer.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Programmer, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Programmer;
    static deserializeBinaryFromReader(message: Programmer, reader: jspb.BinaryReader): Programmer;
}

export namespace Programmer {
    export type AsObject = {
        platform: string,
        id: string,
        name: string,
    }
}

export class Platform extends jspb.Message { 
    getId(): string;
    setId(value: string): Platform;

    getInstalled(): string;
    setInstalled(value: string): Platform;

    getLatest(): string;
    setLatest(value: string): Platform;

    getName(): string;
    setName(value: string): Platform;

    getMaintainer(): string;
    setMaintainer(value: string): Platform;

    getWebsite(): string;
    setWebsite(value: string): Platform;

    getEmail(): string;
    setEmail(value: string): Platform;

    clearBoardsList(): void;
    getBoardsList(): Array<Board>;
    setBoardsList(value: Array<Board>): Platform;
    addBoards(value?: Board, index?: number): Board;

    getManuallyInstalled(): boolean;
    setManuallyInstalled(value: boolean): Platform;

    getDeprecated(): boolean;
    setDeprecated(value: boolean): Platform;

    clearTypeList(): void;
    getTypeList(): Array<string>;
    setTypeList(value: Array<string>): Platform;
    addType(value: string, index?: number): string;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Platform.AsObject;
    static toObject(includeInstance: boolean, msg: Platform): Platform.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Platform, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Platform;
    static deserializeBinaryFromReader(message: Platform, reader: jspb.BinaryReader): Platform;
}

export namespace Platform {
    export type AsObject = {
        id: string,
        installed: string,
        latest: string,
        name: string,
        maintainer: string,
        website: string,
        email: string,
        boardsList: Array<Board.AsObject>,
        manuallyInstalled: boolean,
        deprecated: boolean,
        typeList: Array<string>,
    }
}

export class InstalledPlatformReference extends jspb.Message { 
    getId(): string;
    setId(value: string): InstalledPlatformReference;

    getVersion(): string;
    setVersion(value: string): InstalledPlatformReference;

    getInstallDir(): string;
    setInstallDir(value: string): InstalledPlatformReference;

    getPackageUrl(): string;
    setPackageUrl(value: string): InstalledPlatformReference;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InstalledPlatformReference.AsObject;
    static toObject(includeInstance: boolean, msg: InstalledPlatformReference): InstalledPlatformReference.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InstalledPlatformReference, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InstalledPlatformReference;
    static deserializeBinaryFromReader(message: InstalledPlatformReference, reader: jspb.BinaryReader): InstalledPlatformReference;
}

export namespace InstalledPlatformReference {
    export type AsObject = {
        id: string,
        version: string,
        installDir: string,
        packageUrl: string,
    }
}

export class Board extends jspb.Message { 
    getName(): string;
    setName(value: string): Board;

    getFqbn(): string;
    setFqbn(value: string): Board;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Board.AsObject;
    static toObject(includeInstance: boolean, msg: Board): Board.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Board, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Board;
    static deserializeBinaryFromReader(message: Board, reader: jspb.BinaryReader): Board;
}

export namespace Board {
    export type AsObject = {
        name: string,
        fqbn: string,
    }
}

export class Profile extends jspb.Message { 
    getName(): string;
    setName(value: string): Profile;

    getFqbn(): string;
    setFqbn(value: string): Profile;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Profile.AsObject;
    static toObject(includeInstance: boolean, msg: Profile): Profile.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Profile, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Profile;
    static deserializeBinaryFromReader(message: Profile, reader: jspb.BinaryReader): Profile;
}

export namespace Profile {
    export type AsObject = {
        name: string,
        fqbn: string,
    }
}
