// package: cc.arduino.cli.settings
// file: settings/settings.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import {handleClientStreamingCall} from "@grpc/grpc-js/build/src/server-call";
import * as settings_settings_pb from "../settings/settings_pb";

interface ISettingsService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getAll: ISettingsService_IGetAll;
    merge: ISettingsService_IMerge;
    getValue: ISettingsService_IGetValue;
    setValue: ISettingsService_ISetValue;
}

interface ISettingsService_IGetAll extends grpc.MethodDefinition<settings_settings_pb.GetAllRequest, settings_settings_pb.RawData> {
    path: string; // "/cc.arduino.cli.settings.Settings/GetAll"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<settings_settings_pb.GetAllRequest>;
    requestDeserialize: grpc.deserialize<settings_settings_pb.GetAllRequest>;
    responseSerialize: grpc.serialize<settings_settings_pb.RawData>;
    responseDeserialize: grpc.deserialize<settings_settings_pb.RawData>;
}
interface ISettingsService_IMerge extends grpc.MethodDefinition<settings_settings_pb.RawData, settings_settings_pb.MergeResponse> {
    path: string; // "/cc.arduino.cli.settings.Settings/Merge"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<settings_settings_pb.RawData>;
    requestDeserialize: grpc.deserialize<settings_settings_pb.RawData>;
    responseSerialize: grpc.serialize<settings_settings_pb.MergeResponse>;
    responseDeserialize: grpc.deserialize<settings_settings_pb.MergeResponse>;
}
interface ISettingsService_IGetValue extends grpc.MethodDefinition<settings_settings_pb.GetValueRequest, settings_settings_pb.Value> {
    path: string; // "/cc.arduino.cli.settings.Settings/GetValue"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<settings_settings_pb.GetValueRequest>;
    requestDeserialize: grpc.deserialize<settings_settings_pb.GetValueRequest>;
    responseSerialize: grpc.serialize<settings_settings_pb.Value>;
    responseDeserialize: grpc.deserialize<settings_settings_pb.Value>;
}
interface ISettingsService_ISetValue extends grpc.MethodDefinition<settings_settings_pb.Value, settings_settings_pb.SetValueResponse> {
    path: string; // "/cc.arduino.cli.settings.Settings/SetValue"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<settings_settings_pb.Value>;
    requestDeserialize: grpc.deserialize<settings_settings_pb.Value>;
    responseSerialize: grpc.serialize<settings_settings_pb.SetValueResponse>;
    responseDeserialize: grpc.deserialize<settings_settings_pb.SetValueResponse>;
}

export const SettingsService: ISettingsService;

export interface ISettingsServer {
    getAll: grpc.handleUnaryCall<settings_settings_pb.GetAllRequest, settings_settings_pb.RawData>;
    merge: grpc.handleUnaryCall<settings_settings_pb.RawData, settings_settings_pb.MergeResponse>;
    getValue: grpc.handleUnaryCall<settings_settings_pb.GetValueRequest, settings_settings_pb.Value>;
    setValue: grpc.handleUnaryCall<settings_settings_pb.Value, settings_settings_pb.SetValueResponse>;
}

export interface ISettingsClient {
    getAll(request: settings_settings_pb.GetAllRequest, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.RawData) => void): grpc.ClientUnaryCall;
    getAll(request: settings_settings_pb.GetAllRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.RawData) => void): grpc.ClientUnaryCall;
    getAll(request: settings_settings_pb.GetAllRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.RawData) => void): grpc.ClientUnaryCall;
    merge(request: settings_settings_pb.RawData, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.MergeResponse) => void): grpc.ClientUnaryCall;
    merge(request: settings_settings_pb.RawData, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.MergeResponse) => void): grpc.ClientUnaryCall;
    merge(request: settings_settings_pb.RawData, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.MergeResponse) => void): grpc.ClientUnaryCall;
    getValue(request: settings_settings_pb.GetValueRequest, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.Value) => void): grpc.ClientUnaryCall;
    getValue(request: settings_settings_pb.GetValueRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.Value) => void): grpc.ClientUnaryCall;
    getValue(request: settings_settings_pb.GetValueRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.Value) => void): grpc.ClientUnaryCall;
    setValue(request: settings_settings_pb.Value, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.SetValueResponse) => void): grpc.ClientUnaryCall;
    setValue(request: settings_settings_pb.Value, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.SetValueResponse) => void): grpc.ClientUnaryCall;
    setValue(request: settings_settings_pb.Value, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.SetValueResponse) => void): grpc.ClientUnaryCall;
}

export class SettingsClient extends grpc.Client implements ISettingsClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public getAll(request: settings_settings_pb.GetAllRequest, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.RawData) => void): grpc.ClientUnaryCall;
    public getAll(request: settings_settings_pb.GetAllRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.RawData) => void): grpc.ClientUnaryCall;
    public getAll(request: settings_settings_pb.GetAllRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.RawData) => void): grpc.ClientUnaryCall;
    public merge(request: settings_settings_pb.RawData, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.MergeResponse) => void): grpc.ClientUnaryCall;
    public merge(request: settings_settings_pb.RawData, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.MergeResponse) => void): grpc.ClientUnaryCall;
    public merge(request: settings_settings_pb.RawData, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.MergeResponse) => void): grpc.ClientUnaryCall;
    public getValue(request: settings_settings_pb.GetValueRequest, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.Value) => void): grpc.ClientUnaryCall;
    public getValue(request: settings_settings_pb.GetValueRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.Value) => void): grpc.ClientUnaryCall;
    public getValue(request: settings_settings_pb.GetValueRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.Value) => void): grpc.ClientUnaryCall;
    public setValue(request: settings_settings_pb.Value, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.SetValueResponse) => void): grpc.ClientUnaryCall;
    public setValue(request: settings_settings_pb.Value, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.SetValueResponse) => void): grpc.ClientUnaryCall;
    public setValue(request: settings_settings_pb.Value, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: settings_settings_pb.SetValueResponse) => void): grpc.ClientUnaryCall;
}
