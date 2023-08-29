/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';
import { DownloadProgress, Instance, TaskProgress } from './common';

export enum LibraryInstallLocation {
  /**
   * LIBRARY_INSTALL_LOCATION_USER - In the `libraries` subdirectory of the user directory (sketchbook). This is
   * the default if not specified.
   */
  LIBRARY_INSTALL_LOCATION_USER = 0,
  /** LIBRARY_INSTALL_LOCATION_BUILTIN - In the configured 'builtin.libraries' directory. */
  LIBRARY_INSTALL_LOCATION_BUILTIN = 1,
  UNRECOGNIZED = -1,
}

export function libraryInstallLocationFromJSON(
  object: any
): LibraryInstallLocation {
  switch (object) {
    case 0:
    case 'LIBRARY_INSTALL_LOCATION_USER':
      return LibraryInstallLocation.LIBRARY_INSTALL_LOCATION_USER;
    case 1:
    case 'LIBRARY_INSTALL_LOCATION_BUILTIN':
      return LibraryInstallLocation.LIBRARY_INSTALL_LOCATION_BUILTIN;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return LibraryInstallLocation.UNRECOGNIZED;
  }
}

export function libraryInstallLocationToJSON(
  object: LibraryInstallLocation
): string {
  switch (object) {
    case LibraryInstallLocation.LIBRARY_INSTALL_LOCATION_USER:
      return 'LIBRARY_INSTALL_LOCATION_USER';
    case LibraryInstallLocation.LIBRARY_INSTALL_LOCATION_BUILTIN:
      return 'LIBRARY_INSTALL_LOCATION_BUILTIN';
    case LibraryInstallLocation.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED';
  }
}

export enum LibrarySearchStatus {
  /** LIBRARY_SEARCH_STATUS_FAILED - No search results were found. */
  LIBRARY_SEARCH_STATUS_FAILED = 0,
  /** LIBRARY_SEARCH_STATUS_SUCCESS - Search results were found. */
  LIBRARY_SEARCH_STATUS_SUCCESS = 1,
  UNRECOGNIZED = -1,
}

export function librarySearchStatusFromJSON(object: any): LibrarySearchStatus {
  switch (object) {
    case 0:
    case 'LIBRARY_SEARCH_STATUS_FAILED':
      return LibrarySearchStatus.LIBRARY_SEARCH_STATUS_FAILED;
    case 1:
    case 'LIBRARY_SEARCH_STATUS_SUCCESS':
      return LibrarySearchStatus.LIBRARY_SEARCH_STATUS_SUCCESS;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return LibrarySearchStatus.UNRECOGNIZED;
  }
}

export function librarySearchStatusToJSON(object: LibrarySearchStatus): string {
  switch (object) {
    case LibrarySearchStatus.LIBRARY_SEARCH_STATUS_FAILED:
      return 'LIBRARY_SEARCH_STATUS_FAILED';
    case LibrarySearchStatus.LIBRARY_SEARCH_STATUS_SUCCESS:
      return 'LIBRARY_SEARCH_STATUS_SUCCESS';
    case LibrarySearchStatus.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED';
  }
}

export enum LibraryLayout {
  /** LIBRARY_LAYOUT_FLAT - Library is in the 1.0 Arduino library format. */
  LIBRARY_LAYOUT_FLAT = 0,
  /** LIBRARY_LAYOUT_RECURSIVE - Library is in the 1.5 Arduino library format. */
  LIBRARY_LAYOUT_RECURSIVE = 1,
  UNRECOGNIZED = -1,
}

export function libraryLayoutFromJSON(object: any): LibraryLayout {
  switch (object) {
    case 0:
    case 'LIBRARY_LAYOUT_FLAT':
      return LibraryLayout.LIBRARY_LAYOUT_FLAT;
    case 1:
    case 'LIBRARY_LAYOUT_RECURSIVE':
      return LibraryLayout.LIBRARY_LAYOUT_RECURSIVE;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return LibraryLayout.UNRECOGNIZED;
  }
}

export function libraryLayoutToJSON(object: LibraryLayout): string {
  switch (object) {
    case LibraryLayout.LIBRARY_LAYOUT_FLAT:
      return 'LIBRARY_LAYOUT_FLAT';
    case LibraryLayout.LIBRARY_LAYOUT_RECURSIVE:
      return 'LIBRARY_LAYOUT_RECURSIVE';
    case LibraryLayout.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED';
  }
}

export enum LibraryLocation {
  /** LIBRARY_LOCATION_BUILTIN - In the configured 'builtin.libraries' directory. */
  LIBRARY_LOCATION_BUILTIN = 0,
  /** LIBRARY_LOCATION_USER - In the `libraries` subdirectory of the user directory (sketchbook). */
  LIBRARY_LOCATION_USER = 1,
  /** LIBRARY_LOCATION_PLATFORM_BUILTIN - In the `libraries` subdirectory of a platform. */
  LIBRARY_LOCATION_PLATFORM_BUILTIN = 2,
  /**
   * LIBRARY_LOCATION_REFERENCED_PLATFORM_BUILTIN - When `LibraryLocation` is used in a context where a board is specified,
   * this indicates the library is in the `libraries` subdirectory of a
   * platform referenced by the board's platform.
   */
  LIBRARY_LOCATION_REFERENCED_PLATFORM_BUILTIN = 3,
  /** LIBRARY_LOCATION_UNMANAGED - Outside the `libraries` folders managed by the CLI. */
  LIBRARY_LOCATION_UNMANAGED = 4,
  UNRECOGNIZED = -1,
}

export function libraryLocationFromJSON(object: any): LibraryLocation {
  switch (object) {
    case 0:
    case 'LIBRARY_LOCATION_BUILTIN':
      return LibraryLocation.LIBRARY_LOCATION_BUILTIN;
    case 1:
    case 'LIBRARY_LOCATION_USER':
      return LibraryLocation.LIBRARY_LOCATION_USER;
    case 2:
    case 'LIBRARY_LOCATION_PLATFORM_BUILTIN':
      return LibraryLocation.LIBRARY_LOCATION_PLATFORM_BUILTIN;
    case 3:
    case 'LIBRARY_LOCATION_REFERENCED_PLATFORM_BUILTIN':
      return LibraryLocation.LIBRARY_LOCATION_REFERENCED_PLATFORM_BUILTIN;
    case 4:
    case 'LIBRARY_LOCATION_UNMANAGED':
      return LibraryLocation.LIBRARY_LOCATION_UNMANAGED;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return LibraryLocation.UNRECOGNIZED;
  }
}

export function libraryLocationToJSON(object: LibraryLocation): string {
  switch (object) {
    case LibraryLocation.LIBRARY_LOCATION_BUILTIN:
      return 'LIBRARY_LOCATION_BUILTIN';
    case LibraryLocation.LIBRARY_LOCATION_USER:
      return 'LIBRARY_LOCATION_USER';
    case LibraryLocation.LIBRARY_LOCATION_PLATFORM_BUILTIN:
      return 'LIBRARY_LOCATION_PLATFORM_BUILTIN';
    case LibraryLocation.LIBRARY_LOCATION_REFERENCED_PLATFORM_BUILTIN:
      return 'LIBRARY_LOCATION_REFERENCED_PLATFORM_BUILTIN';
    case LibraryLocation.LIBRARY_LOCATION_UNMANAGED:
      return 'LIBRARY_LOCATION_UNMANAGED';
    case LibraryLocation.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED';
  }
}

export interface LibraryDownloadRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /** Name of the library. */
  name: string;
  /** The version of the library to download. */
  version: string;
}

export interface LibraryDownloadResponse {
  /** Progress of the library download. */
  progress: DownloadProgress | undefined;
}

export interface LibraryInstallRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /** Name of the library. */
  name: string;
  /** The version of the library to install. */
  version: string;
  /**
   * Set to true to skip installation of specified library's dependencies,
   * defaults to false.
   */
  noDeps: boolean;
  /**
   * Set to true to skip installation if a different version of the library or
   * one of its dependencies is already installed, defaults to false.
   */
  noOverwrite: boolean;
  /** Install the library and dependencies in the specified location */
  installLocation: LibraryInstallLocation;
}

export interface LibraryInstallResponse {
  /** Progress of the library download. */
  progress: DownloadProgress | undefined;
  /** Description of the current stage of the installation. */
  taskProgress: TaskProgress | undefined;
}

export interface LibraryUpgradeRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /** Name of the library. */
  name: string;
  /**
   * Set to true to skip installation of specified library's dependencies,
   * defaults to false.
   */
  noDeps: boolean;
}

export interface LibraryUpgradeResponse {
  /** Progress of the library download. */
  progress: DownloadProgress | undefined;
  /** Description of the current stage of the installation. */
  taskProgress: TaskProgress | undefined;
}

export interface LibraryUninstallRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /** Name of the library. */
  name: string;
  /** The version of the library to uninstall. */
  version: string;
}

export interface LibraryUninstallResponse {
  /** Description of the current stage of the uninstallation. */
  taskProgress: TaskProgress | undefined;
}

export interface LibraryUpgradeAllRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
}

export interface LibraryUpgradeAllResponse {
  /** Progress of the downloads of files needed for the upgrades. */
  progress: DownloadProgress | undefined;
  /** Description of the current stage of the upgrade. */
  taskProgress: TaskProgress | undefined;
}

export interface LibraryResolveDependenciesRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /** Name of the library. */
  name: string;
  /**
   * The version of the library to check dependencies of. If no version is
   * specified, dependencies of the newest version will be listed.
   */
  version: string;
}

export interface LibraryResolveDependenciesResponse {
  /** Dependencies of the library. */
  dependencies: LibraryDependencyStatus[];
}

export interface LibraryDependencyStatus {
  /** The name of the library dependency. */
  name: string;
  /** The required version of the library dependency. */
  versionRequired: string;
  /** Version of the library dependency currently installed. */
  versionInstalled: string;
}

export interface LibrarySearchRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /**
   * Deprecated. Use search_args instead.
   *
   * @deprecated
   */
  query: string;
  /**
   * Set to true to not populate the releases field in the response (may save a
   * lot of bandwidth/CPU).
   */
  omitReleasesDetails: boolean;
  /** Keywords for the search. */
  searchArgs: string;
}

export interface LibrarySearchResponse {
  /** The results of the search. */
  libraries: SearchedLibrary[];
  /** Whether the search yielded results. */
  status: LibrarySearchStatus;
}

export interface SearchedLibrary {
  /** Library name. */
  name: string;
  /**
   * The index data for the available versions of the library. The key of the
   * map is the library version.
   */
  releases: { [key: string]: LibraryRelease };
  /** The index data for the latest version of the library. */
  latest: LibraryRelease | undefined;
  /** The available versions of this library. */
  availableVersions: string[];
}

export interface SearchedLibrary_ReleasesEntry {
  key: string;
  value: LibraryRelease | undefined;
}

export interface LibraryRelease {
  /** Value of the `author` field in library.properties. */
  author: string;
  /** Value of the `version` field in library.properties. */
  version: string;
  /** Value of the `maintainer` field in library.properties. */
  maintainer: string;
  /** Value of the `sentence` field in library.properties. */
  sentence: string;
  /** Value of the `paragraph` field in library.properties. */
  paragraph: string;
  /** Value of the `url` field in library.properties. */
  website: string;
  /** Value of the `category` field in library.properties. */
  category: string;
  /** Value of the `architectures` field in library.properties. */
  architectures: string[];
  /**
   * The type categories of the library, as defined in the libraries index.
   * Possible values: `Arduino`, `Partner`, `Recommended`, `Contributed`,
   * `Retired`.
   */
  types: string[];
  /** Information about the library archive file. */
  resources: DownloadResource | undefined;
  /** Value of the `license` field in library.properties. */
  license: string;
  /** Value of the `includes` field in library.properties. */
  providesIncludes: string[];
  /**
   * The names of the library's dependencies, as defined by the 'depends'
   * field of library.properties.
   */
  dependencies: LibraryDependency[];
}

export interface LibraryDependency {
  /** Library name of the dependency. */
  name: string;
  /** Version constraint of the dependency. */
  versionConstraint: string;
}

export interface DownloadResource {
  /** Download URL of the library archive. */
  url: string;
  /** Filename of the library archive. */
  archiveFilename: string;
  /** Checksum of the library archive. */
  checksum: string;
  /** File size of the library archive. */
  size: number;
  /**
   * The directory under the staging subdirectory of the data directory the
   * library archive file will be downloaded to.
   */
  cachePath: string;
}

export interface LibraryListRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /**
   * Whether to include built-in libraries (from platforms and the Arduino
   * IDE) in the listing.
   */
  all: boolean;
  /**
   * Whether to list only libraries for which there is a newer version than
   * the installed version available in the libraries index.
   */
  updatable: boolean;
  /** If set filters out the libraries not matching name */
  name: string;
  /**
   * By setting this field all duplicate libraries are filtered out leaving
   * only the libraries that will be used to compile for the specified board
   * FQBN.
   */
  fqbn: string;
}

export interface LibraryListResponse {
  /** List of installed libraries. */
  installedLibraries: InstalledLibrary[];
}

export interface InstalledLibrary {
  /** Information about the library. */
  library: Library | undefined;
  /**
   * When the `updatable` field of the `LibraryList` request is set to `true`,
   * this will contain information on the latest version of the library in the
   * libraries index.
   */
  release: LibraryRelease | undefined;
}

export interface Library {
  /** Library name (value of `name` field in library.properties). */
  name: string;
  /** Value of the `author` field in library.properties. */
  author: string;
  /** Value of the `maintainer` field in library.properties. */
  maintainer: string;
  /** Value of the `sentence` field in library.properties. */
  sentence: string;
  /** Value of the `paragraph` field in library.properties. */
  paragraph: string;
  /** Value of the `url` field in library.properties. */
  website: string;
  /** Value of the `category` field in library.properties. */
  category: string;
  /** Value of the `architectures` field in library.properties. */
  architectures: string[];
  /**
   * The type categories of the library. Possible values: `Arduino`,
   * `Partner`, `Recommended`, `Contributed`, `Retired`.
   */
  types: string[];
  /** The path of the library directory. */
  installDir: string;
  /** The location of the library's source files. */
  sourceDir: string;
  /** The location of the library's `utility` directory. */
  utilityDir: string;
  /**
   * If `location` is `platform_builtin` or `referenced_platform_builtin`, the
   * identifying string for the platform containing the library
   * (e.g., `arduino:avr@1.8.2`).
   */
  containerPlatform: string;
  /** Value of the `dot_a_linkage` field in library.properties. */
  dotALinkage: boolean;
  /** Value of the `precompiled` field in library.properties. */
  precompiled: boolean;
  /** Value of the `ldflags` field in library.properties. */
  ldFlags: string;
  /** A library.properties file is not present in the library's root directory. */
  isLegacy: boolean;
  /** Value of the `version` field in library.properties. */
  version: string;
  /** Value of the `license` field in library.properties. */
  license: string;
  /**
   * The data from the library's library.properties file, including unused
   * fields.
   */
  properties: { [key: string]: string };
  /** The location type of the library installation. */
  location: LibraryLocation;
  /** The library format type. */
  layout: LibraryLayout;
  /** The example sketches provided by the library */
  examples: string[];
  /**
   * Value of the `includes` field in library.properties or, if missing, the
   * list of include files available on the library source root directory.
   */
  providesIncludes: string[];
  /** Map of FQBNs that specifies if library is compatible with this library */
  compatibleWith: { [key: string]: boolean };
  /**
   * This value is set to true if the library is in development and should not
   * be treated as read-only. This status is determined by the presence of a
   * `.development` file in the library root directory.
   */
  inDevelopment: boolean;
}

export interface Library_PropertiesEntry {
  key: string;
  value: string;
}

export interface Library_CompatibleWithEntry {
  key: string;
  value: boolean;
}

export interface ZipLibraryInstallRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /** Path to the archived library */
  path: string;
  /**
   * Set to true to overwrite an already installed library with the same name.
   * Defaults to false.
   */
  overwrite: boolean;
}

export interface ZipLibraryInstallResponse {
  /** Description of the current stage of the installation. */
  taskProgress: TaskProgress | undefined;
}

export interface GitLibraryInstallRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /** URL to the repository containing the library */
  url: string;
  /**
   * Set to true to overwrite an already installed library with the same name.
   * Defaults to false.
   */
  overwrite: boolean;
}

export interface GitLibraryInstallResponse {
  /** Description of the current stage of the installation. */
  taskProgress: TaskProgress | undefined;
}

function createBaseLibraryDownloadRequest(): LibraryDownloadRequest {
  return { instance: undefined, name: '', version: '' };
}

export const LibraryDownloadRequest = {
  encode(
    message: LibraryDownloadRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.name !== '') {
      writer.uint32(18).string(message.name);
    }
    if (message.version !== '') {
      writer.uint32(26).string(message.version);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): LibraryDownloadRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryDownloadRequest();
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

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
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

  fromJSON(object: any): LibraryDownloadRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      name: isSet(object.name) ? String(object.name) : '',
      version: isSet(object.version) ? String(object.version) : '',
    };
  },

  toJSON(message: LibraryDownloadRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.version !== '') {
      obj.version = message.version;
    }
    return obj;
  },

  create(base?: DeepPartial<LibraryDownloadRequest>): LibraryDownloadRequest {
    return LibraryDownloadRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryDownloadRequest>
  ): LibraryDownloadRequest {
    const message = createBaseLibraryDownloadRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.name = object.name ?? '';
    message.version = object.version ?? '';
    return message;
  },
};

function createBaseLibraryDownloadResponse(): LibraryDownloadResponse {
  return { progress: undefined };
}

export const LibraryDownloadResponse = {
  encode(
    message: LibraryDownloadResponse,
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
  ): LibraryDownloadResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryDownloadResponse();
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

  fromJSON(object: any): LibraryDownloadResponse {
    return {
      progress: isSet(object.progress)
        ? DownloadProgress.fromJSON(object.progress)
        : undefined,
    };
  },

  toJSON(message: LibraryDownloadResponse): unknown {
    const obj: any = {};
    if (message.progress !== undefined) {
      obj.progress = DownloadProgress.toJSON(message.progress);
    }
    return obj;
  },

  create(base?: DeepPartial<LibraryDownloadResponse>): LibraryDownloadResponse {
    return LibraryDownloadResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryDownloadResponse>
  ): LibraryDownloadResponse {
    const message = createBaseLibraryDownloadResponse();
    message.progress =
      object.progress !== undefined && object.progress !== null
        ? DownloadProgress.fromPartial(object.progress)
        : undefined;
    return message;
  },
};

function createBaseLibraryInstallRequest(): LibraryInstallRequest {
  return {
    instance: undefined,
    name: '',
    version: '',
    noDeps: false,
    noOverwrite: false,
    installLocation: 0,
  };
}

export const LibraryInstallRequest = {
  encode(
    message: LibraryInstallRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.name !== '') {
      writer.uint32(18).string(message.name);
    }
    if (message.version !== '') {
      writer.uint32(26).string(message.version);
    }
    if (message.noDeps === true) {
      writer.uint32(32).bool(message.noDeps);
    }
    if (message.noOverwrite === true) {
      writer.uint32(40).bool(message.noOverwrite);
    }
    if (message.installLocation !== 0) {
      writer.uint32(48).int32(message.installLocation);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): LibraryInstallRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryInstallRequest();
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

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.version = reader.string();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.noDeps = reader.bool();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.noOverwrite = reader.bool();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.installLocation = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LibraryInstallRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      name: isSet(object.name) ? String(object.name) : '',
      version: isSet(object.version) ? String(object.version) : '',
      noDeps: isSet(object.noDeps) ? Boolean(object.noDeps) : false,
      noOverwrite: isSet(object.noOverwrite)
        ? Boolean(object.noOverwrite)
        : false,
      installLocation: isSet(object.installLocation)
        ? libraryInstallLocationFromJSON(object.installLocation)
        : 0,
    };
  },

  toJSON(message: LibraryInstallRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.version !== '') {
      obj.version = message.version;
    }
    if (message.noDeps === true) {
      obj.noDeps = message.noDeps;
    }
    if (message.noOverwrite === true) {
      obj.noOverwrite = message.noOverwrite;
    }
    if (message.installLocation !== 0) {
      obj.installLocation = libraryInstallLocationToJSON(
        message.installLocation
      );
    }
    return obj;
  },

  create(base?: DeepPartial<LibraryInstallRequest>): LibraryInstallRequest {
    return LibraryInstallRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryInstallRequest>
  ): LibraryInstallRequest {
    const message = createBaseLibraryInstallRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.name = object.name ?? '';
    message.version = object.version ?? '';
    message.noDeps = object.noDeps ?? false;
    message.noOverwrite = object.noOverwrite ?? false;
    message.installLocation = object.installLocation ?? 0;
    return message;
  },
};

function createBaseLibraryInstallResponse(): LibraryInstallResponse {
  return { progress: undefined, taskProgress: undefined };
}

export const LibraryInstallResponse = {
  encode(
    message: LibraryInstallResponse,
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
  ): LibraryInstallResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryInstallResponse();
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

  fromJSON(object: any): LibraryInstallResponse {
    return {
      progress: isSet(object.progress)
        ? DownloadProgress.fromJSON(object.progress)
        : undefined,
      taskProgress: isSet(object.taskProgress)
        ? TaskProgress.fromJSON(object.taskProgress)
        : undefined,
    };
  },

  toJSON(message: LibraryInstallResponse): unknown {
    const obj: any = {};
    if (message.progress !== undefined) {
      obj.progress = DownloadProgress.toJSON(message.progress);
    }
    if (message.taskProgress !== undefined) {
      obj.taskProgress = TaskProgress.toJSON(message.taskProgress);
    }
    return obj;
  },

  create(base?: DeepPartial<LibraryInstallResponse>): LibraryInstallResponse {
    return LibraryInstallResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryInstallResponse>
  ): LibraryInstallResponse {
    const message = createBaseLibraryInstallResponse();
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

function createBaseLibraryUpgradeRequest(): LibraryUpgradeRequest {
  return { instance: undefined, name: '', noDeps: false };
}

export const LibraryUpgradeRequest = {
  encode(
    message: LibraryUpgradeRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.name !== '') {
      writer.uint32(18).string(message.name);
    }
    if (message.noDeps === true) {
      writer.uint32(24).bool(message.noDeps);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): LibraryUpgradeRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryUpgradeRequest();
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

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.noDeps = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LibraryUpgradeRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      name: isSet(object.name) ? String(object.name) : '',
      noDeps: isSet(object.noDeps) ? Boolean(object.noDeps) : false,
    };
  },

  toJSON(message: LibraryUpgradeRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.noDeps === true) {
      obj.noDeps = message.noDeps;
    }
    return obj;
  },

  create(base?: DeepPartial<LibraryUpgradeRequest>): LibraryUpgradeRequest {
    return LibraryUpgradeRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryUpgradeRequest>
  ): LibraryUpgradeRequest {
    const message = createBaseLibraryUpgradeRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.name = object.name ?? '';
    message.noDeps = object.noDeps ?? false;
    return message;
  },
};

function createBaseLibraryUpgradeResponse(): LibraryUpgradeResponse {
  return { progress: undefined, taskProgress: undefined };
}

export const LibraryUpgradeResponse = {
  encode(
    message: LibraryUpgradeResponse,
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
  ): LibraryUpgradeResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryUpgradeResponse();
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

  fromJSON(object: any): LibraryUpgradeResponse {
    return {
      progress: isSet(object.progress)
        ? DownloadProgress.fromJSON(object.progress)
        : undefined,
      taskProgress: isSet(object.taskProgress)
        ? TaskProgress.fromJSON(object.taskProgress)
        : undefined,
    };
  },

  toJSON(message: LibraryUpgradeResponse): unknown {
    const obj: any = {};
    if (message.progress !== undefined) {
      obj.progress = DownloadProgress.toJSON(message.progress);
    }
    if (message.taskProgress !== undefined) {
      obj.taskProgress = TaskProgress.toJSON(message.taskProgress);
    }
    return obj;
  },

  create(base?: DeepPartial<LibraryUpgradeResponse>): LibraryUpgradeResponse {
    return LibraryUpgradeResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryUpgradeResponse>
  ): LibraryUpgradeResponse {
    const message = createBaseLibraryUpgradeResponse();
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

function createBaseLibraryUninstallRequest(): LibraryUninstallRequest {
  return { instance: undefined, name: '', version: '' };
}

export const LibraryUninstallRequest = {
  encode(
    message: LibraryUninstallRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.name !== '') {
      writer.uint32(18).string(message.name);
    }
    if (message.version !== '') {
      writer.uint32(26).string(message.version);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): LibraryUninstallRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryUninstallRequest();
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

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
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

  fromJSON(object: any): LibraryUninstallRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      name: isSet(object.name) ? String(object.name) : '',
      version: isSet(object.version) ? String(object.version) : '',
    };
  },

  toJSON(message: LibraryUninstallRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.version !== '') {
      obj.version = message.version;
    }
    return obj;
  },

  create(base?: DeepPartial<LibraryUninstallRequest>): LibraryUninstallRequest {
    return LibraryUninstallRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryUninstallRequest>
  ): LibraryUninstallRequest {
    const message = createBaseLibraryUninstallRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.name = object.name ?? '';
    message.version = object.version ?? '';
    return message;
  },
};

function createBaseLibraryUninstallResponse(): LibraryUninstallResponse {
  return { taskProgress: undefined };
}

export const LibraryUninstallResponse = {
  encode(
    message: LibraryUninstallResponse,
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
  ): LibraryUninstallResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryUninstallResponse();
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

  fromJSON(object: any): LibraryUninstallResponse {
    return {
      taskProgress: isSet(object.taskProgress)
        ? TaskProgress.fromJSON(object.taskProgress)
        : undefined,
    };
  },

  toJSON(message: LibraryUninstallResponse): unknown {
    const obj: any = {};
    if (message.taskProgress !== undefined) {
      obj.taskProgress = TaskProgress.toJSON(message.taskProgress);
    }
    return obj;
  },

  create(
    base?: DeepPartial<LibraryUninstallResponse>
  ): LibraryUninstallResponse {
    return LibraryUninstallResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryUninstallResponse>
  ): LibraryUninstallResponse {
    const message = createBaseLibraryUninstallResponse();
    message.taskProgress =
      object.taskProgress !== undefined && object.taskProgress !== null
        ? TaskProgress.fromPartial(object.taskProgress)
        : undefined;
    return message;
  },
};

function createBaseLibraryUpgradeAllRequest(): LibraryUpgradeAllRequest {
  return { instance: undefined };
}

export const LibraryUpgradeAllRequest = {
  encode(
    message: LibraryUpgradeAllRequest,
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
  ): LibraryUpgradeAllRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryUpgradeAllRequest();
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

  fromJSON(object: any): LibraryUpgradeAllRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
    };
  },

  toJSON(message: LibraryUpgradeAllRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    return obj;
  },

  create(
    base?: DeepPartial<LibraryUpgradeAllRequest>
  ): LibraryUpgradeAllRequest {
    return LibraryUpgradeAllRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryUpgradeAllRequest>
  ): LibraryUpgradeAllRequest {
    const message = createBaseLibraryUpgradeAllRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    return message;
  },
};

function createBaseLibraryUpgradeAllResponse(): LibraryUpgradeAllResponse {
  return { progress: undefined, taskProgress: undefined };
}

export const LibraryUpgradeAllResponse = {
  encode(
    message: LibraryUpgradeAllResponse,
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
  ): LibraryUpgradeAllResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryUpgradeAllResponse();
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

  fromJSON(object: any): LibraryUpgradeAllResponse {
    return {
      progress: isSet(object.progress)
        ? DownloadProgress.fromJSON(object.progress)
        : undefined,
      taskProgress: isSet(object.taskProgress)
        ? TaskProgress.fromJSON(object.taskProgress)
        : undefined,
    };
  },

  toJSON(message: LibraryUpgradeAllResponse): unknown {
    const obj: any = {};
    if (message.progress !== undefined) {
      obj.progress = DownloadProgress.toJSON(message.progress);
    }
    if (message.taskProgress !== undefined) {
      obj.taskProgress = TaskProgress.toJSON(message.taskProgress);
    }
    return obj;
  },

  create(
    base?: DeepPartial<LibraryUpgradeAllResponse>
  ): LibraryUpgradeAllResponse {
    return LibraryUpgradeAllResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryUpgradeAllResponse>
  ): LibraryUpgradeAllResponse {
    const message = createBaseLibraryUpgradeAllResponse();
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

function createBaseLibraryResolveDependenciesRequest(): LibraryResolveDependenciesRequest {
  return { instance: undefined, name: '', version: '' };
}

export const LibraryResolveDependenciesRequest = {
  encode(
    message: LibraryResolveDependenciesRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.name !== '') {
      writer.uint32(18).string(message.name);
    }
    if (message.version !== '') {
      writer.uint32(26).string(message.version);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): LibraryResolveDependenciesRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryResolveDependenciesRequest();
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

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
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

  fromJSON(object: any): LibraryResolveDependenciesRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      name: isSet(object.name) ? String(object.name) : '',
      version: isSet(object.version) ? String(object.version) : '',
    };
  },

  toJSON(message: LibraryResolveDependenciesRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.version !== '') {
      obj.version = message.version;
    }
    return obj;
  },

  create(
    base?: DeepPartial<LibraryResolveDependenciesRequest>
  ): LibraryResolveDependenciesRequest {
    return LibraryResolveDependenciesRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryResolveDependenciesRequest>
  ): LibraryResolveDependenciesRequest {
    const message = createBaseLibraryResolveDependenciesRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.name = object.name ?? '';
    message.version = object.version ?? '';
    return message;
  },
};

function createBaseLibraryResolveDependenciesResponse(): LibraryResolveDependenciesResponse {
  return { dependencies: [] };
}

export const LibraryResolveDependenciesResponse = {
  encode(
    message: LibraryResolveDependenciesResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.dependencies) {
      LibraryDependencyStatus.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): LibraryResolveDependenciesResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryResolveDependenciesResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.dependencies.push(
            LibraryDependencyStatus.decode(reader, reader.uint32())
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

  fromJSON(object: any): LibraryResolveDependenciesResponse {
    return {
      dependencies: Array.isArray(object?.dependencies)
        ? object.dependencies.map((e: any) =>
            LibraryDependencyStatus.fromJSON(e)
          )
        : [],
    };
  },

  toJSON(message: LibraryResolveDependenciesResponse): unknown {
    const obj: any = {};
    if (message.dependencies?.length) {
      obj.dependencies = message.dependencies.map((e) =>
        LibraryDependencyStatus.toJSON(e)
      );
    }
    return obj;
  },

  create(
    base?: DeepPartial<LibraryResolveDependenciesResponse>
  ): LibraryResolveDependenciesResponse {
    return LibraryResolveDependenciesResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryResolveDependenciesResponse>
  ): LibraryResolveDependenciesResponse {
    const message = createBaseLibraryResolveDependenciesResponse();
    message.dependencies =
      object.dependencies?.map((e) => LibraryDependencyStatus.fromPartial(e)) ||
      [];
    return message;
  },
};

function createBaseLibraryDependencyStatus(): LibraryDependencyStatus {
  return { name: '', versionRequired: '', versionInstalled: '' };
}

export const LibraryDependencyStatus = {
  encode(
    message: LibraryDependencyStatus,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    if (message.versionRequired !== '') {
      writer.uint32(18).string(message.versionRequired);
    }
    if (message.versionInstalled !== '') {
      writer.uint32(26).string(message.versionInstalled);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): LibraryDependencyStatus {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryDependencyStatus();
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

          message.versionRequired = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.versionInstalled = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LibraryDependencyStatus {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      versionRequired: isSet(object.versionRequired)
        ? String(object.versionRequired)
        : '',
      versionInstalled: isSet(object.versionInstalled)
        ? String(object.versionInstalled)
        : '',
    };
  },

  toJSON(message: LibraryDependencyStatus): unknown {
    const obj: any = {};
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.versionRequired !== '') {
      obj.versionRequired = message.versionRequired;
    }
    if (message.versionInstalled !== '') {
      obj.versionInstalled = message.versionInstalled;
    }
    return obj;
  },

  create(base?: DeepPartial<LibraryDependencyStatus>): LibraryDependencyStatus {
    return LibraryDependencyStatus.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibraryDependencyStatus>
  ): LibraryDependencyStatus {
    const message = createBaseLibraryDependencyStatus();
    message.name = object.name ?? '';
    message.versionRequired = object.versionRequired ?? '';
    message.versionInstalled = object.versionInstalled ?? '';
    return message;
  },
};

function createBaseLibrarySearchRequest(): LibrarySearchRequest {
  return {
    instance: undefined,
    query: '',
    omitReleasesDetails: false,
    searchArgs: '',
  };
}

export const LibrarySearchRequest = {
  encode(
    message: LibrarySearchRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.query !== '') {
      writer.uint32(18).string(message.query);
    }
    if (message.omitReleasesDetails === true) {
      writer.uint32(24).bool(message.omitReleasesDetails);
    }
    if (message.searchArgs !== '') {
      writer.uint32(34).string(message.searchArgs);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): LibrarySearchRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibrarySearchRequest();
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

          message.query = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.omitReleasesDetails = reader.bool();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.searchArgs = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LibrarySearchRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      query: isSet(object.query) ? String(object.query) : '',
      omitReleasesDetails: isSet(object.omitReleasesDetails)
        ? Boolean(object.omitReleasesDetails)
        : false,
      searchArgs: isSet(object.searchArgs) ? String(object.searchArgs) : '',
    };
  },

  toJSON(message: LibrarySearchRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.query !== '') {
      obj.query = message.query;
    }
    if (message.omitReleasesDetails === true) {
      obj.omitReleasesDetails = message.omitReleasesDetails;
    }
    if (message.searchArgs !== '') {
      obj.searchArgs = message.searchArgs;
    }
    return obj;
  },

  create(base?: DeepPartial<LibrarySearchRequest>): LibrarySearchRequest {
    return LibrarySearchRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<LibrarySearchRequest>): LibrarySearchRequest {
    const message = createBaseLibrarySearchRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.query = object.query ?? '';
    message.omitReleasesDetails = object.omitReleasesDetails ?? false;
    message.searchArgs = object.searchArgs ?? '';
    return message;
  },
};

function createBaseLibrarySearchResponse(): LibrarySearchResponse {
  return { libraries: [], status: 0 };
}

export const LibrarySearchResponse = {
  encode(
    message: LibrarySearchResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.libraries) {
      SearchedLibrary.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.status !== 0) {
      writer.uint32(16).int32(message.status);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): LibrarySearchResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibrarySearchResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.libraries.push(
            SearchedLibrary.decode(reader, reader.uint32())
          );
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.status = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LibrarySearchResponse {
    return {
      libraries: Array.isArray(object?.libraries)
        ? object.libraries.map((e: any) => SearchedLibrary.fromJSON(e))
        : [],
      status: isSet(object.status)
        ? librarySearchStatusFromJSON(object.status)
        : 0,
    };
  },

  toJSON(message: LibrarySearchResponse): unknown {
    const obj: any = {};
    if (message.libraries?.length) {
      obj.libraries = message.libraries.map((e) => SearchedLibrary.toJSON(e));
    }
    if (message.status !== 0) {
      obj.status = librarySearchStatusToJSON(message.status);
    }
    return obj;
  },

  create(base?: DeepPartial<LibrarySearchResponse>): LibrarySearchResponse {
    return LibrarySearchResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<LibrarySearchResponse>
  ): LibrarySearchResponse {
    const message = createBaseLibrarySearchResponse();
    message.libraries =
      object.libraries?.map((e) => SearchedLibrary.fromPartial(e)) || [];
    message.status = object.status ?? 0;
    return message;
  },
};

function createBaseSearchedLibrary(): SearchedLibrary {
  return { name: '', releases: {}, latest: undefined, availableVersions: [] };
}

export const SearchedLibrary = {
  encode(
    message: SearchedLibrary,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    Object.entries(message.releases).forEach(([key, value]) => {
      SearchedLibrary_ReleasesEntry.encode(
        { key: key as any, value },
        writer.uint32(18).fork()
      ).ldelim();
    });
    if (message.latest !== undefined) {
      LibraryRelease.encode(message.latest, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.availableVersions) {
      writer.uint32(34).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SearchedLibrary {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSearchedLibrary();
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

          const entry2 = SearchedLibrary_ReleasesEntry.decode(
            reader,
            reader.uint32()
          );
          if (entry2.value !== undefined) {
            message.releases[entry2.key] = entry2.value;
          }
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.latest = LibraryRelease.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.availableVersions.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SearchedLibrary {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      releases: isObject(object.releases)
        ? Object.entries(object.releases).reduce<{
            [key: string]: LibraryRelease;
          }>((acc, [key, value]) => {
            acc[key] = LibraryRelease.fromJSON(value);
            return acc;
          }, {})
        : {},
      latest: isSet(object.latest)
        ? LibraryRelease.fromJSON(object.latest)
        : undefined,
      availableVersions: Array.isArray(object?.availableVersions)
        ? object.availableVersions.map((e: any) => String(e))
        : [],
    };
  },

  toJSON(message: SearchedLibrary): unknown {
    const obj: any = {};
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.releases) {
      const entries = Object.entries(message.releases);
      if (entries.length > 0) {
        obj.releases = {};
        entries.forEach(([k, v]) => {
          obj.releases[k] = LibraryRelease.toJSON(v);
        });
      }
    }
    if (message.latest !== undefined) {
      obj.latest = LibraryRelease.toJSON(message.latest);
    }
    if (message.availableVersions?.length) {
      obj.availableVersions = message.availableVersions;
    }
    return obj;
  },

  create(base?: DeepPartial<SearchedLibrary>): SearchedLibrary {
    return SearchedLibrary.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<SearchedLibrary>): SearchedLibrary {
    const message = createBaseSearchedLibrary();
    message.name = object.name ?? '';
    message.releases = Object.entries(object.releases ?? {}).reduce<{
      [key: string]: LibraryRelease;
    }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = LibraryRelease.fromPartial(value);
      }
      return acc;
    }, {});
    message.latest =
      object.latest !== undefined && object.latest !== null
        ? LibraryRelease.fromPartial(object.latest)
        : undefined;
    message.availableVersions = object.availableVersions?.map((e) => e) || [];
    return message;
  },
};

function createBaseSearchedLibrary_ReleasesEntry(): SearchedLibrary_ReleasesEntry {
  return { key: '', value: undefined };
}

export const SearchedLibrary_ReleasesEntry = {
  encode(
    message: SearchedLibrary_ReleasesEntry,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.key !== '') {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      LibraryRelease.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): SearchedLibrary_ReleasesEntry {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSearchedLibrary_ReleasesEntry();
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

          message.value = LibraryRelease.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SearchedLibrary_ReleasesEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value)
        ? LibraryRelease.fromJSON(object.value)
        : undefined,
    };
  },

  toJSON(message: SearchedLibrary_ReleasesEntry): unknown {
    const obj: any = {};
    if (message.key !== '') {
      obj.key = message.key;
    }
    if (message.value !== undefined) {
      obj.value = LibraryRelease.toJSON(message.value);
    }
    return obj;
  },

  create(
    base?: DeepPartial<SearchedLibrary_ReleasesEntry>
  ): SearchedLibrary_ReleasesEntry {
    return SearchedLibrary_ReleasesEntry.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<SearchedLibrary_ReleasesEntry>
  ): SearchedLibrary_ReleasesEntry {
    const message = createBaseSearchedLibrary_ReleasesEntry();
    message.key = object.key ?? '';
    message.value =
      object.value !== undefined && object.value !== null
        ? LibraryRelease.fromPartial(object.value)
        : undefined;
    return message;
  },
};

function createBaseLibraryRelease(): LibraryRelease {
  return {
    author: '',
    version: '',
    maintainer: '',
    sentence: '',
    paragraph: '',
    website: '',
    category: '',
    architectures: [],
    types: [],
    resources: undefined,
    license: '',
    providesIncludes: [],
    dependencies: [],
  };
}

export const LibraryRelease = {
  encode(
    message: LibraryRelease,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.author !== '') {
      writer.uint32(10).string(message.author);
    }
    if (message.version !== '') {
      writer.uint32(18).string(message.version);
    }
    if (message.maintainer !== '') {
      writer.uint32(26).string(message.maintainer);
    }
    if (message.sentence !== '') {
      writer.uint32(34).string(message.sentence);
    }
    if (message.paragraph !== '') {
      writer.uint32(42).string(message.paragraph);
    }
    if (message.website !== '') {
      writer.uint32(50).string(message.website);
    }
    if (message.category !== '') {
      writer.uint32(58).string(message.category);
    }
    for (const v of message.architectures) {
      writer.uint32(66).string(v!);
    }
    for (const v of message.types) {
      writer.uint32(74).string(v!);
    }
    if (message.resources !== undefined) {
      DownloadResource.encode(
        message.resources,
        writer.uint32(82).fork()
      ).ldelim();
    }
    if (message.license !== '') {
      writer.uint32(90).string(message.license);
    }
    for (const v of message.providesIncludes) {
      writer.uint32(98).string(v!);
    }
    for (const v of message.dependencies) {
      LibraryDependency.encode(v!, writer.uint32(106).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LibraryRelease {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryRelease();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.author = reader.string();
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

          message.maintainer = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.sentence = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.paragraph = reader.string();
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

          message.category = reader.string();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.architectures.push(reader.string());
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.types.push(reader.string());
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.resources = DownloadResource.decode(reader, reader.uint32());
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          message.license = reader.string();
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.providesIncludes.push(reader.string());
          continue;
        case 13:
          if (tag !== 106) {
            break;
          }

          message.dependencies.push(
            LibraryDependency.decode(reader, reader.uint32())
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

  fromJSON(object: any): LibraryRelease {
    return {
      author: isSet(object.author) ? String(object.author) : '',
      version: isSet(object.version) ? String(object.version) : '',
      maintainer: isSet(object.maintainer) ? String(object.maintainer) : '',
      sentence: isSet(object.sentence) ? String(object.sentence) : '',
      paragraph: isSet(object.paragraph) ? String(object.paragraph) : '',
      website: isSet(object.website) ? String(object.website) : '',
      category: isSet(object.category) ? String(object.category) : '',
      architectures: Array.isArray(object?.architectures)
        ? object.architectures.map((e: any) => String(e))
        : [],
      types: Array.isArray(object?.types)
        ? object.types.map((e: any) => String(e))
        : [],
      resources: isSet(object.resources)
        ? DownloadResource.fromJSON(object.resources)
        : undefined,
      license: isSet(object.license) ? String(object.license) : '',
      providesIncludes: Array.isArray(object?.providesIncludes)
        ? object.providesIncludes.map((e: any) => String(e))
        : [],
      dependencies: Array.isArray(object?.dependencies)
        ? object.dependencies.map((e: any) => LibraryDependency.fromJSON(e))
        : [],
    };
  },

  toJSON(message: LibraryRelease): unknown {
    const obj: any = {};
    if (message.author !== '') {
      obj.author = message.author;
    }
    if (message.version !== '') {
      obj.version = message.version;
    }
    if (message.maintainer !== '') {
      obj.maintainer = message.maintainer;
    }
    if (message.sentence !== '') {
      obj.sentence = message.sentence;
    }
    if (message.paragraph !== '') {
      obj.paragraph = message.paragraph;
    }
    if (message.website !== '') {
      obj.website = message.website;
    }
    if (message.category !== '') {
      obj.category = message.category;
    }
    if (message.architectures?.length) {
      obj.architectures = message.architectures;
    }
    if (message.types?.length) {
      obj.types = message.types;
    }
    if (message.resources !== undefined) {
      obj.resources = DownloadResource.toJSON(message.resources);
    }
    if (message.license !== '') {
      obj.license = message.license;
    }
    if (message.providesIncludes?.length) {
      obj.providesIncludes = message.providesIncludes;
    }
    if (message.dependencies?.length) {
      obj.dependencies = message.dependencies.map((e) =>
        LibraryDependency.toJSON(e)
      );
    }
    return obj;
  },

  create(base?: DeepPartial<LibraryRelease>): LibraryRelease {
    return LibraryRelease.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<LibraryRelease>): LibraryRelease {
    const message = createBaseLibraryRelease();
    message.author = object.author ?? '';
    message.version = object.version ?? '';
    message.maintainer = object.maintainer ?? '';
    message.sentence = object.sentence ?? '';
    message.paragraph = object.paragraph ?? '';
    message.website = object.website ?? '';
    message.category = object.category ?? '';
    message.architectures = object.architectures?.map((e) => e) || [];
    message.types = object.types?.map((e) => e) || [];
    message.resources =
      object.resources !== undefined && object.resources !== null
        ? DownloadResource.fromPartial(object.resources)
        : undefined;
    message.license = object.license ?? '';
    message.providesIncludes = object.providesIncludes?.map((e) => e) || [];
    message.dependencies =
      object.dependencies?.map((e) => LibraryDependency.fromPartial(e)) || [];
    return message;
  },
};

function createBaseLibraryDependency(): LibraryDependency {
  return { name: '', versionConstraint: '' };
}

export const LibraryDependency = {
  encode(
    message: LibraryDependency,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    if (message.versionConstraint !== '') {
      writer.uint32(18).string(message.versionConstraint);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LibraryDependency {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryDependency();
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

          message.versionConstraint = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LibraryDependency {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      versionConstraint: isSet(object.versionConstraint)
        ? String(object.versionConstraint)
        : '',
    };
  },

  toJSON(message: LibraryDependency): unknown {
    const obj: any = {};
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.versionConstraint !== '') {
      obj.versionConstraint = message.versionConstraint;
    }
    return obj;
  },

  create(base?: DeepPartial<LibraryDependency>): LibraryDependency {
    return LibraryDependency.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<LibraryDependency>): LibraryDependency {
    const message = createBaseLibraryDependency();
    message.name = object.name ?? '';
    message.versionConstraint = object.versionConstraint ?? '';
    return message;
  },
};

function createBaseDownloadResource(): DownloadResource {
  return { url: '', archiveFilename: '', checksum: '', size: 0, cachePath: '' };
}

export const DownloadResource = {
  encode(
    message: DownloadResource,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.url !== '') {
      writer.uint32(10).string(message.url);
    }
    if (message.archiveFilename !== '') {
      writer.uint32(18).string(message.archiveFilename);
    }
    if (message.checksum !== '') {
      writer.uint32(26).string(message.checksum);
    }
    if (message.size !== 0) {
      writer.uint32(32).int64(message.size);
    }
    if (message.cachePath !== '') {
      writer.uint32(42).string(message.cachePath);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DownloadResource {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDownloadResource();
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

          message.archiveFilename = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.checksum = reader.string();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.size = longToNumber(reader.int64() as Long);
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.cachePath = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DownloadResource {
    return {
      url: isSet(object.url) ? String(object.url) : '',
      archiveFilename: isSet(object.archiveFilename)
        ? String(object.archiveFilename)
        : '',
      checksum: isSet(object.checksum) ? String(object.checksum) : '',
      size: isSet(object.size) ? Number(object.size) : 0,
      cachePath: isSet(object.cachePath) ? String(object.cachePath) : '',
    };
  },

  toJSON(message: DownloadResource): unknown {
    const obj: any = {};
    if (message.url !== '') {
      obj.url = message.url;
    }
    if (message.archiveFilename !== '') {
      obj.archiveFilename = message.archiveFilename;
    }
    if (message.checksum !== '') {
      obj.checksum = message.checksum;
    }
    if (message.size !== 0) {
      obj.size = Math.round(message.size);
    }
    if (message.cachePath !== '') {
      obj.cachePath = message.cachePath;
    }
    return obj;
  },

  create(base?: DeepPartial<DownloadResource>): DownloadResource {
    return DownloadResource.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<DownloadResource>): DownloadResource {
    const message = createBaseDownloadResource();
    message.url = object.url ?? '';
    message.archiveFilename = object.archiveFilename ?? '';
    message.checksum = object.checksum ?? '';
    message.size = object.size ?? 0;
    message.cachePath = object.cachePath ?? '';
    return message;
  },
};

function createBaseLibraryListRequest(): LibraryListRequest {
  return {
    instance: undefined,
    all: false,
    updatable: false,
    name: '',
    fqbn: '',
  };
}

export const LibraryListRequest = {
  encode(
    message: LibraryListRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.all === true) {
      writer.uint32(16).bool(message.all);
    }
    if (message.updatable === true) {
      writer.uint32(24).bool(message.updatable);
    }
    if (message.name !== '') {
      writer.uint32(34).string(message.name);
    }
    if (message.fqbn !== '') {
      writer.uint32(42).string(message.fqbn);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LibraryListRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryListRequest();
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

          message.all = reader.bool();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.updatable = reader.bool();
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

  fromJSON(object: any): LibraryListRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      all: isSet(object.all) ? Boolean(object.all) : false,
      updatable: isSet(object.updatable) ? Boolean(object.updatable) : false,
      name: isSet(object.name) ? String(object.name) : '',
      fqbn: isSet(object.fqbn) ? String(object.fqbn) : '',
    };
  },

  toJSON(message: LibraryListRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.all === true) {
      obj.all = message.all;
    }
    if (message.updatable === true) {
      obj.updatable = message.updatable;
    }
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.fqbn !== '') {
      obj.fqbn = message.fqbn;
    }
    return obj;
  },

  create(base?: DeepPartial<LibraryListRequest>): LibraryListRequest {
    return LibraryListRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<LibraryListRequest>): LibraryListRequest {
    const message = createBaseLibraryListRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.all = object.all ?? false;
    message.updatable = object.updatable ?? false;
    message.name = object.name ?? '';
    message.fqbn = object.fqbn ?? '';
    return message;
  },
};

function createBaseLibraryListResponse(): LibraryListResponse {
  return { installedLibraries: [] };
}

export const LibraryListResponse = {
  encode(
    message: LibraryListResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.installedLibraries) {
      InstalledLibrary.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LibraryListResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibraryListResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.installedLibraries.push(
            InstalledLibrary.decode(reader, reader.uint32())
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

  fromJSON(object: any): LibraryListResponse {
    return {
      installedLibraries: Array.isArray(object?.installedLibraries)
        ? object.installedLibraries.map((e: any) =>
            InstalledLibrary.fromJSON(e)
          )
        : [],
    };
  },

  toJSON(message: LibraryListResponse): unknown {
    const obj: any = {};
    if (message.installedLibraries?.length) {
      obj.installedLibraries = message.installedLibraries.map((e) =>
        InstalledLibrary.toJSON(e)
      );
    }
    return obj;
  },

  create(base?: DeepPartial<LibraryListResponse>): LibraryListResponse {
    return LibraryListResponse.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<LibraryListResponse>): LibraryListResponse {
    const message = createBaseLibraryListResponse();
    message.installedLibraries =
      object.installedLibraries?.map((e) => InstalledLibrary.fromPartial(e)) ||
      [];
    return message;
  },
};

function createBaseInstalledLibrary(): InstalledLibrary {
  return { library: undefined, release: undefined };
}

export const InstalledLibrary = {
  encode(
    message: InstalledLibrary,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.library !== undefined) {
      Library.encode(message.library, writer.uint32(10).fork()).ldelim();
    }
    if (message.release !== undefined) {
      LibraryRelease.encode(message.release, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InstalledLibrary {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInstalledLibrary();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.library = Library.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.release = LibraryRelease.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): InstalledLibrary {
    return {
      library: isSet(object.library)
        ? Library.fromJSON(object.library)
        : undefined,
      release: isSet(object.release)
        ? LibraryRelease.fromJSON(object.release)
        : undefined,
    };
  },

  toJSON(message: InstalledLibrary): unknown {
    const obj: any = {};
    if (message.library !== undefined) {
      obj.library = Library.toJSON(message.library);
    }
    if (message.release !== undefined) {
      obj.release = LibraryRelease.toJSON(message.release);
    }
    return obj;
  },

  create(base?: DeepPartial<InstalledLibrary>): InstalledLibrary {
    return InstalledLibrary.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<InstalledLibrary>): InstalledLibrary {
    const message = createBaseInstalledLibrary();
    message.library =
      object.library !== undefined && object.library !== null
        ? Library.fromPartial(object.library)
        : undefined;
    message.release =
      object.release !== undefined && object.release !== null
        ? LibraryRelease.fromPartial(object.release)
        : undefined;
    return message;
  },
};

function createBaseLibrary(): Library {
  return {
    name: '',
    author: '',
    maintainer: '',
    sentence: '',
    paragraph: '',
    website: '',
    category: '',
    architectures: [],
    types: [],
    installDir: '',
    sourceDir: '',
    utilityDir: '',
    containerPlatform: '',
    dotALinkage: false,
    precompiled: false,
    ldFlags: '',
    isLegacy: false,
    version: '',
    license: '',
    properties: {},
    location: 0,
    layout: 0,
    examples: [],
    providesIncludes: [],
    compatibleWith: {},
    inDevelopment: false,
  };
}

export const Library = {
  encode(
    message: Library,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    if (message.author !== '') {
      writer.uint32(18).string(message.author);
    }
    if (message.maintainer !== '') {
      writer.uint32(26).string(message.maintainer);
    }
    if (message.sentence !== '') {
      writer.uint32(34).string(message.sentence);
    }
    if (message.paragraph !== '') {
      writer.uint32(42).string(message.paragraph);
    }
    if (message.website !== '') {
      writer.uint32(50).string(message.website);
    }
    if (message.category !== '') {
      writer.uint32(58).string(message.category);
    }
    for (const v of message.architectures) {
      writer.uint32(66).string(v!);
    }
    for (const v of message.types) {
      writer.uint32(74).string(v!);
    }
    if (message.installDir !== '') {
      writer.uint32(82).string(message.installDir);
    }
    if (message.sourceDir !== '') {
      writer.uint32(90).string(message.sourceDir);
    }
    if (message.utilityDir !== '') {
      writer.uint32(98).string(message.utilityDir);
    }
    if (message.containerPlatform !== '') {
      writer.uint32(114).string(message.containerPlatform);
    }
    if (message.dotALinkage === true) {
      writer.uint32(136).bool(message.dotALinkage);
    }
    if (message.precompiled === true) {
      writer.uint32(144).bool(message.precompiled);
    }
    if (message.ldFlags !== '') {
      writer.uint32(154).string(message.ldFlags);
    }
    if (message.isLegacy === true) {
      writer.uint32(160).bool(message.isLegacy);
    }
    if (message.version !== '') {
      writer.uint32(170).string(message.version);
    }
    if (message.license !== '') {
      writer.uint32(178).string(message.license);
    }
    Object.entries(message.properties).forEach(([key, value]) => {
      Library_PropertiesEntry.encode(
        { key: key as any, value },
        writer.uint32(186).fork()
      ).ldelim();
    });
    if (message.location !== 0) {
      writer.uint32(192).int32(message.location);
    }
    if (message.layout !== 0) {
      writer.uint32(200).int32(message.layout);
    }
    for (const v of message.examples) {
      writer.uint32(210).string(v!);
    }
    for (const v of message.providesIncludes) {
      writer.uint32(218).string(v!);
    }
    Object.entries(message.compatibleWith).forEach(([key, value]) => {
      Library_CompatibleWithEntry.encode(
        { key: key as any, value },
        writer.uint32(226).fork()
      ).ldelim();
    });
    if (message.inDevelopment === true) {
      writer.uint32(232).bool(message.inDevelopment);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Library {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibrary();
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

          message.author = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.maintainer = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.sentence = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.paragraph = reader.string();
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

          message.category = reader.string();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.architectures.push(reader.string());
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.types.push(reader.string());
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.installDir = reader.string();
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          message.sourceDir = reader.string();
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.utilityDir = reader.string();
          continue;
        case 14:
          if (tag !== 114) {
            break;
          }

          message.containerPlatform = reader.string();
          continue;
        case 17:
          if (tag !== 136) {
            break;
          }

          message.dotALinkage = reader.bool();
          continue;
        case 18:
          if (tag !== 144) {
            break;
          }

          message.precompiled = reader.bool();
          continue;
        case 19:
          if (tag !== 154) {
            break;
          }

          message.ldFlags = reader.string();
          continue;
        case 20:
          if (tag !== 160) {
            break;
          }

          message.isLegacy = reader.bool();
          continue;
        case 21:
          if (tag !== 170) {
            break;
          }

          message.version = reader.string();
          continue;
        case 22:
          if (tag !== 178) {
            break;
          }

          message.license = reader.string();
          continue;
        case 23:
          if (tag !== 186) {
            break;
          }

          const entry23 = Library_PropertiesEntry.decode(
            reader,
            reader.uint32()
          );
          if (entry23.value !== undefined) {
            message.properties[entry23.key] = entry23.value;
          }
          continue;
        case 24:
          if (tag !== 192) {
            break;
          }

          message.location = reader.int32() as any;
          continue;
        case 25:
          if (tag !== 200) {
            break;
          }

          message.layout = reader.int32() as any;
          continue;
        case 26:
          if (tag !== 210) {
            break;
          }

          message.examples.push(reader.string());
          continue;
        case 27:
          if (tag !== 218) {
            break;
          }

          message.providesIncludes.push(reader.string());
          continue;
        case 28:
          if (tag !== 226) {
            break;
          }

          const entry28 = Library_CompatibleWithEntry.decode(
            reader,
            reader.uint32()
          );
          if (entry28.value !== undefined) {
            message.compatibleWith[entry28.key] = entry28.value;
          }
          continue;
        case 29:
          if (tag !== 232) {
            break;
          }

          message.inDevelopment = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Library {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      author: isSet(object.author) ? String(object.author) : '',
      maintainer: isSet(object.maintainer) ? String(object.maintainer) : '',
      sentence: isSet(object.sentence) ? String(object.sentence) : '',
      paragraph: isSet(object.paragraph) ? String(object.paragraph) : '',
      website: isSet(object.website) ? String(object.website) : '',
      category: isSet(object.category) ? String(object.category) : '',
      architectures: Array.isArray(object?.architectures)
        ? object.architectures.map((e: any) => String(e))
        : [],
      types: Array.isArray(object?.types)
        ? object.types.map((e: any) => String(e))
        : [],
      installDir: isSet(object.installDir) ? String(object.installDir) : '',
      sourceDir: isSet(object.sourceDir) ? String(object.sourceDir) : '',
      utilityDir: isSet(object.utilityDir) ? String(object.utilityDir) : '',
      containerPlatform: isSet(object.containerPlatform)
        ? String(object.containerPlatform)
        : '',
      dotALinkage: isSet(object.dotALinkage)
        ? Boolean(object.dotALinkage)
        : false,
      precompiled: isSet(object.precompiled)
        ? Boolean(object.precompiled)
        : false,
      ldFlags: isSet(object.ldFlags) ? String(object.ldFlags) : '',
      isLegacy: isSet(object.isLegacy) ? Boolean(object.isLegacy) : false,
      version: isSet(object.version) ? String(object.version) : '',
      license: isSet(object.license) ? String(object.license) : '',
      properties: isObject(object.properties)
        ? Object.entries(object.properties).reduce<{ [key: string]: string }>(
            (acc, [key, value]) => {
              acc[key] = String(value);
              return acc;
            },
            {}
          )
        : {},
      location: isSet(object.location)
        ? libraryLocationFromJSON(object.location)
        : 0,
      layout: isSet(object.layout) ? libraryLayoutFromJSON(object.layout) : 0,
      examples: Array.isArray(object?.examples)
        ? object.examples.map((e: any) => String(e))
        : [],
      providesIncludes: Array.isArray(object?.providesIncludes)
        ? object.providesIncludes.map((e: any) => String(e))
        : [],
      compatibleWith: isObject(object.compatibleWith)
        ? Object.entries(object.compatibleWith).reduce<{
            [key: string]: boolean;
          }>((acc, [key, value]) => {
            acc[key] = Boolean(value);
            return acc;
          }, {})
        : {},
      inDevelopment: isSet(object.inDevelopment)
        ? Boolean(object.inDevelopment)
        : false,
    };
  },

  toJSON(message: Library): unknown {
    const obj: any = {};
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.author !== '') {
      obj.author = message.author;
    }
    if (message.maintainer !== '') {
      obj.maintainer = message.maintainer;
    }
    if (message.sentence !== '') {
      obj.sentence = message.sentence;
    }
    if (message.paragraph !== '') {
      obj.paragraph = message.paragraph;
    }
    if (message.website !== '') {
      obj.website = message.website;
    }
    if (message.category !== '') {
      obj.category = message.category;
    }
    if (message.architectures?.length) {
      obj.architectures = message.architectures;
    }
    if (message.types?.length) {
      obj.types = message.types;
    }
    if (message.installDir !== '') {
      obj.installDir = message.installDir;
    }
    if (message.sourceDir !== '') {
      obj.sourceDir = message.sourceDir;
    }
    if (message.utilityDir !== '') {
      obj.utilityDir = message.utilityDir;
    }
    if (message.containerPlatform !== '') {
      obj.containerPlatform = message.containerPlatform;
    }
    if (message.dotALinkage === true) {
      obj.dotALinkage = message.dotALinkage;
    }
    if (message.precompiled === true) {
      obj.precompiled = message.precompiled;
    }
    if (message.ldFlags !== '') {
      obj.ldFlags = message.ldFlags;
    }
    if (message.isLegacy === true) {
      obj.isLegacy = message.isLegacy;
    }
    if (message.version !== '') {
      obj.version = message.version;
    }
    if (message.license !== '') {
      obj.license = message.license;
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
    if (message.location !== 0) {
      obj.location = libraryLocationToJSON(message.location);
    }
    if (message.layout !== 0) {
      obj.layout = libraryLayoutToJSON(message.layout);
    }
    if (message.examples?.length) {
      obj.examples = message.examples;
    }
    if (message.providesIncludes?.length) {
      obj.providesIncludes = message.providesIncludes;
    }
    if (message.compatibleWith) {
      const entries = Object.entries(message.compatibleWith);
      if (entries.length > 0) {
        obj.compatibleWith = {};
        entries.forEach(([k, v]) => {
          obj.compatibleWith[k] = v;
        });
      }
    }
    if (message.inDevelopment === true) {
      obj.inDevelopment = message.inDevelopment;
    }
    return obj;
  },

  create(base?: DeepPartial<Library>): Library {
    return Library.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<Library>): Library {
    const message = createBaseLibrary();
    message.name = object.name ?? '';
    message.author = object.author ?? '';
    message.maintainer = object.maintainer ?? '';
    message.sentence = object.sentence ?? '';
    message.paragraph = object.paragraph ?? '';
    message.website = object.website ?? '';
    message.category = object.category ?? '';
    message.architectures = object.architectures?.map((e) => e) || [];
    message.types = object.types?.map((e) => e) || [];
    message.installDir = object.installDir ?? '';
    message.sourceDir = object.sourceDir ?? '';
    message.utilityDir = object.utilityDir ?? '';
    message.containerPlatform = object.containerPlatform ?? '';
    message.dotALinkage = object.dotALinkage ?? false;
    message.precompiled = object.precompiled ?? false;
    message.ldFlags = object.ldFlags ?? '';
    message.isLegacy = object.isLegacy ?? false;
    message.version = object.version ?? '';
    message.license = object.license ?? '';
    message.properties = Object.entries(object.properties ?? {}).reduce<{
      [key: string]: string;
    }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});
    message.location = object.location ?? 0;
    message.layout = object.layout ?? 0;
    message.examples = object.examples?.map((e) => e) || [];
    message.providesIncludes = object.providesIncludes?.map((e) => e) || [];
    message.compatibleWith = Object.entries(
      object.compatibleWith ?? {}
    ).reduce<{ [key: string]: boolean }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = Boolean(value);
      }
      return acc;
    }, {});
    message.inDevelopment = object.inDevelopment ?? false;
    return message;
  },
};

function createBaseLibrary_PropertiesEntry(): Library_PropertiesEntry {
  return { key: '', value: '' };
}

export const Library_PropertiesEntry = {
  encode(
    message: Library_PropertiesEntry,
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
  ): Library_PropertiesEntry {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibrary_PropertiesEntry();
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

  fromJSON(object: any): Library_PropertiesEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? String(object.value) : '',
    };
  },

  toJSON(message: Library_PropertiesEntry): unknown {
    const obj: any = {};
    if (message.key !== '') {
      obj.key = message.key;
    }
    if (message.value !== '') {
      obj.value = message.value;
    }
    return obj;
  },

  create(base?: DeepPartial<Library_PropertiesEntry>): Library_PropertiesEntry {
    return Library_PropertiesEntry.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<Library_PropertiesEntry>
  ): Library_PropertiesEntry {
    const message = createBaseLibrary_PropertiesEntry();
    message.key = object.key ?? '';
    message.value = object.value ?? '';
    return message;
  },
};

function createBaseLibrary_CompatibleWithEntry(): Library_CompatibleWithEntry {
  return { key: '', value: false };
}

export const Library_CompatibleWithEntry = {
  encode(
    message: Library_CompatibleWithEntry,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.key !== '') {
      writer.uint32(10).string(message.key);
    }
    if (message.value === true) {
      writer.uint32(16).bool(message.value);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): Library_CompatibleWithEntry {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLibrary_CompatibleWithEntry();
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
          if (tag !== 16) {
            break;
          }

          message.value = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Library_CompatibleWithEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? Boolean(object.value) : false,
    };
  },

  toJSON(message: Library_CompatibleWithEntry): unknown {
    const obj: any = {};
    if (message.key !== '') {
      obj.key = message.key;
    }
    if (message.value === true) {
      obj.value = message.value;
    }
    return obj;
  },

  create(
    base?: DeepPartial<Library_CompatibleWithEntry>
  ): Library_CompatibleWithEntry {
    return Library_CompatibleWithEntry.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<Library_CompatibleWithEntry>
  ): Library_CompatibleWithEntry {
    const message = createBaseLibrary_CompatibleWithEntry();
    message.key = object.key ?? '';
    message.value = object.value ?? false;
    return message;
  },
};

function createBaseZipLibraryInstallRequest(): ZipLibraryInstallRequest {
  return { instance: undefined, path: '', overwrite: false };
}

export const ZipLibraryInstallRequest = {
  encode(
    message: ZipLibraryInstallRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.path !== '') {
      writer.uint32(18).string(message.path);
    }
    if (message.overwrite === true) {
      writer.uint32(24).bool(message.overwrite);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): ZipLibraryInstallRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseZipLibraryInstallRequest();
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

          message.path = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
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

  fromJSON(object: any): ZipLibraryInstallRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      path: isSet(object.path) ? String(object.path) : '',
      overwrite: isSet(object.overwrite) ? Boolean(object.overwrite) : false,
    };
  },

  toJSON(message: ZipLibraryInstallRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.path !== '') {
      obj.path = message.path;
    }
    if (message.overwrite === true) {
      obj.overwrite = message.overwrite;
    }
    return obj;
  },

  create(
    base?: DeepPartial<ZipLibraryInstallRequest>
  ): ZipLibraryInstallRequest {
    return ZipLibraryInstallRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<ZipLibraryInstallRequest>
  ): ZipLibraryInstallRequest {
    const message = createBaseZipLibraryInstallRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.path = object.path ?? '';
    message.overwrite = object.overwrite ?? false;
    return message;
  },
};

function createBaseZipLibraryInstallResponse(): ZipLibraryInstallResponse {
  return { taskProgress: undefined };
}

export const ZipLibraryInstallResponse = {
  encode(
    message: ZipLibraryInstallResponse,
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
  ): ZipLibraryInstallResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseZipLibraryInstallResponse();
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

  fromJSON(object: any): ZipLibraryInstallResponse {
    return {
      taskProgress: isSet(object.taskProgress)
        ? TaskProgress.fromJSON(object.taskProgress)
        : undefined,
    };
  },

  toJSON(message: ZipLibraryInstallResponse): unknown {
    const obj: any = {};
    if (message.taskProgress !== undefined) {
      obj.taskProgress = TaskProgress.toJSON(message.taskProgress);
    }
    return obj;
  },

  create(
    base?: DeepPartial<ZipLibraryInstallResponse>
  ): ZipLibraryInstallResponse {
    return ZipLibraryInstallResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<ZipLibraryInstallResponse>
  ): ZipLibraryInstallResponse {
    const message = createBaseZipLibraryInstallResponse();
    message.taskProgress =
      object.taskProgress !== undefined && object.taskProgress !== null
        ? TaskProgress.fromPartial(object.taskProgress)
        : undefined;
    return message;
  },
};

function createBaseGitLibraryInstallRequest(): GitLibraryInstallRequest {
  return { instance: undefined, url: '', overwrite: false };
}

export const GitLibraryInstallRequest = {
  encode(
    message: GitLibraryInstallRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.instance !== undefined) {
      Instance.encode(message.instance, writer.uint32(10).fork()).ldelim();
    }
    if (message.url !== '') {
      writer.uint32(18).string(message.url);
    }
    if (message.overwrite === true) {
      writer.uint32(24).bool(message.overwrite);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): GitLibraryInstallRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGitLibraryInstallRequest();
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

          message.url = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
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

  fromJSON(object: any): GitLibraryInstallRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      url: isSet(object.url) ? String(object.url) : '',
      overwrite: isSet(object.overwrite) ? Boolean(object.overwrite) : false,
    };
  },

  toJSON(message: GitLibraryInstallRequest): unknown {
    const obj: any = {};
    if (message.instance !== undefined) {
      obj.instance = Instance.toJSON(message.instance);
    }
    if (message.url !== '') {
      obj.url = message.url;
    }
    if (message.overwrite === true) {
      obj.overwrite = message.overwrite;
    }
    return obj;
  },

  create(
    base?: DeepPartial<GitLibraryInstallRequest>
  ): GitLibraryInstallRequest {
    return GitLibraryInstallRequest.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<GitLibraryInstallRequest>
  ): GitLibraryInstallRequest {
    const message = createBaseGitLibraryInstallRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.url = object.url ?? '';
    message.overwrite = object.overwrite ?? false;
    return message;
  },
};

function createBaseGitLibraryInstallResponse(): GitLibraryInstallResponse {
  return { taskProgress: undefined };
}

export const GitLibraryInstallResponse = {
  encode(
    message: GitLibraryInstallResponse,
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
  ): GitLibraryInstallResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGitLibraryInstallResponse();
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

  fromJSON(object: any): GitLibraryInstallResponse {
    return {
      taskProgress: isSet(object.taskProgress)
        ? TaskProgress.fromJSON(object.taskProgress)
        : undefined,
    };
  },

  toJSON(message: GitLibraryInstallResponse): unknown {
    const obj: any = {};
    if (message.taskProgress !== undefined) {
      obj.taskProgress = TaskProgress.toJSON(message.taskProgress);
    }
    return obj;
  },

  create(
    base?: DeepPartial<GitLibraryInstallResponse>
  ): GitLibraryInstallResponse {
    return GitLibraryInstallResponse.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<GitLibraryInstallResponse>
  ): GitLibraryInstallResponse {
    const message = createBaseGitLibraryInstallResponse();
    message.taskProgress =
      object.taskProgress !== undefined && object.taskProgress !== null
        ? TaskProgress.fromPartial(object.taskProgress)
        : undefined;
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

function isObject(value: any): boolean {
  return typeof value === 'object' && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
