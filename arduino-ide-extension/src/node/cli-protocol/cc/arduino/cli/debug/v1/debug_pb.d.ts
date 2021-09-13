// package: cc.arduino.cli.debug.v1
// file: cc/arduino/cli/debug/v1/debug.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as cc_arduino_cli_commands_v1_common_pb from "../../../../../cc/arduino/cli/commands/v1/common_pb";
import * as cc_arduino_cli_commands_v1_port_pb from "../../../../../cc/arduino/cli/commands/v1/port_pb";

export class DebugRequest extends jspb.Message { 

    hasDebugRequest(): boolean;
    clearDebugRequest(): void;
    getDebugRequest(): DebugConfigRequest | undefined;
    setDebugRequest(value?: DebugConfigRequest): DebugRequest;

    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): DebugRequest;

    getSendInterrupt(): boolean;
    setSendInterrupt(value: boolean): DebugRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DebugRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DebugRequest): DebugRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DebugRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DebugRequest;
    static deserializeBinaryFromReader(message: DebugRequest, reader: jspb.BinaryReader): DebugRequest;
}

export namespace DebugRequest {
    export type AsObject = {
        debugRequest?: DebugConfigRequest.AsObject,
        data: Uint8Array | string,
        sendInterrupt: boolean,
    }
}

export class DebugConfigRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): DebugConfigRequest;

    getFqbn(): string;
    setFqbn(value: string): DebugConfigRequest;

    getSketchPath(): string;
    setSketchPath(value: string): DebugConfigRequest;


    hasPort(): boolean;
    clearPort(): void;
    getPort(): cc_arduino_cli_commands_v1_port_pb.Port | undefined;
    setPort(value?: cc_arduino_cli_commands_v1_port_pb.Port): DebugConfigRequest;

    getInterpreter(): string;
    setInterpreter(value: string): DebugConfigRequest;

    getImportDir(): string;
    setImportDir(value: string): DebugConfigRequest;

    getProgrammer(): string;
    setProgrammer(value: string): DebugConfigRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DebugConfigRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DebugConfigRequest): DebugConfigRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DebugConfigRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DebugConfigRequest;
    static deserializeBinaryFromReader(message: DebugConfigRequest, reader: jspb.BinaryReader): DebugConfigRequest;
}

export namespace DebugConfigRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        fqbn: string,
        sketchPath: string,
        port?: cc_arduino_cli_commands_v1_port_pb.Port.AsObject,
        interpreter: string,
        importDir: string,
        programmer: string,
    }
}

export class DebugResponse extends jspb.Message { 
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): DebugResponse;

    getError(): string;
    setError(value: string): DebugResponse;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DebugResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DebugResponse): DebugResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DebugResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DebugResponse;
    static deserializeBinaryFromReader(message: DebugResponse, reader: jspb.BinaryReader): DebugResponse;
}

export namespace DebugResponse {
    export type AsObject = {
        data: Uint8Array | string,
        error: string,
    }
}

export class GetDebugConfigResponse extends jspb.Message { 
    getExecutable(): string;
    setExecutable(value: string): GetDebugConfigResponse;

    getToolchain(): string;
    setToolchain(value: string): GetDebugConfigResponse;

    getToolchainPath(): string;
    setToolchainPath(value: string): GetDebugConfigResponse;

    getToolchainPrefix(): string;
    setToolchainPrefix(value: string): GetDebugConfigResponse;

    getServer(): string;
    setServer(value: string): GetDebugConfigResponse;

    getServerPath(): string;
    setServerPath(value: string): GetDebugConfigResponse;


    getToolchainConfigurationMap(): jspb.Map<string, string>;
    clearToolchainConfigurationMap(): void;


    getServerConfigurationMap(): jspb.Map<string, string>;
    clearServerConfigurationMap(): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetDebugConfigResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetDebugConfigResponse): GetDebugConfigResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetDebugConfigResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetDebugConfigResponse;
    static deserializeBinaryFromReader(message: GetDebugConfigResponse, reader: jspb.BinaryReader): GetDebugConfigResponse;
}

export namespace GetDebugConfigResponse {
    export type AsObject = {
        executable: string,
        toolchain: string,
        toolchainPath: string,
        toolchainPrefix: string,
        server: string,
        serverPath: string,

        toolchainConfigurationMap: Array<[string, string]>,

        serverConfigurationMap: Array<[string, string]>,
    }
}
