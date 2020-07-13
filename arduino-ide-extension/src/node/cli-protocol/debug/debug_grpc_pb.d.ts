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
}

interface IDebugService_IDebug extends grpc.MethodDefinition<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp> {
    path: string; // "/cc.arduino.cli.debug.Debug/Debug"
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<debug_debug_pb.DebugReq>;
    requestDeserialize: grpc.deserialize<debug_debug_pb.DebugReq>;
    responseSerialize: grpc.serialize<debug_debug_pb.DebugResp>;
    responseDeserialize: grpc.deserialize<debug_debug_pb.DebugResp>;
}

export const DebugService: IDebugService;

export interface IDebugServer {
    debug: grpc.handleBidiStreamingCall<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp>;
}

export interface IDebugClient {
    debug(): grpc.ClientDuplexStream<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp>;
    debug(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp>;
    debug(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp>;
}

export class DebugClient extends grpc.Client implements IDebugClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public debug(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp>;
    public debug(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<debug_debug_pb.DebugReq, debug_debug_pb.DebugResp>;
}
