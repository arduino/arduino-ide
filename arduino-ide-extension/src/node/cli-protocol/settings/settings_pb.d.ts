// package: cc.arduino.cli.settings
// file: settings/settings.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class RawData extends jspb.Message { 
    getJsondata(): string;
    setJsondata(value: string): RawData;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RawData.AsObject;
    static toObject(includeInstance: boolean, msg: RawData): RawData.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RawData, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RawData;
    static deserializeBinaryFromReader(message: RawData, reader: jspb.BinaryReader): RawData;
}

export namespace RawData {
    export type AsObject = {
        jsondata: string,
    }
}

export class Value extends jspb.Message { 
    getKey(): string;
    setKey(value: string): Value;

    getJsondata(): string;
    setJsondata(value: string): Value;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Value.AsObject;
    static toObject(includeInstance: boolean, msg: Value): Value.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Value, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Value;
    static deserializeBinaryFromReader(message: Value, reader: jspb.BinaryReader): Value;
}

export namespace Value {
    export type AsObject = {
        key: string,
        jsondata: string,
    }
}

export class GetAllRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetAllRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetAllRequest): GetAllRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetAllRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetAllRequest;
    static deserializeBinaryFromReader(message: GetAllRequest, reader: jspb.BinaryReader): GetAllRequest;
}

export namespace GetAllRequest {
    export type AsObject = {
    }
}

export class GetValueRequest extends jspb.Message { 
    getKey(): string;
    setKey(value: string): GetValueRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetValueRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetValueRequest): GetValueRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetValueRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetValueRequest;
    static deserializeBinaryFromReader(message: GetValueRequest, reader: jspb.BinaryReader): GetValueRequest;
}

export namespace GetValueRequest {
    export type AsObject = {
        key: string,
    }
}

export class MergeResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MergeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: MergeResponse): MergeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MergeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MergeResponse;
    static deserializeBinaryFromReader(message: MergeResponse, reader: jspb.BinaryReader): MergeResponse;
}

export namespace MergeResponse {
    export type AsObject = {
    }
}

export class SetValueResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetValueResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SetValueResponse): SetValueResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetValueResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetValueResponse;
    static deserializeBinaryFromReader(message: SetValueResponse, reader: jspb.BinaryReader): SetValueResponse;
}

export namespace SetValueResponse {
    export type AsObject = {
    }
}

export class WriteRequest extends jspb.Message { 
    getFilepath(): string;
    setFilepath(value: string): WriteRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WriteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: WriteRequest): WriteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WriteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WriteRequest;
    static deserializeBinaryFromReader(message: WriteRequest, reader: jspb.BinaryReader): WriteRequest;
}

export namespace WriteRequest {
    export type AsObject = {
        filepath: string,
    }
}

export class WriteResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WriteResponse.AsObject;
    static toObject(includeInstance: boolean, msg: WriteResponse): WriteResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WriteResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WriteResponse;
    static deserializeBinaryFromReader(message: WriteResponse, reader: jspb.BinaryReader): WriteResponse;
}

export namespace WriteResponse {
    export type AsObject = {
    }
}
