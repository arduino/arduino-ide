// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/settings.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class SettingsGetAllResponse extends jspb.Message { 
    getJsonData(): string;
    setJsonData(value: string): SettingsGetAllResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsGetAllResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsGetAllResponse): SettingsGetAllResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsGetAllResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsGetAllResponse;
    static deserializeBinaryFromReader(message: SettingsGetAllResponse, reader: jspb.BinaryReader): SettingsGetAllResponse;
}

export namespace SettingsGetAllResponse {
    export type AsObject = {
        jsonData: string,
    }
}

export class SettingsMergeRequest extends jspb.Message { 
    getJsonData(): string;
    setJsonData(value: string): SettingsMergeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsMergeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsMergeRequest): SettingsMergeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsMergeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsMergeRequest;
    static deserializeBinaryFromReader(message: SettingsMergeRequest, reader: jspb.BinaryReader): SettingsMergeRequest;
}

export namespace SettingsMergeRequest {
    export type AsObject = {
        jsonData: string,
    }
}

export class SettingsGetValueResponse extends jspb.Message { 
    getKey(): string;
    setKey(value: string): SettingsGetValueResponse;
    getJsonData(): string;
    setJsonData(value: string): SettingsGetValueResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsGetValueResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsGetValueResponse): SettingsGetValueResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsGetValueResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsGetValueResponse;
    static deserializeBinaryFromReader(message: SettingsGetValueResponse, reader: jspb.BinaryReader): SettingsGetValueResponse;
}

export namespace SettingsGetValueResponse {
    export type AsObject = {
        key: string,
        jsonData: string,
    }
}

export class SettingsSetValueRequest extends jspb.Message { 
    getKey(): string;
    setKey(value: string): SettingsSetValueRequest;
    getJsonData(): string;
    setJsonData(value: string): SettingsSetValueRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsSetValueRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsSetValueRequest): SettingsSetValueRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsSetValueRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsSetValueRequest;
    static deserializeBinaryFromReader(message: SettingsSetValueRequest, reader: jspb.BinaryReader): SettingsSetValueRequest;
}

export namespace SettingsSetValueRequest {
    export type AsObject = {
        key: string,
        jsonData: string,
    }
}

export class SettingsGetAllRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsGetAllRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsGetAllRequest): SettingsGetAllRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsGetAllRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsGetAllRequest;
    static deserializeBinaryFromReader(message: SettingsGetAllRequest, reader: jspb.BinaryReader): SettingsGetAllRequest;
}

export namespace SettingsGetAllRequest {
    export type AsObject = {
    }
}

export class SettingsGetValueRequest extends jspb.Message { 
    getKey(): string;
    setKey(value: string): SettingsGetValueRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsGetValueRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsGetValueRequest): SettingsGetValueRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsGetValueRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsGetValueRequest;
    static deserializeBinaryFromReader(message: SettingsGetValueRequest, reader: jspb.BinaryReader): SettingsGetValueRequest;
}

export namespace SettingsGetValueRequest {
    export type AsObject = {
        key: string,
    }
}

export class SettingsMergeResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsMergeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsMergeResponse): SettingsMergeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsMergeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsMergeResponse;
    static deserializeBinaryFromReader(message: SettingsMergeResponse, reader: jspb.BinaryReader): SettingsMergeResponse;
}

export namespace SettingsMergeResponse {
    export type AsObject = {
    }
}

export class SettingsSetValueResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsSetValueResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsSetValueResponse): SettingsSetValueResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsSetValueResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsSetValueResponse;
    static deserializeBinaryFromReader(message: SettingsSetValueResponse, reader: jspb.BinaryReader): SettingsSetValueResponse;
}

export namespace SettingsSetValueResponse {
    export type AsObject = {
    }
}

export class SettingsWriteRequest extends jspb.Message { 
    getFilePath(): string;
    setFilePath(value: string): SettingsWriteRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsWriteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsWriteRequest): SettingsWriteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsWriteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsWriteRequest;
    static deserializeBinaryFromReader(message: SettingsWriteRequest, reader: jspb.BinaryReader): SettingsWriteRequest;
}

export namespace SettingsWriteRequest {
    export type AsObject = {
        filePath: string,
    }
}

export class SettingsWriteResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsWriteResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsWriteResponse): SettingsWriteResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsWriteResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsWriteResponse;
    static deserializeBinaryFromReader(message: SettingsWriteResponse, reader: jspb.BinaryReader): SettingsWriteResponse;
}

export namespace SettingsWriteResponse {
    export type AsObject = {
    }
}

export class SettingsDeleteRequest extends jspb.Message { 
    getKey(): string;
    setKey(value: string): SettingsDeleteRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsDeleteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsDeleteRequest): SettingsDeleteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsDeleteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsDeleteRequest;
    static deserializeBinaryFromReader(message: SettingsDeleteRequest, reader: jspb.BinaryReader): SettingsDeleteRequest;
}

export namespace SettingsDeleteRequest {
    export type AsObject = {
        key: string,
    }
}

export class SettingsDeleteResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettingsDeleteResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SettingsDeleteResponse): SettingsDeleteResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettingsDeleteResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettingsDeleteResponse;
    static deserializeBinaryFromReader(message: SettingsDeleteResponse, reader: jspb.BinaryReader): SettingsDeleteResponse;
}

export namespace SettingsDeleteResponse {
    export type AsObject = {
    }
}
