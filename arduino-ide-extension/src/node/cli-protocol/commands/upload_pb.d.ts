// package: cc.arduino.cli.commands
// file: commands/upload.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as commands_common_pb from "../commands/common_pb";

export class UploadReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): UploadReq;

    getFqbn(): string;
    setFqbn(value: string): UploadReq;

    getSketchPath(): string;
    setSketchPath(value: string): UploadReq;

    getPort(): string;
    setPort(value: string): UploadReq;

    getVerbose(): boolean;
    setVerbose(value: boolean): UploadReq;

    getVerify(): boolean;
    setVerify(value: boolean): UploadReq;

    getImportFile(): string;
    setImportFile(value: string): UploadReq;

    getImportDir(): string;
    setImportDir(value: string): UploadReq;

    getProgrammer(): string;
    setProgrammer(value: string): UploadReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UploadReq.AsObject;
    static toObject(includeInstance: boolean, msg: UploadReq): UploadReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UploadReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UploadReq;
    static deserializeBinaryFromReader(message: UploadReq, reader: jspb.BinaryReader): UploadReq;
}

export namespace UploadReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        fqbn: string,
        sketchPath: string,
        port: string,
        verbose: boolean,
        verify: boolean,
        importFile: string,
        importDir: string,
        programmer: string,
    }
}

export class UploadResp extends jspb.Message { 
    getOutStream(): Uint8Array | string;
    getOutStream_asU8(): Uint8Array;
    getOutStream_asB64(): string;
    setOutStream(value: Uint8Array | string): UploadResp;

    getErrStream(): Uint8Array | string;
    getErrStream_asU8(): Uint8Array;
    getErrStream_asB64(): string;
    setErrStream(value: Uint8Array | string): UploadResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UploadResp.AsObject;
    static toObject(includeInstance: boolean, msg: UploadResp): UploadResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UploadResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UploadResp;
    static deserializeBinaryFromReader(message: UploadResp, reader: jspb.BinaryReader): UploadResp;
}

export namespace UploadResp {
    export type AsObject = {
        outStream: Uint8Array | string,
        errStream: Uint8Array | string,
    }
}

export class BurnBootloaderReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): BurnBootloaderReq;

    getFqbn(): string;
    setFqbn(value: string): BurnBootloaderReq;

    getPort(): string;
    setPort(value: string): BurnBootloaderReq;

    getVerbose(): boolean;
    setVerbose(value: boolean): BurnBootloaderReq;

    getVerify(): boolean;
    setVerify(value: boolean): BurnBootloaderReq;

    getProgrammer(): string;
    setProgrammer(value: string): BurnBootloaderReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BurnBootloaderReq.AsObject;
    static toObject(includeInstance: boolean, msg: BurnBootloaderReq): BurnBootloaderReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BurnBootloaderReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BurnBootloaderReq;
    static deserializeBinaryFromReader(message: BurnBootloaderReq, reader: jspb.BinaryReader): BurnBootloaderReq;
}

export namespace BurnBootloaderReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        fqbn: string,
        port: string,
        verbose: boolean,
        verify: boolean,
        programmer: string,
    }
}

export class BurnBootloaderResp extends jspb.Message { 
    getOutStream(): Uint8Array | string;
    getOutStream_asU8(): Uint8Array;
    getOutStream_asB64(): string;
    setOutStream(value: Uint8Array | string): BurnBootloaderResp;

    getErrStream(): Uint8Array | string;
    getErrStream_asU8(): Uint8Array;
    getErrStream_asB64(): string;
    setErrStream(value: Uint8Array | string): BurnBootloaderResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BurnBootloaderResp.AsObject;
    static toObject(includeInstance: boolean, msg: BurnBootloaderResp): BurnBootloaderResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BurnBootloaderResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BurnBootloaderResp;
    static deserializeBinaryFromReader(message: BurnBootloaderResp, reader: jspb.BinaryReader): BurnBootloaderResp;
}

export namespace BurnBootloaderResp {
    export type AsObject = {
        outStream: Uint8Array | string,
        errStream: Uint8Array | string,
    }
}

export class ListProgrammersAvailableForUploadReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): ListProgrammersAvailableForUploadReq;

    getFqbn(): string;
    setFqbn(value: string): ListProgrammersAvailableForUploadReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListProgrammersAvailableForUploadReq.AsObject;
    static toObject(includeInstance: boolean, msg: ListProgrammersAvailableForUploadReq): ListProgrammersAvailableForUploadReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListProgrammersAvailableForUploadReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListProgrammersAvailableForUploadReq;
    static deserializeBinaryFromReader(message: ListProgrammersAvailableForUploadReq, reader: jspb.BinaryReader): ListProgrammersAvailableForUploadReq;
}

export namespace ListProgrammersAvailableForUploadReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        fqbn: string,
    }
}

export class ListProgrammersAvailableForUploadResp extends jspb.Message { 
    clearProgrammersList(): void;
    getProgrammersList(): Array<commands_common_pb.Programmer>;
    setProgrammersList(value: Array<commands_common_pb.Programmer>): ListProgrammersAvailableForUploadResp;
    addProgrammers(value?: commands_common_pb.Programmer, index?: number): commands_common_pb.Programmer;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListProgrammersAvailableForUploadResp.AsObject;
    static toObject(includeInstance: boolean, msg: ListProgrammersAvailableForUploadResp): ListProgrammersAvailableForUploadResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListProgrammersAvailableForUploadResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListProgrammersAvailableForUploadResp;
    static deserializeBinaryFromReader(message: ListProgrammersAvailableForUploadResp, reader: jspb.BinaryReader): ListProgrammersAvailableForUploadResp;
}

export namespace ListProgrammersAvailableForUploadResp {
    export type AsObject = {
        programmersList: Array<commands_common_pb.Programmer.AsObject>,
    }
}
