// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class Instance extends jspb.Message { 
    getId(): number;
    setId(value: number): Instance;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Instance.AsObject;
    static toObject(includeInstance: boolean, msg: Instance): Instance.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Instance, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Instance;
    static deserializeBinaryFromReader(message: Instance, reader: jspb.BinaryReader): Instance;
}

export namespace Instance {
    export type AsObject = {
        id: number,
    }
}

export class DownloadProgress extends jspb.Message { 

    hasStart(): boolean;
    clearStart(): void;
    getStart(): DownloadProgressStart | undefined;
    setStart(value?: DownloadProgressStart): DownloadProgress;

    hasUpdate(): boolean;
    clearUpdate(): void;
    getUpdate(): DownloadProgressUpdate | undefined;
    setUpdate(value?: DownloadProgressUpdate): DownloadProgress;

    hasEnd(): boolean;
    clearEnd(): void;
    getEnd(): DownloadProgressEnd | undefined;
    setEnd(value?: DownloadProgressEnd): DownloadProgress;

    getMessageCase(): DownloadProgress.MessageCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DownloadProgress.AsObject;
    static toObject(includeInstance: boolean, msg: DownloadProgress): DownloadProgress.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DownloadProgress, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DownloadProgress;
    static deserializeBinaryFromReader(message: DownloadProgress, reader: jspb.BinaryReader): DownloadProgress;
}

export namespace DownloadProgress {
    export type AsObject = {
        start?: DownloadProgressStart.AsObject,
        update?: DownloadProgressUpdate.AsObject,
        end?: DownloadProgressEnd.AsObject,
    }

    export enum MessageCase {
        MESSAGE_NOT_SET = 0,
        START = 1,
        UPDATE = 2,
        END = 3,
    }

}

export class DownloadProgressStart extends jspb.Message { 
    getUrl(): string;
    setUrl(value: string): DownloadProgressStart;
    getLabel(): string;
    setLabel(value: string): DownloadProgressStart;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DownloadProgressStart.AsObject;
    static toObject(includeInstance: boolean, msg: DownloadProgressStart): DownloadProgressStart.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DownloadProgressStart, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DownloadProgressStart;
    static deserializeBinaryFromReader(message: DownloadProgressStart, reader: jspb.BinaryReader): DownloadProgressStart;
}

export namespace DownloadProgressStart {
    export type AsObject = {
        url: string,
        label: string,
    }
}

export class DownloadProgressUpdate extends jspb.Message { 
    getDownloaded(): number;
    setDownloaded(value: number): DownloadProgressUpdate;
    getTotalSize(): number;
    setTotalSize(value: number): DownloadProgressUpdate;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DownloadProgressUpdate.AsObject;
    static toObject(includeInstance: boolean, msg: DownloadProgressUpdate): DownloadProgressUpdate.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DownloadProgressUpdate, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DownloadProgressUpdate;
    static deserializeBinaryFromReader(message: DownloadProgressUpdate, reader: jspb.BinaryReader): DownloadProgressUpdate;
}

export namespace DownloadProgressUpdate {
    export type AsObject = {
        downloaded: number,
        totalSize: number,
    }
}

export class DownloadProgressEnd extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DownloadProgressEnd;
    getMessage(): string;
    setMessage(value: string): DownloadProgressEnd;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DownloadProgressEnd.AsObject;
    static toObject(includeInstance: boolean, msg: DownloadProgressEnd): DownloadProgressEnd.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DownloadProgressEnd, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DownloadProgressEnd;
    static deserializeBinaryFromReader(message: DownloadProgressEnd, reader: jspb.BinaryReader): DownloadProgressEnd;
}

export namespace DownloadProgressEnd {
    export type AsObject = {
        success: boolean,
        message: string,
    }
}

export class TaskProgress extends jspb.Message { 
    getName(): string;
    setName(value: string): TaskProgress;
    getMessage(): string;
    setMessage(value: string): TaskProgress;
    getCompleted(): boolean;
    setCompleted(value: boolean): TaskProgress;
    getPercent(): number;
    setPercent(value: number): TaskProgress;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TaskProgress.AsObject;
    static toObject(includeInstance: boolean, msg: TaskProgress): TaskProgress.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TaskProgress, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TaskProgress;
    static deserializeBinaryFromReader(message: TaskProgress, reader: jspb.BinaryReader): TaskProgress;
}

export namespace TaskProgress {
    export type AsObject = {
        name: string,
        message: string,
        completed: boolean,
        percent: number,
    }
}

export class Programmer extends jspb.Message { 
    getPlatform(): string;
    setPlatform(value: string): Programmer;
    getId(): string;
    setId(value: string): Programmer;
    getName(): string;
    setName(value: string): Programmer;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Programmer.AsObject;
    static toObject(includeInstance: boolean, msg: Programmer): Programmer.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Programmer, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Programmer;
    static deserializeBinaryFromReader(message: Programmer, reader: jspb.BinaryReader): Programmer;
}

export namespace Programmer {
    export type AsObject = {
        platform: string,
        id: string,
        name: string,
    }
}

export class MissingProgrammerError extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MissingProgrammerError.AsObject;
    static toObject(includeInstance: boolean, msg: MissingProgrammerError): MissingProgrammerError.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MissingProgrammerError, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MissingProgrammerError;
    static deserializeBinaryFromReader(message: MissingProgrammerError, reader: jspb.BinaryReader): MissingProgrammerError;
}

export namespace MissingProgrammerError {
    export type AsObject = {
    }
}

export class Platform extends jspb.Message { 

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): PlatformMetadata | undefined;
    setMetadata(value?: PlatformMetadata): Platform;

    hasRelease(): boolean;
    clearRelease(): void;
    getRelease(): PlatformRelease | undefined;
    setRelease(value?: PlatformRelease): Platform;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Platform.AsObject;
    static toObject(includeInstance: boolean, msg: Platform): Platform.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Platform, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Platform;
    static deserializeBinaryFromReader(message: Platform, reader: jspb.BinaryReader): Platform;
}

export namespace Platform {
    export type AsObject = {
        metadata?: PlatformMetadata.AsObject,
        release?: PlatformRelease.AsObject,
    }
}

export class PlatformSummary extends jspb.Message { 

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): PlatformMetadata | undefined;
    setMetadata(value?: PlatformMetadata): PlatformSummary;

    getReleasesMap(): jspb.Map<string, PlatformRelease>;
    clearReleasesMap(): void;
    getInstalledVersion(): string;
    setInstalledVersion(value: string): PlatformSummary;
    getLatestVersion(): string;
    setLatestVersion(value: string): PlatformSummary;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformSummary.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformSummary): PlatformSummary.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformSummary, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformSummary;
    static deserializeBinaryFromReader(message: PlatformSummary, reader: jspb.BinaryReader): PlatformSummary;
}

export namespace PlatformSummary {
    export type AsObject = {
        metadata?: PlatformMetadata.AsObject,

        releasesMap: Array<[string, PlatformRelease.AsObject]>,
        installedVersion: string,
        latestVersion: string,
    }
}

export class PlatformMetadata extends jspb.Message { 
    getId(): string;
    setId(value: string): PlatformMetadata;
    getMaintainer(): string;
    setMaintainer(value: string): PlatformMetadata;
    getWebsite(): string;
    setWebsite(value: string): PlatformMetadata;
    getEmail(): string;
    setEmail(value: string): PlatformMetadata;
    getManuallyInstalled(): boolean;
    setManuallyInstalled(value: boolean): PlatformMetadata;
    getDeprecated(): boolean;
    setDeprecated(value: boolean): PlatformMetadata;
    getIndexed(): boolean;
    setIndexed(value: boolean): PlatformMetadata;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformMetadata.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformMetadata): PlatformMetadata.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformMetadata, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformMetadata;
    static deserializeBinaryFromReader(message: PlatformMetadata, reader: jspb.BinaryReader): PlatformMetadata;
}

export namespace PlatformMetadata {
    export type AsObject = {
        id: string,
        maintainer: string,
        website: string,
        email: string,
        manuallyInstalled: boolean,
        deprecated: boolean,
        indexed: boolean,
    }
}

export class PlatformRelease extends jspb.Message { 
    getName(): string;
    setName(value: string): PlatformRelease;
    getVersion(): string;
    setVersion(value: string): PlatformRelease;
    clearTypesList(): void;
    getTypesList(): Array<string>;
    setTypesList(value: Array<string>): PlatformRelease;
    addTypes(value: string, index?: number): string;
    getInstalled(): boolean;
    setInstalled(value: boolean): PlatformRelease;
    clearBoardsList(): void;
    getBoardsList(): Array<Board>;
    setBoardsList(value: Array<Board>): PlatformRelease;
    addBoards(value?: Board, index?: number): Board;

    hasHelp(): boolean;
    clearHelp(): void;
    getHelp(): HelpResources | undefined;
    setHelp(value?: HelpResources): PlatformRelease;
    getMissingMetadata(): boolean;
    setMissingMetadata(value: boolean): PlatformRelease;
    getDeprecated(): boolean;
    setDeprecated(value: boolean): PlatformRelease;
    getCompatible(): boolean;
    setCompatible(value: boolean): PlatformRelease;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlatformRelease.AsObject;
    static toObject(includeInstance: boolean, msg: PlatformRelease): PlatformRelease.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlatformRelease, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlatformRelease;
    static deserializeBinaryFromReader(message: PlatformRelease, reader: jspb.BinaryReader): PlatformRelease;
}

export namespace PlatformRelease {
    export type AsObject = {
        name: string,
        version: string,
        typesList: Array<string>,
        installed: boolean,
        boardsList: Array<Board.AsObject>,
        help?: HelpResources.AsObject,
        missingMetadata: boolean,
        deprecated: boolean,
        compatible: boolean,
    }
}

export class InstalledPlatformReference extends jspb.Message { 
    getId(): string;
    setId(value: string): InstalledPlatformReference;
    getVersion(): string;
    setVersion(value: string): InstalledPlatformReference;
    getInstallDir(): string;
    setInstallDir(value: string): InstalledPlatformReference;
    getPackageUrl(): string;
    setPackageUrl(value: string): InstalledPlatformReference;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InstalledPlatformReference.AsObject;
    static toObject(includeInstance: boolean, msg: InstalledPlatformReference): InstalledPlatformReference.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InstalledPlatformReference, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InstalledPlatformReference;
    static deserializeBinaryFromReader(message: InstalledPlatformReference, reader: jspb.BinaryReader): InstalledPlatformReference;
}

export namespace InstalledPlatformReference {
    export type AsObject = {
        id: string,
        version: string,
        installDir: string,
        packageUrl: string,
    }
}

export class Board extends jspb.Message { 
    getName(): string;
    setName(value: string): Board;
    getFqbn(): string;
    setFqbn(value: string): Board;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Board.AsObject;
    static toObject(includeInstance: boolean, msg: Board): Board.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Board, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Board;
    static deserializeBinaryFromReader(message: Board, reader: jspb.BinaryReader): Board;
}

export namespace Board {
    export type AsObject = {
        name: string,
        fqbn: string,
    }
}

export class HelpResources extends jspb.Message { 
    getOnline(): string;
    setOnline(value: string): HelpResources;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HelpResources.AsObject;
    static toObject(includeInstance: boolean, msg: HelpResources): HelpResources.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HelpResources, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HelpResources;
    static deserializeBinaryFromReader(message: HelpResources, reader: jspb.BinaryReader): HelpResources;
}

export namespace HelpResources {
    export type AsObject = {
        online: string,
    }
}

export class Sketch extends jspb.Message { 
    getMainFile(): string;
    setMainFile(value: string): Sketch;
    getLocationPath(): string;
    setLocationPath(value: string): Sketch;
    clearOtherSketchFilesList(): void;
    getOtherSketchFilesList(): Array<string>;
    setOtherSketchFilesList(value: Array<string>): Sketch;
    addOtherSketchFiles(value: string, index?: number): string;
    clearAdditionalFilesList(): void;
    getAdditionalFilesList(): Array<string>;
    setAdditionalFilesList(value: Array<string>): Sketch;
    addAdditionalFiles(value: string, index?: number): string;
    clearRootFolderFilesList(): void;
    getRootFolderFilesList(): Array<string>;
    setRootFolderFilesList(value: Array<string>): Sketch;
    addRootFolderFiles(value: string, index?: number): string;
    getDefaultFqbn(): string;
    setDefaultFqbn(value: string): Sketch;
    getDefaultPort(): string;
    setDefaultPort(value: string): Sketch;
    getDefaultProtocol(): string;
    setDefaultProtocol(value: string): Sketch;
    clearProfilesList(): void;
    getProfilesList(): Array<SketchProfile>;
    setProfilesList(value: Array<SketchProfile>): Sketch;
    addProfiles(value?: SketchProfile, index?: number): SketchProfile;

    hasDefaultProfile(): boolean;
    clearDefaultProfile(): void;
    getDefaultProfile(): SketchProfile | undefined;
    setDefaultProfile(value?: SketchProfile): Sketch;
    getDefaultProgrammer(): string;
    setDefaultProgrammer(value: string): Sketch;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Sketch.AsObject;
    static toObject(includeInstance: boolean, msg: Sketch): Sketch.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Sketch, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Sketch;
    static deserializeBinaryFromReader(message: Sketch, reader: jspb.BinaryReader): Sketch;
}

export namespace Sketch {
    export type AsObject = {
        mainFile: string,
        locationPath: string,
        otherSketchFilesList: Array<string>,
        additionalFilesList: Array<string>,
        rootFolderFilesList: Array<string>,
        defaultFqbn: string,
        defaultPort: string,
        defaultProtocol: string,
        profilesList: Array<SketchProfile.AsObject>,
        defaultProfile?: SketchProfile.AsObject,
        defaultProgrammer: string,
    }
}

export class SketchProfile extends jspb.Message { 
    getName(): string;
    setName(value: string): SketchProfile;
    getFqbn(): string;
    setFqbn(value: string): SketchProfile;
    getProgrammer(): string;
    setProgrammer(value: string): SketchProfile;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SketchProfile.AsObject;
    static toObject(includeInstance: boolean, msg: SketchProfile): SketchProfile.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SketchProfile, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SketchProfile;
    static deserializeBinaryFromReader(message: SketchProfile, reader: jspb.BinaryReader): SketchProfile;
}

export namespace SketchProfile {
    export type AsObject = {
        name: string,
        fqbn: string,
        programmer: string,
    }
}
