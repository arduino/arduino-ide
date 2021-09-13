// package: cc.arduino.cli.debug.v1
// file: cc/arduino/cli/debug/v1/debug.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import {handleClientStreamingCall} from "@grpc/grpc-js/build/src/server-call";
import * as cc_arduino_cli_debug_v1_debug_pb from "../../../../../cc/arduino/cli/debug/v1/debug_pb";
import * as cc_arduino_cli_commands_v1_common_pb from "../../../../../cc/arduino/cli/commands/v1/common_pb";
import * as cc_arduino_cli_commands_v1_port_pb from "../../../../../cc/arduino/cli/commands/v1/port_pb";

interface IDebugServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    debug: IDebugServiceService_IDebug;
    getDebugConfig: IDebugServiceService_IGetDebugConfig;
}

interface IDebugServiceService_IDebug extends grpc.MethodDefinition<cc_arduino_cli_debug_v1_debug_pb.DebugRequest, cc_arduino_cli_debug_v1_debug_pb.DebugResponse> {
    path: "/cc.arduino.cli.debug.v1.DebugService/Debug";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<cc_arduino_cli_debug_v1_debug_pb.DebugRequest>;
    requestDeserialize: grpc.deserialize<cc_arduino_cli_debug_v1_debug_pb.DebugRequest>;
    responseSerialize: grpc.serialize<cc_arduino_cli_debug_v1_debug_pb.DebugResponse>;
    responseDeserialize: grpc.deserialize<cc_arduino_cli_debug_v1_debug_pb.DebugResponse>;
}
interface IDebugServiceService_IGetDebugConfig extends grpc.MethodDefinition<cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest, cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse> {
    path: "/cc.arduino.cli.debug.v1.DebugService/GetDebugConfig";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest>;
    requestDeserialize: grpc.deserialize<cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest>;
    responseSerialize: grpc.serialize<cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse>;
    responseDeserialize: grpc.deserialize<cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse>;
}

export const DebugServiceService: IDebugServiceService;

export interface IDebugServiceServer {
    debug: grpc.handleBidiStreamingCall<cc_arduino_cli_debug_v1_debug_pb.DebugRequest, cc_arduino_cli_debug_v1_debug_pb.DebugResponse>;
    getDebugConfig: grpc.handleUnaryCall<cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest, cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse>;
}

export interface IDebugServiceClient {
    debug(): grpc.ClientDuplexStream<cc_arduino_cli_debug_v1_debug_pb.DebugRequest, cc_arduino_cli_debug_v1_debug_pb.DebugResponse>;
    debug(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<cc_arduino_cli_debug_v1_debug_pb.DebugRequest, cc_arduino_cli_debug_v1_debug_pb.DebugResponse>;
    debug(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<cc_arduino_cli_debug_v1_debug_pb.DebugRequest, cc_arduino_cli_debug_v1_debug_pb.DebugResponse>;
    getDebugConfig(request: cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse) => void): grpc.ClientUnaryCall;
    getDebugConfig(request: cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse) => void): grpc.ClientUnaryCall;
    getDebugConfig(request: cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse) => void): grpc.ClientUnaryCall;
}

export class DebugServiceClient extends grpc.Client implements IDebugServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public debug(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<cc_arduino_cli_debug_v1_debug_pb.DebugRequest, cc_arduino_cli_debug_v1_debug_pb.DebugResponse>;
    public debug(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<cc_arduino_cli_debug_v1_debug_pb.DebugRequest, cc_arduino_cli_debug_v1_debug_pb.DebugResponse>;
    public getDebugConfig(request: cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse) => void): grpc.ClientUnaryCall;
    public getDebugConfig(request: cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse) => void): grpc.ClientUnaryCall;
    public getDebugConfig(request: cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse) => void): grpc.ClientUnaryCall;
}
