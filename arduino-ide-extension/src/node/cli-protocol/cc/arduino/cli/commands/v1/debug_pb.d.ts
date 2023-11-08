// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/debug.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as cc_arduino_cli_commands_v1_common_pb from "../../../../../cc/arduino/cli/commands/v1/common_pb";
import * as cc_arduino_cli_commands_v1_port_pb from "../../../../../cc/arduino/cli/commands/v1/port_pb";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";

export class DebugRequest extends jspb.Message { 

    hasDebugRequest(): boolean;
    clearDebugRequest(): void;
    getDebugRequest(): GetDebugConfigRequest | undefined;
    setDebugRequest(value?: GetDebugConfigRequest): DebugRequest;
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
        debugRequest?: GetDebugConfigRequest.AsObject,
        data: Uint8Array | string,
        sendInterrupt: boolean,
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

export class IsDebugSupportedRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): IsDebugSupportedRequest;
    getFqbn(): string;
    setFqbn(value: string): IsDebugSupportedRequest;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): cc_arduino_cli_commands_v1_port_pb.Port | undefined;
    setPort(value?: cc_arduino_cli_commands_v1_port_pb.Port): IsDebugSupportedRequest;
    getInterpreter(): string;
    setInterpreter(value: string): IsDebugSupportedRequest;
    getProgrammer(): string;
    setProgrammer(value: string): IsDebugSupportedRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IsDebugSupportedRequest.AsObject;
    static toObject(includeInstance: boolean, msg: IsDebugSupportedRequest): IsDebugSupportedRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IsDebugSupportedRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IsDebugSupportedRequest;
    static deserializeBinaryFromReader(message: IsDebugSupportedRequest, reader: jspb.BinaryReader): IsDebugSupportedRequest;
}

export namespace IsDebugSupportedRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        fqbn: string,
        port?: cc_arduino_cli_commands_v1_port_pb.Port.AsObject,
        interpreter: string,
        programmer: string,
    }
}

export class IsDebugSupportedResponse extends jspb.Message { 
    getDebuggingSupported(): boolean;
    setDebuggingSupported(value: boolean): IsDebugSupportedResponse;
    getDebugFqbn(): string;
    setDebugFqbn(value: string): IsDebugSupportedResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IsDebugSupportedResponse.AsObject;
    static toObject(includeInstance: boolean, msg: IsDebugSupportedResponse): IsDebugSupportedResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IsDebugSupportedResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IsDebugSupportedResponse;
    static deserializeBinaryFromReader(message: IsDebugSupportedResponse, reader: jspb.BinaryReader): IsDebugSupportedResponse;
}

export namespace IsDebugSupportedResponse {
    export type AsObject = {
        debuggingSupported: boolean,
        debugFqbn: string,
    }
}

export class GetDebugConfigRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): GetDebugConfigRequest;
    getFqbn(): string;
    setFqbn(value: string): GetDebugConfigRequest;
    getSketchPath(): string;
    setSketchPath(value: string): GetDebugConfigRequest;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): cc_arduino_cli_commands_v1_port_pb.Port | undefined;
    setPort(value?: cc_arduino_cli_commands_v1_port_pb.Port): GetDebugConfigRequest;
    getInterpreter(): string;
    setInterpreter(value: string): GetDebugConfigRequest;
    getImportDir(): string;
    setImportDir(value: string): GetDebugConfigRequest;
    getProgrammer(): string;
    setProgrammer(value: string): GetDebugConfigRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetDebugConfigRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetDebugConfigRequest): GetDebugConfigRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetDebugConfigRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetDebugConfigRequest;
    static deserializeBinaryFromReader(message: GetDebugConfigRequest, reader: jspb.BinaryReader): GetDebugConfigRequest;
}

export namespace GetDebugConfigRequest {
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

    hasToolchainConfiguration(): boolean;
    clearToolchainConfiguration(): void;
    getToolchainConfiguration(): google_protobuf_any_pb.Any | undefined;
    setToolchainConfiguration(value?: google_protobuf_any_pb.Any): GetDebugConfigResponse;

    hasServerConfiguration(): boolean;
    clearServerConfiguration(): void;
    getServerConfiguration(): google_protobuf_any_pb.Any | undefined;
    setServerConfiguration(value?: google_protobuf_any_pb.Any): GetDebugConfigResponse;

    getCustomConfigsMap(): jspb.Map<string, string>;
    clearCustomConfigsMap(): void;
    getSvdFile(): string;
    setSvdFile(value: string): GetDebugConfigResponse;
    getProgrammer(): string;
    setProgrammer(value: string): GetDebugConfigResponse;

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
        toolchainConfiguration?: google_protobuf_any_pb.Any.AsObject,
        serverConfiguration?: google_protobuf_any_pb.Any.AsObject,

        customConfigsMap: Array<[string, string]>,
        svdFile: string,
        programmer: string,
    }
}

export class DebugGCCToolchainConfiguration extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DebugGCCToolchainConfiguration.AsObject;
    static toObject(includeInstance: boolean, msg: DebugGCCToolchainConfiguration): DebugGCCToolchainConfiguration.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DebugGCCToolchainConfiguration, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DebugGCCToolchainConfiguration;
    static deserializeBinaryFromReader(message: DebugGCCToolchainConfiguration, reader: jspb.BinaryReader): DebugGCCToolchainConfiguration;
}

export namespace DebugGCCToolchainConfiguration {
    export type AsObject = {
    }
}

export class DebugOpenOCDServerConfiguration extends jspb.Message { 
    getPath(): string;
    setPath(value: string): DebugOpenOCDServerConfiguration;
    getScriptsDir(): string;
    setScriptsDir(value: string): DebugOpenOCDServerConfiguration;
    clearScriptsList(): void;
    getScriptsList(): Array<string>;
    setScriptsList(value: Array<string>): DebugOpenOCDServerConfiguration;
    addScripts(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DebugOpenOCDServerConfiguration.AsObject;
    static toObject(includeInstance: boolean, msg: DebugOpenOCDServerConfiguration): DebugOpenOCDServerConfiguration.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DebugOpenOCDServerConfiguration, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DebugOpenOCDServerConfiguration;
    static deserializeBinaryFromReader(message: DebugOpenOCDServerConfiguration, reader: jspb.BinaryReader): DebugOpenOCDServerConfiguration;
}

export namespace DebugOpenOCDServerConfiguration {
    export type AsObject = {
        path: string,
        scriptsDir: string,
        scriptsList: Array<string>,
    }
}
