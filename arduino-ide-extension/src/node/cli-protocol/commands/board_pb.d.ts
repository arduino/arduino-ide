// package: cc.arduino.cli.commands
// file: commands/board.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as commands_common_pb from "../commands/common_pb";

export class BoardDetailsReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): BoardDetailsReq;

    getFqbn(): string;
    setFqbn(value: string): BoardDetailsReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardDetailsReq.AsObject;
    static toObject(includeInstance: boolean, msg: BoardDetailsReq): BoardDetailsReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardDetailsReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardDetailsReq;
    static deserializeBinaryFromReader(message: BoardDetailsReq, reader: jspb.BinaryReader): BoardDetailsReq;
}

export namespace BoardDetailsReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        fqbn: string,
    }
}

export class BoardDetailsResp extends jspb.Message { 
    getFqbn(): string;
    setFqbn(value: string): BoardDetailsResp;

    getName(): string;
    setName(value: string): BoardDetailsResp;

    getVersion(): string;
    setVersion(value: string): BoardDetailsResp;

    getPropertiesid(): string;
    setPropertiesid(value: string): BoardDetailsResp;

    getAlias(): string;
    setAlias(value: string): BoardDetailsResp;

    getOfficial(): boolean;
    setOfficial(value: boolean): BoardDetailsResp;

    getPinout(): string;
    setPinout(value: string): BoardDetailsResp;


    hasPackage(): boolean;
    clearPackage(): void;
    getPackage(): Package | undefined;
    setPackage(value?: Package): BoardDetailsResp;


    hasPlatform(): boolean;
    clearPlatform(): void;
    getPlatform(): BoardPlatform | undefined;
    setPlatform(value?: BoardPlatform): BoardDetailsResp;

    clearToolsdependenciesList(): void;
    getToolsdependenciesList(): Array<ToolsDependencies>;
    setToolsdependenciesList(value: Array<ToolsDependencies>): BoardDetailsResp;
    addToolsdependencies(value?: ToolsDependencies, index?: number): ToolsDependencies;

    clearConfigOptionsList(): void;
    getConfigOptionsList(): Array<ConfigOption>;
    setConfigOptionsList(value: Array<ConfigOption>): BoardDetailsResp;
    addConfigOptions(value?: ConfigOption, index?: number): ConfigOption;

    clearIdentificationPrefList(): void;
    getIdentificationPrefList(): Array<IdentificationPref>;
    setIdentificationPrefList(value: Array<IdentificationPref>): BoardDetailsResp;
    addIdentificationPref(value?: IdentificationPref, index?: number): IdentificationPref;

    clearProgrammersList(): void;
    getProgrammersList(): Array<commands_common_pb.Programmer>;
    setProgrammersList(value: Array<commands_common_pb.Programmer>): BoardDetailsResp;
    addProgrammers(value?: commands_common_pb.Programmer, index?: number): commands_common_pb.Programmer;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardDetailsResp.AsObject;
    static toObject(includeInstance: boolean, msg: BoardDetailsResp): BoardDetailsResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardDetailsResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardDetailsResp;
    static deserializeBinaryFromReader(message: BoardDetailsResp, reader: jspb.BinaryReader): BoardDetailsResp;
}

export namespace BoardDetailsResp {
    export type AsObject = {
        fqbn: string,
        name: string,
        version: string,
        propertiesid: string,
        alias: string,
        official: boolean,
        pinout: string,
        pb_package?: Package.AsObject,
        platform?: BoardPlatform.AsObject,
        toolsdependenciesList: Array<ToolsDependencies.AsObject>,
        configOptionsList: Array<ConfigOption.AsObject>,
        identificationPrefList: Array<IdentificationPref.AsObject>,
        programmersList: Array<commands_common_pb.Programmer.AsObject>,
    }
}

export class IdentificationPref extends jspb.Message { 

    hasUsbid(): boolean;
    clearUsbid(): void;
    getUsbid(): USBID | undefined;
    setUsbid(value?: USBID): IdentificationPref;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IdentificationPref.AsObject;
    static toObject(includeInstance: boolean, msg: IdentificationPref): IdentificationPref.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IdentificationPref, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IdentificationPref;
    static deserializeBinaryFromReader(message: IdentificationPref, reader: jspb.BinaryReader): IdentificationPref;
}

export namespace IdentificationPref {
    export type AsObject = {
        usbid?: USBID.AsObject,
    }
}

export class USBID extends jspb.Message { 
    getVid(): string;
    setVid(value: string): USBID;

    getPid(): string;
    setPid(value: string): USBID;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): USBID.AsObject;
    static toObject(includeInstance: boolean, msg: USBID): USBID.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: USBID, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): USBID;
    static deserializeBinaryFromReader(message: USBID, reader: jspb.BinaryReader): USBID;
}

export namespace USBID {
    export type AsObject = {
        vid: string,
        pid: string,
    }
}

export class Package extends jspb.Message { 
    getMaintainer(): string;
    setMaintainer(value: string): Package;

    getUrl(): string;
    setUrl(value: string): Package;

    getWebsiteurl(): string;
    setWebsiteurl(value: string): Package;

    getEmail(): string;
    setEmail(value: string): Package;

    getName(): string;
    setName(value: string): Package;


    hasHelp(): boolean;
    clearHelp(): void;
    getHelp(): Help | undefined;
    setHelp(value?: Help): Package;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Package.AsObject;
    static toObject(includeInstance: boolean, msg: Package): Package.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Package, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Package;
    static deserializeBinaryFromReader(message: Package, reader: jspb.BinaryReader): Package;
}

export namespace Package {
    export type AsObject = {
        maintainer: string,
        url: string,
        websiteurl: string,
        email: string,
        name: string,
        help?: Help.AsObject,
    }
}

export class Help extends jspb.Message { 
    getOnline(): string;
    setOnline(value: string): Help;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Help.AsObject;
    static toObject(includeInstance: boolean, msg: Help): Help.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Help, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Help;
    static deserializeBinaryFromReader(message: Help, reader: jspb.BinaryReader): Help;
}

export namespace Help {
    export type AsObject = {
        online: string,
    }
}

export class BoardPlatform extends jspb.Message { 
    getArchitecture(): string;
    setArchitecture(value: string): BoardPlatform;

    getCategory(): string;
    setCategory(value: string): BoardPlatform;

    getUrl(): string;
    setUrl(value: string): BoardPlatform;

    getArchivefilename(): string;
    setArchivefilename(value: string): BoardPlatform;

    getChecksum(): string;
    setChecksum(value: string): BoardPlatform;

    getSize(): number;
    setSize(value: number): BoardPlatform;

    getName(): string;
    setName(value: string): BoardPlatform;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardPlatform.AsObject;
    static toObject(includeInstance: boolean, msg: BoardPlatform): BoardPlatform.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardPlatform, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardPlatform;
    static deserializeBinaryFromReader(message: BoardPlatform, reader: jspb.BinaryReader): BoardPlatform;
}

export namespace BoardPlatform {
    export type AsObject = {
        architecture: string,
        category: string,
        url: string,
        archivefilename: string,
        checksum: string,
        size: number,
        name: string,
    }
}

export class ToolsDependencies extends jspb.Message { 
    getPackager(): string;
    setPackager(value: string): ToolsDependencies;

    getName(): string;
    setName(value: string): ToolsDependencies;

    getVersion(): string;
    setVersion(value: string): ToolsDependencies;

    clearSystemsList(): void;
    getSystemsList(): Array<Systems>;
    setSystemsList(value: Array<Systems>): ToolsDependencies;
    addSystems(value?: Systems, index?: number): Systems;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ToolsDependencies.AsObject;
    static toObject(includeInstance: boolean, msg: ToolsDependencies): ToolsDependencies.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ToolsDependencies, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ToolsDependencies;
    static deserializeBinaryFromReader(message: ToolsDependencies, reader: jspb.BinaryReader): ToolsDependencies;
}

export namespace ToolsDependencies {
    export type AsObject = {
        packager: string,
        name: string,
        version: string,
        systemsList: Array<Systems.AsObject>,
    }
}

export class Systems extends jspb.Message { 
    getChecksum(): string;
    setChecksum(value: string): Systems;

    getHost(): string;
    setHost(value: string): Systems;

    getArchivefilename(): string;
    setArchivefilename(value: string): Systems;

    getUrl(): string;
    setUrl(value: string): Systems;

    getSize(): number;
    setSize(value: number): Systems;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Systems.AsObject;
    static toObject(includeInstance: boolean, msg: Systems): Systems.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Systems, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Systems;
    static deserializeBinaryFromReader(message: Systems, reader: jspb.BinaryReader): Systems;
}

export namespace Systems {
    export type AsObject = {
        checksum: string,
        host: string,
        archivefilename: string,
        url: string,
        size: number,
    }
}

export class ConfigOption extends jspb.Message { 
    getOption(): string;
    setOption(value: string): ConfigOption;

    getOptionLabel(): string;
    setOptionLabel(value: string): ConfigOption;

    clearValuesList(): void;
    getValuesList(): Array<ConfigValue>;
    setValuesList(value: Array<ConfigValue>): ConfigOption;
    addValues(value?: ConfigValue, index?: number): ConfigValue;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConfigOption.AsObject;
    static toObject(includeInstance: boolean, msg: ConfigOption): ConfigOption.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConfigOption, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConfigOption;
    static deserializeBinaryFromReader(message: ConfigOption, reader: jspb.BinaryReader): ConfigOption;
}

export namespace ConfigOption {
    export type AsObject = {
        option: string,
        optionLabel: string,
        valuesList: Array<ConfigValue.AsObject>,
    }
}

export class ConfigValue extends jspb.Message { 
    getValue(): string;
    setValue(value: string): ConfigValue;

    getValueLabel(): string;
    setValueLabel(value: string): ConfigValue;

    getSelected(): boolean;
    setSelected(value: boolean): ConfigValue;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConfigValue.AsObject;
    static toObject(includeInstance: boolean, msg: ConfigValue): ConfigValue.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConfigValue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConfigValue;
    static deserializeBinaryFromReader(message: ConfigValue, reader: jspb.BinaryReader): ConfigValue;
}

export namespace ConfigValue {
    export type AsObject = {
        value: string,
        valueLabel: string,
        selected: boolean,
    }
}

export class BoardAttachReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): BoardAttachReq;

    getBoardUri(): string;
    setBoardUri(value: string): BoardAttachReq;

    getSketchPath(): string;
    setSketchPath(value: string): BoardAttachReq;

    getSearchTimeout(): string;
    setSearchTimeout(value: string): BoardAttachReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardAttachReq.AsObject;
    static toObject(includeInstance: boolean, msg: BoardAttachReq): BoardAttachReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardAttachReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardAttachReq;
    static deserializeBinaryFromReader(message: BoardAttachReq, reader: jspb.BinaryReader): BoardAttachReq;
}

export namespace BoardAttachReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        boardUri: string,
        sketchPath: string,
        searchTimeout: string,
    }
}

export class BoardAttachResp extends jspb.Message { 

    hasTaskProgress(): boolean;
    clearTaskProgress(): void;
    getTaskProgress(): commands_common_pb.TaskProgress | undefined;
    setTaskProgress(value?: commands_common_pb.TaskProgress): BoardAttachResp;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardAttachResp.AsObject;
    static toObject(includeInstance: boolean, msg: BoardAttachResp): BoardAttachResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardAttachResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardAttachResp;
    static deserializeBinaryFromReader(message: BoardAttachResp, reader: jspb.BinaryReader): BoardAttachResp;
}

export namespace BoardAttachResp {
    export type AsObject = {
        taskProgress?: commands_common_pb.TaskProgress.AsObject,
    }
}

export class BoardListReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): BoardListReq;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardListReq.AsObject;
    static toObject(includeInstance: boolean, msg: BoardListReq): BoardListReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardListReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardListReq;
    static deserializeBinaryFromReader(message: BoardListReq, reader: jspb.BinaryReader): BoardListReq;
}

export namespace BoardListReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
    }
}

export class BoardListResp extends jspb.Message { 
    clearPortsList(): void;
    getPortsList(): Array<DetectedPort>;
    setPortsList(value: Array<DetectedPort>): BoardListResp;
    addPorts(value?: DetectedPort, index?: number): DetectedPort;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardListResp.AsObject;
    static toObject(includeInstance: boolean, msg: BoardListResp): BoardListResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardListResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardListResp;
    static deserializeBinaryFromReader(message: BoardListResp, reader: jspb.BinaryReader): BoardListResp;
}

export namespace BoardListResp {
    export type AsObject = {
        portsList: Array<DetectedPort.AsObject>,
    }
}

export class DetectedPort extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): DetectedPort;

    getProtocol(): string;
    setProtocol(value: string): DetectedPort;

    getProtocolLabel(): string;
    setProtocolLabel(value: string): DetectedPort;

    clearBoardsList(): void;
    getBoardsList(): Array<BoardListItem>;
    setBoardsList(value: Array<BoardListItem>): DetectedPort;
    addBoards(value?: BoardListItem, index?: number): BoardListItem;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DetectedPort.AsObject;
    static toObject(includeInstance: boolean, msg: DetectedPort): DetectedPort.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DetectedPort, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DetectedPort;
    static deserializeBinaryFromReader(message: DetectedPort, reader: jspb.BinaryReader): DetectedPort;
}

export namespace DetectedPort {
    export type AsObject = {
        address: string,
        protocol: string,
        protocolLabel: string,
        boardsList: Array<BoardListItem.AsObject>,
    }
}

export class BoardListAllReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): BoardListAllReq;

    clearSearchArgsList(): void;
    getSearchArgsList(): Array<string>;
    setSearchArgsList(value: Array<string>): BoardListAllReq;
    addSearchArgs(value: string, index?: number): string;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardListAllReq.AsObject;
    static toObject(includeInstance: boolean, msg: BoardListAllReq): BoardListAllReq.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardListAllReq, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardListAllReq;
    static deserializeBinaryFromReader(message: BoardListAllReq, reader: jspb.BinaryReader): BoardListAllReq;
}

export namespace BoardListAllReq {
    export type AsObject = {
        instance?: commands_common_pb.Instance.AsObject,
        searchArgsList: Array<string>,
    }
}

export class BoardListAllResp extends jspb.Message { 
    clearBoardsList(): void;
    getBoardsList(): Array<BoardListItem>;
    setBoardsList(value: Array<BoardListItem>): BoardListAllResp;
    addBoards(value?: BoardListItem, index?: number): BoardListItem;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardListAllResp.AsObject;
    static toObject(includeInstance: boolean, msg: BoardListAllResp): BoardListAllResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardListAllResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardListAllResp;
    static deserializeBinaryFromReader(message: BoardListAllResp, reader: jspb.BinaryReader): BoardListAllResp;
}

export namespace BoardListAllResp {
    export type AsObject = {
        boardsList: Array<BoardListItem.AsObject>,
    }
}

export class BoardListItem extends jspb.Message { 
    getName(): string;
    setName(value: string): BoardListItem;

    getFqbn(): string;
    setFqbn(value: string): BoardListItem;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardListItem.AsObject;
    static toObject(includeInstance: boolean, msg: BoardListItem): BoardListItem.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardListItem, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardListItem;
    static deserializeBinaryFromReader(message: BoardListItem, reader: jspb.BinaryReader): BoardListItem;
}

export namespace BoardListItem {
    export type AsObject = {
        name: string,
        fqbn: string,
    }
}
