/* eslint-disable */
import _m0 from 'protobufjs/minimal';

/** Port represents a board port that may be used to upload or to monitor a board */
export interface Port {
  /** Address of the port (e.g., `/dev/ttyACM0`). */
  address: string;
  /** The port label to show on the GUI (e.g. "ttyACM0") */
  label: string;
  /** Protocol of the port (e.g., `serial`, `network`, ...). */
  protocol: string;
  /** A human friendly description of the protocol (e.g., "Serial Port (USB)"). */
  protocolLabel: string;
  /** A set of properties of the port */
  properties: { [key: string]: string };
  /** The hardware ID (serial number) of the board attached to the port */
  hardwareId: string;
}

export interface Port_PropertiesEntry {
  key: string;
  value: string;
}

function createBasePort(): Port {
  return {
    address: '',
    label: '',
    protocol: '',
    protocolLabel: '',
    properties: {},
    hardwareId: '',
  };
}

export const Port = {
  encode(message: Port, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== '') {
      writer.uint32(10).string(message.address);
    }
    if (message.label !== '') {
      writer.uint32(18).string(message.label);
    }
    if (message.protocol !== '') {
      writer.uint32(26).string(message.protocol);
    }
    if (message.protocolLabel !== '') {
      writer.uint32(34).string(message.protocolLabel);
    }
    Object.entries(message.properties).forEach(([key, value]) => {
      Port_PropertiesEntry.encode(
        { key: key as any, value },
        writer.uint32(42).fork()
      ).ldelim();
    });
    if (message.hardwareId !== '') {
      writer.uint32(50).string(message.hardwareId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Port {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePort();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.address = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.label = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.protocol = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.protocolLabel = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          const entry5 = Port_PropertiesEntry.decode(reader, reader.uint32());
          if (entry5.value !== undefined) {
            message.properties[entry5.key] = entry5.value;
          }
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.hardwareId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Port {
    return {
      address: isSet(object.address) ? String(object.address) : '',
      label: isSet(object.label) ? String(object.label) : '',
      protocol: isSet(object.protocol) ? String(object.protocol) : '',
      protocolLabel: isSet(object.protocolLabel)
        ? String(object.protocolLabel)
        : '',
      properties: isObject(object.properties)
        ? Object.entries(object.properties).reduce<{ [key: string]: string }>(
            (acc, [key, value]) => {
              acc[key] = String(value);
              return acc;
            },
            {}
          )
        : {},
      hardwareId: isSet(object.hardwareId) ? String(object.hardwareId) : '',
    };
  },

  toJSON(message: Port): unknown {
    const obj: any = {};
    if (message.address !== '') {
      obj.address = message.address;
    }
    if (message.label !== '') {
      obj.label = message.label;
    }
    if (message.protocol !== '') {
      obj.protocol = message.protocol;
    }
    if (message.protocolLabel !== '') {
      obj.protocolLabel = message.protocolLabel;
    }
    if (message.properties) {
      const entries = Object.entries(message.properties);
      if (entries.length > 0) {
        obj.properties = {};
        entries.forEach(([k, v]) => {
          obj.properties[k] = v;
        });
      }
    }
    if (message.hardwareId !== '') {
      obj.hardwareId = message.hardwareId;
    }
    return obj;
  },

  create(base?: DeepPartial<Port>): Port {
    return Port.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<Port>): Port {
    const message = createBasePort();
    message.address = object.address ?? '';
    message.label = object.label ?? '';
    message.protocol = object.protocol ?? '';
    message.protocolLabel = object.protocolLabel ?? '';
    message.properties = Object.entries(object.properties ?? {}).reduce<{
      [key: string]: string;
    }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});
    message.hardwareId = object.hardwareId ?? '';
    return message;
  },
};

function createBasePort_PropertiesEntry(): Port_PropertiesEntry {
  return { key: '', value: '' };
}

export const Port_PropertiesEntry = {
  encode(
    message: Port_PropertiesEntry,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.key !== '') {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== '') {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): Port_PropertiesEntry {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePort_PropertiesEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.key = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Port_PropertiesEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? String(object.value) : '',
    };
  },

  toJSON(message: Port_PropertiesEntry): unknown {
    const obj: any = {};
    if (message.key !== '') {
      obj.key = message.key;
    }
    if (message.value !== '') {
      obj.value = message.value;
    }
    return obj;
  },

  create(base?: DeepPartial<Port_PropertiesEntry>): Port_PropertiesEntry {
    return Port_PropertiesEntry.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<Port_PropertiesEntry>): Port_PropertiesEntry {
    const message = createBasePort_PropertiesEntry();
    message.key = object.key ?? '';
    message.value = object.value ?? '';
    return message;
  },
};

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | boolean
  | undefined;

type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends { $case: string }
  ? { [K in keyof Omit<T, '$case'>]?: DeepPartial<T[K]> } & {
      $case: T['$case'];
    }
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

function isObject(value: any): boolean {
  return typeof value === 'object' && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
