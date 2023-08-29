/* eslint-disable */
import type { CallContext, CallOptions } from 'nice-grpc-common';
import _m0 from 'protobufjs/minimal';
import { Instance } from '../../commands/v1/common';
import { Port } from '../../commands/v1/port';

/**
 * The top-level message sent by the client for the `Debug` method.
 * Multiple `DebugReq` messages can be sent but the first message
 * must contain a `DebugConfigReq` message to initialize the debug session.
 * All subsequent messages must contain bytes to be sent to the debug session
 * and must not contain a `DebugReq` message.
 */
export interface DebugRequest {
  /**
   * Provides information to the debug that specifies which is the target.
   * The first `StreamingOpenReq` message must contain a `DebugReq`
   * message.
   */
  debugRequest: DebugConfigRequest | undefined;
  /** The data to be sent to the target being monitored. */
  data: Uint8Array;
  /** Set this to true to send and Interrupt signal to the debugger process */
  sendInterrupt: boolean;
}

export interface DebugConfigRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /**
   * Fully qualified board name of the board in use
   * (e.g., `arduino:samd:mkr1000`). If this is omitted, the FQBN attached to
   * the sketch will be used.
   */
  fqbn: string;
  /**
   * Path to the sketch that is running on the board. The compiled executable
   * is expected to be located under this path.
   */
  sketchPath: string;
  /** Port of the debugger (optional). */
  port: Port | undefined;
  /** Which GDB command interpreter to use. */
  interpreter: string;
  /**
   * Directory containing the compiled executable. If `import_dir` is not
   * specified, the executable is assumed to be in
   * `{sketch_path}/build/{fqbn}/`.
   */
  importDir: string;
  /** The programmer to use for debugging. */
  programmer: string;
}

/**  */
export interface DebugResponse {
  /** Incoming data from the debugger tool. */
  data: Uint8Array;
  /** Incoming error output from the debugger tool. */
  error: string;
}

export interface GetDebugConfigResponse {
  /** The executable binary to debug */
  executable: string;
  /** The toolchain type used for the build (for example "gcc") */
  toolchain: string;
  /** The toolchain directory */
  toolchainPath: string;
  /** The toolchain architecture prefix (for example "arm-none-eabi-") */
  toolchainPrefix: string;
  /**
   * The GDB server type used to connect to the programmer/board (for example
   * "openocd")
   */
  server: string;
  /** The GDB server directory */
  serverPath: string;
  /** Extra configuration parameters wrt toolchain */
  toolchainConfiguration: { [key: string]: string };
  /** Extra configuration parameters wrt GDB server */
  serverConfiguration: { [key: string]: string };
}

export interface GetDebugConfigResponse_ToolchainConfigurationEntry {
  key: string;
  value: string;
}

export interface GetDebugConfigResponse_ServerConfigurationEntry {
  key: string;
  value: string;
}

function createBaseDebugRequest(): DebugRequest {
  return {
    debugRequest: undefined,
    data: new Uint8Array(0),
    sendInterrupt: false,
  };
}

export const DebugRequest = {
  encode(
    message: DebugRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.debugRequest !== undefined) {
      DebugConfigRequest.encode(
        message.debugRequest,
        writer.uint32(10).fork()
      ).ldelim();
    }
    if (message.data.length !== 0) {
      writer.uint32(18).bytes(message.data);
    }
    if (message.sendInterrupt === true) {
      writer.uint32(24).bool(message.sendInterrupt);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DebugRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDebugRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.debugRequest = DebugConfigRequest.decode(
            reader,
            reader.uint32()
          );
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.data = reader.bytes();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.sendInterrupt = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DebugRequest {
    return {
      debugRequest: isSet(object.debugRequest)
        ? DebugConfigRequest.fromJSON(object.debugRequest)
        : undefined,
      data: isSet(object.data)
        ? bytesFromBase64(object.data)
        : new Uint8Array(0),
      sendInterrupt: isSet(object.sendInterrupt)
        ? Boolean(object.sendInterrupt)
        : false,
    };
  },

  toJSON(message: DebugRequest): unknown {
    const obj: any = {};
    if (message.debugRequest !== undefined) {
      obj.debugRequest = DebugConfigRequest.toJSON(message.debugRequest);
    }
    if (message.data.length !== 0) {
      obj.data = base64FromBytes(message.data);
    }
    if (message.sendInterrupt === true) {
      obj.sendInterrupt = message.sendInterrupt;
    }
    return obj;
  },

  create(base?: DeepPartial<DebugRequest>): DebugRequest {
    return DebugRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<DebugRequest>): DebugRequest {
    const message = createBaseDebugRequest();
    message.debugRequest =
      object.debugRequest !== undefined && object.debugRequest !== null
        ? DebugConfigRequest.fromPartial(object.debugRequest)
        : undefined;
    message.data = object.data ?? new Uint8Array(0);
    message.sendInterrupt = object.sendInterrupt ?? false;
    return message;
  },
};

function createBaseDebugConfigRequest(): DebugConfigRequest {
  return {
    instance: undefined,
    fqbn: '',
    sketchPath: '',
    port: undefined,
    interpreter: '',
    importDir: '',
    programmer: '',
  };
}

export const DebugConfigRequest = {
  encode(
    message: DebugConfigRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.fqbn !== '') {
      writer.uint32(18).string(message.fqbn);
    }
    if (message.sketchPath !== '') {
      writer.uint32(26).string(message.sketchPath);
    }
    if (message.port !== undefined) {
      Port.encode(message.port, writer.uint32(34).fork()).ldelim();
    }
    if (message.interpreter !== '') {
      writer.uint32(42).string(message.interpreter);
    }
    if (message.importDir !== '') {
      writer.uint32(66).string(message.importDir);
    }
    if (message.programmer !== '') {
      writer.uint32(74).string(message.programmer);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DebugConfigRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDebugConfigRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.instance = Instance.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.fqbn = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.sketchPath = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.port = Port.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.interpreter = reader.string();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.importDir = reader.string();
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.programmer = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DebugConfigRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      fqbn: isSet(object.fqbn) ? String(object.fqbn) : '',
      sketchPath: isSet(object.sketchPath) ? String(object.sketchPath) : '',
      port: isSet(object.port) ? Port.fromJSON(object.port) : undefined,
      interpreter: isSet(object.interpreter) ? String(object.interpreter) : '',
      importDir: isSet(object.importDir) ? String(object.importDir) : '',
      programmer: isSet(object.programmer) ? String(object.programmer) : '',
    };
  },

  toJSON(message: DebugConfigRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.fqbn !== '') {
      obj.fqbn = message.fqbn;
    }
    if (message.sketchPath !== '') {
      obj.sketchPath = message.sketchPath;
    }
    if (message.port !== undefined) {
      obj.port = Port.toJSON(message.port);
    }
    if (message.interpreter !== '') {
      obj.interpreter = message.interpreter;
    }
    if (message.importDir !== '') {
      obj.importDir = message.importDir;
    }
    if (message.programmer !== '') {
      obj.programmer = message.programmer;
    }
    return obj;
  },

  create(base?: DeepPartial<DebugConfigRequest>): DebugConfigRequest {
    return DebugConfigRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<DebugConfigRequest>): DebugConfigRequest {
    const message = createBaseDebugConfigRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.fqbn = object.fqbn ?? '';
    message.sketchPath = object.sketchPath ?? '';
    message.port =
      object.port !== undefined && object.port !== null
        ? Port.fromPartial(object.port)
        : undefined;
    message.interpreter = object.interpreter ?? '';
    message.importDir = object.importDir ?? '';
    message.programmer = object.programmer ?? '';
    return message;
  },
};

function createBaseDebugResponse(): DebugResponse {
  return { data: new Uint8Array(0), error: '' };
}

export const DebugResponse = {
  encode(
    message: DebugResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.data.length !== 0) {
      writer.uint32(10).bytes(message.data);
    }
    if (message.error !== '') {
      writer.uint32(18).string(message.error);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DebugResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDebugResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.data = reader.bytes();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.error = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DebugResponse {
    return {
      data: isSet(object.data)
        ? bytesFromBase64(object.data)
        : new Uint8Array(0),
      error: isSet(object.error) ? String(object.error) : '',
    };
  },

  toJSON(message: DebugResponse): unknown {
    const obj: any = {};
    if (message.data.length !== 0) {
      obj.data = base64FromBytes(message.data);
    }
    if (message.error !== '') {
      obj.error = message.error;
    }
    return obj;
  },

  create(base?: DeepPartial<DebugResponse>): DebugResponse {
    return DebugResponse.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<DebugResponse>): DebugResponse {
    const message = createBaseDebugResponse();
    message.data = object.data ?? new Uint8Array(0);
    message.error = object.error ?? '';
    return message;
  },
};

function createBaseGetDebugConfigResponse(): GetDebugConfigResponse {
  return {
    executable: '',
    toolchain: '',
    toolchainPath: '',
    toolchainPrefix: '',
    server: '',
    serverPath: '',
    toolchainConfiguration: {},
    serverConfiguration: {},
  };
}

export const GetDebugConfigResponse = {
  encode(
    message: GetDebugConfigResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.executable !== '') {
      writer.uint32(10).string(message.executable);
    }
    if (message.toolchain !== '') {
      writer.uint32(18).string(message.toolchain);
    }
    if (message.toolchainPath !== '') {
      writer.uint32(26).string(message.toolchainPath);
    }
    if (message.toolchainPrefix !== '') {
      writer.uint32(34).string(message.toolchainPrefix);
    }
    if (message.server !== '') {
      writer.uint32(42).string(message.server);
    }
    if (message.serverPath !== '') {
      writer.uint32(50).string(message.serverPath);
    }
    Object.entries(message.toolchainConfiguration).forEach(([key, value]) => {
      GetDebugConfigResponse_ToolchainConfigurationEntry.encode(
        { key: key as any, value },
        writer.uint32(58).fork()
      ).ldelim();
    });
    Object.entries(message.serverConfiguration).forEach(([key, value]) => {
      GetDebugConfigResponse_ServerConfigurationEntry.encode(
        { key: key as any, value },
        writer.uint32(66).fork()
      ).ldelim();
    });
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): GetDebugConfigResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetDebugConfigResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.executable = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.toolchain = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.toolchainPath = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.toolchainPrefix = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.server = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.serverPath = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          const entry7 =
            GetDebugConfigResponse_ToolchainConfigurationEntry.decode(
              reader,
              reader.uint32()
            );
          if (entry7.value !== undefined) {
            message.toolchainConfiguration[entry7.key] = entry7.value;
          }
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          const entry8 = GetDebugConfigResponse_ServerConfigurationEntry.decode(
            reader,
            reader.uint32()
          );
          if (entry8.value !== undefined) {
            message.serverConfiguration[entry8.key] = entry8.value;
          }
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetDebugConfigResponse {
    return {
      executable: isSet(object.executable) ? String(object.executable) : '',
      toolchain: isSet(object.toolchain) ? String(object.toolchain) : '',
      toolchainPath: isSet(object.toolchainPath)
        ? String(object.toolchainPath)
        : '',
      toolchainPrefix: isSet(object.toolchainPrefix)
        ? String(object.toolchainPrefix)
        : '',
      server: isSet(object.server) ? String(object.server) : '',
      serverPath: isSet(object.serverPath) ? String(object.serverPath) : '',
      toolchainConfiguration: isObject(object.toolchainConfiguration)
        ? Object.entries(object.toolchainConfiguration).reduce<{
            [key: string]: string;
          }>((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {})
        : {},
      serverConfiguration: isObject(object.serverConfiguration)
        ? Object.entries(object.serverConfiguration).reduce<{
            [key: string]: string;
          }>((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {})
        : {},
    };
  },

  toJSON(message: GetDebugConfigResponse): unknown {
    const obj: any = {};
    if (message.executable !== '') {
      obj.executable = message.executable;
    }
    if (message.toolchain !== '') {
      obj.toolchain = message.toolchain;
    }
    if (message.toolchainPath !== '') {
      obj.toolchainPath = message.toolchainPath;
    }
    if (message.toolchainPrefix !== '') {
      obj.toolchainPrefix = message.toolchainPrefix;
    }
    if (message.server !== '') {
      obj.server = message.server;
    }
    if (message.serverPath !== '') {
      obj.serverPath = message.serverPath;
    }
    if (message.toolchainConfiguration) {
      const entries = Object.entries(message.toolchainConfiguration);
      if (entries.length > 0) {
        obj.toolchainConfiguration = {};
        entries.forEach(([k, v]) => {
          obj.toolchainConfiguration[k] = v;
        });
      }
    }
    if (message.serverConfiguration) {
      const entries = Object.entries(message.serverConfiguration);
      if (entries.length > 0) {
        obj.serverConfiguration = {};
        entries.forEach(([k, v]) => {
          obj.serverConfiguration[k] = v;
        });
      }
    }
    return obj;
  },

  create(base?: DeepPartial<GetDebugConfigResponse>): GetDebugConfigResponse {
    return GetDebugConfigResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<GetDebugConfigResponse>
  ): GetDebugConfigResponse {
    const message = createBaseGetDebugConfigResponse();
    message.executable = object.executable ?? '';
    message.toolchain = object.toolchain ?? '';
    message.toolchainPath = object.toolchainPath ?? '';
    message.toolchainPrefix = object.toolchainPrefix ?? '';
    message.server = object.server ?? '';
    message.serverPath = object.serverPath ?? '';
    message.toolchainConfiguration = Object.entries(
      object.toolchainConfiguration ?? {}
    ).reduce<{ [key: string]: string }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});
    message.serverConfiguration = Object.entries(
      object.serverConfiguration ?? {}
    ).reduce<{ [key: string]: string }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});
    return message;
  },
};

function createBaseGetDebugConfigResponse_ToolchainConfigurationEntry(): GetDebugConfigResponse_ToolchainConfigurationEntry {
  return { key: '', value: '' };
}

export const GetDebugConfigResponse_ToolchainConfigurationEntry = {
  encode(
    message: GetDebugConfigResponse_ToolchainConfigurationEntry,
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
  ): GetDebugConfigResponse_ToolchainConfigurationEntry {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message =
      createBaseGetDebugConfigResponse_ToolchainConfigurationEntry();
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

  fromJSON(object: any): GetDebugConfigResponse_ToolchainConfigurationEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? String(object.value) : '',
    };
  },

  toJSON(message: GetDebugConfigResponse_ToolchainConfigurationEntry): unknown {
    const obj: any = {};
    if (message.key !== '') {
      obj.key = message.key;
    }
    if (message.value !== '') {
      obj.value = message.value;
    }
    return obj;
  },

  create(
    base?: DeepPartial<GetDebugConfigResponse_ToolchainConfigurationEntry>
  ): GetDebugConfigResponse_ToolchainConfigurationEntry {
    return GetDebugConfigResponse_ToolchainConfigurationEntry.fromPartial(
      base ?? {}
    );
  },
  fromPartial(
    object: DeepPartial<GetDebugConfigResponse_ToolchainConfigurationEntry>
  ): GetDebugConfigResponse_ToolchainConfigurationEntry {
    const message =
      createBaseGetDebugConfigResponse_ToolchainConfigurationEntry();
    message.key = object.key ?? '';
    message.value = object.value ?? '';
    return message;
  },
};

function createBaseGetDebugConfigResponse_ServerConfigurationEntry(): GetDebugConfigResponse_ServerConfigurationEntry {
  return { key: '', value: '' };
}

export const GetDebugConfigResponse_ServerConfigurationEntry = {
  encode(
    message: GetDebugConfigResponse_ServerConfigurationEntry,
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
  ): GetDebugConfigResponse_ServerConfigurationEntry {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetDebugConfigResponse_ServerConfigurationEntry();
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

  fromJSON(object: any): GetDebugConfigResponse_ServerConfigurationEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? String(object.value) : '',
    };
  },

  toJSON(message: GetDebugConfigResponse_ServerConfigurationEntry): unknown {
    const obj: any = {};
    if (message.key !== '') {
      obj.key = message.key;
    }
    if (message.value !== '') {
      obj.value = message.value;
    }
    return obj;
  },

  create(
    base?: DeepPartial<GetDebugConfigResponse_ServerConfigurationEntry>
  ): GetDebugConfigResponse_ServerConfigurationEntry {
    return GetDebugConfigResponse_ServerConfigurationEntry.fromPartial(
      base ?? {}
    );
  },
  fromPartial(
    object: DeepPartial<GetDebugConfigResponse_ServerConfigurationEntry>
  ): GetDebugConfigResponse_ServerConfigurationEntry {
    const message = createBaseGetDebugConfigResponse_ServerConfigurationEntry();
    message.key = object.key ?? '';
    message.value = object.value ?? '';
    return message;
  },
};

/** DebugService abstracts a debug Session usage */
export type DebugServiceDefinition = typeof DebugServiceDefinition;
export const DebugServiceDefinition = {
  name: 'DebugService',
  fullName: 'cc.arduino.cli.debug.v1.DebugService',
  methods: {
    /** Start a debug session and communicate with the debugger tool. */
    debug: {
      name: 'Debug',
      requestType: DebugRequest,
      requestStream: true,
      responseType: DebugResponse,
      responseStream: true,
      options: {},
    },
    getDebugConfig: {
      name: 'GetDebugConfig',
      requestType: DebugConfigRequest,
      requestStream: false,
      responseType: GetDebugConfigResponse,
      responseStream: false,
      options: {},
    },
  },
} as const;

export interface DebugServiceImplementation<CallContextExt = {}> {
  /** Start a debug session and communicate with the debugger tool. */
  debug(
    request: AsyncIterable<DebugRequest>,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<DebugResponse>>;
  getDebugConfig(
    request: DebugConfigRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<GetDebugConfigResponse>>;
}

export interface DebugServiceClient<CallOptionsExt = {}> {
  /** Start a debug session and communicate with the debugger tool. */
  debug(
    request: AsyncIterable<DeepPartial<DebugRequest>>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<DebugResponse>;
  getDebugConfig(
    request: DeepPartial<DebugConfigRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<GetDebugConfigResponse>;
}

declare const self: any | undefined;
declare const window: any | undefined;
declare const global: any | undefined;
const tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw 'Unable to locate global object';
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (tsProtoGlobalThis.Buffer) {
    return Uint8Array.from(tsProtoGlobalThis.Buffer.from(b64, 'base64'));
  } else {
    const bin = tsProtoGlobalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (tsProtoGlobalThis.Buffer) {
    return tsProtoGlobalThis.Buffer.from(arr).toString('base64');
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return tsProtoGlobalThis.btoa(bin.join(''));
  }
}

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

export type ServerStreamingMethodResult<Response> = {
  [Symbol.asyncIterator](): AsyncIterator<Response, void>;
};
