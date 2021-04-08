// package: cc.arduino.cli.monitor.v1
// file: cc/arduino/cli/monitor/v1/monitor.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class StreamingOpenRequest extends jspb.Message { 

    hasConfig(): boolean;
    clearConfig(): void;
    getConfig(): MonitorConfig | undefined;
    setConfig(value?: MonitorConfig): StreamingOpenRequest;


    hasData(): boolean;
    clearData(): void;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): StreamingOpenRequest;


    hasRecvAcknowledge(): boolean;
    clearRecvAcknowledge(): void;
    getRecvAcknowledge(): number;
    setRecvAcknowledge(value: number): StreamingOpenRequest;


    getContentCase(): StreamingOpenRequest.ContentCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamingOpenRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StreamingOpenRequest): StreamingOpenRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamingOpenRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamingOpenRequest;
    static deserializeBinaryFromReader(message: StreamingOpenRequest, reader: jspb.BinaryReader): StreamingOpenRequest;
}

export namespace StreamingOpenRequest {
    export type AsObject = {
        config?: MonitorConfig.AsObject,
        data: Uint8Array | string,
        recvAcknowledge: number,
    }

    export enum ContentCase {
        CONTENT_NOT_SET = 0,
    
    CONFIG = 1,

    DATA = 2,

    RECV_ACKNOWLEDGE = 3,

    }

}

export class MonitorConfig extends jspb.Message { 
    getTarget(): string;
    setTarget(value: string): MonitorConfig;

    getType(): MonitorConfig.TargetType;
    setType(value: MonitorConfig.TargetType): MonitorConfig;


    hasAdditionalConfig(): boolean;
    clearAdditionalConfig(): void;
    getAdditionalConfig(): google_protobuf_struct_pb.Struct | undefined;
    setAdditionalConfig(value?: google_protobuf_struct_pb.Struct): MonitorConfig;

    getRecvRateLimitBuffer(): number;
    setRecvRateLimitBuffer(value: number): MonitorConfig;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MonitorConfig.AsObject;
    static toObject(includeInstance: boolean, msg: MonitorConfig): MonitorConfig.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MonitorConfig, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MonitorConfig;
    static deserializeBinaryFromReader(message: MonitorConfig, reader: jspb.BinaryReader): MonitorConfig;
}

export namespace MonitorConfig {
    export type AsObject = {
        target: string,
        type: MonitorConfig.TargetType,
        additionalConfig?: google_protobuf_struct_pb.Struct.AsObject,
        recvRateLimitBuffer: number,
    }

    export enum TargetType {
    TARGET_TYPE_SERIAL = 0,
    TARGET_TYPE_NULL = 99,
    }

}

export class StreamingOpenResponse extends jspb.Message { 
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): StreamingOpenResponse;

    getDropped(): number;
    setDropped(value: number): StreamingOpenResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamingOpenResponse.AsObject;
    static toObject(includeInstance: boolean, msg: StreamingOpenResponse): StreamingOpenResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamingOpenResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamingOpenResponse;
    static deserializeBinaryFromReader(message: StreamingOpenResponse, reader: jspb.BinaryReader): StreamingOpenResponse;
}

export namespace StreamingOpenResponse {
    export type AsObject = {
        data: Uint8Array | string,
        dropped: number,
    }
}
