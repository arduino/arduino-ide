// package: cc.arduino.cli.commands
// file: commands/compile.proto

/* tslint:disable */

import * as jspb from "google-protobuf";
import * as commands_common_pb from "../commands/common_pb";

export class CompileReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): void;

    getFqbn(): string;
    setFqbn(value: string): void;

    getSketchpath(): string;
    setSketchpath(value: string): void;

    getShowproperties(): boolean;
    setShowproperties(value: boolean): void;

    getPreprocess(): boolean;
    setPreprocess(value: boolean): void;

    getBuildcachepath(): string;
    setBuildcachepath(value: string): void;

    getBuildpath(): string;
    setBuildpath(value: string): void;

    clearBuildpropertiesList(): void;
    getBuildpropertiesList(): Array<string>;
    setBuildpropertiesList(value: Array<string>): void;
    addBuildproperties(value: string, index?: number): string;

    getWarnings(): string;
    setWarnings(value: string): void;

    getVerbose(): boolean;
    setVerbose(value: boolean): void;

    getQuiet(): boolean;
    setQuiet(value: boolean): void;

    getVidpid(): string;
    setVidpid(value: string): void;

    getExportfile(): string;
    setExportfile(value: string): void;

    getJobs(): number;
    setJobs(value: number): void;


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
    }
}

export class CompileResp extends jspb.Message { 
    getOutStream(): Uint8Array | string;
    getOutStream_asU8(): Uint8Array;
    getOutStream_asB64(): string;
    setOutStream(value: Uint8Array | string): void;

    getErrStream(): Uint8Array | string;
    getErrStream_asU8(): Uint8Array;
    getErrStream_asB64(): string;
    setErrStream(value: Uint8Array | string): void;


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
