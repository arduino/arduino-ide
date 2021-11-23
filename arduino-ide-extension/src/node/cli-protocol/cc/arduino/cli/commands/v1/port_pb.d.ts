// package: cc.arduino.cli.commands.v1
// file: cc/arduino/cli/commands/v1/port.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class Port extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): Port;

    getLabel(): string;
    setLabel(value: string): Port;

    getProtocol(): string;
    setProtocol(value: string): Port;

    getProtocolLabel(): string;
    setProtocolLabel(value: string): Port;


    getPropertiesMap(): jspb.Map<string, string>;
    clearPropertiesMap(): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Port.AsObject;
    static toObject(includeInstance: boolean, msg: Port): Port.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Port, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Port;
    static deserializeBinaryFromReader(message: Port, reader: jspb.BinaryReader): Port;
}

export namespace Port {
    export type AsObject = {
        address: string,
        label: string,
        protocol: string,
        protocolLabel: string,

        propertiesMap: Array<[string, string]>,
    }
}
