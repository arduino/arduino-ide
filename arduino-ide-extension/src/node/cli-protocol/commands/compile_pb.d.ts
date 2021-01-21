// package: cc.arduino.cli.commands
// file: commands/compile.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as commands_common_pb from "../commands/common_pb";
import * as commands_lib_pb from "../commands/lib_pb";

export class CompileReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): CompileReq;

    getFqbn(): string;
    setFqbn(value: string): CompileReq;

    getSketchpath(): string;
    setSketchpath(value: string): CompileReq;

    getShowproperties(): boolean;
    setShowproperties(value: boolean): CompileReq;

    getPreprocess(): boolean;
    setPreprocess(value: boolean): CompileReq;

    getBuildcachepath(): string;
    setBuildcachepath(value: string): CompileReq;

    getBuildpath(): string;
    setBuildpath(value: string): CompileReq;

    clearBuildpropertiesList(): void;
    getBuildpropertiesList(): Array<string>;
    setBuildpropertiesList(value: Array<string>): CompileReq;
    addBuildproperties(value: string, index?: number): string;

    getWarnings(): string;
    setWarnings(value: string): CompileReq;

    getVerbose(): boolean;
    setVerbose(value: boolean): CompileReq;

    getQuiet(): boolean;
    setQuiet(value: boolean): CompileReq;

    getVidpid(): string;
    setVidpid(value: string): CompileReq;

    getJobs(): number;
    setJobs(value: number): CompileReq;

    clearLibrariesList(): void;
    getLibrariesList(): Array<string>;
    setLibrariesList(value: Array<string>): CompileReq;
    addLibraries(value: string, index?: number): string;

    getOptimizefordebug(): boolean;
    setOptimizefordebug(value: boolean): CompileReq;

    getExportDir(): string;
    setExportDir(value: string): CompileReq;

    getClean(): boolean;
    setClean(value: boolean): CompileReq;

    getExportBinaries(): boolean;
    setExportBinaries(value: boolean): CompileReq;

    getCreateCompilationDatabaseOnly(): boolean;
    setCreateCompilationDatabaseOnly(value: boolean): CompileReq;


    getSourceOverrideMap(): jspb.Map<string, string>;
    clearSourceOverrideMap(): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CompileReq.AsObject;
    static toObject(includeInstance: boolean, msg: CompileReq): CompileReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CompileReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CompileReq;
    static deserializeBinaryFromReader(message: CompileReq, reader: jspb.BinaryReader): CompileReq;
}

export namespace CompileReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        fqbn: string,
        sketchpath: string,
        showproperties: boolean,
        preprocess: boolean,
        buildcachepath: string,
        buildpath: string,
        buildpropertiesList: Array<string>,
        warnings: string,
        verbose: boolean,
        quiet: boolean,
        vidpid: string,
        jobs: number,
        librariesList: Array<string>,
        optimizefordebug: boolean,
        exportDir: string,
        clean: boolean,
        exportBinaries: boolean,
        createCompilationDatabaseOnly: boolean,

        sourceOverrideMap: Array<[string, string]>,
    }
}

export class CompileResp extends jspb.Message { 
    getOutStream(): Uint8Array | string;
    getOutStream_asU8(): Uint8Array;
    getOutStream_asB64(): string;
    setOutStream(value: Uint8Array | string): CompileResp;

    getErrStream(): Uint8Array | string;
    getErrStream_asU8(): Uint8Array;
    getErrStream_asB64(): string;
    setErrStream(value: Uint8Array | string): CompileResp;

    getBuildPath(): string;
    setBuildPath(value: string): CompileResp;

    clearUsedLibrariesList(): void;
    getUsedLibrariesList(): Array<commands_lib_pb.Library>;
    setUsedLibrariesList(value: Array<commands_lib_pb.Library>): CompileResp;
    addUsedLibraries(value?: commands_lib_pb.Library, index?: number): commands_lib_pb.Library;

    clearExecutableSectionsSizeList(): void;
    getExecutableSectionsSizeList(): Array<ExecutableSectionSize>;
    setExecutableSectionsSizeList(value: Array<ExecutableSectionSize>): CompileResp;
    addExecutableSectionsSize(value?: ExecutableSectionSize, index?: number): ExecutableSectionSize;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CompileResp.AsObject;
    static toObject(includeInstance: boolean, msg: CompileResp): CompileResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CompileResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CompileResp;
    static deserializeBinaryFromReader(message: CompileResp, reader: jspb.BinaryReader): CompileResp;
}

export namespace CompileResp {
    export type AsObject = {
        outStream: Uint8Array | string,
        errStream: Uint8Array | string,
        buildPath: string,
        usedLibrariesList: Array<commands_lib_pb.Library.AsObject>,
        executableSectionsSizeList: Array<ExecutableSectionSize.AsObject>,
    }
}

export class ExecutableSectionSize extends jspb.Message { 
    getName(): string;
    setName(value: string): ExecutableSectionSize;

    getSize(): number;
    setSize(value: number): ExecutableSectionSize;

    getMaxsize(): number;
    setMaxsize(value: number): ExecutableSectionSize;


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
        maxsize: number,
    }
}
