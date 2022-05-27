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
    getUrl(): string;
    setUrl(value: string): DownloadProgress;

    getFile(): string;
    setFile(value: string): DownloadProgress;

    getTotalSize(): number;
    setTotalSize(value: number): DownloadProgress;

    getDownloaded(): number;
    setDownloaded(value: number): DownloadProgress;

    getCompleted(): boolean;
    setCompleted(value: boolean): DownloadProgress;


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
        url: string,
        file: string,
        totalSize: number,
        downloaded: number,
        completed: boolean,
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
    }
}

export class PlatformReference extends jspb.Message { 
    getId(): string;
    setId(value: string): PlatformReference;

    getVersion(): string;
    setVersion(value: string): PlatformReference;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformReference.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformReference): PlatformReference.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformReference, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformReference;
    static deserializeBinaryFromReader(message: PlatformReference, reader: jspb.BinaryReader): PlatformReference;
}

export namespace PlatformReference {
    export type AsObject = {
        id: string,
        version: string,
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
