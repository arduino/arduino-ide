// package: cc.arduino.cli.commands
// file: commands/compile.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as commands_common_pb from "../commands/common_pb";

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

    getExportfile(): string;
    setExportfile(value: string): CompileReq;

    getJobs(): number;
    setJobs(value: number): CompileReq;

    clearLibrariesList(): void;
    getLibrariesList(): Array<string>;
    setLibrariesList(value: Array<string>): CompileReq;
    addLibraries(value: string, index?: number): string;

    getOptimizefordebug(): boolean;
    setOptimizefordebug(value: boolean): CompileReq;

    getDryrun(): boolean;
    setDryrun(value: boolean): CompileReq;

    getExportDir(): string;
    setExportDir(value: string): CompileReq;


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
        exportfile: string,
        jobs: number,
        librariesList: Array<string>,
        optimizefordebug: boolean,
        dryrun: boolean,
        exportDir: string,
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
    }
}
