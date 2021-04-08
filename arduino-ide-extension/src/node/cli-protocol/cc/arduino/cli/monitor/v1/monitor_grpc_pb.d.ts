// package: cc.arduino.cli.monitor.v1
// file: cc/arduino/cli/monitor/v1/monitor.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import {handleClientStreamingCall} from "@grpc/grpc-js/build/src/server-call";
import * as cc_arduino_cli_monitor_v1_monitor_pb from "../../../../../cc/arduino/cli/monitor/v1/monitor_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

interface IMonitorServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    streamingOpen: IMonitorServiceService_IStreamingOpen;
}

interface IMonitorServiceService_IStreamingOpen extends grpc.MethodDefinition<cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenRequest, cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenResponse> {
    path: "/cc.arduino.cli.monitor.v1.MonitorService/StreamingOpen";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenRequest>;
    requestDeserialize: grpc.deserialize<cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenRequest>;
    responseSerialize: grpc.serialize<cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenResponse>;
    responseDeserialize: grpc.deserialize<cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenResponse>;
}

export const MonitorServiceService: IMonitorServiceService;

export interface IMonitorServiceServer {
    streamingOpen: grpc.handleBidiStreamingCall<cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenRequest, cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenResponse>;
}

export interface IMonitorServiceClient {
    streamingOpen(): grpc.ClientDuplexStream<cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenRequest, cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenResponse>;
    streamingOpen(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenRequest, cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenResponse>;
    streamingOpen(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenRequest, cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenResponse>;
}

export class MonitorServiceClient extends grpc.Client implements IMonitorServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public streamingOpen(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenRequest, cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenResponse>;
    public streamingOpen(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenRequest, cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenResponse>;
}
