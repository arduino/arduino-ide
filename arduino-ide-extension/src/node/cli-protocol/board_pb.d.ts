// package: arduino
// file: board.proto

/* tslint:disable */

import * as jspb from "google-protobuf";
import * as common_pb from "./common_pb";

export class BoardDetailsReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): common_pb.Instance | undefined;
    setInstance(value?: common_pb.Instance): void;

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
        instance?: common_pb.Instance.AsObject,
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

export class BoardListReq extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): common_pb.Instance | undefined;
    setInstance(value?: common_pb.Instance): void;


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
        instance?: common_pb.Instance.AsObject,
    }
}

export class BoardListResp extends jspb.Message { 
    clearSerialList(): void;
    getSerialList(): Array<AttachedSerialBoard>;
    setSerialList(value: Array<AttachedSerialBoard>): void;
    addSerial(value?: AttachedSerialBoard, index?: number): AttachedSerialBoard;

    clearNetworkList(): void;
    getNetworkList(): Array<AttachedNetworkBoard>;
    setNetworkList(value: Array<AttachedNetworkBoard>): void;
    addNetwork(value?: AttachedNetworkBoard, index?: number): AttachedNetworkBoard;


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
        serialList: Array<AttachedSerialBoard.AsObject>,
        networkList: Array<AttachedNetworkBoard.AsObject>,
    }
}

export class AttachedNetworkBoard extends jspb.Message { 
    getName(): string;
    setName(value: string): void;

    getFqbn(): string;
    setFqbn(value: string): void;

    getInfo(): string;
    setInfo(value: string): void;

    getAddress(): string;
    setAddress(value: string): void;

    getPort(): number;
    setPort(value: number): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AttachedNetworkBoard.AsObject;
    static toObject(includeInstance: boolean, msg: AttachedNetworkBoard): AttachedNetworkBoard.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AttachedNetworkBoard, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AttachedNetworkBoard;
    static deserializeBinaryFromReader(message: AttachedNetworkBoard, reader: jspb.BinaryReader): AttachedNetworkBoard;
}

export namespace AttachedNetworkBoard {
    export type AsObject = {
        name: string,
        fqbn: string,
        info: string,
        address: string,
        port: number,
    }
}

export class AttachedSerialBoard extends jspb.Message { 
    getName(): string;
    setName(value: string): void;

    getFqbn(): string;
    setFqbn(value: string): void;

    getPort(): string;
    setPort(value: string): void;

    getSerialnumber(): string;
    setSerialnumber(value: string): void;

    getProductid(): string;
    setProductid(value: string): void;

    getVendorid(): string;
    setVendorid(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AttachedSerialBoard.AsObject;
    static toObject(includeInstance: boolean, msg: AttachedSerialBoard): AttachedSerialBoard.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AttachedSerialBoard, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AttachedSerialBoard;
    static deserializeBinaryFromReader(message: AttachedSerialBoard, reader: jspb.BinaryReader): AttachedSerialBoard;
}

export namespace AttachedSerialBoard {
    export type AsObject = {
        name: string,
        fqbn: string,
        port: string,
        serialnumber: string,
        productid: string,
        vendorid: string,
    }
}
