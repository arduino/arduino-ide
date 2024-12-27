// package: cc.arduino.cli.settings.v1
// file: cc/arduino/cli/settings/v1/settings.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as cc_arduino_cli_settings_v1_settings_pb from "../../../../../cc/arduino/cli/settings/v1/settings_pb";

interface ISettingsServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getAll: ISettingsServiceService_IGetAll;
    merge: ISettingsServiceService_IMerge;
    getValue: ISettingsServiceService_IGetValue;
    setValue: ISettingsServiceService_ISetValue;
    write: ISettingsServiceService_IWrite;
    delete: ISettingsServiceService_IDelete;
}

interface ISettingsServiceService_IGetAll extends grpc.MethodDefinition<cc_arduino_cli_settings_v1_settings_pb.GetAllRequest, cc_arduino_cli_settings_v1_settings_pb.GetAllResponse> {
    path: "/cc.arduino.cli.settings.v1.SettingsService/GetAll";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cc_arduino_cli_settings_v1_settings_pb.GetAllRequest>;
    requestDeserialize: grpc.deserialize<cc_arduino_cli_settings_v1_settings_pb.GetAllRequest>;
    responseSerialize: grpc.serialize<cc_arduino_cli_settings_v1_settings_pb.GetAllResponse>;
    responseDeserialize: grpc.deserialize<cc_arduino_cli_settings_v1_settings_pb.GetAllResponse>;
}
interface ISettingsServiceService_IMerge extends grpc.MethodDefinition<cc_arduino_cli_settings_v1_settings_pb.MergeRequest, cc_arduino_cli_settings_v1_settings_pb.MergeResponse> {
    path: "/cc.arduino.cli.settings.v1.SettingsService/Merge";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cc_arduino_cli_settings_v1_settings_pb.MergeRequest>;
    requestDeserialize: grpc.deserialize<cc_arduino_cli_settings_v1_settings_pb.MergeRequest>;
    responseSerialize: grpc.serialize<cc_arduino_cli_settings_v1_settings_pb.MergeResponse>;
    responseDeserialize: grpc.deserialize<cc_arduino_cli_settings_v1_settings_pb.MergeResponse>;
}
interface ISettingsServiceService_IGetValue extends grpc.MethodDefinition<cc_arduino_cli_settings_v1_settings_pb.GetValueRequest, cc_arduino_cli_settings_v1_settings_pb.GetValueResponse> {
    path: "/cc.arduino.cli.settings.v1.SettingsService/GetValue";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cc_arduino_cli_settings_v1_settings_pb.GetValueRequest>;
    requestDeserialize: grpc.deserialize<cc_arduino_cli_settings_v1_settings_pb.GetValueRequest>;
    responseSerialize: grpc.serialize<cc_arduino_cli_settings_v1_settings_pb.GetValueResponse>;
    responseDeserialize: grpc.deserialize<cc_arduino_cli_settings_v1_settings_pb.GetValueResponse>;
}
interface ISettingsServiceService_ISetValue extends grpc.MethodDefinition<cc_arduino_cli_settings_v1_settings_pb.SetValueRequest, cc_arduino_cli_settings_v1_settings_pb.SetValueResponse> {
    path: "/cc.arduino.cli.settings.v1.SettingsService/SetValue";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cc_arduino_cli_settings_v1_settings_pb.SetValueRequest>;
    requestDeserialize: grpc.deserialize<cc_arduino_cli_settings_v1_settings_pb.SetValueRequest>;
    responseSerialize: grpc.serialize<cc_arduino_cli_settings_v1_settings_pb.SetValueResponse>;
    responseDeserialize: grpc.deserialize<cc_arduino_cli_settings_v1_settings_pb.SetValueResponse>;
}
interface ISettingsServiceService_IWrite extends grpc.MethodDefinition<cc_arduino_cli_settings_v1_settings_pb.WriteRequest, cc_arduino_cli_settings_v1_settings_pb.WriteResponse> {
    path: "/cc.arduino.cli.settings.v1.SettingsService/Write";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cc_arduino_cli_settings_v1_settings_pb.WriteRequest>;
    requestDeserialize: grpc.deserialize<cc_arduino_cli_settings_v1_settings_pb.WriteRequest>;
    responseSerialize: grpc.serialize<cc_arduino_cli_settings_v1_settings_pb.WriteResponse>;
    responseDeserialize: grpc.deserialize<cc_arduino_cli_settings_v1_settings_pb.WriteResponse>;
}
interface ISettingsServiceService_IDelete extends grpc.MethodDefinition<cc_arduino_cli_settings_v1_settings_pb.DeleteRequest, cc_arduino_cli_settings_v1_settings_pb.DeleteResponse> {
    path: "/cc.arduino.cli.settings.v1.SettingsService/Delete";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cc_arduino_cli_settings_v1_settings_pb.DeleteRequest>;
    requestDeserialize: grpc.deserialize<cc_arduino_cli_settings_v1_settings_pb.DeleteRequest>;
    responseSerialize: grpc.serialize<cc_arduino_cli_settings_v1_settings_pb.DeleteResponse>;
    responseDeserialize: grpc.deserialize<cc_arduino_cli_settings_v1_settings_pb.DeleteResponse>;
}

export const SettingsServiceService: ISettingsServiceService;

export interface ISettingsServiceServer extends grpc.UntypedServiceImplementation {
    getAll: grpc.handleUnaryCall<cc_arduino_cli_settings_v1_settings_pb.GetAllRequest, cc_arduino_cli_settings_v1_settings_pb.GetAllResponse>;
    merge: grpc.handleUnaryCall<cc_arduino_cli_settings_v1_settings_pb.MergeRequest, cc_arduino_cli_settings_v1_settings_pb.MergeResponse>;
    getValue: grpc.handleUnaryCall<cc_arduino_cli_settings_v1_settings_pb.GetValueRequest, cc_arduino_cli_settings_v1_settings_pb.GetValueResponse>;
    setValue: grpc.handleUnaryCall<cc_arduino_cli_settings_v1_settings_pb.SetValueRequest, cc_arduino_cli_settings_v1_settings_pb.SetValueResponse>;
    write: grpc.handleUnaryCall<cc_arduino_cli_settings_v1_settings_pb.WriteRequest, cc_arduino_cli_settings_v1_settings_pb.WriteResponse>;
    delete: grpc.handleUnaryCall<cc_arduino_cli_settings_v1_settings_pb.DeleteRequest, cc_arduino_cli_settings_v1_settings_pb.DeleteResponse>;
}

export interface ISettingsServiceClient {
    getAll(request: cc_arduino_cli_settings_v1_settings_pb.GetAllRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.GetAllResponse) => void): grpc.ClientUnaryCall;
    getAll(request: cc_arduino_cli_settings_v1_settings_pb.GetAllRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.GetAllResponse) => void): grpc.ClientUnaryCall;
    getAll(request: cc_arduino_cli_settings_v1_settings_pb.GetAllRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.GetAllResponse) => void): grpc.ClientUnaryCall;
    merge(request: cc_arduino_cli_settings_v1_settings_pb.MergeRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.MergeResponse) => void): grpc.ClientUnaryCall;
    merge(request: cc_arduino_cli_settings_v1_settings_pb.MergeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.MergeResponse) => void): grpc.ClientUnaryCall;
    merge(request: cc_arduino_cli_settings_v1_settings_pb.MergeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.MergeResponse) => void): grpc.ClientUnaryCall;
    getValue(request: cc_arduino_cli_settings_v1_settings_pb.GetValueRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.GetValueResponse) => void): grpc.ClientUnaryCall;
    getValue(request: cc_arduino_cli_settings_v1_settings_pb.GetValueRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.GetValueResponse) => void): grpc.ClientUnaryCall;
    getValue(request: cc_arduino_cli_settings_v1_settings_pb.GetValueRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.GetValueResponse) => void): grpc.ClientUnaryCall;
    setValue(request: cc_arduino_cli_settings_v1_settings_pb.SetValueRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.SetValueResponse) => void): grpc.ClientUnaryCall;
    setValue(request: cc_arduino_cli_settings_v1_settings_pb.SetValueRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.SetValueResponse) => void): grpc.ClientUnaryCall;
    setValue(request: cc_arduino_cli_settings_v1_settings_pb.SetValueRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.SetValueResponse) => void): grpc.ClientUnaryCall;
    write(request: cc_arduino_cli_settings_v1_settings_pb.WriteRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.WriteResponse) => void): grpc.ClientUnaryCall;
    write(request: cc_arduino_cli_settings_v1_settings_pb.WriteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.WriteResponse) => void): grpc.ClientUnaryCall;
    write(request: cc_arduino_cli_settings_v1_settings_pb.WriteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.WriteResponse) => void): grpc.ClientUnaryCall;
    delete(request: cc_arduino_cli_settings_v1_settings_pb.DeleteRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.DeleteResponse) => void): grpc.ClientUnaryCall;
    delete(request: cc_arduino_cli_settings_v1_settings_pb.DeleteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.DeleteResponse) => void): grpc.ClientUnaryCall;
    delete(request: cc_arduino_cli_settings_v1_settings_pb.DeleteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.DeleteResponse) => void): grpc.ClientUnaryCall;
}

export class SettingsServiceClient extends grpc.Client implements ISettingsServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getAll(request: cc_arduino_cli_settings_v1_settings_pb.GetAllRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.GetAllResponse) => void): grpc.ClientUnaryCall;
    public getAll(request: cc_arduino_cli_settings_v1_settings_pb.GetAllRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.GetAllResponse) => void): grpc.ClientUnaryCall;
    public getAll(request: cc_arduino_cli_settings_v1_settings_pb.GetAllRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.GetAllResponse) => void): grpc.ClientUnaryCall;
    public merge(request: cc_arduino_cli_settings_v1_settings_pb.MergeRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.MergeResponse) => void): grpc.ClientUnaryCall;
    public merge(request: cc_arduino_cli_settings_v1_settings_pb.MergeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.MergeResponse) => void): grpc.ClientUnaryCall;
    public merge(request: cc_arduino_cli_settings_v1_settings_pb.MergeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.MergeResponse) => void): grpc.ClientUnaryCall;
    public getValue(request: cc_arduino_cli_settings_v1_settings_pb.GetValueRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.GetValueResponse) => void): grpc.ClientUnaryCall;
    public getValue(request: cc_arduino_cli_settings_v1_settings_pb.GetValueRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.GetValueResponse) => void): grpc.ClientUnaryCall;
    public getValue(request: cc_arduino_cli_settings_v1_settings_pb.GetValueRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.GetValueResponse) => void): grpc.ClientUnaryCall;
    public setValue(request: cc_arduino_cli_settings_v1_settings_pb.SetValueRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.SetValueResponse) => void): grpc.ClientUnaryCall;
    public setValue(request: cc_arduino_cli_settings_v1_settings_pb.SetValueRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.SetValueResponse) => void): grpc.ClientUnaryCall;
    public setValue(request: cc_arduino_cli_settings_v1_settings_pb.SetValueRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.SetValueResponse) => void): grpc.ClientUnaryCall;
    public write(request: cc_arduino_cli_settings_v1_settings_pb.WriteRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.WriteResponse) => void): grpc.ClientUnaryCall;
    public write(request: cc_arduino_cli_settings_v1_settings_pb.WriteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.WriteResponse) => void): grpc.ClientUnaryCall;
    public write(request: cc_arduino_cli_settings_v1_settings_pb.WriteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.WriteResponse) => void): grpc.ClientUnaryCall;
    public delete(request: cc_arduino_cli_settings_v1_settings_pb.DeleteRequest, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.DeleteResponse) => void): grpc.ClientUnaryCall;
    public delete(request: cc_arduino_cli_settings_v1_settings_pb.DeleteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.DeleteResponse) => void): grpc.ClientUnaryCall;
    public delete(request: cc_arduino_cli_settings_v1_settings_pb.DeleteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cc_arduino_cli_settings_v1_settings_pb.DeleteResponse) => void): grpc.ClientUnaryCall;
}
