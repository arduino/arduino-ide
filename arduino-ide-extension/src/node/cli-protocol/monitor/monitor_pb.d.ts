// package: cc.arduino.cli.monitor
// file: monitor/monitor.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class StreamingOpenReq extends jspb.Message { 

    hasMonitorconfig(): boolean;
    clearMonitorconfig(): void;
    getMonitorconfig(): MonitorConfig | undefined;
    setMonitorconfig(value?: MonitorConfig): StreamingOpenReq;


    hasData(): boolean;
    clearData(): void;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): StreamingOpenReq;


    hasRecvAcknowledge(): boolean;
    clearRecvAcknowledge(): void;
    getRecvAcknowledge(): number;
    setRecvAcknowledge(value: number): StreamingOpenReq;


    getContentCase(): StreamingOpenReq.ContentCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamingOpenReq.AsObject;
    static toObject(includeInstance: boolean, msg: StreamingOpenReq): StreamingOpenReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamingOpenReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamingOpenReq;
    static deserializeBinaryFromReader(message: StreamingOpenReq, reader: jspb.BinaryReader): StreamingOpenReq;
}

export namespace StreamingOpenReq {
    export type AsObject = {
        monitorconfig?: MonitorConfig.AsObject,
        data: Uint8Array | string,
        recvAcknowledge: number,
    }

    export enum ContentCase {
        CONTENT_NOT_SET = 0,
    
    MONITORCONFIG = 1,

    DATA = 2,

    RECV_ACKNOWLEDGE = 3,

    }

}

export class MonitorConfig extends jspb.Message { 
    getTarget(): string;
    setTarget(value: string): MonitorConfig;

    getType(): MonitorConfig.TargetType;
    setType(value: MonitorConfig.TargetType): MonitorConfig;


    hasAdditionalconfig(): boolean;
    clearAdditionalconfig(): void;
    getAdditionalconfig(): google_protobuf_struct_pb.Struct | undefined;
    setAdditionalconfig(value?: google_protobuf_struct_pb.Struct): MonitorConfig;

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
        additionalconfig?: google_protobuf_struct_pb.Struct.AsObject,
        recvRateLimitBuffer: number,
    }

    export enum TargetType {
    SERIAL = 0,
    NULL = 99,
    }

}

export class StreamingOpenResp extends jspb.Message { 
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): StreamingOpenResp;

    getDropped(): number;
    setDropped(value: number): StreamingOpenResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamingOpenResp.AsObject;
    static toObject(includeInstance: boolean, msg: StreamingOpenResp): StreamingOpenResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamingOpenResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamingOpenResp;
    static deserializeBinaryFromReader(message: StreamingOpenResp, reader: jspb.BinaryReader): StreamingOpenResp;
}

export namespace StreamingOpenResp {
    export type AsObject = {
        data: Uint8Array | string,
        dropped: number,
    }
}
