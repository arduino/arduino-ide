// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/compile.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_wrappers_pb from "google-protobuf/google/protobuf/wrappers_pb";
import * as cc_arduino_cli_commands_v1_common_pb from "../../../../../cc/arduino/cli/commands/v1/common_pb";
import * as cc_arduino_cli_commands_v1_lib_pb from "../../../../../cc/arduino/cli/commands/v1/lib_pb";

export class CompileRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): CompileRequest;

    getFqbn(): string;
    setFqbn(value: string): CompileRequest;

    getSketchPath(): string;
    setSketchPath(value: string): CompileRequest;

    getShowProperties(): boolean;
    setShowProperties(value: boolean): CompileRequest;

    getPreprocess(): boolean;
    setPreprocess(value: boolean): CompileRequest;

    getBuildCachePath(): string;
    setBuildCachePath(value: string): CompileRequest;

    getBuildPath(): string;
    setBuildPath(value: string): CompileRequest;

    clearBuildPropertiesList(): void;
    getBuildPropertiesList(): Array<string>;
    setBuildPropertiesList(value: Array<string>): CompileRequest;
    addBuildProperties(value: string, index?: number): string;

    getWarnings(): string;
    setWarnings(value: string): CompileRequest;

    getVerbose(): boolean;
    setVerbose(value: boolean): CompileRequest;

    getQuiet(): boolean;
    setQuiet(value: boolean): CompileRequest;

    getJobs(): number;
    setJobs(value: number): CompileRequest;

    clearLibrariesList(): void;
    getLibrariesList(): Array<string>;
    setLibrariesList(value: Array<string>): CompileRequest;
    addLibraries(value: string, index?: number): string;

    getOptimizeForDebug(): boolean;
    setOptimizeForDebug(value: boolean): CompileRequest;

    getExportDir(): string;
    setExportDir(value: string): CompileRequest;

    getClean(): boolean;
    setClean(value: boolean): CompileRequest;

    getCreateCompilationDatabaseOnly(): boolean;
    setCreateCompilationDatabaseOnly(value: boolean): CompileRequest;


    getSourceOverrideMap(): jspb.Map<string, string>;
    clearSourceOverrideMap(): void;


    hasExportBinaries(): boolean;
    clearExportBinaries(): void;
    getExportBinaries(): google_protobuf_wrappers_pb.BoolValue | undefined;
    setExportBinaries(value?: google_protobuf_wrappers_pb.BoolValue): CompileRequest;

    clearLibraryList(): void;
    getLibraryList(): Array<string>;
    setLibraryList(value: Array<string>): CompileRequest;
    addLibrary(value: string, index?: number): string;

    getKeysKeychain(): string;
    setKeysKeychain(value: string): CompileRequest;

    getSignKey(): string;
    setSignKey(value: string): CompileRequest;

    getEncryptKey(): string;
    setEncryptKey(value: string): CompileRequest;

    getSkipLibrariesDiscovery(): boolean;
    setSkipLibrariesDiscovery(value: boolean): CompileRequest;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CompileRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CompileRequest): CompileRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CompileRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CompileRequest;
    static deserializeBinaryFromReader(message: CompileRequest, reader: jspb.BinaryReader): CompileRequest;
}

export namespace CompileRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        fqbn: string,
        sketchPath: string,
        showProperties: boolean,
        preprocess: boolean,
        buildCachePath: string,
        buildPath: string,
        buildPropertiesList: Array<string>,
        warnings: string,
        verbose: boolean,
        quiet: boolean,
        jobs: number,
        librariesList: Array<string>,
        optimizeForDebug: boolean,
        exportDir: string,
        clean: boolean,
        createCompilationDatabaseOnly: boolean,

        sourceOverrideMap: Array<[string, string]>,
        exportBinaries?: google_protobuf_wrappers_pb.BoolValue.AsObject,
        libraryList: Array<string>,
        keysKeychain: string,
        signKey: string,
        encryptKey: string,
        skipLibrariesDiscovery: boolean,
    }
}

export class CompileResponse extends jspb.Message { 
    getOutStream(): Uint8Array | string;
    getOutStream_asU8(): Uint8Array;
    getOutStream_asB64(): string;
    setOutStream(value: Uint8Array | string): CompileResponse;

    getErrStream(): Uint8Array | string;
    getErrStream_asU8(): Uint8Array;
    getErrStream_asB64(): string;
    setErrStream(value: Uint8Array | string): CompileResponse;

    getBuildPath(): string;
    setBuildPath(value: string): CompileResponse;

    clearUsedLibrariesList(): void;
    getUsedLibrariesList(): Array<cc_arduino_cli_commands_v1_lib_pb.Library>;
    setUsedLibrariesList(value: Array<cc_arduino_cli_commands_v1_lib_pb.Library>): CompileResponse;
    addUsedLibraries(value?: cc_arduino_cli_commands_v1_lib_pb.Library, index?: number): cc_arduino_cli_commands_v1_lib_pb.Library;

    clearExecutableSectionsSizeList(): void;
    getExecutableSectionsSizeList(): Array<ExecutableSectionSize>;
    setExecutableSectionsSizeList(value: Array<ExecutableSectionSize>): CompileResponse;
    addExecutableSectionsSize(value?: ExecutableSectionSize, index?: number): ExecutableSectionSize;


    hasBoardPlatform(): boolean;
    clearBoardPlatform(): void;
    getBoardPlatform(): cc_arduino_cli_commands_v1_common_pb.InstalledPlatformReference | undefined;
    setBoardPlatform(value?: cc_arduino_cli_commands_v1_common_pb.InstalledPlatformReference): CompileResponse;


    hasBuildPlatform(): boolean;
    clearBuildPlatform(): void;
    getBuildPlatform(): cc_arduino_cli_commands_v1_common_pb.InstalledPlatformReference | undefined;
    setBuildPlatform(value?: cc_arduino_cli_commands_v1_common_pb.InstalledPlatformReference): CompileResponse;


    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
    setProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): CompileResponse;

    clearBuildPropertiesList(): void;
    getBuildPropertiesList(): Array<string>;
    setBuildPropertiesList(value: Array<string>): CompileResponse;
    addBuildProperties(value: string, index?: number): string;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CompileResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CompileResponse): CompileResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CompileResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CompileResponse;
    static deserializeBinaryFromReader(message: CompileResponse, reader: jspb.BinaryReader): CompileResponse;
}

export namespace CompileResponse {
    export type AsObject = {
        outStream: Uint8Array | string,
        errStream: Uint8Array | string,
        buildPath: string,
        usedLibrariesList: Array<cc_arduino_cli_commands_v1_lib_pb.Library.AsObject>,
        executableSectionsSizeList: Array<ExecutableSectionSize.AsObject>,
        boardPlatform?: cc_arduino_cli_commands_v1_common_pb.InstalledPlatformReference.AsObject,
        buildPlatform?: cc_arduino_cli_commands_v1_common_pb.InstalledPlatformReference.AsObject,
        progress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
        buildPropertiesList: Array<string>,
    }
}

export class ExecutableSectionSize extends jspb.Message { 
    getName(): string;
    setName(value: string): ExecutableSectionSize;

    getSize(): number;
    setSize(value: number): ExecutableSectionSize;

    getMaxSize(): number;
    setMaxSize(value: number): ExecutableSectionSize;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExecutableSectionSize.AsObject;
    static toObject(includeInstance: boolean, msg: ExecutableSectionSize): ExecutableSectionSize.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExecutableSectionSize, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExecutableSectionSize;
    static deserializeBinaryFromReader(message: ExecutableSectionSize, reader: jspb.BinaryReader): ExecutableSectionSize;
}

export namespace ExecutableSectionSize {
    export type AsObject = {
        name: string,
        size: number,
        maxSize: number,
    }
}
