// package: cc.arduino.cli.monitor
// file: monitor/monitor.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import {handleClientStreamingCall} from "@grpc/grpc-js/build/src/server-call";
import * as monitor_monitor_pb from "../monitor/monitor_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

interface IMonitorService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    streamingOpen: IMonitorService_IStreamingOpen;
}

interface IMonitorService_IStreamingOpen extends grpc.MethodDefinition<monitor_monitor_pb.StreamingOpenReq, monitor_monitor_pb.StreamingOpenResp> {
    path: "/cc.arduino.cli.monitor.Monitor/StreamingOpen";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<monitor_monitor_pb.StreamingOpenReq>;
    requestDeserialize: grpc.deserialize<monitor_monitor_pb.StreamingOpenReq>;
    responseSerialize: grpc.serialize<monitor_monitor_pb.StreamingOpenResp>;
    responseDeserialize: grpc.deserialize<monitor_monitor_pb.StreamingOpenResp>;
}

export const MonitorService: IMonitorService;

export interface IMonitorServer {
    streamingOpen: grpc.handleBidiStreamingCall<monitor_monitor_pb.StreamingOpenReq, monitor_monitor_pb.StreamingOpenResp>;
}

export interface IMonitorClient {
    streamingOpen(): grpc.ClientDuplexStream<monitor_monitor_pb.StreamingOpenReq, monitor_monitor_pb.StreamingOpenResp>;
    streamingOpen(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<monitor_monitor_pb.StreamingOpenReq, monitor_monitor_pb.StreamingOpenResp>;
    streamingOpen(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<monitor_monitor_pb.StreamingOpenReq, monitor_monitor_pb.StreamingOpenResp>;
}

export class MonitorClient extends grpc.Client implements IMonitorClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public streamingOpen(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<monitor_monitor_pb.StreamingOpenReq, monitor_monitor_pb.StreamingOpenResp>;
    public streamingOpen(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<monitor_monitor_pb.StreamingOpenReq, monitor_monitor_pb.StreamingOpenResp>;
}
