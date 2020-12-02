// package: cc.arduino.cli.debug
// file: debug/debug.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import {handleClientStreamingCall} from "@grpc/grpc-js/build/src/server-call";
import * as debug_debug_pb from "../debug/debug_pb";
import * as commands_common_pb from "../commands/common_pb";

interface IDebugService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    debug: IDebugService_IDebug;
    getDebugConfig: IDebugService_IGetDebugConfig;
}

interface IDebugService_IDebug extends grpc.MethodDefinition<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp> {
    path: "/cc.arduino.cli.debug.Debug/Debug";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<debug_debug_pb.DebugReq>;
    requestDeserialize: grpc.deserialize<debug_debug_pb.DebugReq>;
    responseSerialize: grpc.serialize<debug_debug_pb.DebugResp>;
    responseDeserialize: grpc.deserialize<debug_debug_pb.DebugResp>;
}
interface IDebugService_IGetDebugConfig extends grpc.MethodDefinition<debug_debug_pb.DebugConfigReq, debug_debug_pb.GetDebugConfigResp> {
    path: "/cc.arduino.cli.debug.Debug/GetDebugConfig";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<debug_debug_pb.DebugConfigReq>;
    requestDeserialize: grpc.deserialize<debug_debug_pb.DebugConfigReq>;
    responseSerialize: grpc.serialize<debug_debug_pb.GetDebugConfigResp>;
    responseDeserialize: grpc.deserialize<debug_debug_pb.GetDebugConfigResp>;
}

export const DebugService: IDebugService;

export interface IDebugServer {
    debug: grpc.handleBidiStreamingCall<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp>;
    getDebugConfig: grpc.handleUnaryCall<debug_debug_pb.DebugConfigReq, debug_debug_pb.GetDebugConfigResp>;
}

export interface IDebugClient {
    debug(): grpc.ClientDuplexStream<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp>;
    debug(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp>;
    debug(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp>;
    getDebugConfig(request: debug_debug_pb.DebugConfigReq, callback: (error: grpc.ServiceError | null, response: debug_debug_pb.GetDebugConfigResp) => void): grpc.ClientUnaryCall;
    getDebugConfig(request: debug_debug_pb.DebugConfigReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: debug_debug_pb.GetDebugConfigResp) => void): grpc.ClientUnaryCall;
    getDebugConfig(request: debug_debug_pb.DebugConfigReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: debug_debug_pb.GetDebugConfigResp) => void): grpc.ClientUnaryCall;
}

export class DebugClient extends grpc.Client implements IDebugClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public debug(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp>;
    public debug(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp>;
    public getDebugConfig(request: debug_debug_pb.DebugConfigReq, callback: (error: grpc.ServiceError | null, response: debug_debug_pb.GetDebugConfigResp) => void): grpc.ClientUnaryCall;
    public getDebugConfig(request: debug_debug_pb.DebugConfigReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: debug_debug_pb.GetDebugConfigResp) => void): grpc.ClientUnaryCall;
    public getDebugConfig(request: debug_debug_pb.DebugConfigReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: debug_debug_pb.GetDebugConfigResp) => void): grpc.ClientUnaryCall;
}
