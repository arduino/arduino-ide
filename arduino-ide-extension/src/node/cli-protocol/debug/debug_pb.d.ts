// package: cc.arduino.cli.debug
// file: debug/debug.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class DebugReq extends jspb.Message { 

    hasDebugreq(): boolean;
    clearDebugreq(): void;
    getDebugreq(): DebugConfigReq | undefined;
    setDebugreq(value?: DebugConfigReq): void;

    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DebugReq.AsObject;
    static toObject(includeInstance: boolean, msg: DebugReq): DebugReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DebugReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DebugReq;
    static deserializeBinaryFromReader(message: DebugReq, reader: jspb.BinaryReader): DebugReq;
}

export namespace DebugReq {
    export type AsObject = {
        debugreq?: DebugConfigReq.AsObject,
        data: Uint8Array | string,
    }
}

export class DebugConfigReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): Instance | undefined;
    setInstance(value?: Instance): void;

    getFqbn(): string;
    setFqbn(value: string): void;

    getSketchPath(): string;
    setSketchPath(value: string): void;

    getPort(): string;
    setPort(value: string): void;

    getVerbose(): boolean;
    setVerbose(value: boolean): void;

    getImportFile(): string;
    setImportFile(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DebugConfigReq.AsObject;
    static toObject(includeInstance: boolean, msg: DebugConfigReq): DebugConfigReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DebugConfigReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DebugConfigReq;
    static deserializeBinaryFromReader(message: DebugConfigReq, reader: jspb.BinaryReader): DebugConfigReq;
}

export namespace DebugConfigReq {
    export type AsObject = {
        instance?: Instance.AsObject,
        fqbn: string,
        sketchPath: string,
        port: string,
        verbose: boolean,
        importFile: string,
    }
}

export class DebugResp extends jspb.Message { 
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): void;

    getError(): string;
    setError(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DebugResp.AsObject;
    static toObject(includeInstance: boolean, msg: DebugResp): DebugResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DebugResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DebugResp;
    static deserializeBinaryFromReader(message: DebugResp, reader: jspb.BinaryReader): DebugResp;
}

export namespace DebugResp {
    export type AsObject = {
        data: Uint8Array | string,
        error: string,
    }
}

export class Instance extends jspb.Message { 
    getId(): number;
    setId(value: number): void;


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
