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
    getDoNotExpandBuildProperties(): boolean;
    setDoNotExpandBuildProperties(value: boolean): CompileRequest;

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
        doNotExpandBuildProperties: boolean,
    }
}

export class CompileResponse extends jspb.Message { 

    hasOutStream(): boolean;
    clearOutStream(): void;
    getOutStream(): Uint8Array | string;
    getOutStream_asU8(): Uint8Array;
    getOutStream_asB64(): string;
    setOutStream(value: Uint8Array | string): CompileResponse;

    hasErrStream(): boolean;
    clearErrStream(): void;
    getErrStream(): Uint8Array | string;
    getErrStream_asU8(): Uint8Array;
    getErrStream_asB64(): string;
    setErrStream(value: Uint8Array | string): CompileResponse;

    hasProgress(): boolean;
    clearProgress(): void;
    getProgress(): cc_arduino_cli_commands_v1_common_pb.TaskProgress | undefined;
    setProgress(value?: cc_arduino_cli_commands_v1_common_pb.TaskProgress): CompileResponse;

    hasResult(): boolean;
    clearResult(): void;
    getResult(): BuilderResult | undefined;
    setResult(value?: BuilderResult): CompileResponse;

    getMessageCase(): CompileResponse.MessageCase;

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
        progress?: cc_arduino_cli_commands_v1_common_pb.TaskProgress.AsObject,
        result?: BuilderResult.AsObject,
    }

    export enum MessageCase {
        MESSAGE_NOT_SET = 0,
        OUT_STREAM = 1,
        ERR_STREAM = 2,
        PROGRESS = 3,
        RESULT = 4,
    }

}

export class BuilderResult extends jspb.Message { 
    getBuildPath(): string;
    setBuildPath(value: string): BuilderResult;
    clearUsedLibrariesList(): void;
    getUsedLibrariesList(): Array<cc_arduino_cli_commands_v1_lib_pb.Library>;
    setUsedLibrariesList(value: Array<cc_arduino_cli_commands_v1_lib_pb.Library>): BuilderResult;
    addUsedLibraries(value?: cc_arduino_cli_commands_v1_lib_pb.Library, index?: number): cc_arduino_cli_commands_v1_lib_pb.Library;
    clearExecutableSectionsSizeList(): void;
    getExecutableSectionsSizeList(): Array<ExecutableSectionSize>;
    setExecutableSectionsSizeList(value: Array<ExecutableSectionSize>): BuilderResult;
    addExecutableSectionsSize(value?: ExecutableSectionSize, index?: number): ExecutableSectionSize;

    hasBoardPlatform(): boolean;
    clearBoardPlatform(): void;
    getBoardPlatform(): cc_arduino_cli_commands_v1_common_pb.InstalledPlatformReference | undefined;
    setBoardPlatform(value?: cc_arduino_cli_commands_v1_common_pb.InstalledPlatformReference): BuilderResult;

    hasBuildPlatform(): boolean;
    clearBuildPlatform(): void;
    getBuildPlatform(): cc_arduino_cli_commands_v1_common_pb.InstalledPlatformReference | undefined;
    setBuildPlatform(value?: cc_arduino_cli_commands_v1_common_pb.InstalledPlatformReference): BuilderResult;
    clearBuildPropertiesList(): void;
    getBuildPropertiesList(): Array<string>;
    setBuildPropertiesList(value: Array<string>): BuilderResult;
    addBuildProperties(value: string, index?: number): string;
    clearDiagnosticsList(): void;
    getDiagnosticsList(): Array<CompileDiagnostic>;
    setDiagnosticsList(value: Array<CompileDiagnostic>): BuilderResult;
    addDiagnostics(value?: CompileDiagnostic, index?: number): CompileDiagnostic;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BuilderResult.AsObject;
    static toObject(includeInstance: boolean, msg: BuilderResult): BuilderResult.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BuilderResult, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BuilderResult;
    static deserializeBinaryFromReader(message: BuilderResult, reader: jspb.BinaryReader): BuilderResult;
}

export namespace BuilderResult {
    export type AsObject = {
        buildPath: string,
        usedLibrariesList: Array<cc_arduino_cli_commands_v1_lib_pb.Library.AsObject>,
        executableSectionsSizeList: Array<ExecutableSectionSize.AsObject>,
        boardPlatform?: cc_arduino_cli_commands_v1_common_pb.InstalledPlatformReference.AsObject,
        buildPlatform?: cc_arduino_cli_commands_v1_common_pb.InstalledPlatformReference.AsObject,
        buildPropertiesList: Array<string>,
        diagnosticsList: Array<CompileDiagnostic.AsObject>,
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

export class CompileDiagnostic extends jspb.Message { 
    getSeverity(): string;
    setSeverity(value: string): CompileDiagnostic;
    getMessage(): string;
    setMessage(value: string): CompileDiagnostic;
    getFile(): string;
    setFile(value: string): CompileDiagnostic;
    getLine(): number;
    setLine(value: number): CompileDiagnostic;
    getColumn(): number;
    setColumn(value: number): CompileDiagnostic;
    clearContextList(): void;
    getContextList(): Array<CompileDiagnosticContext>;
    setContextList(value: Array<CompileDiagnosticContext>): CompileDiagnostic;
    addContext(value?: CompileDiagnosticContext, index?: number): CompileDiagnosticContext;
    clearNotesList(): void;
    getNotesList(): Array<CompileDiagnosticNote>;
    setNotesList(value: Array<CompileDiagnosticNote>): CompileDiagnostic;
    addNotes(value?: CompileDiagnosticNote, index?: number): CompileDiagnosticNote;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CompileDiagnostic.AsObject;
    static toObject(includeInstance: boolean, msg: CompileDiagnostic): CompileDiagnostic.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CompileDiagnostic, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CompileDiagnostic;
    static deserializeBinaryFromReader(message: CompileDiagnostic, reader: jspb.BinaryReader): CompileDiagnostic;
}

export namespace CompileDiagnostic {
    export type AsObject = {
        severity: string,
        message: string,
        file: string,
        line: number,
        column: number,
        contextList: Array<CompileDiagnosticContext.AsObject>,
        notesList: Array<CompileDiagnosticNote.AsObject>,
    }
}

export class CompileDiagnosticContext extends jspb.Message { 
    getMessage(): string;
    setMessage(value: string): CompileDiagnosticContext;
    getFile(): string;
    setFile(value: string): CompileDiagnosticContext;
    getLine(): number;
    setLine(value: number): CompileDiagnosticContext;
    getColumn(): number;
    setColumn(value: number): CompileDiagnosticContext;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CompileDiagnosticContext.AsObject;
    static toObject(includeInstance: boolean, msg: CompileDiagnosticContext): CompileDiagnosticContext.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CompileDiagnosticContext, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CompileDiagnosticContext;
    static deserializeBinaryFromReader(message: CompileDiagnosticContext, reader: jspb.BinaryReader): CompileDiagnosticContext;
}

export namespace CompileDiagnosticContext {
    export type AsObject = {
        message: string,
        file: string,
        line: number,
        column: number,
    }
}

export class CompileDiagnosticNote extends jspb.Message { 
    getMessage(): string;
    setMessage(value: string): CompileDiagnosticNote;
    getFile(): string;
    setFile(value: string): CompileDiagnosticNote;
    getLine(): number;
    setLine(value: number): CompileDiagnosticNote;
    getColumn(): number;
    setColumn(value: number): CompileDiagnosticNote;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CompileDiagnosticNote.AsObject;
    static toObject(includeInstance: boolean, msg: CompileDiagnosticNote): CompileDiagnosticNote.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CompileDiagnosticNote, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CompileDiagnosticNote;
    static deserializeBinaryFromReader(message: CompileDiagnosticNote, reader: jspb.BinaryReader): CompileDiagnosticNote;
}

export namespace CompileDiagnosticNote {
    export type AsObject = {
        message: string,
        file: string,
        line: number,
        column: number,
    }
}
