// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/monitor.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as cc_arduino_cli_commands_v1_common_pb from "../../../../../cc/arduino/cli/commands/v1/common_pb";
import * as cc_arduino_cli_commands_v1_port_pb from "../../../../../cc/arduino/cli/commands/v1/port_pb";

export class MonitorRequest extends jspb.Message { 

    hasOpenRequest(): boolean;
    clearOpenRequest(): void;
    getOpenRequest(): MonitorPortOpenRequest | undefined;
    setOpenRequest(value?: MonitorPortOpenRequest): MonitorRequest;

    hasTxData(): boolean;
    clearTxData(): void;
    getTxData(): Uint8Array | string;
    getTxData_asU8(): Uint8Array;
    getTxData_asB64(): string;
    setTxData(value: Uint8Array | string): MonitorRequest;

    hasUpdatedConfiguration(): boolean;
    clearUpdatedConfiguration(): void;
    getUpdatedConfiguration(): cc_arduino_cli_commands_v1_common_pb.MonitorPortConfiguration | undefined;
    setUpdatedConfiguration(value?: cc_arduino_cli_commands_v1_common_pb.MonitorPortConfiguration): MonitorRequest;

    hasClose(): boolean;
    clearClose(): void;
    getClose(): boolean;
    setClose(value: boolean): MonitorRequest;

    getMessageCase(): MonitorRequest.MessageCase;

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
        openRequest?: MonitorPortOpenRequest.AsObject,
        txData: Uint8Array | string,
        updatedConfiguration?: cc_arduino_cli_commands_v1_common_pb.MonitorPortConfiguration.AsObject,
        close: boolean,
    }

    export enum MessageCase {
        MESSAGE_NOT_SET = 0,
        OPEN_REQUEST = 1,
        TX_DATA = 2,
        UPDATED_CONFIGURATION = 3,
        CLOSE = 4,
    }

}

export class MonitorPortOpenRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): MonitorPortOpenRequest;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): cc_arduino_cli_commands_v1_port_pb.Port | undefined;
    setPort(value?: cc_arduino_cli_commands_v1_port_pb.Port): MonitorPortOpenRequest;
    getFqbn(): string;
    setFqbn(value: string): MonitorPortOpenRequest;

    hasPortConfiguration(): boolean;
    clearPortConfiguration(): void;
    getPortConfiguration(): cc_arduino_cli_commands_v1_common_pb.MonitorPortConfiguration | undefined;
    setPortConfiguration(value?: cc_arduino_cli_commands_v1_common_pb.MonitorPortConfiguration): MonitorPortOpenRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MonitorPortOpenRequest.AsObject;
    static toObject(includeInstance: boolean, msg: MonitorPortOpenRequest): MonitorPortOpenRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MonitorPortOpenRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MonitorPortOpenRequest;
    static deserializeBinaryFromReader(message: MonitorPortOpenRequest, reader: jspb.BinaryReader): MonitorPortOpenRequest;
}

export namespace MonitorPortOpenRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        port?: cc_arduino_cli_commands_v1_port_pb.Port.AsObject,
        fqbn: string,
        portConfiguration?: cc_arduino_cli_commands_v1_common_pb.MonitorPortConfiguration.AsObject,
    }
}

export class MonitorResponse extends jspb.Message { 

    hasError(): boolean;
    clearError(): void;
    getError(): string;
    setError(value: string): MonitorResponse;

    hasRxData(): boolean;
    clearRxData(): void;
    getRxData(): Uint8Array | string;
    getRxData_asU8(): Uint8Array;
    getRxData_asB64(): string;
    setRxData(value: Uint8Array | string): MonitorResponse;

    hasAppliedSettings(): boolean;
    clearAppliedSettings(): void;
    getAppliedSettings(): cc_arduino_cli_commands_v1_common_pb.MonitorPortConfiguration | undefined;
    setAppliedSettings(value?: cc_arduino_cli_commands_v1_common_pb.MonitorPortConfiguration): MonitorResponse;

    hasSuccess(): boolean;
    clearSuccess(): void;
    getSuccess(): boolean;
    setSuccess(value: boolean): MonitorResponse;

    getMessageCase(): MonitorResponse.MessageCase;

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
        appliedSettings?: cc_arduino_cli_commands_v1_common_pb.MonitorPortConfiguration.AsObject,
        success: boolean,
    }

    export enum MessageCase {
        MESSAGE_NOT_SET = 0,
        ERROR = 1,
        RX_DATA = 2,
        APPLIED_SETTINGS = 3,
        SUCCESS = 4,
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
