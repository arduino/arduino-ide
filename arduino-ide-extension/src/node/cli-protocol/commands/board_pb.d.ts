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
    setInstance(value?: commands_common_pb.Instance): void;

    getFqbn(): string;
    setFqbn(value: string): void;


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
    getName(): string;
    setName(value: string): void;

    clearConfigOptionsList(): void;
    getConfigOptionsList(): Array<ConfigOption>;
    setConfigOptionsList(value: Array<ConfigOption>): void;
    addConfigOptions(value?: ConfigOption, index?: number): ConfigOption;

    clearRequiredToolsList(): void;
    getRequiredToolsList(): Array<RequiredTool>;
    setRequiredToolsList(value: Array<RequiredTool>): void;
    addRequiredTools(value?: RequiredTool, index?: number): RequiredTool;


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
        name: string,
        configOptionsList: Array<ConfigOption.AsObject>,
        requiredToolsList: Array<RequiredTool.AsObject>,
    }
}

export class ConfigOption extends jspb.Message { 
    getOption(): string;
    setOption(value: string): void;

    getOptionLabel(): string;
    setOptionLabel(value: string): void;

    clearValuesList(): void;
    getValuesList(): Array<ConfigValue>;
    setValuesList(value: Array<ConfigValue>): void;
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
    setValue(value: string): void;

    getValueLabel(): string;
    setValueLabel(value: string): void;

    getSelected(): boolean;
    setSelected(value: boolean): void;


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

export class RequiredTool extends jspb.Message { 
    getName(): string;
    setName(value: string): void;

    getVersion(): string;
    setVersion(value: string): void;

    getPackager(): string;
    setPackager(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RequiredTool.AsObject;
    static toObject(includeInstance: boolean, msg: RequiredTool): RequiredTool.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RequiredTool, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RequiredTool;
    static deserializeBinaryFromReader(message: RequiredTool, reader: jspb.BinaryReader): RequiredTool;
}

export namespace RequiredTool {
    export type AsObject = {
        name: string,
        version: string,
        packager: string,
    }
}

export class BoardAttachReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): commands_common_pb.Instance | undefined;
    setInstance(value?: commands_common_pb.Instance): void;

    getBoardUri(): string;
    setBoardUri(value: string): void;

    getSketchPath(): string;
    setSketchPath(value: string): void;

    getSearchTimeout(): string;
    setSearchTimeout(value: string): void;


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
    setTaskProgress(value?: commands_common_pb.TaskProgress): void;


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
    setInstance(value?: commands_common_pb.Instance): void;


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
    setPortsList(value: Array<DetectedPort>): void;
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
    setAddress(value: string): void;

    getProtocol(): string;
    setProtocol(value: string): void;

    getProtocolLabel(): string;
    setProtocolLabel(value: string): void;

    clearBoardsList(): void;
    getBoardsList(): Array<BoardListItem>;
    setBoardsList(value: Array<BoardListItem>): void;
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
    setInstance(value?: commands_common_pb.Instance): void;

    clearSearchArgsList(): void;
    getSearchArgsList(): Array<string>;
    setSearchArgsList(value: Array<string>): void;
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
    setBoardsList(value: Array<BoardListItem>): void;
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
    setName(value: string): void;

    getFqbn(): string;
    setFqbn(value: string): void;


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
