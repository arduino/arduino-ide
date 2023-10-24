// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/board.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as cc_arduino_cli_commands_v1_common_pb from "../../../../../cc/arduino/cli/commands/v1/common_pb";
import * as cc_arduino_cli_commands_v1_port_pb from "../../../../../cc/arduino/cli/commands/v1/port_pb";

export class BoardDetailsRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): BoardDetailsRequest;
    getFqbn(): string;
    setFqbn(value: string): BoardDetailsRequest;
    getDoNotExpandBuildProperties(): boolean;
    setDoNotExpandBuildProperties(value: boolean): BoardDetailsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardDetailsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BoardDetailsRequest): BoardDetailsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardDetailsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardDetailsRequest;
    static deserializeBinaryFromReader(message: BoardDetailsRequest, reader: jspb.BinaryReader): BoardDetailsRequest;
}

export namespace BoardDetailsRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        fqbn: string,
        doNotExpandBuildProperties: boolean,
    }
}

export class BoardDetailsResponse extends jspb.Message { 
    getFqbn(): string;
    setFqbn(value: string): BoardDetailsResponse;
    getName(): string;
    setName(value: string): BoardDetailsResponse;
    getVersion(): string;
    setVersion(value: string): BoardDetailsResponse;
    getPropertiesId(): string;
    setPropertiesId(value: string): BoardDetailsResponse;
    getAlias(): string;
    setAlias(value: string): BoardDetailsResponse;
    getOfficial(): boolean;
    setOfficial(value: boolean): BoardDetailsResponse;
    getPinout(): string;
    setPinout(value: string): BoardDetailsResponse;

    hasPackage(): boolean;
    clearPackage(): void;
    getPackage(): Package | undefined;
    setPackage(value?: Package): BoardDetailsResponse;

    hasPlatform(): boolean;
    clearPlatform(): void;
    getPlatform(): BoardPlatform | undefined;
    setPlatform(value?: BoardPlatform): BoardDetailsResponse;
    clearToolsDependenciesList(): void;
    getToolsDependenciesList(): Array<ToolsDependencies>;
    setToolsDependenciesList(value: Array<ToolsDependencies>): BoardDetailsResponse;
    addToolsDependencies(value?: ToolsDependencies, index?: number): ToolsDependencies;
    clearConfigOptionsList(): void;
    getConfigOptionsList(): Array<ConfigOption>;
    setConfigOptionsList(value: Array<ConfigOption>): BoardDetailsResponse;
    addConfigOptions(value?: ConfigOption, index?: number): ConfigOption;
    clearProgrammersList(): void;
    getProgrammersList(): Array<cc_arduino_cli_commands_v1_common_pb.Programmer>;
    setProgrammersList(value: Array<cc_arduino_cli_commands_v1_common_pb.Programmer>): BoardDetailsResponse;
    addProgrammers(value?: cc_arduino_cli_commands_v1_common_pb.Programmer, index?: number): cc_arduino_cli_commands_v1_common_pb.Programmer;
    getDebuggingSupported(): boolean;
    setDebuggingSupported(value: boolean): BoardDetailsResponse;
    clearIdentificationPropertiesList(): void;
    getIdentificationPropertiesList(): Array<BoardIdentificationProperties>;
    setIdentificationPropertiesList(value: Array<BoardIdentificationProperties>): BoardDetailsResponse;
    addIdentificationProperties(value?: BoardIdentificationProperties, index?: number): BoardIdentificationProperties;
    clearBuildPropertiesList(): void;
    getBuildPropertiesList(): Array<string>;
    setBuildPropertiesList(value: Array<string>): BoardDetailsResponse;
    addBuildProperties(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardDetailsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BoardDetailsResponse): BoardDetailsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardDetailsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardDetailsResponse;
    static deserializeBinaryFromReader(message: BoardDetailsResponse, reader: jspb.BinaryReader): BoardDetailsResponse;
}

export namespace BoardDetailsResponse {
    export type AsObject = {
        fqbn: string,
        name: string,
        version: string,
        propertiesId: string,
        alias: string,
        official: boolean,
        pinout: string,
        pb_package?: Package.AsObject,
        platform?: BoardPlatform.AsObject,
        toolsDependenciesList: Array<ToolsDependencies.AsObject>,
        configOptionsList: Array<ConfigOption.AsObject>,
        programmersList: Array<cc_arduino_cli_commands_v1_common_pb.Programmer.AsObject>,
        debuggingSupported: boolean,
        identificationPropertiesList: Array<BoardIdentificationProperties.AsObject>,
        buildPropertiesList: Array<string>,
    }
}

export class BoardIdentificationProperties extends jspb.Message { 

    getPropertiesMap(): jspb.Map<string, string>;
    clearPropertiesMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardIdentificationProperties.AsObject;
    static toObject(includeInstance: boolean, msg: BoardIdentificationProperties): BoardIdentificationProperties.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardIdentificationProperties, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardIdentificationProperties;
    static deserializeBinaryFromReader(message: BoardIdentificationProperties, reader: jspb.BinaryReader): BoardIdentificationProperties;
}

export namespace BoardIdentificationProperties {
    export type AsObject = {

        propertiesMap: Array<[string, string]>,
    }
}

export class Package extends jspb.Message { 
    getMaintainer(): string;
    setMaintainer(value: string): Package;
    getUrl(): string;
    setUrl(value: string): Package;
    getWebsiteUrl(): string;
    setWebsiteUrl(value: string): Package;
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
        websiteUrl: string,
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
    getArchiveFilename(): string;
    setArchiveFilename(value: string): BoardPlatform;
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
        archiveFilename: string,
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
    getArchiveFilename(): string;
    setArchiveFilename(value: string): Systems;
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
        archiveFilename: string,
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

export class BoardListRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): BoardListRequest;
    getTimeout(): number;
    setTimeout(value: number): BoardListRequest;
    getFqbn(): string;
    setFqbn(value: string): BoardListRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardListRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BoardListRequest): BoardListRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardListRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardListRequest;
    static deserializeBinaryFromReader(message: BoardListRequest, reader: jspb.BinaryReader): BoardListRequest;
}

export namespace BoardListRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        timeout: number,
        fqbn: string,
    }
}

export class BoardListResponse extends jspb.Message { 
    clearPortsList(): void;
    getPortsList(): Array<DetectedPort>;
    setPortsList(value: Array<DetectedPort>): BoardListResponse;
    addPorts(value?: DetectedPort, index?: number): DetectedPort;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardListResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BoardListResponse): BoardListResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardListResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardListResponse;
    static deserializeBinaryFromReader(message: BoardListResponse, reader: jspb.BinaryReader): BoardListResponse;
}

export namespace BoardListResponse {
    export type AsObject = {
        portsList: Array<DetectedPort.AsObject>,
    }
}

export class DetectedPort extends jspb.Message { 
    clearMatchingBoardsList(): void;
    getMatchingBoardsList(): Array<BoardListItem>;
    setMatchingBoardsList(value: Array<BoardListItem>): DetectedPort;
    addMatchingBoards(value?: BoardListItem, index?: number): BoardListItem;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): cc_arduino_cli_commands_v1_port_pb.Port | undefined;
    setPort(value?: cc_arduino_cli_commands_v1_port_pb.Port): DetectedPort;

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
        matchingBoardsList: Array<BoardListItem.AsObject>,
        port?: cc_arduino_cli_commands_v1_port_pb.Port.AsObject,
    }
}

export class BoardListAllRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): BoardListAllRequest;
    clearSearchArgsList(): void;
    getSearchArgsList(): Array<string>;
    setSearchArgsList(value: Array<string>): BoardListAllRequest;
    addSearchArgs(value: string, index?: number): string;
    getIncludeHiddenBoards(): boolean;
    setIncludeHiddenBoards(value: boolean): BoardListAllRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardListAllRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BoardListAllRequest): BoardListAllRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardListAllRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardListAllRequest;
    static deserializeBinaryFromReader(message: BoardListAllRequest, reader: jspb.BinaryReader): BoardListAllRequest;
}

export namespace BoardListAllRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        searchArgsList: Array<string>,
        includeHiddenBoards: boolean,
    }
}

export class BoardListAllResponse extends jspb.Message { 
    clearBoardsList(): void;
    getBoardsList(): Array<BoardListItem>;
    setBoardsList(value: Array<BoardListItem>): BoardListAllResponse;
    addBoards(value?: BoardListItem, index?: number): BoardListItem;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardListAllResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BoardListAllResponse): BoardListAllResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardListAllResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardListAllResponse;
    static deserializeBinaryFromReader(message: BoardListAllResponse, reader: jspb.BinaryReader): BoardListAllResponse;
}

export namespace BoardListAllResponse {
    export type AsObject = {
        boardsList: Array<BoardListItem.AsObject>,
    }
}

export class BoardListWatchRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): BoardListWatchRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardListWatchRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BoardListWatchRequest): BoardListWatchRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardListWatchRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardListWatchRequest;
    static deserializeBinaryFromReader(message: BoardListWatchRequest, reader: jspb.BinaryReader): BoardListWatchRequest;
}

export namespace BoardListWatchRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
    }
}

export class BoardListWatchResponse extends jspb.Message { 
    getEventType(): string;
    setEventType(value: string): BoardListWatchResponse;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): DetectedPort | undefined;
    setPort(value?: DetectedPort): BoardListWatchResponse;
    getError(): string;
    setError(value: string): BoardListWatchResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardListWatchResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BoardListWatchResponse): BoardListWatchResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardListWatchResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardListWatchResponse;
    static deserializeBinaryFromReader(message: BoardListWatchResponse, reader: jspb.BinaryReader): BoardListWatchResponse;
}

export namespace BoardListWatchResponse {
    export type AsObject = {
        eventType: string,
        port?: DetectedPort.AsObject,
        error: string,
    }
}

export class BoardListItem extends jspb.Message { 
    getName(): string;
    setName(value: string): BoardListItem;
    getFqbn(): string;
    setFqbn(value: string): BoardListItem;
    getIsHidden(): boolean;
    setIsHidden(value: boolean): BoardListItem;

    hasPlatform(): boolean;
    clearPlatform(): void;
    getPlatform(): cc_arduino_cli_commands_v1_common_pb.Platform | undefined;
    setPlatform(value?: cc_arduino_cli_commands_v1_common_pb.Platform): BoardListItem;

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
        isHidden: boolean,
        platform?: cc_arduino_cli_commands_v1_common_pb.Platform.AsObject,
    }
}

export class BoardSearchRequest extends jspb.Message { 

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): cc_arduino_cli_commands_v1_common_pb.Instance | undefined;
    setInstance(value?: cc_arduino_cli_commands_v1_common_pb.Instance): BoardSearchRequest;
    getSearchArgs(): string;
    setSearchArgs(value: string): BoardSearchRequest;
    getIncludeHiddenBoards(): boolean;
    setIncludeHiddenBoards(value: boolean): BoardSearchRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardSearchRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BoardSearchRequest): BoardSearchRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardSearchRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardSearchRequest;
    static deserializeBinaryFromReader(message: BoardSearchRequest, reader: jspb.BinaryReader): BoardSearchRequest;
}

export namespace BoardSearchRequest {
    export type AsObject = {
        instance?: cc_arduino_cli_commands_v1_common_pb.Instance.AsObject,
        searchArgs: string,
        includeHiddenBoards: boolean,
    }
}

export class BoardSearchResponse extends jspb.Message { 
    clearBoardsList(): void;
    getBoardsList(): Array<BoardListItem>;
    setBoardsList(value: Array<BoardListItem>): BoardSearchResponse;
    addBoards(value?: BoardListItem, index?: number): BoardListItem;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BoardSearchResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BoardSearchResponse): BoardSearchResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BoardSearchResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BoardSearchResponse;
    static deserializeBinaryFromReader(message: BoardSearchResponse, reader: jspb.BinaryReader): BoardSearchResponse;
}

export namespace BoardSearchResponse {
    export type AsObject = {
        boardsList: Array<BoardListItem.AsObject>,
    }
}
