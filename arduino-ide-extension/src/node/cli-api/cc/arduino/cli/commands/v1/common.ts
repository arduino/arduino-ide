/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';

export interface Instance {
  /** The ID of the instance. */
  id: number;
}

export interface DownloadProgress {
  message?:
    | { $case: 'start'; start: DownloadProgressStart }
    | { $case: 'update'; update: DownloadProgressUpdate }
    | {
        $case: 'end';
        end: DownloadProgressEnd;
      }
    | undefined;
}

export interface DownloadProgressStart {
  /** URL of the download. */
  url: string;
  /** The label to display on the progress bar. */
  label: string;
}

export interface DownloadProgressUpdate {
  /** Size of the downloaded portion of the file. */
  downloaded: number;
  /** Total size of the file being downloaded. */
  totalSize: number;
}

export interface DownloadProgressEnd {
  /** True if the download is successful */
  success: boolean;
  /**
   * Info or error message, depending on the value of 'success'. Some examples:
   * "File xxx already downloaded" or "Connection timeout"
   */
  message: string;
}

export interface TaskProgress {
  /** Description of the task. */
  name: string;
  /** Additional information about the task. */
  message: string;
  /** Whether the task is complete. */
  completed: boolean;
  /** Amount in percent of the task completion (optional) */
  percent: number;
}

export interface Programmer {
  platform: string;
  id: string;
  name: string;
}

export interface Platform {
  /** Platform ID (e.g., `arduino:avr`). */
  id: string;
  /** Version of the platform. */
  installed: string;
  /** Newest available version of the platform. */
  latest: string;
  /** Name used to identify the platform to humans (e.g., "Arduino AVR Boards"). */
  name: string;
  /** Maintainer of the platform's package. */
  maintainer: string;
  /**
   * A URL provided by the author of the platform's package, intended to point
   * to their website.
   */
  website: string;
  /** Email of the maintainer of the platform's package. */
  email: string;
  /**
   * List of boards provided by the platform. If the platform is installed,
   * this is the boards listed in the platform's boards.txt. If the platform is
   * not installed, this is an arbitrary list of board names provided by the
   * platform author for display and may not match boards.txt.
   */
  boards: Board[];
  /**
   * If true this Platform has been installed manually in the user' sketchbook
   * hardware folder
   */
  manuallyInstalled: boolean;
  /** If true this Platform has been deprecated */
  deprecated: boolean;
  /** Type of the platform. */
  type: string[];
  /**
   * A URL provided by the author of the platform's package, intended to point
   * to their online help service.
   */
  help: HelpResources | undefined;
  /** If true the platform is indexed */
  indexed: boolean;
  /**
   * This field is true when the platform is installed with the Arduino IDE 1.8.
   * If the platform is also not indexed it may fail to work correctly in some
   * circumstances, and it may need to be re-installed.
   */
  missingMetadata: boolean;
}

export interface InstalledPlatformReference {
  /** Platform ID (e.g., `arduino:avr`). */
  id: string;
  /** Version of the platform. */
  version: string;
  /** Installation directory of the platform */
  installDir: string;
  /** 3rd party platform URL */
  packageUrl: string;
}

export interface Board {
  /** Name used to identify the board to humans. */
  name: string;
  /**
   * Fully qualified board name used to identify the board to machines. The FQBN
   * is only available for installed boards.
   */
  fqbn: string;
}

export interface Profile {
  /** Name used to identify the profile within the sketch. */
  name: string;
  /** FQBN specified in the profile. */
  fqbn: string;
}

export interface HelpResources {
  /**
   * A URL provided by the author of the platform's package, intended to point
   * to their online help service.
   */
  online: string;
}

function createBaseInstance(): Instance {
  return { id: 0 };
}

export const Instance = {
  encode(
    message: Instance,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== 0) {
      writer.uint32(8).int32(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Instance {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInstance();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.id = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Instance {
    return { id: isSet(object.id) ? Number(object.id) : 0 };
  },

  toJSON(message: Instance): unknown {
    const obj: any = {};
    if (message.id !== 0) {
      obj.id = Math.round(message.id);
    }
    return obj;
  },

  create(base?: DeepPartial<Instance>): Instance {
    return Instance.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<Instance>): Instance {
    const message = createBaseInstance();
    message.id = object.id ?? 0;
    return message;
  },
};

function createBaseDownloadProgress(): DownloadProgress {
  return { message: undefined };
}

export const DownloadProgress = {
  encode(
    message: DownloadProgress,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    switch (message.message?.$case) {
      case 'start':
        DownloadProgressStart.encode(
          message.message.start,
          writer.uint32(10).fork()
        ).ldelim();
        break;
      case 'update':
        DownloadProgressUpdate.encode(
          message.message.update,
          writer.uint32(18).fork()
        ).ldelim();
        break;
      case 'end':
        DownloadProgressEnd.encode(
          message.message.end,
          writer.uint32(26).fork()
        ).ldelim();
        break;
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DownloadProgress {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDownloadProgress();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.message = {
            $case: 'start',
            start: DownloadProgressStart.decode(reader, reader.uint32()),
          };
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.message = {
            $case: 'update',
            update: DownloadProgressUpdate.decode(reader, reader.uint32()),
          };
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.message = {
            $case: 'end',
            end: DownloadProgressEnd.decode(reader, reader.uint32()),
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

  fromJSON(object: any): DownloadProgress {
    return {
      message: isSet(object.start)
        ? {
            $case: 'start',
            start: DownloadProgressStart.fromJSON(object.start),
          }
        : isSet(object.update)
        ? {
            $case: 'update',
            update: DownloadProgressUpdate.fromJSON(object.update),
          }
        : isSet(object.end)
        ? { $case: 'end', end: DownloadProgressEnd.fromJSON(object.end) }
        : undefined,
    };
  },

  toJSON(message: DownloadProgress): unknown {
    const obj: any = {};
    if (message.message?.$case === 'start') {
      obj.start = DownloadProgressStart.toJSON(message.message.start);
    }
    if (message.message?.$case === 'update') {
      obj.update = DownloadProgressUpdate.toJSON(message.message.update);
    }
    if (message.message?.$case === 'end') {
      obj.end = DownloadProgressEnd.toJSON(message.message.end);
    }
    return obj;
  },

  create(base?: DeepPartial<DownloadProgress>): DownloadProgress {
    return DownloadProgress.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<DownloadProgress>): DownloadProgress {
    const message = createBaseDownloadProgress();
    if (
      object.message?.$case === 'start' &&
      object.message?.start !== undefined &&
      object.message?.start !== null
    ) {
      message.message = {
        $case: 'start',
        start: DownloadProgressStart.fromPartial(object.message.start),
      };
    }
    if (
      object.message?.$case === 'update' &&
      object.message?.update !== undefined &&
      object.message?.update !== null
    ) {
      message.message = {
        $case: 'update',
        update: DownloadProgressUpdate.fromPartial(object.message.update),
      };
    }
    if (
      object.message?.$case === 'end' &&
      object.message?.end !== undefined &&
      object.message?.end !== null
    ) {
      message.message = {
        $case: 'end',
        end: DownloadProgressEnd.fromPartial(object.message.end),
      };
    }
    return message;
  },
};

function createBaseDownloadProgressStart(): DownloadProgressStart {
  return { url: '', label: '' };
}

export const DownloadProgressStart = {
  encode(
    message: DownloadProgressStart,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.url !== '') {
      writer.uint32(10).string(message.url);
    }
    if (message.label !== '') {
      writer.uint32(18).string(message.label);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): DownloadProgressStart {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDownloadProgressStart();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.url = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.label = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DownloadProgressStart {
    return {
      url: isSet(object.url) ? String(object.url) : '',
      label: isSet(object.label) ? String(object.label) : '',
    };
  },

  toJSON(message: DownloadProgressStart): unknown {
    const obj: any = {};
    if (message.url !== '') {
      obj.url = message.url;
    }
    if (message.label !== '') {
      obj.label = message.label;
    }
    return obj;
  },

  create(base?: DeepPartial<DownloadProgressStart>): DownloadProgressStart {
    return DownloadProgressStart.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<DownloadProgressStart>
  ): DownloadProgressStart {
    const message = createBaseDownloadProgressStart();
    message.url = object.url ?? '';
    message.label = object.label ?? '';
    return message;
  },
};

function createBaseDownloadProgressUpdate(): DownloadProgressUpdate {
  return { downloaded: 0, totalSize: 0 };
}

export const DownloadProgressUpdate = {
  encode(
    message: DownloadProgressUpdate,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.downloaded !== 0) {
      writer.uint32(8).int64(message.downloaded);
    }
    if (message.totalSize !== 0) {
      writer.uint32(16).int64(message.totalSize);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): DownloadProgressUpdate {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDownloadProgressUpdate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.downloaded = longToNumber(reader.int64() as Long);
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.totalSize = longToNumber(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DownloadProgressUpdate {
    return {
      downloaded: isSet(object.downloaded) ? Number(object.downloaded) : 0,
      totalSize: isSet(object.totalSize) ? Number(object.totalSize) : 0,
    };
  },

  toJSON(message: DownloadProgressUpdate): unknown {
    const obj: any = {};
    if (message.downloaded !== 0) {
      obj.downloaded = Math.round(message.downloaded);
    }
    if (message.totalSize !== 0) {
      obj.totalSize = Math.round(message.totalSize);
    }
    return obj;
  },

  create(base?: DeepPartial<DownloadProgressUpdate>): DownloadProgressUpdate {
    return DownloadProgressUpdate.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<DownloadProgressUpdate>
  ): DownloadProgressUpdate {
    const message = createBaseDownloadProgressUpdate();
    message.downloaded = object.downloaded ?? 0;
    message.totalSize = object.totalSize ?? 0;
    return message;
  },
};

function createBaseDownloadProgressEnd(): DownloadProgressEnd {
  return { success: false, message: '' };
}

export const DownloadProgressEnd = {
  encode(
    message: DownloadProgressEnd,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.success === true) {
      writer.uint32(8).bool(message.success);
    }
    if (message.message !== '') {
      writer.uint32(18).string(message.message);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DownloadProgressEnd {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDownloadProgressEnd();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.success = reader.bool();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.message = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DownloadProgressEnd {
    return {
      success: isSet(object.success) ? Boolean(object.success) : false,
      message: isSet(object.message) ? String(object.message) : '',
    };
  },

  toJSON(message: DownloadProgressEnd): unknown {
    const obj: any = {};
    if (message.success === true) {
      obj.success = message.success;
    }
    if (message.message !== '') {
      obj.message = message.message;
    }
    return obj;
  },

  create(base?: DeepPartial<DownloadProgressEnd>): DownloadProgressEnd {
    return DownloadProgressEnd.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<DownloadProgressEnd>): DownloadProgressEnd {
    const message = createBaseDownloadProgressEnd();
    message.success = object.success ?? false;
    message.message = object.message ?? '';
    return message;
  },
};

function createBaseTaskProgress(): TaskProgress {
  return { name: '', message: '', completed: false, percent: 0 };
}

export const TaskProgress = {
  encode(
    message: TaskProgress,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    if (message.message !== '') {
      writer.uint32(18).string(message.message);
    }
    if (message.completed === true) {
      writer.uint32(24).bool(message.completed);
    }
    if (message.percent !== 0) {
      writer.uint32(37).float(message.percent);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TaskProgress {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTaskProgress();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.message = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.completed = reader.bool();
          continue;
        case 4:
          if (tag !== 37) {
            break;
          }

          message.percent = reader.float();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TaskProgress {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      message: isSet(object.message) ? String(object.message) : '',
      completed: isSet(object.completed) ? Boolean(object.completed) : false,
      percent: isSet(object.percent) ? Number(object.percent) : 0,
    };
  },

  toJSON(message: TaskProgress): unknown {
    const obj: any = {};
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.message !== '') {
      obj.message = message.message;
    }
    if (message.completed === true) {
      obj.completed = message.completed;
    }
    if (message.percent !== 0) {
      obj.percent = message.percent;
    }
    return obj;
  },

  create(base?: DeepPartial<TaskProgress>): TaskProgress {
    return TaskProgress.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<TaskProgress>): TaskProgress {
    const message = createBaseTaskProgress();
    message.name = object.name ?? '';
    message.message = object.message ?? '';
    message.completed = object.completed ?? false;
    message.percent = object.percent ?? 0;
    return message;
  },
};

function createBaseProgrammer(): Programmer {
  return { platform: '', id: '', name: '' };
}

export const Programmer = {
  encode(
    message: Programmer,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.platform !== '') {
      writer.uint32(10).string(message.platform);
    }
    if (message.id !== '') {
      writer.uint32(18).string(message.id);
    }
    if (message.name !== '') {
      writer.uint32(26).string(message.name);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Programmer {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProgrammer();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.platform = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.id = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.name = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Programmer {
    return {
      platform: isSet(object.platform) ? String(object.platform) : '',
      id: isSet(object.id) ? String(object.id) : '',
      name: isSet(object.name) ? String(object.name) : '',
    };
  },

  toJSON(message: Programmer): unknown {
    const obj: any = {};
    if (message.platform !== '') {
      obj.platform = message.platform;
    }
    if (message.id !== '') {
      obj.id = message.id;
    }
    if (message.name !== '') {
      obj.name = message.name;
    }
    return obj;
  },

  create(base?: DeepPartial<Programmer>): Programmer {
    return Programmer.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<Programmer>): Programmer {
    const message = createBaseProgrammer();
    message.platform = object.platform ?? '';
    message.id = object.id ?? '';
    message.name = object.name ?? '';
    return message;
  },
};

function createBasePlatform(): Platform {
  return {
    id: '',
    installed: '',
    latest: '',
    name: '',
    maintainer: '',
    website: '',
    email: '',
    boards: [],
    manuallyInstalled: false,
    deprecated: false,
    type: [],
    help: undefined,
    indexed: false,
    missingMetadata: false,
  };
}

export const Platform = {
  encode(
    message: Platform,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== '') {
      writer.uint32(10).string(message.id);
    }
    if (message.installed !== '') {
      writer.uint32(18).string(message.installed);
    }
    if (message.latest !== '') {
      writer.uint32(26).string(message.latest);
    }
    if (message.name !== '') {
      writer.uint32(34).string(message.name);
    }
    if (message.maintainer !== '') {
      writer.uint32(42).string(message.maintainer);
    }
    if (message.website !== '') {
      writer.uint32(50).string(message.website);
    }
    if (message.email !== '') {
      writer.uint32(58).string(message.email);
    }
    for (const v of message.boards) {
      Board.encode(v!, writer.uint32(66).fork()).ldelim();
    }
    if (message.manuallyInstalled === true) {
      writer.uint32(72).bool(message.manuallyInstalled);
    }
    if (message.deprecated === true) {
      writer.uint32(80).bool(message.deprecated);
    }
    for (const v of message.type) {
      writer.uint32(90).string(v!);
    }
    if (message.help !== undefined) {
      HelpResources.encode(message.help, writer.uint32(98).fork()).ldelim();
    }
    if (message.indexed === true) {
      writer.uint32(104).bool(message.indexed);
    }
    if (message.missingMetadata === true) {
      writer.uint32(112).bool(message.missingMetadata);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Platform {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatform();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.installed = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.latest = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.name = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.maintainer = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.website = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.email = reader.string();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.boards.push(Board.decode(reader, reader.uint32()));
          continue;
        case 9:
          if (tag !== 72) {
            break;
          }

          message.manuallyInstalled = reader.bool();
          continue;
        case 10:
          if (tag !== 80) {
            break;
          }

          message.deprecated = reader.bool();
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          message.type.push(reader.string());
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.help = HelpResources.decode(reader, reader.uint32());
          continue;
        case 13:
          if (tag !== 104) {
            break;
          }

          message.indexed = reader.bool();
          continue;
        case 14:
          if (tag !== 112) {
            break;
          }

          message.missingMetadata = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Platform {
    return {
      id: isSet(object.id) ? String(object.id) : '',
      installed: isSet(object.installed) ? String(object.installed) : '',
      latest: isSet(object.latest) ? String(object.latest) : '',
      name: isSet(object.name) ? String(object.name) : '',
      maintainer: isSet(object.maintainer) ? String(object.maintainer) : '',
      website: isSet(object.website) ? String(object.website) : '',
      email: isSet(object.email) ? String(object.email) : '',
      boards: Array.isArray(object?.boards)
        ? object.boards.map((e: any) => Board.fromJSON(e))
        : [],
      manuallyInstalled: isSet(object.manuallyInstalled)
        ? Boolean(object.manuallyInstalled)
        : false,
      deprecated: isSet(object.deprecated) ? Boolean(object.deprecated) : false,
      type: Array.isArray(object?.type)
        ? object.type.map((e: any) => String(e))
        : [],
      help: isSet(object.help)
        ? HelpResources.fromJSON(object.help)
        : undefined,
      indexed: isSet(object.indexed) ? Boolean(object.indexed) : false,
      missingMetadata: isSet(object.missingMetadata)
        ? Boolean(object.missingMetadata)
        : false,
    };
  },

  toJSON(message: Platform): unknown {
    const obj: any = {};
    if (message.id !== '') {
      obj.id = message.id;
    }
    if (message.installed !== '') {
      obj.installed = message.installed;
    }
    if (message.latest !== '') {
      obj.latest = message.latest;
    }
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.maintainer !== '') {
      obj.maintainer = message.maintainer;
    }
    if (message.website !== '') {
      obj.website = message.website;
    }
    if (message.email !== '') {
      obj.email = message.email;
    }
    if (message.boards?.length) {
      obj.boards = message.boards.map((e) => Board.toJSON(e));
    }
    if (message.manuallyInstalled === true) {
      obj.manuallyInstalled = message.manuallyInstalled;
    }
    if (message.deprecated === true) {
      obj.deprecated = message.deprecated;
    }
    if (message.type?.length) {
      obj.type = message.type;
    }
    if (message.help !== undefined) {
      obj.help = HelpResources.toJSON(message.help);
    }
    if (message.indexed === true) {
      obj.indexed = message.indexed;
    }
    if (message.missingMetadata === true) {
      obj.missingMetadata = message.missingMetadata;
    }
    return obj;
  },

  create(base?: DeepPartial<Platform>): Platform {
    return Platform.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<Platform>): Platform {
    const message = createBasePlatform();
    message.id = object.id ?? '';
    message.installed = object.installed ?? '';
    message.latest = object.latest ?? '';
    message.name = object.name ?? '';
    message.maintainer = object.maintainer ?? '';
    message.website = object.website ?? '';
    message.email = object.email ?? '';
    message.boards = object.boards?.map((e) => Board.fromPartial(e)) || [];
    message.manuallyInstalled = object.manuallyInstalled ?? false;
    message.deprecated = object.deprecated ?? false;
    message.type = object.type?.map((e) => e) || [];
    message.help =
      object.help !== undefined && object.help !== null
        ? HelpResources.fromPartial(object.help)
        : undefined;
    message.indexed = object.indexed ?? false;
    message.missingMetadata = object.missingMetadata ?? false;
    return message;
  },
};

function createBaseInstalledPlatformReference(): InstalledPlatformReference {
  return { id: '', version: '', installDir: '', packageUrl: '' };
}

export const InstalledPlatformReference = {
  encode(
    message: InstalledPlatformReference,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== '') {
      writer.uint32(10).string(message.id);
    }
    if (message.version !== '') {
      writer.uint32(18).string(message.version);
    }
    if (message.installDir !== '') {
      writer.uint32(26).string(message.installDir);
    }
    if (message.packageUrl !== '') {
      writer.uint32(34).string(message.packageUrl);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): InstalledPlatformReference {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInstalledPlatformReference();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.version = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.installDir = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.packageUrl = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): InstalledPlatformReference {
    return {
      id: isSet(object.id) ? String(object.id) : '',
      version: isSet(object.version) ? String(object.version) : '',
      installDir: isSet(object.installDir) ? String(object.installDir) : '',
      packageUrl: isSet(object.packageUrl) ? String(object.packageUrl) : '',
    };
  },

  toJSON(message: InstalledPlatformReference): unknown {
    const obj: any = {};
    if (message.id !== '') {
      obj.id = message.id;
    }
    if (message.version !== '') {
      obj.version = message.version;
    }
    if (message.installDir !== '') {
      obj.installDir = message.installDir;
    }
    if (message.packageUrl !== '') {
      obj.packageUrl = message.packageUrl;
    }
    return obj;
  },

  create(
    base?: DeepPartial<InstalledPlatformReference>
  ): InstalledPlatformReference {
    return InstalledPlatformReference.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<InstalledPlatformReference>
  ): InstalledPlatformReference {
    const message = createBaseInstalledPlatformReference();
    message.id = object.id ?? '';
    message.version = object.version ?? '';
    message.installDir = object.installDir ?? '';
    message.packageUrl = object.packageUrl ?? '';
    return message;
  },
};

function createBaseBoard(): Board {
  return { name: '', fqbn: '' };
}

export const Board = {
  encode(message: Board, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    if (message.fqbn !== '') {
      writer.uint32(18).string(message.fqbn);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Board {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBoard();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
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

  fromJSON(object: any): Board {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      fqbn: isSet(object.fqbn) ? String(object.fqbn) : '',
    };
  },

  toJSON(message: Board): unknown {
    const obj: any = {};
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.fqbn !== '') {
      obj.fqbn = message.fqbn;
    }
    return obj;
  },

  create(base?: DeepPartial<Board>): Board {
    return Board.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<Board>): Board {
    const message = createBaseBoard();
    message.name = object.name ?? '';
    message.fqbn = object.fqbn ?? '';
    return message;
  },
};

function createBaseProfile(): Profile {
  return { name: '', fqbn: '' };
}

export const Profile = {
  encode(
    message: Profile,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    if (message.fqbn !== '') {
      writer.uint32(18).string(message.fqbn);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Profile {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProfile();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
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

  fromJSON(object: any): Profile {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      fqbn: isSet(object.fqbn) ? String(object.fqbn) : '',
    };
  },

  toJSON(message: Profile): unknown {
    const obj: any = {};
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.fqbn !== '') {
      obj.fqbn = message.fqbn;
    }
    return obj;
  },

  create(base?: DeepPartial<Profile>): Profile {
    return Profile.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<Profile>): Profile {
    const message = createBaseProfile();
    message.name = object.name ?? '';
    message.fqbn = object.fqbn ?? '';
    return message;
  },
};

function createBaseHelpResources(): HelpResources {
  return { online: '' };
}

export const HelpResources = {
  encode(
    message: HelpResources,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.online !== '') {
      writer.uint32(10).string(message.online);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HelpResources {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHelpResources();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.online = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): HelpResources {
    return { online: isSet(object.online) ? String(object.online) : '' };
  },

  toJSON(message: HelpResources): unknown {
    const obj: any = {};
    if (message.online !== '') {
      obj.online = message.online;
    }
    return obj;
  },

  create(base?: DeepPartial<HelpResources>): HelpResources {
    return HelpResources.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<HelpResources>): HelpResources {
    const message = createBaseHelpResources();
    message.online = object.online ?? '';
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

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new tsProtoGlobalThis.Error(
      'Value is larger than Number.MAX_SAFE_INTEGER'
    );
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
