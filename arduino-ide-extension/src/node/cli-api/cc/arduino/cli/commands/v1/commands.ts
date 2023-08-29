/* eslint-disable */
import type { CallContext, CallOptions } from 'nice-grpc-common';
import _m0 from 'protobufjs/minimal';
import { Status } from '../../../../../google/rpc/status';
import {
  BoardDetailsRequest,
  BoardDetailsResponse,
  BoardListAllRequest,
  BoardListAllResponse,
  BoardListRequest,
  BoardListResponse,
  BoardListWatchRequest,
  BoardListWatchResponse,
  BoardSearchRequest,
  BoardSearchResponse,
} from './board';
import { DownloadProgress, Instance, Profile, TaskProgress } from './common';
import { CompileRequest, CompileResponse } from './compile';
import {
  PlatformDownloadRequest,
  PlatformDownloadResponse,
  PlatformInstallRequest,
  PlatformInstallResponse,
  PlatformListRequest,
  PlatformListResponse,
  PlatformSearchRequest,
  PlatformSearchResponse,
  PlatformUninstallRequest,
  PlatformUninstallResponse,
  PlatformUpgradeRequest,
  PlatformUpgradeResponse,
} from './core';
import {
  GitLibraryInstallRequest,
  GitLibraryInstallResponse,
  LibraryDownloadRequest,
  LibraryDownloadResponse,
  LibraryInstallRequest,
  LibraryInstallResponse,
  LibraryListRequest,
  LibraryListResponse,
  LibraryResolveDependenciesRequest,
  LibraryResolveDependenciesResponse,
  LibrarySearchRequest,
  LibrarySearchResponse,
  LibraryUninstallRequest,
  LibraryUninstallResponse,
  LibraryUpgradeAllRequest,
  LibraryUpgradeAllResponse,
  LibraryUpgradeRequest,
  LibraryUpgradeResponse,
  ZipLibraryInstallRequest,
  ZipLibraryInstallResponse,
} from './lib';
import {
  EnumerateMonitorPortSettingsRequest,
  EnumerateMonitorPortSettingsResponse,
  MonitorRequest,
  MonitorResponse,
} from './monitor';
import {
  BurnBootloaderRequest,
  BurnBootloaderResponse,
  ListProgrammersAvailableForUploadRequest,
  ListProgrammersAvailableForUploadResponse,
  SupportedUserFieldsRequest,
  SupportedUserFieldsResponse,
  UploadRequest,
  UploadResponse,
  UploadUsingProgrammerRequest,
  UploadUsingProgrammerResponse,
} from './upload';

export enum FailedInstanceInitReason {
  /** FAILED_INSTANCE_INIT_REASON_UNSPECIFIED - FAILED_INSTANCE_INIT_REASON_UNSPECIFIED the error reason is not specialized */
  FAILED_INSTANCE_INIT_REASON_UNSPECIFIED = 0,
  /** FAILED_INSTANCE_INIT_REASON_INVALID_INDEX_URL - INVALID_INDEX_URL a package index url is malformed */
  FAILED_INSTANCE_INIT_REASON_INVALID_INDEX_URL = 1,
  /**
   * FAILED_INSTANCE_INIT_REASON_INDEX_LOAD_ERROR - FAILED_INSTANCE_INIT_REASON_INDEX_LOAD_ERROR failure encountered while
   * loading an index
   */
  FAILED_INSTANCE_INIT_REASON_INDEX_LOAD_ERROR = 2,
  /**
   * FAILED_INSTANCE_INIT_REASON_TOOL_LOAD_ERROR - FAILED_INSTANCE_INIT_REASON_TOOL_LOAD_ERROR failure encountered while
   * loading a tool
   */
  FAILED_INSTANCE_INIT_REASON_TOOL_LOAD_ERROR = 3,
  /**
   * FAILED_INSTANCE_INIT_REASON_INDEX_DOWNLOAD_ERROR - FAILED_INSTANCE_INIT_REASON_INDEX_DOWNLOAD_ERROR failure encountered while
   * downloading an index
   */
  FAILED_INSTANCE_INIT_REASON_INDEX_DOWNLOAD_ERROR = 4,
  UNRECOGNIZED = -1,
}

export function failedInstanceInitReasonFromJSON(
  object: any
): FailedInstanceInitReason {
  switch (object) {
    case 0:
    case 'FAILED_INSTANCE_INIT_REASON_UNSPECIFIED':
      return FailedInstanceInitReason.FAILED_INSTANCE_INIT_REASON_UNSPECIFIED;
    case 1:
    case 'FAILED_INSTANCE_INIT_REASON_INVALID_INDEX_URL':
      return FailedInstanceInitReason.FAILED_INSTANCE_INIT_REASON_INVALID_INDEX_URL;
    case 2:
    case 'FAILED_INSTANCE_INIT_REASON_INDEX_LOAD_ERROR':
      return FailedInstanceInitReason.FAILED_INSTANCE_INIT_REASON_INDEX_LOAD_ERROR;
    case 3:
    case 'FAILED_INSTANCE_INIT_REASON_TOOL_LOAD_ERROR':
      return FailedInstanceInitReason.FAILED_INSTANCE_INIT_REASON_TOOL_LOAD_ERROR;
    case 4:
    case 'FAILED_INSTANCE_INIT_REASON_INDEX_DOWNLOAD_ERROR':
      return FailedInstanceInitReason.FAILED_INSTANCE_INIT_REASON_INDEX_DOWNLOAD_ERROR;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return FailedInstanceInitReason.UNRECOGNIZED;
  }
}

export function failedInstanceInitReasonToJSON(
  object: FailedInstanceInitReason
): string {
  switch (object) {
    case FailedInstanceInitReason.FAILED_INSTANCE_INIT_REASON_UNSPECIFIED:
      return 'FAILED_INSTANCE_INIT_REASON_UNSPECIFIED';
    case FailedInstanceInitReason.FAILED_INSTANCE_INIT_REASON_INVALID_INDEX_URL:
      return 'FAILED_INSTANCE_INIT_REASON_INVALID_INDEX_URL';
    case FailedInstanceInitReason.FAILED_INSTANCE_INIT_REASON_INDEX_LOAD_ERROR:
      return 'FAILED_INSTANCE_INIT_REASON_INDEX_LOAD_ERROR';
    case FailedInstanceInitReason.FAILED_INSTANCE_INIT_REASON_TOOL_LOAD_ERROR:
      return 'FAILED_INSTANCE_INIT_REASON_TOOL_LOAD_ERROR';
    case FailedInstanceInitReason.FAILED_INSTANCE_INIT_REASON_INDEX_DOWNLOAD_ERROR:
      return 'FAILED_INSTANCE_INIT_REASON_INDEX_DOWNLOAD_ERROR';
    case FailedInstanceInitReason.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED';
  }
}

export interface CreateRequest {}

export interface CreateResponse {
  /** An Arduino Core instance. */
  instance: Instance | undefined;
}

export interface InitRequest {
  /** An Arduino Core instance. */
  instance: Instance | undefined;
  /** Profile to use */
  profile: string;
  /** The path where the sketch is stored */
  sketchPath: string;
}

export interface InitResponse {
  message?:
    | { $case: 'initProgress'; initProgress: InitResponse_Progress }
    | { $case: 'error'; error: Status }
    | {
        $case: 'profile';
        profile: Profile;
      }
    | undefined;
}

export interface InitResponse_Progress {
  /** Progress of the downloads of platforms and libraries index files. */
  downloadProgress: DownloadProgress | undefined;
  /** Describes the current stage of the initialization. */
  taskProgress: TaskProgress | undefined;
}

export interface FailedInstanceInitError {
  /** specific cause of the error */
  reason: FailedInstanceInitReason;
  /** explanation of the error */
  message: string;
}

export interface DestroyRequest {
  /** The Arduino Core Service instance to destroy. */
  instance: Instance | undefined;
}

export interface DestroyResponse {}

export interface UpdateIndexRequest {
  /** Arduino Core Service instance from the Init response. */
  instance: Instance | undefined;
  /** If set to true user defined package indexes will not be updated. */
  ignoreCustomPackageIndexes: boolean;
}

export interface UpdateIndexResponse {
  /** Progress of the package index download. */
  downloadProgress: DownloadProgress | undefined;
}

export interface UpdateLibrariesIndexRequest {
  /** Arduino Core Service instance from the Init response. */
  instance: Instance | undefined;
}

export interface UpdateLibrariesIndexResponse {
  /** Progress of the libraries index download. */
  downloadProgress: DownloadProgress | undefined;
}

export interface VersionRequest {}

export interface VersionResponse {
  /** The version of Arduino CLI in use. */
  version: string;
}

export interface NewSketchRequest {
  /** New sketch name */
  sketchName: string;
  /**
   * Optional: create a Sketch in this directory
   * (used as "Sketchbook" directory).
   * Default Sketchbook directory "directories.User" is used if sketch_dir is
   * empty.
   */
  sketchDir: string;
  /** Specificies if an existing .ino sketch should be overwritten */
  overwrite: boolean;
}

export interface NewSketchResponse {
  /** Absolute path to a main sketch file */
  mainFile: string;
}

export interface LoadSketchRequest {
  /** Absolute path to single sketch file or a sketch folder */
  sketchPath: string;
}

export interface SketchProfile {
  /** Name of the profile */
  name: string;
  /** FQBN used by the profile */
  fqbn: string;
}

export interface LoadSketchResponse {
  /** Absolute path to a main sketch files */
  mainFile: string;
  /** Absolute path to folder that contains main_file */
  locationPath: string;
  /** List of absolute paths to other sketch files */
  otherSketchFiles: string[];
  /** List of absolute paths to additional sketch files */
  additionalFiles: string[];
  /**
   * List of absolute paths to supported files in the sketch root folder, main
   * file excluded
   */
  rootFolderFiles: string[];
  /** Default FQBN set in project file (sketch.yaml) */
  defaultFqbn: string;
  /** Default Port set in project file (sketch.yaml) */
  defaultPort: string;
  /** Default Protocol set in project file (sketch.yaml) */
  defaultProtocol: string;
  /** List of profiles present in the project file (sketch.yaml) */
  profiles: SketchProfile[];
  /** Default profile set in the project file (sketch.yaml) */
  defaultProfile: SketchProfile | undefined;
}

export interface ArchiveSketchRequest {
  /** Absolute path to Sketch file or folder containing Sketch file */
  sketchPath: string;
  /**
   * Absolute path to archive that will be created or folder that will contain
   * it
   */
  archivePath: string;
  /** Specifies if build directory should be included in the archive */
  includeBuildDir: boolean;
  /** Allows to override an already existing archive */
  overwrite: boolean;
}

export interface ArchiveSketchResponse {}

export interface SetSketchDefaultsRequest {
  /** Absolute path to Sketch file or folder containing Sketch file */
  sketchPath: string;
  /** The desired value for default_fqbn in project file (sketch.yaml) */
  defaultFqbn: string;
  /** The desired value for default_port in project file (sketch.yaml) */
  defaultPortAddress: string;
  /** The desired value for default_protocol in project file (sketch.yaml) */
  defaultPortProtocol: string;
}

export interface SetSketchDefaultsResponse {
  /**
   * The value of default_fqnn that has been written in project file
   * (sketch.yaml)
   */
  defaultFqbn: string;
  /**
   * The value of default_port that has been written in project file
   * (sketch.yaml)
   */
  defaultPortAddress: string;
  /**
   * The value of default_protocol that has been written in project file
   * (sketch.yaml)
   */
  defaultPortProtocol: string;
}

function createBaseCreateRequest(): CreateRequest {
  return {};
}

export const CreateRequest = {
  encode(
    _: CreateRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CreateRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCreateRequest();
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

  fromJSON(_: any): CreateRequest {
    return {};
  },

  toJSON(_: CreateRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create(base?: DeepPartial<CreateRequest>): CreateRequest {
    return CreateRequest.fromPartial(base ?? {});
  },
  fromPartial(_: DeepPartial<CreateRequest>): CreateRequest {
    const message = createBaseCreateRequest();
    return message;
  },
};

function createBaseCreateResponse(): CreateResponse {
  return { instance: undefined };
}

export const CreateResponse = {
  encode(
    message: CreateResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CreateResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCreateResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.instance = Instance.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): CreateResponse {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
    };
  },

  toJSON(message: CreateResponse): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    return obj;
  },

  create(base?: DeepPartial<CreateResponse>): CreateResponse {
    return CreateResponse.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<CreateResponse>): CreateResponse {
    const message = createBaseCreateResponse();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    return message;
  },
};

function createBaseInitRequest(): InitRequest {
  return { instance: undefined, profile: '', sketchPath: '' };
}

export const InitRequest = {
  encode(
    message: InitRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.profile !== '') {
      writer.uint32(18).string(message.profile);
    }
    if (message.sketchPath !== '') {
      writer.uint32(26).string(message.sketchPath);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InitRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInitRequest();
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

          message.profile = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.sketchPath = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): InitRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      profile: isSet(object.profile) ? String(object.profile) : '',
      sketchPath: isSet(object.sketchPath) ? String(object.sketchPath) : '',
    };
  },

  toJSON(message: InitRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.profile !== '') {
      obj.profile = message.profile;
    }
    if (message.sketchPath !== '') {
      obj.sketchPath = message.sketchPath;
    }
    return obj;
  },

  create(base?: DeepPartial<InitRequest>): InitRequest {
    return InitRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<InitRequest>): InitRequest {
    const message = createBaseInitRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.profile = object.profile ?? '';
    message.sketchPath = object.sketchPath ?? '';
    return message;
  },
};

function createBaseInitResponse(): InitResponse {
  return { message: undefined };
}

export const InitResponse = {
  encode(
    message: InitResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    switch (message.message?.$case) {
      case 'initProgress':
        InitResponse_Progress.encode(
          message.message.initProgress,
          writer.uint32(10).fork()
        ).ldelim();
        break;
      case 'error':
        Status.encode(message.message.error, writer.uint32(18).fork()).ldelim();
        break;
      case 'profile':
        Profile.encode(
          message.message.profile,
          writer.uint32(26).fork()
        ).ldelim();
        break;
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InitResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInitResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.message = {
            $case: 'initProgress',
            initProgress: InitResponse_Progress.decode(reader, reader.uint32()),
          };
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.message = {
            $case: 'error',
            error: Status.decode(reader, reader.uint32()),
          };
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.message = {
            $case: 'profile',
            profile: Profile.decode(reader, reader.uint32()),
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

  fromJSON(object: any): InitResponse {
    return {
      message: isSet(object.initProgress)
        ? {
            $case: 'initProgress',
            initProgress: InitResponse_Progress.fromJSON(object.initProgress),
          }
        : isSet(object.error)
        ? { $case: 'error', error: Status.fromJSON(object.error) }
        : isSet(object.profile)
        ? { $case: 'profile', profile: Profile.fromJSON(object.profile) }
        : undefined,
    };
  },

  toJSON(message: InitResponse): unknown {
    const obj: any = {};
    if (message.message?.$case === 'initProgress') {
      obj.initProgress = InitResponse_Progress.toJSON(
        message.message.initProgress
      );
    }
    if (message.message?.$case === 'error') {
      obj.error = Status.toJSON(message.message.error);
    }
    if (message.message?.$case === 'profile') {
      obj.profile = Profile.toJSON(message.message.profile);
    }
    return obj;
  },

  create(base?: DeepPartial<InitResponse>): InitResponse {
    return InitResponse.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<InitResponse>): InitResponse {
    const message = createBaseInitResponse();
    if (
      object.message?.$case === 'initProgress' &&
      object.message?.initProgress !== undefined &&
      object.message?.initProgress !== null
    ) {
      message.message = {
        $case: 'initProgress',
        initProgress: InitResponse_Progress.fromPartial(
          object.message.initProgress
        ),
      };
    }
    if (
      object.message?.$case === 'error' &&
      object.message?.error !== undefined &&
      object.message?.error !== null
    ) {
      message.message = {
        $case: 'error',
        error: Status.fromPartial(object.message.error),
      };
    }
    if (
      object.message?.$case === 'profile' &&
      object.message?.profile !== undefined &&
      object.message?.profile !== null
    ) {
      message.message = {
        $case: 'profile',
        profile: Profile.fromPartial(object.message.profile),
      };
    }
    return message;
  },
};

function createBaseInitResponse_Progress(): InitResponse_Progress {
  return { downloadProgress: undefined, taskProgress: undefined };
}

export const InitResponse_Progress = {
  encode(
    message: InitResponse_Progress,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.downloadProgress !== undefined) {
      DownloadProgress.encode(
        message.downloadProgress,
        writer.uint32(10).fork()
      ).ldelim();
    }
    if (message.taskProgress !== undefined) {
      TaskProgress.encode(
        message.taskProgress,
        writer.uint32(18).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): InitResponse_Progress {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInitResponse_Progress();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.downloadProgress = DownloadProgress.decode(
            reader,
            reader.uint32()
          );
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.taskProgress = TaskProgress.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): InitResponse_Progress {
    return {
      downloadProgress: isSet(object.downloadProgress)
        ? DownloadProgress.fromJSON(object.downloadProgress)
        : undefined,
      taskProgress: isSet(object.taskProgress)
        ? TaskProgress.fromJSON(object.taskProgress)
        : undefined,
    };
  },

  toJSON(message: InitResponse_Progress): unknown {
    const obj: any = {};
    if (message.downloadProgress !== undefined) {
      obj.downloadProgress = DownloadProgress.toJSON(message.downloadProgress);
    }
    if (message.taskProgress !== undefined) {
      obj.taskProgress = TaskProgress.toJSON(message.taskProgress);
    }
    return obj;
  },

  create(base?: DeepPartial<InitResponse_Progress>): InitResponse_Progress {
    return InitResponse_Progress.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<InitResponse_Progress>
  ): InitResponse_Progress {
    const message = createBaseInitResponse_Progress();
    message.downloadProgress =
      object.downloadProgress !== undefined && object.downloadProgress !== null
        ? DownloadProgress.fromPartial(object.downloadProgress)
        : undefined;
    message.taskProgress =
      object.taskProgress !== undefined && object.taskProgress !== null
        ? TaskProgress.fromPartial(object.taskProgress)
        : undefined;
    return message;
  },
};

function createBaseFailedInstanceInitError(): FailedInstanceInitError {
  return { reason: 0, message: '' };
}

export const FailedInstanceInitError = {
  encode(
    message: FailedInstanceInitError,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.reason !== 0) {
      writer.uint32(8).int32(message.reason);
    }
    if (message.message !== '') {
      writer.uint32(18).string(message.message);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): FailedInstanceInitError {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFailedInstanceInitError();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.reason = reader.int32() as any;
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

  fromJSON(object: any): FailedInstanceInitError {
    return {
      reason: isSet(object.reason)
        ? failedInstanceInitReasonFromJSON(object.reason)
        : 0,
      message: isSet(object.message) ? String(object.message) : '',
    };
  },

  toJSON(message: FailedInstanceInitError): unknown {
    const obj: any = {};
    if (message.reason !== 0) {
      obj.reason = failedInstanceInitReasonToJSON(message.reason);
    }
    if (message.message !== '') {
      obj.message = message.message;
    }
    return obj;
  },

  create(base?: DeepPartial<FailedInstanceInitError>): FailedInstanceInitError {
    return FailedInstanceInitError.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<FailedInstanceInitError>
  ): FailedInstanceInitError {
    const message = createBaseFailedInstanceInitError();
    message.reason = object.reason ?? 0;
    message.message = object.message ?? '';
    return message;
  },
};

function createBaseDestroyRequest(): DestroyRequest {
  return { instance: undefined };
}

export const DestroyRequest = {
  encode(
    message: DestroyRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DestroyRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDestroyRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.instance = Instance.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DestroyRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
    };
  },

  toJSON(message: DestroyRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    return obj;
  },

  create(base?: DeepPartial<DestroyRequest>): DestroyRequest {
    return DestroyRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<DestroyRequest>): DestroyRequest {
    const message = createBaseDestroyRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    return message;
  },
};

function createBaseDestroyResponse(): DestroyResponse {
  return {};
}

export const DestroyResponse = {
  encode(
    _: DestroyResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DestroyResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDestroyResponse();
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

  fromJSON(_: any): DestroyResponse {
    return {};
  },

  toJSON(_: DestroyResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(base?: DeepPartial<DestroyResponse>): DestroyResponse {
    return DestroyResponse.fromPartial(base ?? {});
  },
  fromPartial(_: DeepPartial<DestroyResponse>): DestroyResponse {
    const message = createBaseDestroyResponse();
    return message;
  },
};

function createBaseUpdateIndexRequest(): UpdateIndexRequest {
  return { instance: undefined, ignoreCustomPackageIndexes: false };
}

export const UpdateIndexRequest = {
  encode(
    message: UpdateIndexRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.ignoreCustomPackageIndexes === true) {
      writer.uint32(16).bool(message.ignoreCustomPackageIndexes);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UpdateIndexRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUpdateIndexRequest();
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
          if (tag !== 16) {
            break;
          }

          message.ignoreCustomPackageIndexes = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UpdateIndexRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      ignoreCustomPackageIndexes: isSet(object.ignoreCustomPackageIndexes)
        ? Boolean(object.ignoreCustomPackageIndexes)
        : false,
    };
  },

  toJSON(message: UpdateIndexRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.ignoreCustomPackageIndexes === true) {
      obj.ignoreCustomPackageIndexes = message.ignoreCustomPackageIndexes;
    }
    return obj;
  },

  create(base?: DeepPartial<UpdateIndexRequest>): UpdateIndexRequest {
    return UpdateIndexRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<UpdateIndexRequest>): UpdateIndexRequest {
    const message = createBaseUpdateIndexRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.ignoreCustomPackageIndexes =
      object.ignoreCustomPackageIndexes ?? false;
    return message;
  },
};

function createBaseUpdateIndexResponse(): UpdateIndexResponse {
  return { downloadProgress: undefined };
}

export const UpdateIndexResponse = {
  encode(
    message: UpdateIndexResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.downloadProgress !== undefined) {
      DownloadProgress.encode(
        message.downloadProgress,
        writer.uint32(10).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UpdateIndexResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUpdateIndexResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.downloadProgress = DownloadProgress.decode(
            reader,
            reader.uint32()
          );
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UpdateIndexResponse {
    return {
      downloadProgress: isSet(object.downloadProgress)
        ? DownloadProgress.fromJSON(object.downloadProgress)
        : undefined,
    };
  },

  toJSON(message: UpdateIndexResponse): unknown {
    const obj: any = {};
    if (message.downloadProgress !== undefined) {
      obj.downloadProgress = DownloadProgress.toJSON(message.downloadProgress);
    }
    return obj;
  },

  create(base?: DeepPartial<UpdateIndexResponse>): UpdateIndexResponse {
    return UpdateIndexResponse.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<UpdateIndexResponse>): UpdateIndexResponse {
    const message = createBaseUpdateIndexResponse();
    message.downloadProgress =
      object.downloadProgress !== undefined && object.downloadProgress !== null
        ? DownloadProgress.fromPartial(object.downloadProgress)
        : undefined;
    return message;
  },
};

function createBaseUpdateLibrariesIndexRequest(): UpdateLibrariesIndexRequest {
  return { instance: undefined };
}

export const UpdateLibrariesIndexRequest = {
  encode(
    message: UpdateLibrariesIndexRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): UpdateLibrariesIndexRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUpdateLibrariesIndexRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.instance = Instance.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UpdateLibrariesIndexRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
    };
  },

  toJSON(message: UpdateLibrariesIndexRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    return obj;
  },

  create(
    base?: DeepPartial<UpdateLibrariesIndexRequest>
  ): UpdateLibrariesIndexRequest {
    return UpdateLibrariesIndexRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<UpdateLibrariesIndexRequest>
  ): UpdateLibrariesIndexRequest {
    const message = createBaseUpdateLibrariesIndexRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    return message;
  },
};

function createBaseUpdateLibrariesIndexResponse(): UpdateLibrariesIndexResponse {
  return { downloadProgress: undefined };
}

export const UpdateLibrariesIndexResponse = {
  encode(
    message: UpdateLibrariesIndexResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.downloadProgress !== undefined) {
      DownloadProgress.encode(
        message.downloadProgress,
        writer.uint32(10).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): UpdateLibrariesIndexResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUpdateLibrariesIndexResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.downloadProgress = DownloadProgress.decode(
            reader,
            reader.uint32()
          );
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UpdateLibrariesIndexResponse {
    return {
      downloadProgress: isSet(object.downloadProgress)
        ? DownloadProgress.fromJSON(object.downloadProgress)
        : undefined,
    };
  },

  toJSON(message: UpdateLibrariesIndexResponse): unknown {
    const obj: any = {};
    if (message.downloadProgress !== undefined) {
      obj.downloadProgress = DownloadProgress.toJSON(message.downloadProgress);
    }
    return obj;
  },

  create(
    base?: DeepPartial<UpdateLibrariesIndexResponse>
  ): UpdateLibrariesIndexResponse {
    return UpdateLibrariesIndexResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<UpdateLibrariesIndexResponse>
  ): UpdateLibrariesIndexResponse {
    const message = createBaseUpdateLibrariesIndexResponse();
    message.downloadProgress =
      object.downloadProgress !== undefined && object.downloadProgress !== null
        ? DownloadProgress.fromPartial(object.downloadProgress)
        : undefined;
    return message;
  },
};

function createBaseVersionRequest(): VersionRequest {
  return {};
}

export const VersionRequest = {
  encode(
    _: VersionRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VersionRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVersionRequest();
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

  fromJSON(_: any): VersionRequest {
    return {};
  },

  toJSON(_: VersionRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create(base?: DeepPartial<VersionRequest>): VersionRequest {
    return VersionRequest.fromPartial(base ?? {});
  },
  fromPartial(_: DeepPartial<VersionRequest>): VersionRequest {
    const message = createBaseVersionRequest();
    return message;
  },
};

function createBaseVersionResponse(): VersionResponse {
  return { version: '' };
}

export const VersionResponse = {
  encode(
    message: VersionResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.version !== '') {
      writer.uint32(10).string(message.version);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VersionResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVersionResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.version = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): VersionResponse {
    return { version: isSet(object.version) ? String(object.version) : '' };
  },

  toJSON(message: VersionResponse): unknown {
    const obj: any = {};
    if (message.version !== '') {
      obj.version = message.version;
    }
    return obj;
  },

  create(base?: DeepPartial<VersionResponse>): VersionResponse {
    return VersionResponse.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<VersionResponse>): VersionResponse {
    const message = createBaseVersionResponse();
    message.version = object.version ?? '';
    return message;
  },
};

function createBaseNewSketchRequest(): NewSketchRequest {
  return { sketchName: '', sketchDir: '', overwrite: false };
}

export const NewSketchRequest = {
  encode(
    message: NewSketchRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.sketchName !== '') {
      writer.uint32(18).string(message.sketchName);
    }
    if (message.sketchDir !== '') {
      writer.uint32(26).string(message.sketchDir);
    }
    if (message.overwrite === true) {
      writer.uint32(32).bool(message.overwrite);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): NewSketchRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseNewSketchRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          if (tag !== 18) {
            break;
          }

          message.sketchName = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.sketchDir = reader.string();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.overwrite = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): NewSketchRequest {
    return {
      sketchName: isSet(object.sketchName) ? String(object.sketchName) : '',
      sketchDir: isSet(object.sketchDir) ? String(object.sketchDir) : '',
      overwrite: isSet(object.overwrite) ? Boolean(object.overwrite) : false,
    };
  },

  toJSON(message: NewSketchRequest): unknown {
    const obj: any = {};
    if (message.sketchName !== '') {
      obj.sketchName = message.sketchName;
    }
    if (message.sketchDir !== '') {
      obj.sketchDir = message.sketchDir;
    }
    if (message.overwrite === true) {
      obj.overwrite = message.overwrite;
    }
    return obj;
  },

  create(base?: DeepPartial<NewSketchRequest>): NewSketchRequest {
    return NewSketchRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<NewSketchRequest>): NewSketchRequest {
    const message = createBaseNewSketchRequest();
    message.sketchName = object.sketchName ?? '';
    message.sketchDir = object.sketchDir ?? '';
    message.overwrite = object.overwrite ?? false;
    return message;
  },
};

function createBaseNewSketchResponse(): NewSketchResponse {
  return { mainFile: '' };
}

export const NewSketchResponse = {
  encode(
    message: NewSketchResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.mainFile !== '') {
      writer.uint32(10).string(message.mainFile);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): NewSketchResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseNewSketchResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.mainFile = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): NewSketchResponse {
    return { mainFile: isSet(object.mainFile) ? String(object.mainFile) : '' };
  },

  toJSON(message: NewSketchResponse): unknown {
    const obj: any = {};
    if (message.mainFile !== '') {
      obj.mainFile = message.mainFile;
    }
    return obj;
  },

  create(base?: DeepPartial<NewSketchResponse>): NewSketchResponse {
    return NewSketchResponse.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<NewSketchResponse>): NewSketchResponse {
    const message = createBaseNewSketchResponse();
    message.mainFile = object.mainFile ?? '';
    return message;
  },
};

function createBaseLoadSketchRequest(): LoadSketchRequest {
  return { sketchPath: '' };
}

export const LoadSketchRequest = {
  encode(
    message: LoadSketchRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.sketchPath !== '') {
      writer.uint32(18).string(message.sketchPath);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LoadSketchRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLoadSketchRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          if (tag !== 18) {
            break;
          }

          message.sketchPath = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LoadSketchRequest {
    return {
      sketchPath: isSet(object.sketchPath) ? String(object.sketchPath) : '',
    };
  },

  toJSON(message: LoadSketchRequest): unknown {
    const obj: any = {};
    if (message.sketchPath !== '') {
      obj.sketchPath = message.sketchPath;
    }
    return obj;
  },

  create(base?: DeepPartial<LoadSketchRequest>): LoadSketchRequest {
    return LoadSketchRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<LoadSketchRequest>): LoadSketchRequest {
    const message = createBaseLoadSketchRequest();
    message.sketchPath = object.sketchPath ?? '';
    return message;
  },
};

function createBaseSketchProfile(): SketchProfile {
  return { name: '', fqbn: '' };
}

export const SketchProfile = {
  encode(
    message: SketchProfile,
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

  decode(input: _m0.Reader | Uint8Array, length?: number): SketchProfile {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSketchProfile();
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

  fromJSON(object: any): SketchProfile {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      fqbn: isSet(object.fqbn) ? String(object.fqbn) : '',
    };
  },

  toJSON(message: SketchProfile): unknown {
    const obj: any = {};
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.fqbn !== '') {
      obj.fqbn = message.fqbn;
    }
    return obj;
  },

  create(base?: DeepPartial<SketchProfile>): SketchProfile {
    return SketchProfile.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<SketchProfile>): SketchProfile {
    const message = createBaseSketchProfile();
    message.name = object.name ?? '';
    message.fqbn = object.fqbn ?? '';
    return message;
  },
};

function createBaseLoadSketchResponse(): LoadSketchResponse {
  return {
    mainFile: '',
    locationPath: '',
    otherSketchFiles: [],
    additionalFiles: [],
    rootFolderFiles: [],
    defaultFqbn: '',
    defaultPort: '',
    defaultProtocol: '',
    profiles: [],
    defaultProfile: undefined,
  };
}

export const LoadSketchResponse = {
  encode(
    message: LoadSketchResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.mainFile !== '') {
      writer.uint32(10).string(message.mainFile);
    }
    if (message.locationPath !== '') {
      writer.uint32(18).string(message.locationPath);
    }
    for (const v of message.otherSketchFiles) {
      writer.uint32(26).string(v!);
    }
    for (const v of message.additionalFiles) {
      writer.uint32(34).string(v!);
    }
    for (const v of message.rootFolderFiles) {
      writer.uint32(42).string(v!);
    }
    if (message.defaultFqbn !== '') {
      writer.uint32(50).string(message.defaultFqbn);
    }
    if (message.defaultPort !== '') {
      writer.uint32(58).string(message.defaultPort);
    }
    if (message.defaultProtocol !== '') {
      writer.uint32(66).string(message.defaultProtocol);
    }
    for (const v of message.profiles) {
      SketchProfile.encode(v!, writer.uint32(74).fork()).ldelim();
    }
    if (message.defaultProfile !== undefined) {
      SketchProfile.encode(
        message.defaultProfile,
        writer.uint32(82).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LoadSketchResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLoadSketchResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.mainFile = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.locationPath = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.otherSketchFiles.push(reader.string());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.additionalFiles.push(reader.string());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.rootFolderFiles.push(reader.string());
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.defaultFqbn = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.defaultPort = reader.string();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.defaultProtocol = reader.string();
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.profiles.push(SketchProfile.decode(reader, reader.uint32()));
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.defaultProfile = SketchProfile.decode(
            reader,
            reader.uint32()
          );
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LoadSketchResponse {
    return {
      mainFile: isSet(object.mainFile) ? String(object.mainFile) : '',
      locationPath: isSet(object.locationPath)
        ? String(object.locationPath)
        : '',
      otherSketchFiles: Array.isArray(object?.otherSketchFiles)
        ? object.otherSketchFiles.map((e: any) => String(e))
        : [],
      additionalFiles: Array.isArray(object?.additionalFiles)
        ? object.additionalFiles.map((e: any) => String(e))
        : [],
      rootFolderFiles: Array.isArray(object?.rootFolderFiles)
        ? object.rootFolderFiles.map((e: any) => String(e))
        : [],
      defaultFqbn: isSet(object.defaultFqbn) ? String(object.defaultFqbn) : '',
      defaultPort: isSet(object.defaultPort) ? String(object.defaultPort) : '',
      defaultProtocol: isSet(object.defaultProtocol)
        ? String(object.defaultProtocol)
        : '',
      profiles: Array.isArray(object?.profiles)
        ? object.profiles.map((e: any) => SketchProfile.fromJSON(e))
        : [],
      defaultProfile: isSet(object.defaultProfile)
        ? SketchProfile.fromJSON(object.defaultProfile)
        : undefined,
    };
  },

  toJSON(message: LoadSketchResponse): unknown {
    const obj: any = {};
    if (message.mainFile !== '') {
      obj.mainFile = message.mainFile;
    }
    if (message.locationPath !== '') {
      obj.locationPath = message.locationPath;
    }
    if (message.otherSketchFiles?.length) {
      obj.otherSketchFiles = message.otherSketchFiles;
    }
    if (message.additionalFiles?.length) {
      obj.additionalFiles = message.additionalFiles;
    }
    if (message.rootFolderFiles?.length) {
      obj.rootFolderFiles = message.rootFolderFiles;
    }
    if (message.defaultFqbn !== '') {
      obj.defaultFqbn = message.defaultFqbn;
    }
    if (message.defaultPort !== '') {
      obj.defaultPort = message.defaultPort;
    }
    if (message.defaultProtocol !== '') {
      obj.defaultProtocol = message.defaultProtocol;
    }
    if (message.profiles?.length) {
      obj.profiles = message.profiles.map((e) => SketchProfile.toJSON(e));
    }
    if (message.defaultProfile !== undefined) {
      obj.defaultProfile = SketchProfile.toJSON(message.defaultProfile);
    }
    return obj;
  },

  create(base?: DeepPartial<LoadSketchResponse>): LoadSketchResponse {
    return LoadSketchResponse.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<LoadSketchResponse>): LoadSketchResponse {
    const message = createBaseLoadSketchResponse();
    message.mainFile = object.mainFile ?? '';
    message.locationPath = object.locationPath ?? '';
    message.otherSketchFiles = object.otherSketchFiles?.map((e) => e) || [];
    message.additionalFiles = object.additionalFiles?.map((e) => e) || [];
    message.rootFolderFiles = object.rootFolderFiles?.map((e) => e) || [];
    message.defaultFqbn = object.defaultFqbn ?? '';
    message.defaultPort = object.defaultPort ?? '';
    message.defaultProtocol = object.defaultProtocol ?? '';
    message.profiles =
      object.profiles?.map((e) => SketchProfile.fromPartial(e)) || [];
    message.defaultProfile =
      object.defaultProfile !== undefined && object.defaultProfile !== null
        ? SketchProfile.fromPartial(object.defaultProfile)
        : undefined;
    return message;
  },
};

function createBaseArchiveSketchRequest(): ArchiveSketchRequest {
  return {
    sketchPath: '',
    archivePath: '',
    includeBuildDir: false,
    overwrite: false,
  };
}

export const ArchiveSketchRequest = {
  encode(
    message: ArchiveSketchRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.sketchPath !== '') {
      writer.uint32(10).string(message.sketchPath);
    }
    if (message.archivePath !== '') {
      writer.uint32(18).string(message.archivePath);
    }
    if (message.includeBuildDir === true) {
      writer.uint32(24).bool(message.includeBuildDir);
    }
    if (message.overwrite === true) {
      writer.uint32(32).bool(message.overwrite);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): ArchiveSketchRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseArchiveSketchRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.sketchPath = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.archivePath = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.includeBuildDir = reader.bool();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.overwrite = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ArchiveSketchRequest {
    return {
      sketchPath: isSet(object.sketchPath) ? String(object.sketchPath) : '',
      archivePath: isSet(object.archivePath) ? String(object.archivePath) : '',
      includeBuildDir: isSet(object.includeBuildDir)
        ? Boolean(object.includeBuildDir)
        : false,
      overwrite: isSet(object.overwrite) ? Boolean(object.overwrite) : false,
    };
  },

  toJSON(message: ArchiveSketchRequest): unknown {
    const obj: any = {};
    if (message.sketchPath !== '') {
      obj.sketchPath = message.sketchPath;
    }
    if (message.archivePath !== '') {
      obj.archivePath = message.archivePath;
    }
    if (message.includeBuildDir === true) {
      obj.includeBuildDir = message.includeBuildDir;
    }
    if (message.overwrite === true) {
      obj.overwrite = message.overwrite;
    }
    return obj;
  },

  create(base?: DeepPartial<ArchiveSketchRequest>): ArchiveSketchRequest {
    return ArchiveSketchRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<ArchiveSketchRequest>): ArchiveSketchRequest {
    const message = createBaseArchiveSketchRequest();
    message.sketchPath = object.sketchPath ?? '';
    message.archivePath = object.archivePath ?? '';
    message.includeBuildDir = object.includeBuildDir ?? false;
    message.overwrite = object.overwrite ?? false;
    return message;
  },
};

function createBaseArchiveSketchResponse(): ArchiveSketchResponse {
  return {};
}

export const ArchiveSketchResponse = {
  encode(
    _: ArchiveSketchResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): ArchiveSketchResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseArchiveSketchResponse();
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

  fromJSON(_: any): ArchiveSketchResponse {
    return {};
  },

  toJSON(_: ArchiveSketchResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(base?: DeepPartial<ArchiveSketchResponse>): ArchiveSketchResponse {
    return ArchiveSketchResponse.fromPartial(base ?? {});
  },
  fromPartial(_: DeepPartial<ArchiveSketchResponse>): ArchiveSketchResponse {
    const message = createBaseArchiveSketchResponse();
    return message;
  },
};

function createBaseSetSketchDefaultsRequest(): SetSketchDefaultsRequest {
  return {
    sketchPath: '',
    defaultFqbn: '',
    defaultPortAddress: '',
    defaultPortProtocol: '',
  };
}

export const SetSketchDefaultsRequest = {
  encode(
    message: SetSketchDefaultsRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.sketchPath !== '') {
      writer.uint32(10).string(message.sketchPath);
    }
    if (message.defaultFqbn !== '') {
      writer.uint32(18).string(message.defaultFqbn);
    }
    if (message.defaultPortAddress !== '') {
      writer.uint32(26).string(message.defaultPortAddress);
    }
    if (message.defaultPortProtocol !== '') {
      writer.uint32(34).string(message.defaultPortProtocol);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): SetSketchDefaultsRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSetSketchDefaultsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.sketchPath = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.defaultFqbn = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.defaultPortAddress = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.defaultPortProtocol = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SetSketchDefaultsRequest {
    return {
      sketchPath: isSet(object.sketchPath) ? String(object.sketchPath) : '',
      defaultFqbn: isSet(object.defaultFqbn) ? String(object.defaultFqbn) : '',
      defaultPortAddress: isSet(object.defaultPortAddress)
        ? String(object.defaultPortAddress)
        : '',
      defaultPortProtocol: isSet(object.defaultPortProtocol)
        ? String(object.defaultPortProtocol)
        : '',
    };
  },

  toJSON(message: SetSketchDefaultsRequest): unknown {
    const obj: any = {};
    if (message.sketchPath !== '') {
      obj.sketchPath = message.sketchPath;
    }
    if (message.defaultFqbn !== '') {
      obj.defaultFqbn = message.defaultFqbn;
    }
    if (message.defaultPortAddress !== '') {
      obj.defaultPortAddress = message.defaultPortAddress;
    }
    if (message.defaultPortProtocol !== '') {
      obj.defaultPortProtocol = message.defaultPortProtocol;
    }
    return obj;
  },

  create(
    base?: DeepPartial<SetSketchDefaultsRequest>
  ): SetSketchDefaultsRequest {
    return SetSketchDefaultsRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<SetSketchDefaultsRequest>
  ): SetSketchDefaultsRequest {
    const message = createBaseSetSketchDefaultsRequest();
    message.sketchPath = object.sketchPath ?? '';
    message.defaultFqbn = object.defaultFqbn ?? '';
    message.defaultPortAddress = object.defaultPortAddress ?? '';
    message.defaultPortProtocol = object.defaultPortProtocol ?? '';
    return message;
  },
};

function createBaseSetSketchDefaultsResponse(): SetSketchDefaultsResponse {
  return { defaultFqbn: '', defaultPortAddress: '', defaultPortProtocol: '' };
}

export const SetSketchDefaultsResponse = {
  encode(
    message: SetSketchDefaultsResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.defaultFqbn !== '') {
      writer.uint32(10).string(message.defaultFqbn);
    }
    if (message.defaultPortAddress !== '') {
      writer.uint32(18).string(message.defaultPortAddress);
    }
    if (message.defaultPortProtocol !== '') {
      writer.uint32(26).string(message.defaultPortProtocol);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): SetSketchDefaultsResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSetSketchDefaultsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.defaultFqbn = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.defaultPortAddress = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.defaultPortProtocol = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SetSketchDefaultsResponse {
    return {
      defaultFqbn: isSet(object.defaultFqbn) ? String(object.defaultFqbn) : '',
      defaultPortAddress: isSet(object.defaultPortAddress)
        ? String(object.defaultPortAddress)
        : '',
      defaultPortProtocol: isSet(object.defaultPortProtocol)
        ? String(object.defaultPortProtocol)
        : '',
    };
  },

  toJSON(message: SetSketchDefaultsResponse): unknown {
    const obj: any = {};
    if (message.defaultFqbn !== '') {
      obj.defaultFqbn = message.defaultFqbn;
    }
    if (message.defaultPortAddress !== '') {
      obj.defaultPortAddress = message.defaultPortAddress;
    }
    if (message.defaultPortProtocol !== '') {
      obj.defaultPortProtocol = message.defaultPortProtocol;
    }
    return obj;
  },

  create(
    base?: DeepPartial<SetSketchDefaultsResponse>
  ): SetSketchDefaultsResponse {
    return SetSketchDefaultsResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<SetSketchDefaultsResponse>
  ): SetSketchDefaultsResponse {
    const message = createBaseSetSketchDefaultsResponse();
    message.defaultFqbn = object.defaultFqbn ?? '';
    message.defaultPortAddress = object.defaultPortAddress ?? '';
    message.defaultPortProtocol = object.defaultPortProtocol ?? '';
    return message;
  },
};

/** The main Arduino Platform service API */
export type ArduinoCoreServiceDefinition = typeof ArduinoCoreServiceDefinition;
export const ArduinoCoreServiceDefinition = {
  name: 'ArduinoCoreService',
  fullName: 'cc.arduino.cli.commands.v1.ArduinoCoreService',
  methods: {
    /** Create a new Arduino Core instance */
    create: {
      name: 'Create',
      requestType: CreateRequest,
      requestStream: false,
      responseType: CreateResponse,
      responseStream: false,
      options: {},
    },
    /**
     * Initializes an existing Arduino Core instance by loading platforms and
     * libraries
     */
    init: {
      name: 'Init',
      requestType: InitRequest,
      requestStream: false,
      responseType: InitResponse,
      responseStream: true,
      options: {},
    },
    /** Destroy an instance of the Arduino Core Service */
    destroy: {
      name: 'Destroy',
      requestType: DestroyRequest,
      requestStream: false,
      responseType: DestroyResponse,
      responseStream: false,
      options: {},
    },
    /** Update package index of the Arduino Core Service */
    updateIndex: {
      name: 'UpdateIndex',
      requestType: UpdateIndexRequest,
      requestStream: false,
      responseType: UpdateIndexResponse,
      responseStream: true,
      options: {},
    },
    /** Update libraries index */
    updateLibrariesIndex: {
      name: 'UpdateLibrariesIndex',
      requestType: UpdateLibrariesIndexRequest,
      requestStream: false,
      responseType: UpdateLibrariesIndexResponse,
      responseStream: true,
      options: {},
    },
    /** Get the version of Arduino CLI in use. */
    version: {
      name: 'Version',
      requestType: VersionRequest,
      requestStream: false,
      responseType: VersionResponse,
      responseStream: false,
      options: {},
    },
    /** Create a new Sketch */
    newSketch: {
      name: 'NewSketch',
      requestType: NewSketchRequest,
      requestStream: false,
      responseType: NewSketchResponse,
      responseStream: false,
      options: {},
    },
    /** Returns all files composing a Sketch */
    loadSketch: {
      name: 'LoadSketch',
      requestType: LoadSketchRequest,
      requestStream: false,
      responseType: LoadSketchResponse,
      responseStream: false,
      options: {},
    },
    /** Creates a zip file containing all files of specified Sketch */
    archiveSketch: {
      name: 'ArchiveSketch',
      requestType: ArchiveSketchRequest,
      requestStream: false,
      responseType: ArchiveSketchResponse,
      responseStream: false,
      options: {},
    },
    /**
     * Sets the sketch default FQBN and Port Address/Protocol in
     * the sketch project file (sketch.yaml). These metadata can be retrieved
     * using LoadSketch.
     */
    setSketchDefaults: {
      name: 'SetSketchDefaults',
      requestType: SetSketchDefaultsRequest,
      requestStream: false,
      responseType: SetSketchDefaultsResponse,
      responseStream: false,
      options: {},
    },
    /** Requests details about a board */
    boardDetails: {
      name: 'BoardDetails',
      requestType: BoardDetailsRequest,
      requestStream: false,
      responseType: BoardDetailsResponse,
      responseStream: false,
      options: {},
    },
    /** List the boards currently connected to the computer. */
    boardList: {
      name: 'BoardList',
      requestType: BoardListRequest,
      requestStream: false,
      responseType: BoardListResponse,
      responseStream: false,
      options: {},
    },
    /** List all the boards provided by installed platforms. */
    boardListAll: {
      name: 'BoardListAll',
      requestType: BoardListAllRequest,
      requestStream: false,
      responseType: BoardListAllResponse,
      responseStream: false,
      options: {},
    },
    /** Search boards in installed and not installed Platforms. */
    boardSearch: {
      name: 'BoardSearch',
      requestType: BoardSearchRequest,
      requestStream: false,
      responseType: BoardSearchResponse,
      responseStream: false,
      options: {},
    },
    /** List boards connection and disconnected events. */
    boardListWatch: {
      name: 'BoardListWatch',
      requestType: BoardListWatchRequest,
      requestStream: true,
      responseType: BoardListWatchResponse,
      responseStream: true,
      options: {},
    },
    /** Compile an Arduino sketch. */
    compile: {
      name: 'Compile',
      requestType: CompileRequest,
      requestStream: false,
      responseType: CompileResponse,
      responseStream: true,
      options: {},
    },
    /** Download and install a platform and its tool dependencies. */
    platformInstall: {
      name: 'PlatformInstall',
      requestType: PlatformInstallRequest,
      requestStream: false,
      responseType: PlatformInstallResponse,
      responseStream: true,
      options: {},
    },
    /**
     * Download a platform and its tool dependencies to the `staging/packages`
     * subdirectory of the data directory.
     */
    platformDownload: {
      name: 'PlatformDownload',
      requestType: PlatformDownloadRequest,
      requestStream: false,
      responseType: PlatformDownloadResponse,
      responseStream: true,
      options: {},
    },
    /**
     * Uninstall a platform as well as its tool dependencies that are not used by
     * other installed platforms.
     */
    platformUninstall: {
      name: 'PlatformUninstall',
      requestType: PlatformUninstallRequest,
      requestStream: false,
      responseType: PlatformUninstallResponse,
      responseStream: true,
      options: {},
    },
    /** Upgrade an installed platform to the latest version. */
    platformUpgrade: {
      name: 'PlatformUpgrade',
      requestType: PlatformUpgradeRequest,
      requestStream: false,
      responseType: PlatformUpgradeResponse,
      responseStream: true,
      options: {},
    },
    /** Upload a compiled sketch to a board. */
    upload: {
      name: 'Upload',
      requestType: UploadRequest,
      requestStream: false,
      responseType: UploadResponse,
      responseStream: true,
      options: {},
    },
    /** Upload a compiled sketch to a board using a programmer. */
    uploadUsingProgrammer: {
      name: 'UploadUsingProgrammer',
      requestType: UploadUsingProgrammerRequest,
      requestStream: false,
      responseType: UploadUsingProgrammerResponse,
      responseStream: true,
      options: {},
    },
    /**
     * Returns the list of users fields necessary to upload to that board
     * using the specified protocol.
     */
    supportedUserFields: {
      name: 'SupportedUserFields',
      requestType: SupportedUserFieldsRequest,
      requestStream: false,
      responseType: SupportedUserFieldsResponse,
      responseStream: false,
      options: {},
    },
    /** List programmers available for a board. */
    listProgrammersAvailableForUpload: {
      name: 'ListProgrammersAvailableForUpload',
      requestType: ListProgrammersAvailableForUploadRequest,
      requestStream: false,
      responseType: ListProgrammersAvailableForUploadResponse,
      responseStream: false,
      options: {},
    },
    /** Burn bootloader to a board. */
    burnBootloader: {
      name: 'BurnBootloader',
      requestType: BurnBootloaderRequest,
      requestStream: false,
      responseType: BurnBootloaderResponse,
      responseStream: true,
      options: {},
    },
    /** Search for a platform in the platforms indexes. */
    platformSearch: {
      name: 'PlatformSearch',
      requestType: PlatformSearchRequest,
      requestStream: false,
      responseType: PlatformSearchResponse,
      responseStream: false,
      options: {},
    },
    /** List all installed platforms. */
    platformList: {
      name: 'PlatformList',
      requestType: PlatformListRequest,
      requestStream: false,
      responseType: PlatformListResponse,
      responseStream: false,
      options: {},
    },
    /**
     * Download the archive file of an Arduino library in the libraries index to
     * the staging directory.
     */
    libraryDownload: {
      name: 'LibraryDownload',
      requestType: LibraryDownloadRequest,
      requestStream: false,
      responseType: LibraryDownloadResponse,
      responseStream: true,
      options: {},
    },
    /** Download and install an Arduino library from the libraries index. */
    libraryInstall: {
      name: 'LibraryInstall',
      requestType: LibraryInstallRequest,
      requestStream: false,
      responseType: LibraryInstallResponse,
      responseStream: true,
      options: {},
    },
    /** Upgrade a library to the newest version available. */
    libraryUpgrade: {
      name: 'LibraryUpgrade',
      requestType: LibraryUpgradeRequest,
      requestStream: false,
      responseType: LibraryUpgradeResponse,
      responseStream: true,
      options: {},
    },
    /** Install a library from a Zip File */
    zipLibraryInstall: {
      name: 'ZipLibraryInstall',
      requestType: ZipLibraryInstallRequest,
      requestStream: false,
      responseType: ZipLibraryInstallResponse,
      responseStream: true,
      options: {},
    },
    /** Download and install a library from a git url */
    gitLibraryInstall: {
      name: 'GitLibraryInstall',
      requestType: GitLibraryInstallRequest,
      requestStream: false,
      responseType: GitLibraryInstallResponse,
      responseStream: true,
      options: {},
    },
    /** Uninstall an Arduino library. */
    libraryUninstall: {
      name: 'LibraryUninstall',
      requestType: LibraryUninstallRequest,
      requestStream: false,
      responseType: LibraryUninstallResponse,
      responseStream: true,
      options: {},
    },
    /** Upgrade all installed Arduino libraries to the newest version available. */
    libraryUpgradeAll: {
      name: 'LibraryUpgradeAll',
      requestType: LibraryUpgradeAllRequest,
      requestStream: false,
      responseType: LibraryUpgradeAllResponse,
      responseStream: true,
      options: {},
    },
    /**
     * List the recursive dependencies of a library, as defined by the `depends`
     * field of the library.properties files.
     */
    libraryResolveDependencies: {
      name: 'LibraryResolveDependencies',
      requestType: LibraryResolveDependenciesRequest,
      requestStream: false,
      responseType: LibraryResolveDependenciesResponse,
      responseStream: false,
      options: {},
    },
    /** Search the Arduino libraries index for libraries. */
    librarySearch: {
      name: 'LibrarySearch',
      requestType: LibrarySearchRequest,
      requestStream: false,
      responseType: LibrarySearchResponse,
      responseStream: false,
      options: {},
    },
    /** List the installed libraries. */
    libraryList: {
      name: 'LibraryList',
      requestType: LibraryListRequest,
      requestStream: false,
      responseType: LibraryListResponse,
      responseStream: false,
      options: {},
    },
    /** Open a monitor connection to a board port */
    monitor: {
      name: 'Monitor',
      requestType: MonitorRequest,
      requestStream: true,
      responseType: MonitorResponse,
      responseStream: true,
      options: {},
    },
    /** Returns the parameters that can be set in the MonitorRequest calls */
    enumerateMonitorPortSettings: {
      name: 'EnumerateMonitorPortSettings',
      requestType: EnumerateMonitorPortSettingsRequest,
      requestStream: false,
      responseType: EnumerateMonitorPortSettingsResponse,
      responseStream: false,
      options: {},
    },
  },
} as const;

export interface ArduinoCoreServiceImplementation<CallContextExt = {}> {
  /** Create a new Arduino Core instance */
  create(
    request: CreateRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<CreateResponse>>;
  /**
   * Initializes an existing Arduino Core instance by loading platforms and
   * libraries
   */
  init(
    request: InitRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<InitResponse>>;
  /** Destroy an instance of the Arduino Core Service */
  destroy(
    request: DestroyRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<DestroyResponse>>;
  /** Update package index of the Arduino Core Service */
  updateIndex(
    request: UpdateIndexRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<UpdateIndexResponse>>;
  /** Update libraries index */
  updateLibrariesIndex(
    request: UpdateLibrariesIndexRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<UpdateLibrariesIndexResponse>>;
  /** Get the version of Arduino CLI in use. */
  version(
    request: VersionRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<VersionResponse>>;
  /** Create a new Sketch */
  newSketch(
    request: NewSketchRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<NewSketchResponse>>;
  /** Returns all files composing a Sketch */
  loadSketch(
    request: LoadSketchRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<LoadSketchResponse>>;
  /** Creates a zip file containing all files of specified Sketch */
  archiveSketch(
    request: ArchiveSketchRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<ArchiveSketchResponse>>;
  /**
   * Sets the sketch default FQBN and Port Address/Protocol in
   * the sketch project file (sketch.yaml). These metadata can be retrieved
   * using LoadSketch.
   */
  setSketchDefaults(
    request: SetSketchDefaultsRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<SetSketchDefaultsResponse>>;
  /** Requests details about a board */
  boardDetails(
    request: BoardDetailsRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<BoardDetailsResponse>>;
  /** List the boards currently connected to the computer. */
  boardList(
    request: BoardListRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<BoardListResponse>>;
  /** List all the boards provided by installed platforms. */
  boardListAll(
    request: BoardListAllRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<BoardListAllResponse>>;
  /** Search boards in installed and not installed Platforms. */
  boardSearch(
    request: BoardSearchRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<BoardSearchResponse>>;
  /** List boards connection and disconnected events. */
  boardListWatch(
    request: AsyncIterable<BoardListWatchRequest>,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<BoardListWatchResponse>>;
  /** Compile an Arduino sketch. */
  compile(
    request: CompileRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<CompileResponse>>;
  /** Download and install a platform and its tool dependencies. */
  platformInstall(
    request: PlatformInstallRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<PlatformInstallResponse>>;
  /**
   * Download a platform and its tool dependencies to the `staging/packages`
   * subdirectory of the data directory.
   */
  platformDownload(
    request: PlatformDownloadRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<PlatformDownloadResponse>>;
  /**
   * Uninstall a platform as well as its tool dependencies that are not used by
   * other installed platforms.
   */
  platformUninstall(
    request: PlatformUninstallRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<PlatformUninstallResponse>>;
  /** Upgrade an installed platform to the latest version. */
  platformUpgrade(
    request: PlatformUpgradeRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<PlatformUpgradeResponse>>;
  /** Upload a compiled sketch to a board. */
  upload(
    request: UploadRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<UploadResponse>>;
  /** Upload a compiled sketch to a board using a programmer. */
  uploadUsingProgrammer(
    request: UploadUsingProgrammerRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<UploadUsingProgrammerResponse>>;
  /**
   * Returns the list of users fields necessary to upload to that board
   * using the specified protocol.
   */
  supportedUserFields(
    request: SupportedUserFieldsRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<SupportedUserFieldsResponse>>;
  /** List programmers available for a board. */
  listProgrammersAvailableForUpload(
    request: ListProgrammersAvailableForUploadRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<ListProgrammersAvailableForUploadResponse>>;
  /** Burn bootloader to a board. */
  burnBootloader(
    request: BurnBootloaderRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<BurnBootloaderResponse>>;
  /** Search for a platform in the platforms indexes. */
  platformSearch(
    request: PlatformSearchRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<PlatformSearchResponse>>;
  /** List all installed platforms. */
  platformList(
    request: PlatformListRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<PlatformListResponse>>;
  /**
   * Download the archive file of an Arduino library in the libraries index to
   * the staging directory.
   */
  libraryDownload(
    request: LibraryDownloadRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<LibraryDownloadResponse>>;
  /** Download and install an Arduino library from the libraries index. */
  libraryInstall(
    request: LibraryInstallRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<LibraryInstallResponse>>;
  /** Upgrade a library to the newest version available. */
  libraryUpgrade(
    request: LibraryUpgradeRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<LibraryUpgradeResponse>>;
  /** Install a library from a Zip File */
  zipLibraryInstall(
    request: ZipLibraryInstallRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<ZipLibraryInstallResponse>>;
  /** Download and install a library from a git url */
  gitLibraryInstall(
    request: GitLibraryInstallRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<GitLibraryInstallResponse>>;
  /** Uninstall an Arduino library. */
  libraryUninstall(
    request: LibraryUninstallRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<LibraryUninstallResponse>>;
  /** Upgrade all installed Arduino libraries to the newest version available. */
  libraryUpgradeAll(
    request: LibraryUpgradeAllRequest,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<LibraryUpgradeAllResponse>>;
  /**
   * List the recursive dependencies of a library, as defined by the `depends`
   * field of the library.properties files.
   */
  libraryResolveDependencies(
    request: LibraryResolveDependenciesRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<LibraryResolveDependenciesResponse>>;
  /** Search the Arduino libraries index for libraries. */
  librarySearch(
    request: LibrarySearchRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<LibrarySearchResponse>>;
  /** List the installed libraries. */
  libraryList(
    request: LibraryListRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<LibraryListResponse>>;
  /** Open a monitor connection to a board port */
  monitor(
    request: AsyncIterable<MonitorRequest>,
    context: CallContext & CallContextExt
  ): ServerStreamingMethodResult<DeepPartial<MonitorResponse>>;
  /** Returns the parameters that can be set in the MonitorRequest calls */
  enumerateMonitorPortSettings(
    request: EnumerateMonitorPortSettingsRequest,
    context: CallContext & CallContextExt
  ): Promise<DeepPartial<EnumerateMonitorPortSettingsResponse>>;
}

export interface ArduinoCoreServiceClient<CallOptionsExt = {}> {
  /** Create a new Arduino Core instance */
  create(
    request: DeepPartial<CreateRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<CreateResponse>;
  /**
   * Initializes an existing Arduino Core instance by loading platforms and
   * libraries
   */
  init(
    request: DeepPartial<InitRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<InitResponse>;
  /** Destroy an instance of the Arduino Core Service */
  destroy(
    request: DeepPartial<DestroyRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<DestroyResponse>;
  /** Update package index of the Arduino Core Service */
  updateIndex(
    request: DeepPartial<UpdateIndexRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<UpdateIndexResponse>;
  /** Update libraries index */
  updateLibrariesIndex(
    request: DeepPartial<UpdateLibrariesIndexRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<UpdateLibrariesIndexResponse>;
  /** Get the version of Arduino CLI in use. */
  version(
    request: DeepPartial<VersionRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<VersionResponse>;
  /** Create a new Sketch */
  newSketch(
    request: DeepPartial<NewSketchRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<NewSketchResponse>;
  /** Returns all files composing a Sketch */
  loadSketch(
    request: DeepPartial<LoadSketchRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<LoadSketchResponse>;
  /** Creates a zip file containing all files of specified Sketch */
  archiveSketch(
    request: DeepPartial<ArchiveSketchRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<ArchiveSketchResponse>;
  /**
   * Sets the sketch default FQBN and Port Address/Protocol in
   * the sketch project file (sketch.yaml). These metadata can be retrieved
   * using LoadSketch.
   */
  setSketchDefaults(
    request: DeepPartial<SetSketchDefaultsRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<SetSketchDefaultsResponse>;
  /** Requests details about a board */
  boardDetails(
    request: DeepPartial<BoardDetailsRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<BoardDetailsResponse>;
  /** List the boards currently connected to the computer. */
  boardList(
    request: DeepPartial<BoardListRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<BoardListResponse>;
  /** List all the boards provided by installed platforms. */
  boardListAll(
    request: DeepPartial<BoardListAllRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<BoardListAllResponse>;
  /** Search boards in installed and not installed Platforms. */
  boardSearch(
    request: DeepPartial<BoardSearchRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<BoardSearchResponse>;
  /** List boards connection and disconnected events. */
  boardListWatch(
    request: AsyncIterable<DeepPartial<BoardListWatchRequest>>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<BoardListWatchResponse>;
  /** Compile an Arduino sketch. */
  compile(
    request: DeepPartial<CompileRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<CompileResponse>;
  /** Download and install a platform and its tool dependencies. */
  platformInstall(
    request: DeepPartial<PlatformInstallRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<PlatformInstallResponse>;
  /**
   * Download a platform and its tool dependencies to the `staging/packages`
   * subdirectory of the data directory.
   */
  platformDownload(
    request: DeepPartial<PlatformDownloadRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<PlatformDownloadResponse>;
  /**
   * Uninstall a platform as well as its tool dependencies that are not used by
   * other installed platforms.
   */
  platformUninstall(
    request: DeepPartial<PlatformUninstallRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<PlatformUninstallResponse>;
  /** Upgrade an installed platform to the latest version. */
  platformUpgrade(
    request: DeepPartial<PlatformUpgradeRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<PlatformUpgradeResponse>;
  /** Upload a compiled sketch to a board. */
  upload(
    request: DeepPartial<UploadRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<UploadResponse>;
  /** Upload a compiled sketch to a board using a programmer. */
  uploadUsingProgrammer(
    request: DeepPartial<UploadUsingProgrammerRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<UploadUsingProgrammerResponse>;
  /**
   * Returns the list of users fields necessary to upload to that board
   * using the specified protocol.
   */
  supportedUserFields(
    request: DeepPartial<SupportedUserFieldsRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<SupportedUserFieldsResponse>;
  /** List programmers available for a board. */
  listProgrammersAvailableForUpload(
    request: DeepPartial<ListProgrammersAvailableForUploadRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<ListProgrammersAvailableForUploadResponse>;
  /** Burn bootloader to a board. */
  burnBootloader(
    request: DeepPartial<BurnBootloaderRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<BurnBootloaderResponse>;
  /** Search for a platform in the platforms indexes. */
  platformSearch(
    request: DeepPartial<PlatformSearchRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<PlatformSearchResponse>;
  /** List all installed platforms. */
  platformList(
    request: DeepPartial<PlatformListRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<PlatformListResponse>;
  /**
   * Download the archive file of an Arduino library in the libraries index to
   * the staging directory.
   */
  libraryDownload(
    request: DeepPartial<LibraryDownloadRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<LibraryDownloadResponse>;
  /** Download and install an Arduino library from the libraries index. */
  libraryInstall(
    request: DeepPartial<LibraryInstallRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<LibraryInstallResponse>;
  /** Upgrade a library to the newest version available. */
  libraryUpgrade(
    request: DeepPartial<LibraryUpgradeRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<LibraryUpgradeResponse>;
  /** Install a library from a Zip File */
  zipLibraryInstall(
    request: DeepPartial<ZipLibraryInstallRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<ZipLibraryInstallResponse>;
  /** Download and install a library from a git url */
  gitLibraryInstall(
    request: DeepPartial<GitLibraryInstallRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<GitLibraryInstallResponse>;
  /** Uninstall an Arduino library. */
  libraryUninstall(
    request: DeepPartial<LibraryUninstallRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<LibraryUninstallResponse>;
  /** Upgrade all installed Arduino libraries to the newest version available. */
  libraryUpgradeAll(
    request: DeepPartial<LibraryUpgradeAllRequest>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<LibraryUpgradeAllResponse>;
  /**
   * List the recursive dependencies of a library, as defined by the `depends`
   * field of the library.properties files.
   */
  libraryResolveDependencies(
    request: DeepPartial<LibraryResolveDependenciesRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<LibraryResolveDependenciesResponse>;
  /** Search the Arduino libraries index for libraries. */
  librarySearch(
    request: DeepPartial<LibrarySearchRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<LibrarySearchResponse>;
  /** List the installed libraries. */
  libraryList(
    request: DeepPartial<LibraryListRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<LibraryListResponse>;
  /** Open a monitor connection to a board port */
  monitor(
    request: AsyncIterable<DeepPartial<MonitorRequest>>,
    options?: CallOptions & CallOptionsExt
  ): AsyncIterable<MonitorResponse>;
  /** Returns the parameters that can be set in the MonitorRequest calls */
  enumerateMonitorPortSettings(
    request: DeepPartial<EnumerateMonitorPortSettingsRequest>,
    options?: CallOptions & CallOptionsExt
  ): Promise<EnumerateMonitorPortSettingsResponse>;
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

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

export type ServerStreamingMethodResult<Response> = {
  [Symbol.asyncIterator](): AsyncIterator<Response, void>;
};
