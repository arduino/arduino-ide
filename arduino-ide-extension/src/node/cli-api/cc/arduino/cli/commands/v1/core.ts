/* eslint-disable */
import _m0 from 'protobufjs/minimal';
import { DownloadProgress, Instance, Platform, TaskProgress } from './common';

export interface PlatformInstallRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /** Vendor name of the platform (e.g., `arduino`). */
  platformPackage: string;
  /** Architecture name of the platform (e.g., `avr`). */
  architecture: string;
  /** Platform version to install. */
  version: string;
  /**
   * Set to true to not run (eventual) post install scripts for trusted
   * platforms
   */
  skipPostInstall: boolean;
  /**
   * Set to true to skip installation if a different version of the platform
   * is already installed.
   */
  noOverwrite: boolean;
}

export interface PlatformInstallResponse {
  /** Progress of the downloads of the platform and tool files. */
  progress: DownloadProgress | undefined;
  /** Description of the current stage of the installation. */
  taskProgress: TaskProgress | undefined;
}

export interface PlatformLoadingError {}

export interface PlatformDownloadRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  platformPackage: string;
  /** Architecture name of the platform (e.g., `avr`). */
  architecture: string;
  /** Platform version to download. */
  version: string;
}

export interface PlatformDownloadResponse {
  /** Progress of the downloads of platform and tool files. */
  progress: DownloadProgress | undefined;
}

export interface PlatformUninstallRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /** Vendor name of the platform (e.g., `arduino`). */
  platformPackage: string;
  /** Architecture name of the platform (e.g., `avr`). */
  architecture: string;
}

export interface PlatformUninstallResponse {
  /** Description of the current stage of the uninstall. */
  taskProgress: TaskProgress | undefined;
}

/**
 * AlreadyAtLatestVersionError is returned when an upgrade is not possible
 * because already at latest version.
 */
export interface AlreadyAtLatestVersionError {}

export interface PlatformUpgradeRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /** Vendor name of the platform (e.g., `arduino`). */
  platformPackage: string;
  /** Architecture name of the platform (e.g., `avr`). */
  architecture: string;
  /**
   * Set to true to not run (eventual) post install scripts for trusted
   * platforms
   */
  skipPostInstall: boolean;
}

export interface PlatformUpgradeResponse {
  /** Progress of the downloads of the platform and tool files. */
  progress: DownloadProgress | undefined;
  /** Description of the current stage of the upgrade. */
  taskProgress: TaskProgress | undefined;
  /** The upgraded platform. */
  platform: Platform | undefined;
}

export interface PlatformSearchRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /** Keywords for the search. */
  searchArgs: string;
  /**
   * Whether to show all available versions. `false` causes only the newest
   * versions of the cores to be listed in the search results.
   */
  allVersions: boolean;
}

export interface PlatformSearchResponse {
  /** Results of the search. */
  searchOutput: Platform[];
}

export interface PlatformListRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /**
   * Set to true to only list platforms which have a newer version available
   * than the one currently installed.
   */
  updatableOnly: boolean;
  /**
   * Set to true to list platforms installed manually in the user' sketchbook
   * hardware folder, installed with the PlatformManager through the CLI or
   * IDE and that are available to install
   */
  all: boolean;
}

export interface PlatformListResponse {
  /** The installed platforms. */
  installedPlatforms: Platform[];
}

function createBasePlatformInstallRequest(): PlatformInstallRequest {
  return {
    instance: undefined,
    platformPackage: '',
    architecture: '',
    version: '',
    skipPostInstall: false,
    noOverwrite: false,
  };
}

export const PlatformInstallRequest = {
  encode(
    message: PlatformInstallRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.platformPackage !== '') {
      writer.uint32(18).string(message.platformPackage);
    }
    if (message.architecture !== '') {
      writer.uint32(26).string(message.architecture);
    }
    if (message.version !== '') {
      writer.uint32(34).string(message.version);
    }
    if (message.skipPostInstall === true) {
      writer.uint32(40).bool(message.skipPostInstall);
    }
    if (message.noOverwrite === true) {
      writer.uint32(48).bool(message.noOverwrite);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PlatformInstallRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformInstallRequest();
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

          message.platformPackage = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.architecture = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.version = reader.string();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.skipPostInstall = reader.bool();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.noOverwrite = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PlatformInstallRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      platformPackage: isSet(object.platformPackage)
        ? String(object.platformPackage)
        : '',
      architecture: isSet(object.architecture)
        ? String(object.architecture)
        : '',
      version: isSet(object.version) ? String(object.version) : '',
      skipPostInstall: isSet(object.skipPostInstall)
        ? Boolean(object.skipPostInstall)
        : false,
      noOverwrite: isSet(object.noOverwrite)
        ? Boolean(object.noOverwrite)
        : false,
    };
  },

  toJSON(message: PlatformInstallRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.platformPackage !== '') {
      obj.platformPackage = message.platformPackage;
    }
    if (message.architecture !== '') {
      obj.architecture = message.architecture;
    }
    if (message.version !== '') {
      obj.version = message.version;
    }
    if (message.skipPostInstall === true) {
      obj.skipPostInstall = message.skipPostInstall;
    }
    if (message.noOverwrite === true) {
      obj.noOverwrite = message.noOverwrite;
    }
    return obj;
  },

  create(base?: DeepPartial<PlatformInstallRequest>): PlatformInstallRequest {
    return PlatformInstallRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<PlatformInstallRequest>
  ): PlatformInstallRequest {
    const message = createBasePlatformInstallRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.platformPackage = object.platformPackage ?? '';
    message.architecture = object.architecture ?? '';
    message.version = object.version ?? '';
    message.skipPostInstall = object.skipPostInstall ?? false;
    message.noOverwrite = object.noOverwrite ?? false;
    return message;
  },
};

function createBasePlatformInstallResponse(): PlatformInstallResponse {
  return { progress: undefined, taskProgress: undefined };
}

export const PlatformInstallResponse = {
  encode(
    message: PlatformInstallResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.progress !== undefined) {
      DownloadProgress.encode(
        message.progress,
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
  ): PlatformInstallResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformInstallResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.progress = DownloadProgress.decode(reader, reader.uint32());
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

  fromJSON(object: any): PlatformInstallResponse {
    return {
      progress: isSet(object.progress)
        ? DownloadProgress.fromJSON(object.progress)
        : undefined,
      taskProgress: isSet(object.taskProgress)
        ? TaskProgress.fromJSON(object.taskProgress)
        : undefined,
    };
  },

  toJSON(message: PlatformInstallResponse): unknown {
    const obj: any = {};
    if (message.progress !== undefined) {
      obj.progress = DownloadProgress.toJSON(message.progress);
    }
    if (message.taskProgress !== undefined) {
      obj.taskProgress = TaskProgress.toJSON(message.taskProgress);
    }
    return obj;
  },

  create(base?: DeepPartial<PlatformInstallResponse>): PlatformInstallResponse {
    return PlatformInstallResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<PlatformInstallResponse>
  ): PlatformInstallResponse {
    const message = createBasePlatformInstallResponse();
    message.progress =
      object.progress !== undefined && object.progress !== null
        ? DownloadProgress.fromPartial(object.progress)
        : undefined;
    message.taskProgress =
      object.taskProgress !== undefined && object.taskProgress !== null
        ? TaskProgress.fromPartial(object.taskProgress)
        : undefined;
    return message;
  },
};

function createBasePlatformLoadingError(): PlatformLoadingError {
  return {};
}

export const PlatformLoadingError = {
  encode(
    _: PlatformLoadingError,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PlatformLoadingError {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformLoadingError();
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

  fromJSON(_: any): PlatformLoadingError {
    return {};
  },

  toJSON(_: PlatformLoadingError): unknown {
    const obj: any = {};
    return obj;
  },

  create(base?: DeepPartial<PlatformLoadingError>): PlatformLoadingError {
    return PlatformLoadingError.fromPartial(base ?? {});
  },
  fromPartial(_: DeepPartial<PlatformLoadingError>): PlatformLoadingError {
    const message = createBasePlatformLoadingError();
    return message;
  },
};

function createBasePlatformDownloadRequest(): PlatformDownloadRequest {
  return {
    instance: undefined,
    platformPackage: '',
    architecture: '',
    version: '',
  };
}

export const PlatformDownloadRequest = {
  encode(
    message: PlatformDownloadRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.platformPackage !== '') {
      writer.uint32(18).string(message.platformPackage);
    }
    if (message.architecture !== '') {
      writer.uint32(26).string(message.architecture);
    }
    if (message.version !== '') {
      writer.uint32(34).string(message.version);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PlatformDownloadRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformDownloadRequest();
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

          message.platformPackage = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.architecture = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
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

  fromJSON(object: any): PlatformDownloadRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      platformPackage: isSet(object.platformPackage)
        ? String(object.platformPackage)
        : '',
      architecture: isSet(object.architecture)
        ? String(object.architecture)
        : '',
      version: isSet(object.version) ? String(object.version) : '',
    };
  },

  toJSON(message: PlatformDownloadRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.platformPackage !== '') {
      obj.platformPackage = message.platformPackage;
    }
    if (message.architecture !== '') {
      obj.architecture = message.architecture;
    }
    if (message.version !== '') {
      obj.version = message.version;
    }
    return obj;
  },

  create(base?: DeepPartial<PlatformDownloadRequest>): PlatformDownloadRequest {
    return PlatformDownloadRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<PlatformDownloadRequest>
  ): PlatformDownloadRequest {
    const message = createBasePlatformDownloadRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.platformPackage = object.platformPackage ?? '';
    message.architecture = object.architecture ?? '';
    message.version = object.version ?? '';
    return message;
  },
};

function createBasePlatformDownloadResponse(): PlatformDownloadResponse {
  return { progress: undefined };
}

export const PlatformDownloadResponse = {
  encode(
    message: PlatformDownloadResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.progress !== undefined) {
      DownloadProgress.encode(
        message.progress,
        writer.uint32(10).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PlatformDownloadResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformDownloadResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.progress = DownloadProgress.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PlatformDownloadResponse {
    return {
      progress: isSet(object.progress)
        ? DownloadProgress.fromJSON(object.progress)
        : undefined,
    };
  },

  toJSON(message: PlatformDownloadResponse): unknown {
    const obj: any = {};
    if (message.progress !== undefined) {
      obj.progress = DownloadProgress.toJSON(message.progress);
    }
    return obj;
  },

  create(
    base?: DeepPartial<PlatformDownloadResponse>
  ): PlatformDownloadResponse {
    return PlatformDownloadResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<PlatformDownloadResponse>
  ): PlatformDownloadResponse {
    const message = createBasePlatformDownloadResponse();
    message.progress =
      object.progress !== undefined && object.progress !== null
        ? DownloadProgress.fromPartial(object.progress)
        : undefined;
    return message;
  },
};

function createBasePlatformUninstallRequest(): PlatformUninstallRequest {
  return { instance: undefined, platformPackage: '', architecture: '' };
}

export const PlatformUninstallRequest = {
  encode(
    message: PlatformUninstallRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.platformPackage !== '') {
      writer.uint32(18).string(message.platformPackage);
    }
    if (message.architecture !== '') {
      writer.uint32(26).string(message.architecture);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PlatformUninstallRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformUninstallRequest();
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

          message.platformPackage = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.architecture = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PlatformUninstallRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      platformPackage: isSet(object.platformPackage)
        ? String(object.platformPackage)
        : '',
      architecture: isSet(object.architecture)
        ? String(object.architecture)
        : '',
    };
  },

  toJSON(message: PlatformUninstallRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.platformPackage !== '') {
      obj.platformPackage = message.platformPackage;
    }
    if (message.architecture !== '') {
      obj.architecture = message.architecture;
    }
    return obj;
  },

  create(
    base?: DeepPartial<PlatformUninstallRequest>
  ): PlatformUninstallRequest {
    return PlatformUninstallRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<PlatformUninstallRequest>
  ): PlatformUninstallRequest {
    const message = createBasePlatformUninstallRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.platformPackage = object.platformPackage ?? '';
    message.architecture = object.architecture ?? '';
    return message;
  },
};

function createBasePlatformUninstallResponse(): PlatformUninstallResponse {
  return { taskProgress: undefined };
}

export const PlatformUninstallResponse = {
  encode(
    message: PlatformUninstallResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.taskProgress !== undefined) {
      TaskProgress.encode(
        message.taskProgress,
        writer.uint32(10).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PlatformUninstallResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformUninstallResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
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

  fromJSON(object: any): PlatformUninstallResponse {
    return {
      taskProgress: isSet(object.taskProgress)
        ? TaskProgress.fromJSON(object.taskProgress)
        : undefined,
    };
  },

  toJSON(message: PlatformUninstallResponse): unknown {
    const obj: any = {};
    if (message.taskProgress !== undefined) {
      obj.taskProgress = TaskProgress.toJSON(message.taskProgress);
    }
    return obj;
  },

  create(
    base?: DeepPartial<PlatformUninstallResponse>
  ): PlatformUninstallResponse {
    return PlatformUninstallResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<PlatformUninstallResponse>
  ): PlatformUninstallResponse {
    const message = createBasePlatformUninstallResponse();
    message.taskProgress =
      object.taskProgress !== undefined && object.taskProgress !== null
        ? TaskProgress.fromPartial(object.taskProgress)
        : undefined;
    return message;
  },
};

function createBaseAlreadyAtLatestVersionError(): AlreadyAtLatestVersionError {
  return {};
}

export const AlreadyAtLatestVersionError = {
  encode(
    _: AlreadyAtLatestVersionError,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): AlreadyAtLatestVersionError {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAlreadyAtLatestVersionError();
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

  fromJSON(_: any): AlreadyAtLatestVersionError {
    return {};
  },

  toJSON(_: AlreadyAtLatestVersionError): unknown {
    const obj: any = {};
    return obj;
  },

  create(
    base?: DeepPartial<AlreadyAtLatestVersionError>
  ): AlreadyAtLatestVersionError {
    return AlreadyAtLatestVersionError.fromPartial(base ?? {});
  },
  fromPartial(
    _: DeepPartial<AlreadyAtLatestVersionError>
  ): AlreadyAtLatestVersionError {
    const message = createBaseAlreadyAtLatestVersionError();
    return message;
  },
};

function createBasePlatformUpgradeRequest(): PlatformUpgradeRequest {
  return {
    instance: undefined,
    platformPackage: '',
    architecture: '',
    skipPostInstall: false,
  };
}

export const PlatformUpgradeRequest = {
  encode(
    message: PlatformUpgradeRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.platformPackage !== '') {
      writer.uint32(18).string(message.platformPackage);
    }
    if (message.architecture !== '') {
      writer.uint32(26).string(message.architecture);
    }
    if (message.skipPostInstall === true) {
      writer.uint32(32).bool(message.skipPostInstall);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PlatformUpgradeRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformUpgradeRequest();
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

          message.platformPackage = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.architecture = reader.string();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.skipPostInstall = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PlatformUpgradeRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      platformPackage: isSet(object.platformPackage)
        ? String(object.platformPackage)
        : '',
      architecture: isSet(object.architecture)
        ? String(object.architecture)
        : '',
      skipPostInstall: isSet(object.skipPostInstall)
        ? Boolean(object.skipPostInstall)
        : false,
    };
  },

  toJSON(message: PlatformUpgradeRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.platformPackage !== '') {
      obj.platformPackage = message.platformPackage;
    }
    if (message.architecture !== '') {
      obj.architecture = message.architecture;
    }
    if (message.skipPostInstall === true) {
      obj.skipPostInstall = message.skipPostInstall;
    }
    return obj;
  },

  create(base?: DeepPartial<PlatformUpgradeRequest>): PlatformUpgradeRequest {
    return PlatformUpgradeRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<PlatformUpgradeRequest>
  ): PlatformUpgradeRequest {
    const message = createBasePlatformUpgradeRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.platformPackage = object.platformPackage ?? '';
    message.architecture = object.architecture ?? '';
    message.skipPostInstall = object.skipPostInstall ?? false;
    return message;
  },
};

function createBasePlatformUpgradeResponse(): PlatformUpgradeResponse {
  return { progress: undefined, taskProgress: undefined, platform: undefined };
}

export const PlatformUpgradeResponse = {
  encode(
    message: PlatformUpgradeResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.progress !== undefined) {
      DownloadProgress.encode(
        message.progress,
        writer.uint32(10).fork()
      ).ldelim();
    }
    if (message.taskProgress !== undefined) {
      TaskProgress.encode(
        message.taskProgress,
        writer.uint32(18).fork()
      ).ldelim();
    }
    if (message.platform !== undefined) {
      Platform.encode(message.platform, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PlatformUpgradeResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformUpgradeResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.progress = DownloadProgress.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.taskProgress = TaskProgress.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.platform = Platform.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PlatformUpgradeResponse {
    return {
      progress: isSet(object.progress)
        ? DownloadProgress.fromJSON(object.progress)
        : undefined,
      taskProgress: isSet(object.taskProgress)
        ? TaskProgress.fromJSON(object.taskProgress)
        : undefined,
      platform: isSet(object.platform)
        ? Platform.fromJSON(object.platform)
        : undefined,
    };
  },

  toJSON(message: PlatformUpgradeResponse): unknown {
    const obj: any = {};
    if (message.progress !== undefined) {
      obj.progress = DownloadProgress.toJSON(message.progress);
    }
    if (message.taskProgress !== undefined) {
      obj.taskProgress = TaskProgress.toJSON(message.taskProgress);
    }
    if (message.platform !== undefined) {
      obj.platform = Platform.toJSON(message.platform);
    }
    return obj;
  },

  create(base?: DeepPartial<PlatformUpgradeResponse>): PlatformUpgradeResponse {
    return PlatformUpgradeResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<PlatformUpgradeResponse>
  ): PlatformUpgradeResponse {
    const message = createBasePlatformUpgradeResponse();
    message.progress =
      object.progress !== undefined && object.progress !== null
        ? DownloadProgress.fromPartial(object.progress)
        : undefined;
    message.taskProgress =
      object.taskProgress !== undefined && object.taskProgress !== null
        ? TaskProgress.fromPartial(object.taskProgress)
        : undefined;
    message.platform =
      object.platform !== undefined && object.platform !== null
        ? Platform.fromPartial(object.platform)
        : undefined;
    return message;
  },
};

function createBasePlatformSearchRequest(): PlatformSearchRequest {
  return { instance: undefined, searchArgs: '', allVersions: false };
}

export const PlatformSearchRequest = {
  encode(
    message: PlatformSearchRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.searchArgs !== '') {
      writer.uint32(18).string(message.searchArgs);
    }
    if (message.allVersions === true) {
      writer.uint32(24).bool(message.allVersions);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PlatformSearchRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformSearchRequest();
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

          message.searchArgs = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.allVersions = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PlatformSearchRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      searchArgs: isSet(object.searchArgs) ? String(object.searchArgs) : '',
      allVersions: isSet(object.allVersions)
        ? Boolean(object.allVersions)
        : false,
    };
  },

  toJSON(message: PlatformSearchRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.searchArgs !== '') {
      obj.searchArgs = message.searchArgs;
    }
    if (message.allVersions === true) {
      obj.allVersions = message.allVersions;
    }
    return obj;
  },

  create(base?: DeepPartial<PlatformSearchRequest>): PlatformSearchRequest {
    return PlatformSearchRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<PlatformSearchRequest>
  ): PlatformSearchRequest {
    const message = createBasePlatformSearchRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.searchArgs = object.searchArgs ?? '';
    message.allVersions = object.allVersions ?? false;
    return message;
  },
};

function createBasePlatformSearchResponse(): PlatformSearchResponse {
  return { searchOutput: [] };
}

export const PlatformSearchResponse = {
  encode(
    message: PlatformSearchResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.searchOutput) {
      Platform.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PlatformSearchResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformSearchResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.searchOutput.push(Platform.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PlatformSearchResponse {
    return {
      searchOutput: Array.isArray(object?.searchOutput)
        ? object.searchOutput.map((e: any) => Platform.fromJSON(e))
        : [],
    };
  },

  toJSON(message: PlatformSearchResponse): unknown {
    const obj: any = {};
    if (message.searchOutput?.length) {
      obj.searchOutput = message.searchOutput.map((e) => Platform.toJSON(e));
    }
    return obj;
  },

  create(base?: DeepPartial<PlatformSearchResponse>): PlatformSearchResponse {
    return PlatformSearchResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<PlatformSearchResponse>
  ): PlatformSearchResponse {
    const message = createBasePlatformSearchResponse();
    message.searchOutput =
      object.searchOutput?.map((e) => Platform.fromPartial(e)) || [];
    return message;
  },
};

function createBasePlatformListRequest(): PlatformListRequest {
  return { instance: undefined, updatableOnly: false, all: false };
}

export const PlatformListRequest = {
  encode(
    message: PlatformListRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.updatableOnly === true) {
      writer.uint32(16).bool(message.updatableOnly);
    }
    if (message.all === true) {
      writer.uint32(24).bool(message.all);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PlatformListRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformListRequest();
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

          message.updatableOnly = reader.bool();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.all = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PlatformListRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      updatableOnly: isSet(object.updatableOnly)
        ? Boolean(object.updatableOnly)
        : false,
      all: isSet(object.all) ? Boolean(object.all) : false,
    };
  },

  toJSON(message: PlatformListRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.updatableOnly === true) {
      obj.updatableOnly = message.updatableOnly;
    }
    if (message.all === true) {
      obj.all = message.all;
    }
    return obj;
  },

  create(base?: DeepPartial<PlatformListRequest>): PlatformListRequest {
    return PlatformListRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<PlatformListRequest>): PlatformListRequest {
    const message = createBasePlatformListRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.updatableOnly = object.updatableOnly ?? false;
    message.all = object.all ?? false;
    return message;
  },
};

function createBasePlatformListResponse(): PlatformListResponse {
  return { installedPlatforms: [] };
}

export const PlatformListResponse = {
  encode(
    message: PlatformListResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.installedPlatforms) {
      Platform.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PlatformListResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlatformListResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.installedPlatforms.push(
            Platform.decode(reader, reader.uint32())
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

  fromJSON(object: any): PlatformListResponse {
    return {
      installedPlatforms: Array.isArray(object?.installedPlatforms)
        ? object.installedPlatforms.map((e: any) => Platform.fromJSON(e))
        : [],
    };
  },

  toJSON(message: PlatformListResponse): unknown {
    const obj: any = {};
    if (message.installedPlatforms?.length) {
      obj.installedPlatforms = message.installedPlatforms.map((e) =>
        Platform.toJSON(e)
      );
    }
    return obj;
  },

  create(base?: DeepPartial<PlatformListResponse>): PlatformListResponse {
    return PlatformListResponse.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<PlatformListResponse>): PlatformListResponse {
    const message = createBasePlatformListResponse();
    message.installedPlatforms =
      object.installedPlatforms?.map((e) => Platform.fromPartial(e)) || [];
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

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
