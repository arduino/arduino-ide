// package: cc.arduino.cli.commands
// file: commands/common.proto

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
