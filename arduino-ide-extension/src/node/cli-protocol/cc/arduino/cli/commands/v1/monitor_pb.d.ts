// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/monitor.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as cc_arduino_cli_commands_v1_common_pb from "../../../../../cc/arduino/cli/commands/v1/common_pb";
import * as cc_arduino_cli_commands_v1_port_pb from "../../../../../cc/arduino/cli/commands/v1/port_pb";

export class MonitorRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): MonitorRequest;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): cc_arduino_cli_commands_v1_port_pb.Port | undefined;
    setPort(value?: cc_arduino_cli_commands_v1_port_pb.Port): MonitorRequest;
    getFqbn(): string;
    setFqbn(value: string): MonitorRequest;
    getTxData(): Uint8Array | string;
    getTxData_asU8(): Uint8Array;
    getTxData_asB64(): string;
    setTxData(value: Uint8Array | string): MonitorRequest;

    hasPortConfiguration(): boolean;
    clearPortConfiguration(): void;
    getPortConfiguration(): MonitorPortConfiguration | undefined;
    setPortConfiguration(value?: MonitorPortConfiguration): MonitorRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MonitorRequest.AsObject;
    static toObject(includeInstance: boolean, msg: MonitorRequest): MonitorRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MonitorRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MonitorRequest;
    static deserializeBinaryFromReader(message: MonitorRequest, reader: jspb.BinaryReader): MonitorRequest;
}

export namespace MonitorRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        port?: cc_arduino_cli_commands_v1_port_pb.Port.AsObject,
        fqbn: string,
        txData: Uint8Array | string,
        portConfiguration?: MonitorPortConfiguration.AsObject,
    }
}

export class MonitorPortConfiguration extends jspb.Message { 
    clearSettingsList(): void;
    getSettingsList(): Array<MonitorPortSetting>;
    setSettingsList(value: Array<MonitorPortSetting>): MonitorPortConfiguration;
    addSettings(value?: MonitorPortSetting, index?: number): MonitorPortSetting;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MonitorPortConfiguration.AsObject;
    static toObject(includeInstance: boolean, msg: MonitorPortConfiguration): MonitorPortConfiguration.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MonitorPortConfiguration, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MonitorPortConfiguration;
    static deserializeBinaryFromReader(message: MonitorPortConfiguration, reader: jspb.BinaryReader): MonitorPortConfiguration;
}

export namespace MonitorPortConfiguration {
    export type AsObject = {
        settingsList: Array<MonitorPortSetting.AsObject>,
    }
}

export class MonitorResponse extends jspb.Message { 
    getError(): string;
    setError(value: string): MonitorResponse;
    getRxData(): Uint8Array | string;
    getRxData_asU8(): Uint8Array;
    getRxData_asB64(): string;
    setRxData(value: Uint8Array | string): MonitorResponse;
    clearAppliedSettingsList(): void;
    getAppliedSettingsList(): Array<MonitorPortSetting>;
    setAppliedSettingsList(value: Array<MonitorPortSetting>): MonitorResponse;
    addAppliedSettings(value?: MonitorPortSetting, index?: number): MonitorPortSetting;
    getSuccess(): boolean;
    setSuccess(value: boolean): MonitorResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MonitorResponse.AsObject;
    static toObject(includeInstance: boolean, msg: MonitorResponse): MonitorResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MonitorResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MonitorResponse;
    static deserializeBinaryFromReader(message: MonitorResponse, reader: jspb.BinaryReader): MonitorResponse;
}

export namespace MonitorResponse {
    export type AsObject = {
        error: string,
        rxData: Uint8Array | string,
        appliedSettingsList: Array<MonitorPortSetting.AsObject>,
        success: boolean,
    }
}

export class MonitorPortSetting extends jspb.Message { 
    getSettingId(): string;
    setSettingId(value: string): MonitorPortSetting;
    getValue(): string;
    setValue(value: string): MonitorPortSetting;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MonitorPortSetting.AsObject;
    static toObject(includeInstance: boolean, msg: MonitorPortSetting): MonitorPortSetting.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MonitorPortSetting, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MonitorPortSetting;
    static deserializeBinaryFromReader(message: MonitorPortSetting, reader: jspb.BinaryReader): MonitorPortSetting;
}

export namespace MonitorPortSetting {
    export type AsObject = {
        settingId: string,
        value: string,
    }
}

export class EnumerateMonitorPortSettingsRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): EnumerateMonitorPortSettingsRequest;
    getPortProtocol(): string;
    setPortProtocol(value: string): EnumerateMonitorPortSettingsRequest;
    getFqbn(): string;
    setFqbn(value: string): EnumerateMonitorPortSettingsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnumerateMonitorPortSettingsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: EnumerateMonitorPortSettingsRequest): EnumerateMonitorPortSettingsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnumerateMonitorPortSettingsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnumerateMonitorPortSettingsRequest;
    static deserializeBinaryFromReader(message: EnumerateMonitorPortSettingsRequest, reader: jspb.BinaryReader): EnumerateMonitorPortSettingsRequest;
}

export namespace EnumerateMonitorPortSettingsRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        portProtocol: string,
        fqbn: string,
    }
}

export class EnumerateMonitorPortSettingsResponse extends jspb.Message { 
    clearSettingsList(): void;
    getSettingsList(): Array<MonitorPortSettingDescriptor>;
    setSettingsList(value: Array<MonitorPortSettingDescriptor>): EnumerateMonitorPortSettingsResponse;
    addSettings(value?: MonitorPortSettingDescriptor, index?: number): MonitorPortSettingDescriptor;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnumerateMonitorPortSettingsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: EnumerateMonitorPortSettingsResponse): EnumerateMonitorPortSettingsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnumerateMonitorPortSettingsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnumerateMonitorPortSettingsResponse;
    static deserializeBinaryFromReader(message: EnumerateMonitorPortSettingsResponse, reader: jspb.BinaryReader): EnumerateMonitorPortSettingsResponse;
}

export namespace EnumerateMonitorPortSettingsResponse {
    export type AsObject = {
        settingsList: Array<MonitorPortSettingDescriptor.AsObject>,
    }
}

export class MonitorPortSettingDescriptor extends jspb.Message { 
    getSettingId(): string;
    setSettingId(value: string): MonitorPortSettingDescriptor;
    getLabel(): string;
    setLabel(value: string): MonitorPortSettingDescriptor;
    getType(): string;
    setType(value: string): MonitorPortSettingDescriptor;
    clearEnumValuesList(): void;
    getEnumValuesList(): Array<string>;
    setEnumValuesList(value: Array<string>): MonitorPortSettingDescriptor;
    addEnumValues(value: string, index?: number): string;
    getValue(): string;
    setValue(value: string): MonitorPortSettingDescriptor;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MonitorPortSettingDescriptor.AsObject;
    static toObject(includeInstance: boolean, msg: MonitorPortSettingDescriptor): MonitorPortSettingDescriptor.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MonitorPortSettingDescriptor, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MonitorPortSettingDescriptor;
    static deserializeBinaryFromReader(message: MonitorPortSettingDescriptor, reader: jspb.BinaryReader): MonitorPortSettingDescriptor;
}

export namespace MonitorPortSettingDescriptor {
    export type AsObject = {
        settingId: string,
        label: string,
        type: string,
        enumValuesList: Array<string>,
        value: string,
    }
}
