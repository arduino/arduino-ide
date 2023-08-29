/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';
import { BoolValue } from '../../../../../google/protobuf/wrappers';
import { InstalledPlatformReference, Instance, TaskProgress } from './common';
import { Library } from './lib';

export interface CompileRequest {
  /** Arduino Core Service instance from the `Init` response. */
  instance: Instance | undefined;
  /**
   * Fully Qualified Board Name, e.g.: `arduino:avr:uno`. If this field is
   * not defined, the FQBN of the board attached to the sketch via the
   * `BoardAttach` method is used.
   */
  fqbn: string;
  /** The path where the sketch is stored. */
  sketchPath: string;
  /** Just get the build properties and do not run the full compile. */
  showProperties: boolean;
  /** Print preprocessed code to stdout instead of compiling. */
  preprocess: boolean;
  /** Builds of 'core.a' are saved into this path to be cached and reused. */
  buildCachePath: string;
  /**
   * Path to use to store the files used for the compilation. If omitted,
   * a directory will be created in the operating system's default temporary
   * path.
   */
  buildPath: string;
  /** List of custom build properties separated by commas. */
  buildProperties: string[];
  /**
   * Used to tell gcc which warning level to use. The level names are: "none",
   * "default", "more" and "all".
   */
  warnings: string;
  /** Turns on verbose mode. */
  verbose: boolean;
  /** Suppresses almost every output. */
  quiet: boolean;
  /**
   * The max number of concurrent compiler instances to run (as `make -jx`).
   * If jobs is set to 0, it will use the number of available CPUs as the
   * maximum.
   */
  jobs: number;
  /** A list of paths to directories containing a collection of libraries. */
  libraries: string[];
  /** Optimize compile output for debug, not for release. */
  optimizeForDebug: boolean;
  /**
   * Optional: save the build artifacts in this directory, the directory must
   * exist.
   */
  exportDir: string;
  /**
   * Optional: cleanup the build folder and do not use any previously cached
   * build
   */
  clean: boolean;
  /**
   * When set to `true` only the compilation database will be produced and no
   * actual build will be performed.
   */
  createCompilationDatabaseOnly: boolean;
  /**
   * This map (source file -> new content) let the builder use the provided
   * content instead of reading the corresponding file on disk. This is useful
   * for IDE that have unsaved changes in memory. The path must be relative to
   * the sketch directory. Only files from the sketch are allowed.
   */
  sourceOverride: { [key: string]: string };
  /**
   * When set to `true` the compiled binary will be copied to the export
   * directory.
   */
  exportBinaries: boolean | undefined;
  /** A list of paths to single libraries root directory. */
  library: string[];
  /**
   * The path where to search for the custom signing key name and the encrypt
   * key name
   */
  keysKeychain: string;
  /** The name of the custom key to use for signing during the compile process */
  signKey: string;
  /** The name of the custom key to use for encrypting during the compile process */
  encryptKey: string;
  /**
   * If set to true the build will skip the library discovery process and will
   * use the same libraries of latest build. Enabling this flag may produce a
   * wrong output and should not be used in regular compiles unless there is a
   * very specific reason to do so. This flag is mainly provided for usage in
   * language servers to optimize the build speed in some particular cases.
   */
  skipLibrariesDiscovery: boolean;
  /**
   * If set to true the returned build properties will be left unexpanded, with
   * the variables placeholders exactly as defined in the platform.
   */
  doNotExpandBuildProperties: boolean;
}

export interface CompileRequest_SourceOverrideEntry {
  key: string;
  value: string;
}

export interface CompileResponse {
  /** The output of the compilation process (stream) */
  outStream: Uint8Array;
  /** The error output of the compilation process (stream) */
  errStream: Uint8Array;
  /** The compiler build path */
  buildPath: string;
  /** The libraries used in the build */
  usedLibraries: Library[];
  /** The size of the executable split by sections */
  executableSectionsSize: ExecutableSectionSize[];
  /** The platform where the board is defined */
  boardPlatform: InstalledPlatformReference | undefined;
  /** The platform used for the build (if referenced from the board platform) */
  buildPlatform: InstalledPlatformReference | undefined;
  /** Completions reports of the compilation process (stream) */
  progress: TaskProgress | undefined;
  /** Build properties used for compiling */
  buildProperties: string[];
}

export interface ExecutableSectionSize {
  name: string;
  size: number;
  maxSize: number;
}

function createBaseCompileRequest(): CompileRequest {
  return {
    instance: undefined,
    fqbn: '',
    sketchPath: '',
    showProperties: false,
    preprocess: false,
    buildCachePath: '',
    buildPath: '',
    buildProperties: [],
    warnings: '',
    verbose: false,
    quiet: false,
    jobs: 0,
    libraries: [],
    optimizeForDebug: false,
    exportDir: '',
    clean: false,
    createCompilationDatabaseOnly: false,
    sourceOverride: {},
    exportBinaries: undefined,
    library: [],
    keysKeychain: '',
    signKey: '',
    encryptKey: '',
    skipLibrariesDiscovery: false,
    doNotExpandBuildProperties: false,
  };
}

export const CompileRequest = {
  encode(
    message: CompileRequest,
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
    if (message.showProperties === true) {
      writer.uint32(32).bool(message.showProperties);
    }
    if (message.preprocess === true) {
      writer.uint32(40).bool(message.preprocess);
    }
    if (message.buildCachePath !== '') {
      writer.uint32(50).string(message.buildCachePath);
    }
    if (message.buildPath !== '') {
      writer.uint32(58).string(message.buildPath);
    }
    for (const v of message.buildProperties) {
      writer.uint32(66).string(v!);
    }
    if (message.warnings !== '') {
      writer.uint32(74).string(message.warnings);
    }
    if (message.verbose === true) {
      writer.uint32(80).bool(message.verbose);
    }
    if (message.quiet === true) {
      writer.uint32(88).bool(message.quiet);
    }
    if (message.jobs !== 0) {
      writer.uint32(112).int32(message.jobs);
    }
    for (const v of message.libraries) {
      writer.uint32(122).string(v!);
    }
    if (message.optimizeForDebug === true) {
      writer.uint32(128).bool(message.optimizeForDebug);
    }
    if (message.exportDir !== '') {
      writer.uint32(146).string(message.exportDir);
    }
    if (message.clean === true) {
      writer.uint32(152).bool(message.clean);
    }
    if (message.createCompilationDatabaseOnly === true) {
      writer.uint32(168).bool(message.createCompilationDatabaseOnly);
    }
    Object.entries(message.sourceOverride).forEach(([key, value]) => {
      CompileRequest_SourceOverrideEntry.encode(
        { key: key as any, value },
        writer.uint32(178).fork()
      ).ldelim();
    });
    if (message.exportBinaries !== undefined) {
      BoolValue.encode(
        { value: message.exportBinaries! },
        writer.uint32(186).fork()
      ).ldelim();
    }
    for (const v of message.library) {
      writer.uint32(194).string(v!);
    }
    if (message.keysKeychain !== '') {
      writer.uint32(202).string(message.keysKeychain);
    }
    if (message.signKey !== '') {
      writer.uint32(210).string(message.signKey);
    }
    if (message.encryptKey !== '') {
      writer.uint32(218).string(message.encryptKey);
    }
    if (message.skipLibrariesDiscovery === true) {
      writer.uint32(224).bool(message.skipLibrariesDiscovery);
    }
    if (message.doNotExpandBuildProperties === true) {
      writer.uint32(232).bool(message.doNotExpandBuildProperties);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CompileRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCompileRequest();
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
          if (tag !== 32) {
            break;
          }

          message.showProperties = reader.bool();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.preprocess = reader.bool();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.buildCachePath = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.buildPath = reader.string();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.buildProperties.push(reader.string());
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.warnings = reader.string();
          continue;
        case 10:
          if (tag !== 80) {
            break;
          }

          message.verbose = reader.bool();
          continue;
        case 11:
          if (tag !== 88) {
            break;
          }

          message.quiet = reader.bool();
          continue;
        case 14:
          if (tag !== 112) {
            break;
          }

          message.jobs = reader.int32();
          continue;
        case 15:
          if (tag !== 122) {
            break;
          }

          message.libraries.push(reader.string());
          continue;
        case 16:
          if (tag !== 128) {
            break;
          }

          message.optimizeForDebug = reader.bool();
          continue;
        case 18:
          if (tag !== 146) {
            break;
          }

          message.exportDir = reader.string();
          continue;
        case 19:
          if (tag !== 152) {
            break;
          }

          message.clean = reader.bool();
          continue;
        case 21:
          if (tag !== 168) {
            break;
          }

          message.createCompilationDatabaseOnly = reader.bool();
          continue;
        case 22:
          if (tag !== 178) {
            break;
          }

          const entry22 = CompileRequest_SourceOverrideEntry.decode(
            reader,
            reader.uint32()
          );
          if (entry22.value !== undefined) {
            message.sourceOverride[entry22.key] = entry22.value;
          }
          continue;
        case 23:
          if (tag !== 186) {
            break;
          }

          message.exportBinaries = BoolValue.decode(
            reader,
            reader.uint32()
          ).value;
          continue;
        case 24:
          if (tag !== 194) {
            break;
          }

          message.library.push(reader.string());
          continue;
        case 25:
          if (tag !== 202) {
            break;
          }

          message.keysKeychain = reader.string();
          continue;
        case 26:
          if (tag !== 210) {
            break;
          }

          message.signKey = reader.string();
          continue;
        case 27:
          if (tag !== 218) {
            break;
          }

          message.encryptKey = reader.string();
          continue;
        case 28:
          if (tag !== 224) {
            break;
          }

          message.skipLibrariesDiscovery = reader.bool();
          continue;
        case 29:
          if (tag !== 232) {
            break;
          }

          message.doNotExpandBuildProperties = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): CompileRequest {
    return {
      instance: isSet(object.instance)
        ? Instance.fromJSON(object.instance)
        : undefined,
      fqbn: isSet(object.fqbn) ? String(object.fqbn) : '',
      sketchPath: isSet(object.sketchPath) ? String(object.sketchPath) : '',
      showProperties: isSet(object.showProperties)
        ? Boolean(object.showProperties)
        : false,
      preprocess: isSet(object.preprocess) ? Boolean(object.preprocess) : false,
      buildCachePath: isSet(object.buildCachePath)
        ? String(object.buildCachePath)
        : '',
      buildPath: isSet(object.buildPath) ? String(object.buildPath) : '',
      buildProperties: Array.isArray(object?.buildProperties)
        ? object.buildProperties.map((e: any) => String(e))
        : [],
      warnings: isSet(object.warnings) ? String(object.warnings) : '',
      verbose: isSet(object.verbose) ? Boolean(object.verbose) : false,
      quiet: isSet(object.quiet) ? Boolean(object.quiet) : false,
      jobs: isSet(object.jobs) ? Number(object.jobs) : 0,
      libraries: Array.isArray(object?.libraries)
        ? object.libraries.map((e: any) => String(e))
        : [],
      optimizeForDebug: isSet(object.optimizeForDebug)
        ? Boolean(object.optimizeForDebug)
        : false,
      exportDir: isSet(object.exportDir) ? String(object.exportDir) : '',
      clean: isSet(object.clean) ? Boolean(object.clean) : false,
      createCompilationDatabaseOnly: isSet(object.createCompilationDatabaseOnly)
        ? Boolean(object.createCompilationDatabaseOnly)
        : false,
      sourceOverride: isObject(object.sourceOverride)
        ? Object.entries(object.sourceOverride).reduce<{
            [key: string]: string;
          }>((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {})
        : {},
      exportBinaries: isSet(object.exportBinaries)
        ? Boolean(object.exportBinaries)
        : undefined,
      library: Array.isArray(object?.library)
        ? object.library.map((e: any) => String(e))
        : [],
      keysKeychain: isSet(object.keysKeychain)
        ? String(object.keysKeychain)
        : '',
      signKey: isSet(object.signKey) ? String(object.signKey) : '',
      encryptKey: isSet(object.encryptKey) ? String(object.encryptKey) : '',
      skipLibrariesDiscovery: isSet(object.skipLibrariesDiscovery)
        ? Boolean(object.skipLibrariesDiscovery)
        : false,
      doNotExpandBuildProperties: isSet(object.doNotExpandBuildProperties)
        ? Boolean(object.doNotExpandBuildProperties)
        : false,
    };
  },

  toJSON(message: CompileRequest): unknown {
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
    if (message.showProperties === true) {
      obj.showProperties = message.showProperties;
    }
    if (message.preprocess === true) {
      obj.preprocess = message.preprocess;
    }
    if (message.buildCachePath !== '') {
      obj.buildCachePath = message.buildCachePath;
    }
    if (message.buildPath !== '') {
      obj.buildPath = message.buildPath;
    }
    if (message.buildProperties?.length) {
      obj.buildProperties = message.buildProperties;
    }
    if (message.warnings !== '') {
      obj.warnings = message.warnings;
    }
    if (message.verbose === true) {
      obj.verbose = message.verbose;
    }
    if (message.quiet === true) {
      obj.quiet = message.quiet;
    }
    if (message.jobs !== 0) {
      obj.jobs = Math.round(message.jobs);
    }
    if (message.libraries?.length) {
      obj.libraries = message.libraries;
    }
    if (message.optimizeForDebug === true) {
      obj.optimizeForDebug = message.optimizeForDebug;
    }
    if (message.exportDir !== '') {
      obj.exportDir = message.exportDir;
    }
    if (message.clean === true) {
      obj.clean = message.clean;
    }
    if (message.createCompilationDatabaseOnly === true) {
      obj.createCompilationDatabaseOnly = message.createCompilationDatabaseOnly;
    }
    if (message.sourceOverride) {
      const entries = Object.entries(message.sourceOverride);
      if (entries.length > 0) {
        obj.sourceOverride = {};
        entries.forEach(([k, v]) => {
          obj.sourceOverride[k] = v;
        });
      }
    }
    if (message.exportBinaries !== undefined) {
      obj.exportBinaries = message.exportBinaries;
    }
    if (message.library?.length) {
      obj.library = message.library;
    }
    if (message.keysKeychain !== '') {
      obj.keysKeychain = message.keysKeychain;
    }
    if (message.signKey !== '') {
      obj.signKey = message.signKey;
    }
    if (message.encryptKey !== '') {
      obj.encryptKey = message.encryptKey;
    }
    if (message.skipLibrariesDiscovery === true) {
      obj.skipLibrariesDiscovery = message.skipLibrariesDiscovery;
    }
    if (message.doNotExpandBuildProperties === true) {
      obj.doNotExpandBuildProperties = message.doNotExpandBuildProperties;
    }
    return obj;
  },

  create(base?: DeepPartial<CompileRequest>): CompileRequest {
    return CompileRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<CompileRequest>): CompileRequest {
    const message = createBaseCompileRequest();
    message.instance =
      object.instance !== undefined && object.instance !== null
        ? Instance.fromPartial(object.instance)
        : undefined;
    message.fqbn = object.fqbn ?? '';
    message.sketchPath = object.sketchPath ?? '';
    message.showProperties = object.showProperties ?? false;
    message.preprocess = object.preprocess ?? false;
    message.buildCachePath = object.buildCachePath ?? '';
    message.buildPath = object.buildPath ?? '';
    message.buildProperties = object.buildProperties?.map((e) => e) || [];
    message.warnings = object.warnings ?? '';
    message.verbose = object.verbose ?? false;
    message.quiet = object.quiet ?? false;
    message.jobs = object.jobs ?? 0;
    message.libraries = object.libraries?.map((e) => e) || [];
    message.optimizeForDebug = object.optimizeForDebug ?? false;
    message.exportDir = object.exportDir ?? '';
    message.clean = object.clean ?? false;
    message.createCompilationDatabaseOnly =
      object.createCompilationDatabaseOnly ?? false;
    message.sourceOverride = Object.entries(
      object.sourceOverride ?? {}
    ).reduce<{ [key: string]: string }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {});
    message.exportBinaries = object.exportBinaries ?? undefined;
    message.library = object.library?.map((e) => e) || [];
    message.keysKeychain = object.keysKeychain ?? '';
    message.signKey = object.signKey ?? '';
    message.encryptKey = object.encryptKey ?? '';
    message.skipLibrariesDiscovery = object.skipLibrariesDiscovery ?? false;
    message.doNotExpandBuildProperties =
      object.doNotExpandBuildProperties ?? false;
    return message;
  },
};

function createBaseCompileRequest_SourceOverrideEntry(): CompileRequest_SourceOverrideEntry {
  return { key: '', value: '' };
}

export const CompileRequest_SourceOverrideEntry = {
  encode(
    message: CompileRequest_SourceOverrideEntry,
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
  ): CompileRequest_SourceOverrideEntry {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCompileRequest_SourceOverrideEntry();
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

  fromJSON(object: any): CompileRequest_SourceOverrideEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? String(object.value) : '',
    };
  },

  toJSON(message: CompileRequest_SourceOverrideEntry): unknown {
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
    base?: DeepPartial<CompileRequest_SourceOverrideEntry>
  ): CompileRequest_SourceOverrideEntry {
    return CompileRequest_SourceOverrideEntry.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<CompileRequest_SourceOverrideEntry>
  ): CompileRequest_SourceOverrideEntry {
    const message = createBaseCompileRequest_SourceOverrideEntry();
    message.key = object.key ?? '';
    message.value = object.value ?? '';
    return message;
  },
};

function createBaseCompileResponse(): CompileResponse {
  return {
    outStream: new Uint8Array(0),
    errStream: new Uint8Array(0),
    buildPath: '',
    usedLibraries: [],
    executableSectionsSize: [],
    boardPlatform: undefined,
    buildPlatform: undefined,
    progress: undefined,
    buildProperties: [],
  };
}

export const CompileResponse = {
  encode(
    message: CompileResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.outStream.length !== 0) {
      writer.uint32(10).bytes(message.outStream);
    }
    if (message.errStream.length !== 0) {
      writer.uint32(18).bytes(message.errStream);
    }
    if (message.buildPath !== '') {
      writer.uint32(26).string(message.buildPath);
    }
    for (const v of message.usedLibraries) {
      Library.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    for (const v of message.executableSectionsSize) {
      ExecutableSectionSize.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    if (message.boardPlatform !== undefined) {
      InstalledPlatformReference.encode(
        message.boardPlatform,
        writer.uint32(50).fork()
      ).ldelim();
    }
    if (message.buildPlatform !== undefined) {
      InstalledPlatformReference.encode(
        message.buildPlatform,
        writer.uint32(58).fork()
      ).ldelim();
    }
    if (message.progress !== undefined) {
      TaskProgress.encode(message.progress, writer.uint32(66).fork()).ldelim();
    }
    for (const v of message.buildProperties) {
      writer.uint32(74).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CompileResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCompileResponse();
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
        case 3:
          if (tag !== 26) {
            break;
          }

          message.buildPath = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.usedLibraries.push(Library.decode(reader, reader.uint32()));
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.executableSectionsSize.push(
            ExecutableSectionSize.decode(reader, reader.uint32())
          );
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.boardPlatform = InstalledPlatformReference.decode(
            reader,
            reader.uint32()
          );
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.buildPlatform = InstalledPlatformReference.decode(
            reader,
            reader.uint32()
          );
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.progress = TaskProgress.decode(reader, reader.uint32());
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.buildProperties.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): CompileResponse {
    return {
      outStream: isSet(object.outStream)
        ? bytesFromBase64(object.outStream)
        : new Uint8Array(0),
      errStream: isSet(object.errStream)
        ? bytesFromBase64(object.errStream)
        : new Uint8Array(0),
      buildPath: isSet(object.buildPath) ? String(object.buildPath) : '',
      usedLibraries: Array.isArray(object?.usedLibraries)
        ? object.usedLibraries.map((e: any) => Library.fromJSON(e))
        : [],
      executableSectionsSize: Array.isArray(object?.executableSectionsSize)
        ? object.executableSectionsSize.map((e: any) =>
            ExecutableSectionSize.fromJSON(e)
          )
        : [],
      boardPlatform: isSet(object.boardPlatform)
        ? InstalledPlatformReference.fromJSON(object.boardPlatform)
        : undefined,
      buildPlatform: isSet(object.buildPlatform)
        ? InstalledPlatformReference.fromJSON(object.buildPlatform)
        : undefined,
      progress: isSet(object.progress)
        ? TaskProgress.fromJSON(object.progress)
        : undefined,
      buildProperties: Array.isArray(object?.buildProperties)
        ? object.buildProperties.map((e: any) => String(e))
        : [],
    };
  },

  toJSON(message: CompileResponse): unknown {
    const obj: any = {};
    if (message.outStream.length !== 0) {
      obj.outStream = base64FromBytes(message.outStream);
    }
    if (message.errStream.length !== 0) {
      obj.errStream = base64FromBytes(message.errStream);
    }
    if (message.buildPath !== '') {
      obj.buildPath = message.buildPath;
    }
    if (message.usedLibraries?.length) {
      obj.usedLibraries = message.usedLibraries.map((e) => Library.toJSON(e));
    }
    if (message.executableSectionsSize?.length) {
      obj.executableSectionsSize = message.executableSectionsSize.map((e) =>
        ExecutableSectionSize.toJSON(e)
      );
    }
    if (message.boardPlatform !== undefined) {
      obj.boardPlatform = InstalledPlatformReference.toJSON(
        message.boardPlatform
      );
    }
    if (message.buildPlatform !== undefined) {
      obj.buildPlatform = InstalledPlatformReference.toJSON(
        message.buildPlatform
      );
    }
    if (message.progress !== undefined) {
      obj.progress = TaskProgress.toJSON(message.progress);
    }
    if (message.buildProperties?.length) {
      obj.buildProperties = message.buildProperties;
    }
    return obj;
  },

  create(base?: DeepPartial<CompileResponse>): CompileResponse {
    return CompileResponse.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<CompileResponse>): CompileResponse {
    const message = createBaseCompileResponse();
    message.outStream = object.outStream ?? new Uint8Array(0);
    message.errStream = object.errStream ?? new Uint8Array(0);
    message.buildPath = object.buildPath ?? '';
    message.usedLibraries =
      object.usedLibraries?.map((e) => Library.fromPartial(e)) || [];
    message.executableSectionsSize =
      object.executableSectionsSize?.map((e) =>
        ExecutableSectionSize.fromPartial(e)
      ) || [];
    message.boardPlatform =
      object.boardPlatform !== undefined && object.boardPlatform !== null
        ? InstalledPlatformReference.fromPartial(object.boardPlatform)
        : undefined;
    message.buildPlatform =
      object.buildPlatform !== undefined && object.buildPlatform !== null
        ? InstalledPlatformReference.fromPartial(object.buildPlatform)
        : undefined;
    message.progress =
      object.progress !== undefined && object.progress !== null
        ? TaskProgress.fromPartial(object.progress)
        : undefined;
    message.buildProperties = object.buildProperties?.map((e) => e) || [];
    return message;
  },
};

function createBaseExecutableSectionSize(): ExecutableSectionSize {
  return { name: '', size: 0, maxSize: 0 };
}

export const ExecutableSectionSize = {
  encode(
    message: ExecutableSectionSize,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    if (message.size !== 0) {
      writer.uint32(16).int64(message.size);
    }
    if (message.maxSize !== 0) {
      writer.uint32(24).int64(message.maxSize);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): ExecutableSectionSize {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExecutableSectionSize();
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
          if (tag !== 16) {
            break;
          }

          message.size = longToNumber(reader.int64() as Long);
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.maxSize = longToNumber(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ExecutableSectionSize {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      size: isSet(object.size) ? Number(object.size) : 0,
      maxSize: isSet(object.maxSize) ? Number(object.maxSize) : 0,
    };
  },

  toJSON(message: ExecutableSectionSize): unknown {
    const obj: any = {};
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.size !== 0) {
      obj.size = Math.round(message.size);
    }
    if (message.maxSize !== 0) {
      obj.maxSize = Math.round(message.maxSize);
    }
    return obj;
  },

  create(base?: DeepPartial<ExecutableSectionSize>): ExecutableSectionSize {
    return ExecutableSectionSize.fromPartial(base ?? {});
  },
  fromPartial(
    object: DeepPartial<ExecutableSectionSize>
  ): ExecutableSectionSize {
    const message = createBaseExecutableSectionSize();
    message.name = object.name ?? '';
    message.size = object.size ?? 0;
    message.maxSize = object.maxSize ?? 0;
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
