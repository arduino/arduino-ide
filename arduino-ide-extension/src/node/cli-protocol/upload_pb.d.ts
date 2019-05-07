// package: arduino
// file: upload.proto

/* tslint:disable */

import * as jspb from "google-protobuf";
import * as common_pb from "./common_pb";

export class UploadReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): common_pb.Instance | undefined;
    setInstance(value?: common_pb.Instance): void;

    getFqbn(): string;
    setFqbn(value: string): void;

    getSketchPath(): string;
    setSketchPath(value: string): void;

    getPort(): string;
    setPort(value: string): void;

    getVerbose(): boolean;
    setVerbose(value: boolean): void;

    getVerify(): boolean;
    setVerify(value: boolean): void;

    getImportFile(): string;
    setImportFile(value: string): void;


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
        instance?: common_pb.Instance.AsObject,
        fqbn: string,
        sketchPath: string,
        port: string,
        verbose: boolean,
        verify: boolean,
        importFile: string,
    }
}

export class UploadResp extends jspb.Message { 
    getOutStream(): Uint8Array | string;
    getOutStream_asU8(): Uint8Array;
    getOutStream_asB64(): string;
    setOutStream(value: Uint8Array | string): void;

    getErrStream(): Uint8Array | string;
    getErrStream_asU8(): Uint8Array;
    getErrStream_asB64(): string;
    setErrStream(value: Uint8Array | string): void;


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
