/* eslint-disable */
import _m0 from 'protobufjs/minimal';
import { Instance, Programmer } from './common';
import { Port } from './port';

export interface UploadRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /**
   * Fully qualified board name of the target board (e.g., `arduino:avr:uno`).
   * If this field is not defined, the FQBN of the board attached to the sketch
   * via the `BoardAttach` method is used.
   */
  fqbn: string;
  /**
   * Path where the sketch to be uploaded is stored. Unless the `import_file`
   * field is defined, the compiled binary is assumed to be at the location and
   * filename under this path where it is saved by the `Compile` method.
   */
  sketchPath: string;
  /** The port of the board. */
  port: Port | undefined;
  /** Whether to turn on verbose output during the upload. */
  verbose: boolean;
  /**
   * After upload, verify that the contents of the memory on the board match the
   * uploaded binary.
   */
  verify: boolean;
  /**
   * When `import_file` is specified, it overrides the `import_dir` and
   * `sketch_path` params.
   */
  importFile: string;
  /**
   * Custom path to a directory containing compiled files. When `import_dir` is
   * not specified, the standard build directory under `sketch_path` is used.
   */
  importDir: string;
  /**
   * The programmer to use for upload. If set an UploadUsingProgrammer is
   * triggered instead of a normal upload. The UploadUsingProgrammer call may
   * also be used for explicit error check.
   */
  programmer: string;
  /**
   * If set to true, the actual upload will not be performed but a trace output
   * will be printed stdout. This is for debugging purposes.
   */
  dryRun: boolean;
  /**
   * User provided fields usually used by upload tools that need authentication
   * or in any case fields that can be customized by the user at upload time
   * and cannot be known previously.
   * For more info:
   * https://arduino.github.io/arduino-cli/latest/platform-specification/#user-provided-fields
   */
  userFields: { [key: string]: string };
}

export interface UploadRequest_UserFieldsEntry {
  key: string;
  value: string;
}

export interface UploadResponse {
  message?:
    | { $case: 'outStream'; outStream: Uint8Array }
    | { $case: 'errStream'; errStream: Uint8Array }
    | {
        $case: 'result';
        result: UploadResult;
      }
    | undefined;
}

export interface UploadResult {
  /**
   * When a board requires a port disconnection to perform the upload, this
   * field returns the port where the board reconnects after the upload.
   */
  updatedUploadPort: Port | undefined;
}

export interface ProgrammerIsRequiredForUploadError {}

export interface UploadUsingProgrammerRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /**
   * Fully qualified board name of the target board (e.g., `arduino:avr:uno`).
   * If this field is not defined, the FQBN of the board attached to the sketch
   * via the `BoardAttach` method is used.
   */
  fqbn: string;
  /**
   * Path where the sketch to be uploaded is stored. Unless the `import_file`
   * field is defined, the compiled binary is assumed to be at the location and
   * filename under this path where it is saved by the `Compile` method.
   */
  sketchPath: string;
  /** The port of the board. */
  port: Port | undefined;
  /** Whether to turn on verbose output during the upload. */
  verbose: boolean;
  /**
   * After upload, verify that the contents of the memory on the board match the
   * uploaded binary.
   */
  verify: boolean;
  /**
   * When `import_file` is specified, it overrides the `import_dir` and
   * `sketch_path` params.
   */
  importFile: string;
  /**
   * Custom path to a directory containing compiled files. When `import_dir` is
   * not specified, the standard build directory under `sketch_path` is used.
   */
  importDir: string;
  /** The programmer to use for upload. */
  programmer: string;
  /**
   * If set to true, the actual upload will not be performed but a trace output
   * will be printed stdout. This is for debugging purposes.
   */
  dryRun: boolean;
  /**
   * User provided fields usually used by upload tools that need authentication
   * or in any case fields that can be customized by the user at upload time
   * and cannot be known previously.
   * For more info:
   * https://arduino.github.io/arduino-cli/latest/platform-specification/#user-provided-fields
   */
  userFields: { [key: string]: string };
}

export interface UploadUsingProgrammerRequest_UserFieldsEntry {
  key: string;
  value: string;
}

export interface UploadUsingProgrammerResponse {
  /** The output of the upload process. */
  outStream: Uint8Array;
  /** The error output of the upload process. */
  errStream: Uint8Array;
}

export interface BurnBootloaderRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /** Fully qualified board name of the target board (e.g., `arduino:avr:uno`). */
  fqbn: string;
  /** The port of the programmer used to program the bootloader. */
  port: Port | undefined;
  /** Whether to turn on verbose output during the programming. */
  verbose: boolean;
  /**
   * After programming, verify the contents of the memory on the board match the
   * uploaded binary.
   */
  verify: boolean;
  /** The programmer to use for burning bootloader. */
  programmer: string;
  /**
   * If set to true, the actual upload will not be performed but a trace output
   * will be printed stdout. This is for debugging purposes.
   */
  dryRun: boolean;
  /**
   * User provided fields usually used by upload tools that need authentication
   * or in any case fields that can be customized by the user at upload time
   * and cannot be known previously.
   * For more info:
   * https://arduino.github.io/arduino-cli/latest/platform-specification/#user-provided-fields
   */
  userFields: { [key: string]: string };
}

export interface BurnBootloaderRequest_UserFieldsEntry {
  key: string;
  value: string;
}

export interface BurnBootloaderResponse {
  /** The output of the burn bootloader process. */
  outStream: Uint8Array;
  /** The error output of the burn bootloader process. */
  errStream: Uint8Array;
}

export interface ListProgrammersAvailableForUploadRequest {
  instance: Instance | undefined;
  fqbn: string;
}

export interface ListProgrammersAvailableForUploadResponse {
  programmers: Programmer[];
}

export interface SupportedUserFieldsRequest {
  instance: Instance | undefined;
  fqbn: string;
  /**
   * Protocol that will be used to upload, this information is
   * necessary to pick the right upload tool for the board specified
   * with the FQBN.
   */
  protocol: string;
}

export interface UserField {
  /** Id of the tool that supports this field */
  toolId: string;
  /** Name used internally to store and retrieve this field */
  name: string;
  /** Label is the text shown to the user when they need to input this field */
  label: string;
  /**
   * True if the value of the field must not be shown when typing, for example
   * when the user inputs a network password
   */
  secret: boolean;
}

export interface SupportedUserFieldsResponse {
  /**
   * User fields supported by board specified in SupportedUserFieldsRequest.
   * If board doesn't support any field it will be empty.
   */
  userFields: UserField[];
}

function createBaseUploadRequest(): UploadRequest {
  return {
    instance: undefined,
    fqbn: '',
    sketchPath: '',
    port: undefined,
    verbose: false,
    verify: false,
    importFile: '',
    importDir: '',
    programmer: '',
    dryRun: false,
    userFields: {},
  };
}

export const UploadRequest = {
  encode(
    message: UploadRequest,
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
    if (message.verbose === true) {
      writer.uint32(40).bool(message.verbose);
    }
    if (message.verify === true) {
      writer.uint32(48).bool(message.verify);
    }
    if (message.importFile !== '') {
      writer.uint32(58).string(message.importFile);
    }
    if (message.importDir !== '') {
      writer.uint32(66).string(message.importDir);
    }
    if (message.programmer !== '') {
      writer.uint32(74).string(message.programmer);
    }
    if (message.dryRun === true) {
      writer.uint32(80).bool(message.dryRun);
    }
    Object.entries(message.userFields).forEach(([key, value]) => {
      UploadRequest_UserFieldsEntry.encode(
        { key: key as any, value },
        writer.uint32(90).fork()
      ).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UploadRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUploadRequest();
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
          if (tag !== 40) {
            break;
          }

          message.verbose = reader.bool();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.verify = reader.bool();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.importFile = reader.string();
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
        case 10:
          if (tag !== 80) {
            break;
          }

          message.dryRun = reader.bool();
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          const entry11 = UploadRequest_UserFieldsEntry.decode(
            reader,
            reader.uint32()
          );
          if (entry11.value !== undefined) {
            message.userFields[entry11.key] = entry11.value;
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

  fromJSON(object: any): UploadRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      fqbn: isSet(object.fqbn) ? String(object.fqbn) : '',
      sketchPath: isSet(object.sketchPath) ? String(object.sketchPath) : '',
      port: isSet(object.port) ? Port.fromJSON(object.port) : undefined,
      verbose: isSet(object.verbose) ? Boolean(object.verbose) : false,
      verify: isSet(object.verify) ? Boolean(object.verify) : false,
      importFile: isSet(object.importFile) ? String(object.importFile) : '',
      importDir: isSet(object.importDir) ? String(object.importDir) : '',
      programmer: isSet(object.programmer) ? String(object.programmer) : '',
      dryRun: isSet(object.dryRun) ? Boolean(object.dryRun) : false,
      userFields: isObject(object.userFields)
        ? Object.entries(object.userFields).reduce<{ [key: string]: string }>(
            (acc, [key, value]) => {
              acc[key] = String(value);
              return acc;
            },
            {}
          )
        : {},
    };
  },

  toJSON(message: UploadRequest): unknown {
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
    if (message.verbose === true) {
      obj.verbose = message.verbose;
    }
    if (message.verify === true) {
      obj.verify = message.verify;
    }
    if (message.importFile !== '') {
      obj.importFile = message.importFile;
    }
    if (message.importDir !== '') {
      obj.importDir = message.importDir;
    }
    if (message.programmer !== '') {
      obj.programmer = message.programmer;
    }
    if (message.dryRun === true) {
      obj.dryRun = message.dryRun;
    }
    if (message.userFields) {
      const entries = Object.entries(message.userFields);
      if (entries.length > 0) {
        obj.userFields = {};
        entries.forEach(([k, v]) => {
          obj.userFields[k] = v;
        });
      }
    }
    return obj;
  },

  create(base?: DeepPartial<UploadRequest>): UploadRequest {
    return UploadRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<UploadRequest>): UploadRequest {
    const message = createBaseUploadRequest();
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
    message.verbose = object.verbose ?? false;
    message.verify = object.verify ?? false;
    message.importFile = object.importFile ?? '';
    message.importDir = object.importDir ?? '';
    message.programmer = object.programmer ?? '';
    message.dryRun = object.dryRun ?? false;
    message.userFields = Object.entries(object.userFields ?? {}).reduce<{
      [key: string]: string;
    }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});
    return message;
  },
};

function createBaseUploadRequest_UserFieldsEntry(): UploadRequest_UserFieldsEntry {
  return { key: '', value: '' };
}

export const UploadRequest_UserFieldsEntry = {
  encode(
    message: UploadRequest_UserFieldsEntry,
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
  ): UploadRequest_UserFieldsEntry {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUploadRequest_UserFieldsEntry();
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

  fromJSON(object: any): UploadRequest_UserFieldsEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? String(object.value) : '',
    };
  },

  toJSON(message: UploadRequest_UserFieldsEntry): unknown {
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
    base?: DeepPartial<UploadRequest_UserFieldsEntry>
  ): UploadRequest_UserFieldsEntry {
    return UploadRequest_UserFieldsEntry.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<UploadRequest_UserFieldsEntry>
  ): UploadRequest_UserFieldsEntry {
    const message = createBaseUploadRequest_UserFieldsEntry();
    message.key = object.key ?? '';
    message.value = object.value ?? '';
    return message;
  },
};

function createBaseUploadResponse(): UploadResponse {
  return { message: undefined };
}

export const UploadResponse = {
  encode(
    message: UploadResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    switch (message.message?.$case) {
      case 'outStream':
        writer.uint32(10).bytes(message.message.outStream);
        break;
      case 'errStream':
        writer.uint32(18).bytes(message.message.errStream);
        break;
      case 'result':
        UploadResult.encode(
          message.message.result,
          writer.uint32(26).fork()
        ).ldelim();
        break;
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UploadResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUploadResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.message = { $case: 'outStream', outStream: reader.bytes() };
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.message = { $case: 'errStream', errStream: reader.bytes() };
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.message = {
            $case: 'result',
            result: UploadResult.decode(reader, reader.uint32()),
          };
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UploadResponse {
    return {
      message: isSet(object.outStream)
        ? { $case: 'outStream', outStream: bytesFromBase64(object.outStream) }
        : isSet(object.errStream)
        ? { $case: 'errStream', errStream: bytesFromBase64(object.errStream) }
        : isSet(object.result)
        ? { $case: 'result', result: UploadResult.fromJSON(object.result) }
        : undefined,
    };
  },

  toJSON(message: UploadResponse): unknown {
    const obj: any = {};
    if (message.message?.$case === 'outStream') {
      obj.outStream = base64FromBytes(message.message.outStream);
    }
    if (message.message?.$case === 'errStream') {
      obj.errStream = base64FromBytes(message.message.errStream);
    }
    if (message.message?.$case === 'result') {
      obj.result = UploadResult.toJSON(message.message.result);
    }
    return obj;
  },

  create(base?: DeepPartial<UploadResponse>): UploadResponse {
    return UploadResponse.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<UploadResponse>): UploadResponse {
    const message = createBaseUploadResponse();
    if (
      object.message?.$case === 'outStream' &&
      object.message?.outStream !== undefined &&
      object.message?.outStream !== null
    ) {
      message.message = {
        $case: 'outStream',
        outStream: object.message.outStream,
      };
    }
    if (
      object.message?.$case === 'errStream' &&
      object.message?.errStream !== undefined &&
      object.message?.errStream !== null
    ) {
      message.message = {
        $case: 'errStream',
        errStream: object.message.errStream,
      };
    }
    if (
      object.message?.$case === 'result' &&
      object.message?.result !== undefined &&
      object.message?.result !== null
    ) {
      message.message = {
        $case: 'result',
        result: UploadResult.fromPartial(object.message.result),
      };
    }
    return message;
  },
};

function createBaseUploadResult(): UploadResult {
  return { updatedUploadPort: undefined };
}

export const UploadResult = {
  encode(
    message: UploadResult,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.updatedUploadPort !== undefined) {
      Port.encode(message.updatedUploadPort, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UploadResult {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUploadResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.updatedUploadPort = Port.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UploadResult {
    return {
      updatedUploadPort: isSet(object.updatedUploadPort)
        ? Port.fromJSON(object.updatedUploadPort)
        : undefined,
    };
  },

  toJSON(message: UploadResult): unknown {
    const obj: any = {};
    if (message.updatedUploadPort !== undefined) {
      obj.updatedUploadPort = Port.toJSON(message.updatedUploadPort);
    }
    return obj;
  },

  create(base?: DeepPartial<UploadResult>): UploadResult {
    return UploadResult.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<UploadResult>): UploadResult {
    const message = createBaseUploadResult();
    message.updatedUploadPort =
      object.updatedUploadPort !== undefined &&
      object.updatedUploadPort !== null
        ? Port.fromPartial(object.updatedUploadPort)
        : undefined;
    return message;
  },
};

function createBaseProgrammerIsRequiredForUploadError(): ProgrammerIsRequiredForUploadError {
  return {};
}

export const ProgrammerIsRequiredForUploadError = {
  encode(
    _: ProgrammerIsRequiredForUploadError,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): ProgrammerIsRequiredForUploadError {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProgrammerIsRequiredForUploadError();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): ProgrammerIsRequiredForUploadError {
    return {};
  },

  toJSON(_: ProgrammerIsRequiredForUploadError): unknown {
    const obj: any = {};
    return obj;
  },

  create(
    base?: DeepPartial<ProgrammerIsRequiredForUploadError>
  ): ProgrammerIsRequiredForUploadError {
    return ProgrammerIsRequiredForUploadError.fromPartial(base ?? {});
  },
  fromPartial(
    _: DeepPartial<ProgrammerIsRequiredForUploadError>
  ): ProgrammerIsRequiredForUploadError {
    const message = createBaseProgrammerIsRequiredForUploadError();
    return message;
  },
};

function createBaseUploadUsingProgrammerRequest(): UploadUsingProgrammerRequest {
  return {
    instance: undefined,
    fqbn: '',
    sketchPath: '',
    port: undefined,
    verbose: false,
    verify: false,
    importFile: '',
    importDir: '',
    programmer: '',
    dryRun: false,
    userFields: {},
  };
}

export const UploadUsingProgrammerRequest = {
  encode(
    message: UploadUsingProgrammerRequest,
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
    if (message.verbose === true) {
      writer.uint32(40).bool(message.verbose);
    }
    if (message.verify === true) {
      writer.uint32(48).bool(message.verify);
    }
    if (message.importFile !== '') {
      writer.uint32(58).string(message.importFile);
    }
    if (message.importDir !== '') {
      writer.uint32(66).string(message.importDir);
    }
    if (message.programmer !== '') {
      writer.uint32(74).string(message.programmer);
    }
    if (message.dryRun === true) {
      writer.uint32(80).bool(message.dryRun);
    }
    Object.entries(message.userFields).forEach(([key, value]) => {
      UploadUsingProgrammerRequest_UserFieldsEntry.encode(
        { key: key as any, value },
        writer.uint32(90).fork()
      ).ldelim();
    });
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): UploadUsingProgrammerRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUploadUsingProgrammerRequest();
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
          if (tag !== 40) {
            break;
          }

          message.verbose = reader.bool();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.verify = reader.bool();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.importFile = reader.string();
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
        case 10:
          if (tag !== 80) {
            break;
          }

          message.dryRun = reader.bool();
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          const entry11 = UploadUsingProgrammerRequest_UserFieldsEntry.decode(
            reader,
            reader.uint32()
          );
          if (entry11.value !== undefined) {
            message.userFields[entry11.key] = entry11.value;
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

  fromJSON(object: any): UploadUsingProgrammerRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      fqbn: isSet(object.fqbn) ? String(object.fqbn) : '',
      sketchPath: isSet(object.sketchPath) ? String(object.sketchPath) : '',
      port: isSet(object.port) ? Port.fromJSON(object.port) : undefined,
      verbose: isSet(object.verbose) ? Boolean(object.verbose) : false,
      verify: isSet(object.verify) ? Boolean(object.verify) : false,
      importFile: isSet(object.importFile) ? String(object.importFile) : '',
      importDir: isSet(object.importDir) ? String(object.importDir) : '',
      programmer: isSet(object.programmer) ? String(object.programmer) : '',
      dryRun: isSet(object.dryRun) ? Boolean(object.dryRun) : false,
      userFields: isObject(object.userFields)
        ? Object.entries(object.userFields).reduce<{ [key: string]: string }>(
            (acc, [key, value]) => {
              acc[key] = String(value);
              return acc;
            },
            {}
          )
        : {},
    };
  },

  toJSON(message: UploadUsingProgrammerRequest): unknown {
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
    if (message.verbose === true) {
      obj.verbose = message.verbose;
    }
    if (message.verify === true) {
      obj.verify = message.verify;
    }
    if (message.importFile !== '') {
      obj.importFile = message.importFile;
    }
    if (message.importDir !== '') {
      obj.importDir = message.importDir;
    }
    if (message.programmer !== '') {
      obj.programmer = message.programmer;
    }
    if (message.dryRun === true) {
      obj.dryRun = message.dryRun;
    }
    if (message.userFields) {
      const entries = Object.entries(message.userFields);
      if (entries.length > 0) {
        obj.userFields = {};
        entries.forEach(([k, v]) => {
          obj.userFields[k] = v;
        });
      }
    }
    return obj;
  },

  create(
    base?: DeepPartial<UploadUsingProgrammerRequest>
  ): UploadUsingProgrammerRequest {
    return UploadUsingProgrammerRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<UploadUsingProgrammerRequest>
  ): UploadUsingProgrammerRequest {
    const message = createBaseUploadUsingProgrammerRequest();
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
    message.verbose = object.verbose ?? false;
    message.verify = object.verify ?? false;
    message.importFile = object.importFile ?? '';
    message.importDir = object.importDir ?? '';
    message.programmer = object.programmer ?? '';
    message.dryRun = object.dryRun ?? false;
    message.userFields = Object.entries(object.userFields ?? {}).reduce<{
      [key: string]: string;
    }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});
    return message;
  },
};

function createBaseUploadUsingProgrammerRequest_UserFieldsEntry(): UploadUsingProgrammerRequest_UserFieldsEntry {
  return { key: '', value: '' };
}

export const UploadUsingProgrammerRequest_UserFieldsEntry = {
  encode(
    message: UploadUsingProgrammerRequest_UserFieldsEntry,
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
  ): UploadUsingProgrammerRequest_UserFieldsEntry {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUploadUsingProgrammerRequest_UserFieldsEntry();
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

  fromJSON(object: any): UploadUsingProgrammerRequest_UserFieldsEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? String(object.value) : '',
    };
  },

  toJSON(message: UploadUsingProgrammerRequest_UserFieldsEntry): unknown {
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
    base?: DeepPartial<UploadUsingProgrammerRequest_UserFieldsEntry>
  ): UploadUsingProgrammerRequest_UserFieldsEntry {
    return UploadUsingProgrammerRequest_UserFieldsEntry.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<UploadUsingProgrammerRequest_UserFieldsEntry>
  ): UploadUsingProgrammerRequest_UserFieldsEntry {
    const message = createBaseUploadUsingProgrammerRequest_UserFieldsEntry();
    message.key = object.key ?? '';
    message.value = object.value ?? '';
    return message;
  },
};

function createBaseUploadUsingProgrammerResponse(): UploadUsingProgrammerResponse {
  return { outStream: new Uint8Array(0), errStream: new Uint8Array(0) };
}

export const UploadUsingProgrammerResponse = {
  encode(
    message: UploadUsingProgrammerResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.outStream.length !== 0) {
      writer.uint32(10).bytes(message.outStream);
    }
    if (message.errStream.length !== 0) {
      writer.uint32(18).bytes(message.errStream);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): UploadUsingProgrammerResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUploadUsingProgrammerResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.outStream = reader.bytes();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.errStream = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UploadUsingProgrammerResponse {
    return {
      outStream: isSet(object.outStream)
        ? bytesFromBase64(object.outStream)
        : new Uint8Array(0),
      errStream: isSet(object.errStream)
        ? bytesFromBase64(object.errStream)
        : new Uint8Array(0),
    };
  },

  toJSON(message: UploadUsingProgrammerResponse): unknown {
    const obj: any = {};
    if (message.outStream.length !== 0) {
      obj.outStream = base64FromBytes(message.outStream);
    }
    if (message.errStream.length !== 0) {
      obj.errStream = base64FromBytes(message.errStream);
    }
    return obj;
  },

  create(
    base?: DeepPartial<UploadUsingProgrammerResponse>
  ): UploadUsingProgrammerResponse {
    return UploadUsingProgrammerResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<UploadUsingProgrammerResponse>
  ): UploadUsingProgrammerResponse {
    const message = createBaseUploadUsingProgrammerResponse();
    message.outStream = object.outStream ?? new Uint8Array(0);
    message.errStream = object.errStream ?? new Uint8Array(0);
    return message;
  },
};

function createBaseBurnBootloaderRequest(): BurnBootloaderRequest {
  return {
    instance: undefined,
    fqbn: '',
    port: undefined,
    verbose: false,
    verify: false,
    programmer: '',
    dryRun: false,
    userFields: {},
  };
}

export const BurnBootloaderRequest = {
  encode(
    message: BurnBootloaderRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.fqbn !== '') {
      writer.uint32(18).string(message.fqbn);
    }
    if (message.port !== undefined) {
      Port.encode(message.port, writer.uint32(26).fork()).ldelim();
    }
    if (message.verbose === true) {
      writer.uint32(32).bool(message.verbose);
    }
    if (message.verify === true) {
      writer.uint32(40).bool(message.verify);
    }
    if (message.programmer !== '') {
      writer.uint32(50).string(message.programmer);
    }
    if (message.dryRun === true) {
      writer.uint32(56).bool(message.dryRun);
    }
    Object.entries(message.userFields).forEach(([key, value]) => {
      BurnBootloaderRequest_UserFieldsEntry.encode(
        { key: key as any, value },
        writer.uint32(90).fork()
      ).ldelim();
    });
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): BurnBootloaderRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBurnBootloaderRequest();
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

          message.port = Port.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.verbose = reader.bool();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.verify = reader.bool();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.programmer = reader.string();
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.dryRun = reader.bool();
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          const entry11 = BurnBootloaderRequest_UserFieldsEntry.decode(
            reader,
            reader.uint32()
          );
          if (entry11.value !== undefined) {
            message.userFields[entry11.key] = entry11.value;
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

  fromJSON(object: any): BurnBootloaderRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      fqbn: isSet(object.fqbn) ? String(object.fqbn) : '',
      port: isSet(object.port) ? Port.fromJSON(object.port) : undefined,
      verbose: isSet(object.verbose) ? Boolean(object.verbose) : false,
      verify: isSet(object.verify) ? Boolean(object.verify) : false,
      programmer: isSet(object.programmer) ? String(object.programmer) : '',
      dryRun: isSet(object.dryRun) ? Boolean(object.dryRun) : false,
      userFields: isObject(object.userFields)
        ? Object.entries(object.userFields).reduce<{ [key: string]: string }>(
            (acc, [key, value]) => {
              acc[key] = String(value);
              return acc;
            },
            {}
          )
        : {},
    };
  },

  toJSON(message: BurnBootloaderRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.fqbn !== '') {
      obj.fqbn = message.fqbn;
    }
    if (message.port !== undefined) {
      obj.port = Port.toJSON(message.port);
    }
    if (message.verbose === true) {
      obj.verbose = message.verbose;
    }
    if (message.verify === true) {
      obj.verify = message.verify;
    }
    if (message.programmer !== '') {
      obj.programmer = message.programmer;
    }
    if (message.dryRun === true) {
      obj.dryRun = message.dryRun;
    }
    if (message.userFields) {
      const entries = Object.entries(message.userFields);
      if (entries.length > 0) {
        obj.userFields = {};
        entries.forEach(([k, v]) => {
          obj.userFields[k] = v;
        });
      }
    }
    return obj;
  },

  create(base?: DeepPartial<BurnBootloaderRequest>): BurnBootloaderRequest {
    return BurnBootloaderRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<BurnBootloaderRequest>
  ): BurnBootloaderRequest {
    const message = createBaseBurnBootloaderRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.fqbn = object.fqbn ?? '';
    message.port =
      object.port !== undefined && object.port !== null
        ? Port.fromPartial(object.port)
        : undefined;
    message.verbose = object.verbose ?? false;
    message.verify = object.verify ?? false;
    message.programmer = object.programmer ?? '';
    message.dryRun = object.dryRun ?? false;
    message.userFields = Object.entries(object.userFields ?? {}).reduce<{
      [key: string]: string;
    }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});
    return message;
  },
};

function createBaseBurnBootloaderRequest_UserFieldsEntry(): BurnBootloaderRequest_UserFieldsEntry {
  return { key: '', value: '' };
}

export const BurnBootloaderRequest_UserFieldsEntry = {
  encode(
    message: BurnBootloaderRequest_UserFieldsEntry,
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
  ): BurnBootloaderRequest_UserFieldsEntry {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBurnBootloaderRequest_UserFieldsEntry();
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

  fromJSON(object: any): BurnBootloaderRequest_UserFieldsEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? String(object.value) : '',
    };
  },

  toJSON(message: BurnBootloaderRequest_UserFieldsEntry): unknown {
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
    base?: DeepPartial<BurnBootloaderRequest_UserFieldsEntry>
  ): BurnBootloaderRequest_UserFieldsEntry {
    return BurnBootloaderRequest_UserFieldsEntry.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<BurnBootloaderRequest_UserFieldsEntry>
  ): BurnBootloaderRequest_UserFieldsEntry {
    const message = createBaseBurnBootloaderRequest_UserFieldsEntry();
    message.key = object.key ?? '';
    message.value = object.value ?? '';
    return message;
  },
};

function createBaseBurnBootloaderResponse(): BurnBootloaderResponse {
  return { outStream: new Uint8Array(0), errStream: new Uint8Array(0) };
}

export const BurnBootloaderResponse = {
  encode(
    message: BurnBootloaderResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.outStream.length !== 0) {
      writer.uint32(10).bytes(message.outStream);
    }
    if (message.errStream.length !== 0) {
      writer.uint32(18).bytes(message.errStream);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): BurnBootloaderResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBurnBootloaderResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.outStream = reader.bytes();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.errStream = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BurnBootloaderResponse {
    return {
      outStream: isSet(object.outStream)
        ? bytesFromBase64(object.outStream)
        : new Uint8Array(0),
      errStream: isSet(object.errStream)
        ? bytesFromBase64(object.errStream)
        : new Uint8Array(0),
    };
  },

  toJSON(message: BurnBootloaderResponse): unknown {
    const obj: any = {};
    if (message.outStream.length !== 0) {
      obj.outStream = base64FromBytes(message.outStream);
    }
    if (message.errStream.length !== 0) {
      obj.errStream = base64FromBytes(message.errStream);
    }
    return obj;
  },

  create(base?: DeepPartial<BurnBootloaderResponse>): BurnBootloaderResponse {
    return BurnBootloaderResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<BurnBootloaderResponse>
  ): BurnBootloaderResponse {
    const message = createBaseBurnBootloaderResponse();
    message.outStream = object.outStream ?? new Uint8Array(0);
    message.errStream = object.errStream ?? new Uint8Array(0);
    return message;
  },
};

function createBaseListProgrammersAvailableForUploadRequest(): ListProgrammersAvailableForUploadRequest {
  return { instance: undefined, fqbn: '' };
}

export const ListProgrammersAvailableForUploadRequest = {
  encode(
    message: ListProgrammersAvailableForUploadRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.fqbn !== '') {
      writer.uint32(18).string(message.fqbn);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): ListProgrammersAvailableForUploadRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListProgrammersAvailableForUploadRequest();
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
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListProgrammersAvailableForUploadRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      fqbn: isSet(object.fqbn) ? String(object.fqbn) : '',
    };
  },

  toJSON(message: ListProgrammersAvailableForUploadRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.fqbn !== '') {
      obj.fqbn = message.fqbn;
    }
    return obj;
  },

  create(
    base?: DeepPartial<ListProgrammersAvailableForUploadRequest>
  ): ListProgrammersAvailableForUploadRequest {
    return ListProgrammersAvailableForUploadRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<ListProgrammersAvailableForUploadRequest>
  ): ListProgrammersAvailableForUploadRequest {
    const message = createBaseListProgrammersAvailableForUploadRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.fqbn = object.fqbn ?? '';
    return message;
  },
};

function createBaseListProgrammersAvailableForUploadResponse(): ListProgrammersAvailableForUploadResponse {
  return { programmers: [] };
}

export const ListProgrammersAvailableForUploadResponse = {
  encode(
    message: ListProgrammersAvailableForUploadResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.programmers) {
      Programmer.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): ListProgrammersAvailableForUploadResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListProgrammersAvailableForUploadResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.programmers.push(Programmer.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListProgrammersAvailableForUploadResponse {
    return {
      programmers: Array.isArray(object?.programmers)
        ? object.programmers.map((e: any) => Programmer.fromJSON(e))
        : [],
    };
  },

  toJSON(message: ListProgrammersAvailableForUploadResponse): unknown {
    const obj: any = {};
    if (message.programmers?.length) {
      obj.programmers = message.programmers.map((e) => Programmer.toJSON(e));
    }
    return obj;
  },

  create(
    base?: DeepPartial<ListProgrammersAvailableForUploadResponse>
  ): ListProgrammersAvailableForUploadResponse {
    return ListProgrammersAvailableForUploadResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<ListProgrammersAvailableForUploadResponse>
  ): ListProgrammersAvailableForUploadResponse {
    const message = createBaseListProgrammersAvailableForUploadResponse();
    message.programmers =
      object.programmers?.map((e) => Programmer.fromPartial(e)) || [];
    return message;
  },
};

function createBaseSupportedUserFieldsRequest(): SupportedUserFieldsRequest {
  return { instance: undefined, fqbn: '', protocol: '' };
}

export const SupportedUserFieldsRequest = {
  encode(
    message: SupportedUserFieldsRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.fqbn !== '') {
      writer.uint32(18).string(message.fqbn);
    }
    if (message.protocol !== '') {
      writer.uint32(26).string(message.protocol);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): SupportedUserFieldsRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSupportedUserFieldsRequest();
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

          message.protocol = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SupportedUserFieldsRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      fqbn: isSet(object.fqbn) ? String(object.fqbn) : '',
      protocol: isSet(object.protocol) ? String(object.protocol) : '',
    };
  },

  toJSON(message: SupportedUserFieldsRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.fqbn !== '') {
      obj.fqbn = message.fqbn;
    }
    if (message.protocol !== '') {
      obj.protocol = message.protocol;
    }
    return obj;
  },

  create(
    base?: DeepPartial<SupportedUserFieldsRequest>
  ): SupportedUserFieldsRequest {
    return SupportedUserFieldsRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<SupportedUserFieldsRequest>
  ): SupportedUserFieldsRequest {
    const message = createBaseSupportedUserFieldsRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.fqbn = object.fqbn ?? '';
    message.protocol = object.protocol ?? '';
    return message;
  },
};

function createBaseUserField(): UserField {
  return { toolId: '', name: '', label: '', secret: false };
}

export const UserField = {
  encode(
    message: UserField,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.toolId !== '') {
      writer.uint32(10).string(message.toolId);
    }
    if (message.name !== '') {
      writer.uint32(18).string(message.name);
    }
    if (message.label !== '') {
      writer.uint32(26).string(message.label);
    }
    if (message.secret === true) {
      writer.uint32(32).bool(message.secret);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UserField {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUserField();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.toolId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.label = reader.string();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.secret = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UserField {
    return {
      toolId: isSet(object.toolId) ? String(object.toolId) : '',
      name: isSet(object.name) ? String(object.name) : '',
      label: isSet(object.label) ? String(object.label) : '',
      secret: isSet(object.secret) ? Boolean(object.secret) : false,
    };
  },

  toJSON(message: UserField): unknown {
    const obj: any = {};
    if (message.toolId !== '') {
      obj.toolId = message.toolId;
    }
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.label !== '') {
      obj.label = message.label;
    }
    if (message.secret === true) {
      obj.secret = message.secret;
    }
    return obj;
  },

  create(base?: DeepPartial<UserField>): UserField {
    return UserField.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<UserField>): UserField {
    const message = createBaseUserField();
    message.toolId = object.toolId ?? '';
    message.name = object.name ?? '';
    message.label = object.label ?? '';
    message.secret = object.secret ?? false;
    return message;
  },
};

function createBaseSupportedUserFieldsResponse(): SupportedUserFieldsResponse {
  return { userFields: [] };
}

export const SupportedUserFieldsResponse = {
  encode(
    message: SupportedUserFieldsResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.userFields) {
      UserField.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): SupportedUserFieldsResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSupportedUserFieldsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.userFields.push(UserField.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SupportedUserFieldsResponse {
    return {
      userFields: Array.isArray(object?.userFields)
        ? object.userFields.map((e: any) => UserField.fromJSON(e))
        : [],
    };
  },

  toJSON(message: SupportedUserFieldsResponse): unknown {
    const obj: any = {};
    if (message.userFields?.length) {
      obj.userFields = message.userFields.map((e) => UserField.toJSON(e));
    }
    return obj;
  },

  create(
    base?: DeepPartial<SupportedUserFieldsResponse>
  ): SupportedUserFieldsResponse {
    return SupportedUserFieldsResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<SupportedUserFieldsResponse>
  ): SupportedUserFieldsResponse {
    const message = createBaseSupportedUserFieldsResponse();
    message.userFields =
      object.userFields?.map((e) => UserField.fromPartial(e)) || [];
    return message;
  },
};

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
