// package: cc.arduino.cli.settings.v1
// file: cc/arduino/cli/settings/v1/settings.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class GetAllResponse extends jspb.Message { 
    getJsonData(): string;
    setJsonData(value: string): GetAllResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetAllResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetAllResponse): GetAllResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetAllResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetAllResponse;
    static deserializeBinaryFromReader(message: GetAllResponse, reader: jspb.BinaryReader): GetAllResponse;
}

export namespace GetAllResponse {
    export type AsObject = {
        jsonData: string,
    }
}

export class MergeRequest extends jspb.Message { 
    getJsonData(): string;
    setJsonData(value: string): MergeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MergeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: MergeRequest): MergeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MergeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MergeRequest;
    static deserializeBinaryFromReader(message: MergeRequest, reader: jspb.BinaryReader): MergeRequest;
}

export namespace MergeRequest {
    export type AsObject = {
        jsonData: string,
    }
}

export class GetValueResponse extends jspb.Message { 
    getKey(): string;
    setKey(value: string): GetValueResponse;
    getJsonData(): string;
    setJsonData(value: string): GetValueResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetValueResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetValueResponse): GetValueResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetValueResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetValueResponse;
    static deserializeBinaryFromReader(message: GetValueResponse, reader: jspb.BinaryReader): GetValueResponse;
}

export namespace GetValueResponse {
    export type AsObject = {
        key: string,
        jsonData: string,
    }
}

export class SetValueRequest extends jspb.Message { 
    getKey(): string;
    setKey(value: string): SetValueRequest;
    getJsonData(): string;
    setJsonData(value: string): SetValueRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetValueRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetValueRequest): SetValueRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetValueRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetValueRequest;
    static deserializeBinaryFromReader(message: SetValueRequest, reader: jspb.BinaryReader): SetValueRequest;
}

export namespace SetValueRequest {
    export type AsObject = {
        key: string,
        jsonData: string,
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
    getFilePath(): string;
    setFilePath(value: string): WriteRequest;

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
        filePath: string,
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

export class DeleteRequest extends jspb.Message { 
    getKey(): string;
    setKey(value: string): DeleteRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteRequest): DeleteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteRequest;
    static deserializeBinaryFromReader(message: DeleteRequest, reader: jspb.BinaryReader): DeleteRequest;
}

export namespace DeleteRequest {
    export type AsObject = {
        key: string,
    }
}

export class DeleteResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteResponse): DeleteResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteResponse;
    static deserializeBinaryFromReader(message: DeleteResponse, reader: jspb.BinaryReader): DeleteResponse;
}

export namespace DeleteResponse {
    export type AsObject = {
    }
}
