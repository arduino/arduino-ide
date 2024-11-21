import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { ILogger } from '@theia/core/lib/common/logger';
import { nls } from '@theia/core/lib/common/nls';
import { isWindows } from '@theia/core/lib/common/os';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { escapeRegExpCharacters } from '@theia/core/lib/common/strings';
import type { Mutable } from '@theia/core/lib/common/types';
import URI from '@theia/core/lib/common/uri';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { glob } from 'glob';
import crypto from 'node:crypto';
import {
  CopyOptions,
  Stats,
  constants,
  promises as fs,
  lstat,
  realpath,
} from 'node:fs';
import os from 'node:os';
import path, { join } from 'node:path';
import PQueue from 'p-queue';
import temp from 'temp';
import { NotificationServiceServer } from '../common/protocol';
import {
  Sketch,
  SketchContainer,
  SketchRef,
  SketchesError,
  SketchesService,
} from '../common/protocol/sketches-service';
import {
  firstToLowerCase,
  firstToUpperCase,
  startsWithUpperCase,
} from '../common/utils';
import {
  ArchiveSketchRequest,
  LoadSketchRequest,
} from './cli-protocol/cc/arduino/cli/commands/v1/commands_pb';
import { ConfigServiceImpl } from './config-service-impl';
import { CoreClientAware } from './core-client-provider';
import {
  IsTempSketch,
  TempSketchPrefix,
  Win32DriveRegex,
  maybeNormalizeDrive,
} from './is-temp-sketch';
import { ServiceError } from './service-error';
import { SettingsReader } from './settings-reader';
import { ErrnoException } from './utils/errors';

const RecentSketches = 'recent-sketches.json';
const DefaultIno = `void setup() {
  // put your setup code here, to run once:

}

void loop() {
  // put your main code here, to run repeatedly:

}
`;

@injectable()
export class SketchesServiceImpl
  extends CoreClientAware
  implements SketchesService
{
  private sketchSuffixIndex = 1;
  private lastSketchBaseName: string;
  private recentSketches: SketchWithDetails[] | undefined;
  private readonly markAsRecentSketchQueue = new PQueue({
    autoStart: true,
    concurrency: 1,
  });
  private inoContent: Deferred<string> | undefined;

  @inject(ILogger)
  @named('sketches-service')
  private readonly logger: ILogger;
  @inject(ConfigServiceImpl)
  private readonly configService: ConfigServiceImpl;
  @inject(NotificationServiceServer)
  private readonly notificationService: NotificationServiceServer;
  @inject(EnvVariablesServer)
  private readonly envVariableServer: EnvVariablesServer;
  @inject(IsTempSketch)
  private readonly isTempSketch: IsTempSketch;
  @inject(SettingsReader)
  private readonly settingsReader: SettingsReader;

  async getSketches({ uri }: { uri?: string }): Promise<SketchContainer> {
    const root = await this.root(uri);
    if (!root) {
      this.logger.warn(`Could not derive sketchbook root from ${uri}.`);
      return SketchContainer.create('');
    }
    const rootExists = await exists(root);
    if (!rootExists) {
      this.logger.warn(`Sketchbook root ${root} does not exist.`);
      return SketchContainer.create('');
    }
    const container = <Mutable<SketchContainer>>(
      SketchContainer.create(uri ? path.basename(root) : 'Sketchbook')
    );
    return discoverSketches(root, container, this.logger);
  }

  private async root(uri?: string | undefined): Promise<string | undefined> {
    if (uri) {
      return FileUri.fsPath(uri);
    }
    const sketchbookUri = await this.sketchbookUri();
    if (sketchbookUri) {
      return FileUri.fsPath(sketchbookUri);
    }
    return undefined;
  }

  private async sketchbookUri(): Promise<string | undefined> {
    const { config, messages } = await this.configService.getConfiguration();
    if (!config?.sketchDirUri || messages?.length) {
      return undefined;
    }
    return config.sketchDirUri;
  }

  async loadSketch(uri: string): Promise<SketchWithDetails> {
    return this.doLoadSketch(uri);
  }

  private async doLoadSketch(
    uri: string,
    detectInvalidSketchNameError = true
  ): Promise<SketchWithDetails> {
    const { client } = await this.coreClient;
    const req = new LoadSketchRequest();
    const requestSketchPath = FileUri.fsPath(uri);
    req.setSketchPath(requestSketchPath);
    // TODO: since the instance is not required on the request, can IDE2 do this faster or have a dedicated client for the sketch loading?
    const stat = new Deferred<Stats | Error>();
    lstat(requestSketchPath, (err, result) =>
      err ? stat.resolve(err) : stat.resolve(result)
    );
    const sketch = await new Promise<SketchWithDetails>((resolve, reject) => {
      client.loadSketch(req, async (err, resp) => {
        if (err) {
          let rejectWith: unknown = err;
          if (isNotFoundError(err)) {
            rejectWith = SketchesError.NotFound(err.details, uri);
            // detecting the invalid sketch name error is not for free as it requires multiple filesystem access.
            if (detectInvalidSketchNameError) {
              const invalidMainSketchFilePath = await isInvalidSketchNameError(
                err,
                requestSketchPath
              );
              if (invalidMainSketchFilePath) {
                rejectWith = SketchesError.InvalidName(
                  err.details,
                  FileUri.create(invalidMainSketchFilePath).toString()
                );
              }
            }
          }
          reject(rejectWith);
          return;
        }
        const sketch = resp.getSketch();
        if (!sketch) {
          reject(
            new Error(`Incomplete LoadSketch response. Sketch is missing.`)
          );
          return;
        }
        const responseSketchPath = maybeNormalizeDrive(
          sketch.getLocationPath()
        );
        if (requestSketchPath !== responseSketchPath) {
          this.logger.warn(
            `Warning! The request sketch path was different than the response sketch path from the CLI. This could be a potential bug. Request: <${requestSketchPath}>, response: <${responseSketchPath}>.`
          );
        }
        const resolvedStat = await stat.promise;
        if (resolvedStat instanceof Error) {
          this.logger.error(
            `The CLI could load the sketch from ${requestSketchPath}, but stating the folder has failed.`
          );
          reject(resolvedStat);
          return;
        }
        const { mtimeMs } = resolvedStat;
        resolve({
          name: path.basename(responseSketchPath),
          uri: FileUri.create(responseSketchPath).toString(),
          mainFileUri: FileUri.create(sketch.getMainFile()).toString(),
          otherSketchFileUris: sketch
            .getOtherSketchFilesList()
            .map((p) => FileUri.create(p).toString()),
          additionalFileUris: sketch
            .getAdditionalFilesList()
            .map((p) => FileUri.create(p).toString()),
          rootFolderFileUris: sketch
            .getRootFolderFilesList()
            .map((p) => FileUri.create(p).toString()),
          mtimeMs,
        });
      });
    });
    return sketch;
  }

  async maybeLoadSketch(uri: string): Promise<Sketch | undefined> {
    return this._isSketchFolder(uri);
  }

  private get recentSketchesFsPath(): Promise<string> {
    return this.envVariableServer
      .getConfigDirUri()
      .then((uri) => path.join(FileUri.fsPath(uri), RecentSketches));
  }

  private async loadRecentSketches(): Promise<Record<string, number>> {
    this.logger.debug(`>>> Loading recently opened sketches data.`);
    const fsPath = await this.recentSketchesFsPath;
    let data: Record<string, number> = {};
    try {
      const raw = await fs.readFile(fsPath, {
        encoding: 'utf8',
      });
      try {
        data = JSON.parse(raw);
      } catch (err) {
        this.logger.error(
          `Could not parse recently opened sketches. Raw input was: ${raw}`
        );
      }
    } catch (err) {
      if (ErrnoException.isENOENT(err)) {
        this.logger.debug(
          `<<< '${RecentSketches}' does not exist yet. This is normal behavior. Falling back to empty data.`
        );
        return {};
      }
      throw err;
    }
    this.logger.debug(
      `<<< Successfully loaded recently opened sketches data: ${JSON.stringify(
        data
      )}`
    );
    return data;
  }

  private async saveRecentSketches(
    data: Record<string, number>
  ): Promise<void> {
    this.logger.debug(
      `>>> Saving recently opened sketches data: ${JSON.stringify(data)}`
    );
    const fsPath = await this.recentSketchesFsPath;
    await fs.writeFile(fsPath, JSON.stringify(data, null, 2));
    this.logger.debug('<<< Successfully saved recently opened sketches data.');
  }

  async markAsRecentlyOpened(uri: string): Promise<void> {
    return this.markAsRecentSketchQueue.add(async () => {
      this.logger.debug(`Marking sketch at '${uri}' as recently opened.`);
      if (this.isTempSketch.is(FileUri.fsPath(uri))) {
        this.logger.debug(
          `Sketch at '${uri}' is pointing to a temp location. Not marking as recently opened.`
        );
        return;
      }

      let sketch: Sketch | undefined = undefined;
      try {
        sketch = await this.doLoadSketch(uri, false);
        this.logger.debug(
          `Loaded sketch ${JSON.stringify(
            sketch
          )} before marking it as recently opened.`
        );
      } catch (err) {
        if (
          SketchesError.NotFound.is(err) ||
          SketchesError.InvalidName.is(err)
        ) {
          this.logger.debug(
            `Could not load sketch from '${uri}'. Not marking as recently opened.`
          );
          return;
        }
        this.logger.error(
          `Unexpected error occurred while loading sketch from '${uri}'.`,
          err
        );
        throw err;
      }

      const data = await this.loadRecentSketches();
      const now = Date.now();
      this.logger.debug(
        `Marking sketch '${uri}' as recently opened with timestamp: '${now}'.`
      );
      data[sketch.uri] = now;

      let toDelete: [string, number] | undefined = undefined;
      if (Object.keys(data).length > 10) {
        let min = Number.MAX_SAFE_INTEGER;
        for (const [uri, timestamp] of Object.entries(data)) {
          if (min > timestamp) {
            min = data[uri];
            toDelete = [uri, timestamp];
          }
        }
      }

      if (toDelete) {
        const [toDeleteUri] = toDelete;
        delete data[toDeleteUri];
        this.logger.debug(
          `Deleted sketch entry ${JSON.stringify(
            toDelete
          )} from recently opened.`
        );
      }

      await this.saveRecentSketches(data);
      this.logger.debug(`Marked sketch '${uri}' as recently opened.`);
      const sketches = await this.recentlyOpenedSketches(data);
      this.notificationService.notifyRecentSketchesDidChange({ sketches });
    });
  }

  async recentlyOpenedSketches(
    forceUpdate?: Record<string, number> | boolean
  ): Promise<Sketch[]> {
    if (!this.recentSketches || forceUpdate) {
      const data =
        forceUpdate && typeof forceUpdate === 'object'
          ? forceUpdate
          : await this.loadRecentSketches();
      const sketches: SketchWithDetails[] = [];
      let needsUpdate = false;
      for (const uri of Object.keys(data).sort(
        (left, right) => data[right] - data[left]
      )) {
        let sketch: SketchWithDetails | undefined = undefined;
        try {
          sketch = await this.doLoadSketch(uri, false);
        } catch {}
        if (!sketch) {
          needsUpdate = true;
        } else {
          sketches.push(sketch);
        }
      }
      if (needsUpdate) {
        const data = sketches.reduce((acc, curr) => {
          acc[curr.uri] = curr.mtimeMs;
          return acc;
        }, {} as Record<string, number>);
        await this.saveRecentSketches(data);
        this.notificationService.notifyRecentSketchesDidChange({ sketches });
      }
      this.recentSketches = sketches;
    }
    return this.recentSketches;
  }

  async cloneExample(uri: string): Promise<Sketch> {
    const [sketch, parentPath] = await Promise.all([
      this.doLoadSketch(uri, false),
      this.createTempFolder(),
    ]);
    const destinationUri = FileUri.create(
      path.join(parentPath, sketch.name)
    ).toString();
    const copiedSketch = await this.copy(sketch, { destinationUri });
    return this.doLoadSketch(copiedSketch.uri, false);
  }

  async createNewSketch(name?: string, content?: string): Promise<Sketch> {
    let sketchName: string | undefined = name;
    const parentPath = await this.createTempFolder();
    if (!sketchName) {
      const monthNames = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ];
      const today = new Date();
      const sketchBaseName = `sketch_${
        monthNames[today.getMonth()]
      }${today.getDate()}`;
      const { config } = await this.configService.getConfiguration();
      const sketchbookPath = config?.sketchDirUri
        ? FileUri.fsPath(config?.sketchDirUri)
        : os.homedir();

      // If it's another day, reset the count of sketches created today
      if (this.lastSketchBaseName !== sketchBaseName)
        this.sketchSuffixIndex = 1;

      let nameFound = false;
      while (!nameFound) {
        const sketchNameCandidate = `${sketchBaseName}${sketchIndexToLetters(
          this.sketchSuffixIndex++
        )}`;
        // Note: we check the future destination folder (`directories.user`) for name collision and not the temp folder!
        const sketchExists = await exists(
          path.join(sketchbookPath, sketchNameCandidate)
        );
        if (!sketchExists) {
          nameFound = true;
          sketchName = sketchNameCandidate;
        }
      }
      this.lastSketchBaseName = sketchBaseName;
    }

    if (!sketchName) {
      throw new Error('Cannot create a unique sketch name');
    }

    const sketchDir = path.join(parentPath, sketchName);
    const sketchFile = path.join(sketchDir, `${sketchName}.ino`);
    const [inoContent] = await Promise.all([
      content ? content : this.loadInoContent(),
      fs.mkdir(sketchDir, { recursive: true }),
    ]);
    await fs.writeFile(sketchFile, inoContent, { encoding: 'utf8' });
    return this.doLoadSketch(FileUri.create(sketchDir).toString(), false);
  }

  defaultInoContent(): Promise<string> {
    return this.loadInoContent();
  }

  /**
   * Creates a temp folder and returns with a promise that resolves with the canonicalized absolute pathname of the newly created temp folder.
   * This method ensures that the file-system path pointing to the new temp directory is fully resolved.
   * For example, on Windows, instead of getting an [8.3 filename](https://en.wikipedia.org/wiki/8.3_filename), callers will get a fully resolved path.
   * `C:\\Users\\KITTAA~1\\AppData\\Local\\Temp\\.arduinoIDE-unsaved2022615-21100-iahybb.yyvh\\sketch_jul15a` will be `C:\\Users\\kittaakos\\AppData\\Local\\Temp\\.arduinoIDE-unsaved2022615-21100-iahybb.yyvh\\sketch_jul15a`
   */
  private createTempFolder(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      temp.mkdir({ prefix: TempSketchPrefix }, (createError, dirPath) => {
        if (createError) {
          reject(createError);
          return;
        }
        realpath.native(dirPath, (resolveError, resolvedDirPath) => {
          if (resolveError) {
            reject(resolveError);
            return;
          }
          resolve(resolvedDirPath);
        });
      });
    });
  }

  async getSketchFolder(uri: string): Promise<Sketch | undefined> {
    if (!uri) {
      return undefined;
    }
    let currentUri = new URI(uri);
    while (currentUri && !currentUri.path.isRoot) {
      const sketch = await this._isSketchFolder(currentUri.toString());
      if (sketch) {
        return sketch;
      }
      currentUri = currentUri.parent;
    }
    return undefined;
  }

  async isSketchFolder(uri: string): Promise<boolean> {
    const sketch = await this._isSketchFolder(uri);
    return !!sketch;
  }

  private async _isSketchFolder(
    uri: string
  ): Promise<SketchWithDetails | undefined> {
    try {
      const sketch = await this.doLoadSketch(uri, false);
      return sketch;
    } catch (err) {
      if (SketchesError.NotFound.is(err) || SketchesError.InvalidName.is(err)) {
        return undefined;
      }
      throw err;
    }
  }

  async isTemp(sketch: SketchRef): Promise<boolean> {
    return this.isTempSketch.is(FileUri.fsPath(sketch.uri));
  }

  async copy(
    sketch: Sketch,
    {
      destinationUri,
      onlySketchFiles,
    }: { destinationUri: string; onlySketchFiles?: boolean }
  ): Promise<Sketch> {
    const sourceUri = sketch.uri;
    const source = FileUri.fsPath(sourceUri);
    const destination = FileUri.fsPath(destinationUri);
    if (source === destination) {
      const reloadedSketch = await this.doLoadSketch(sourceUri, false);
      return reloadedSketch;
    }
    const sourceFolderBasename = path.basename(source);
    const destinationFolderBasename = path.basename(destination);

    const errorMessage = Sketch.validateSketchFolderName(
      destinationFolderBasename
    );
    if (errorMessage) {
      const message = `${nls.localize(
        'arduino/sketch/invalidSketchFolderNameMessage',
        "Invalid sketch folder name: '{0}'",
        destinationFolderBasename
      )} ${errorMessage}`;
      throw SketchesError.InvalidFolderName(message, destinationFolderBasename);
    }

    // verify a possible name collision with existing ino files
    if (sourceFolderBasename !== destinationFolderBasename) {
      try {
        const otherInoBasename = `${destinationFolderBasename}.ino`;
        const otherInoPath = join(source, otherInoBasename);
        const stat = await fs.stat(otherInoPath);
        if (stat.isFile()) {
          const message = nls.localize(
            'arduino/sketch/sketchAlreadyContainsThisFileError',
            "The sketch already contains a file named '{0}'",
            otherInoBasename
          );
          // if can read the file, it will be a collision
          throw SketchesError.SketchAlreadyContainsThisFile(
            message,
            sourceFolderBasename,
            destinationFolderBasename,
            otherInoBasename
          );
        }
        // Otherwise, it's OK, if it is an existing directory
      } catch (err) {
        // It's OK if the file is missing.
        if (!ErrnoException.isENOENT(err)) {
          throw err;
        }
      }
    }

    let filter: CopyOptions['filter'];
    if (onlySketchFiles) {
      // The Windows paths, can be a trash (see below). Hence, it must be resolved with Node.js.
      // After resolving the path, the drive letter is still a gamble (can be upper or lower case) and could result in a false negative match.
      // Here, all sketch file paths must be resolved by Node.js, to provide the same drive letter casing.
      const sketchFilePaths = await Promise.all(
        Sketch.uris(sketch)
          .map(FileUri.fsPath)
          .map((path) => fs.realpath(path))
      );
      filter = async (s) => {
        // On Windows, the source path could start with a complete trash. For example, \\\\?\\c:\\Users\\kittaakos\\AppData\\Local\\Temp\\.arduinoIDE-unsaved20231024-9300-1hp64fi.g8yh\\sketch_nov24d.
        // The path must be resolved.
        const resolvedSource = await fs.realpath(s);
        if (sketchFilePaths.includes(resolvedSource)) {
          return true;
        }
        const stat = await fs.stat(resolvedSource);
        if (stat.isFile()) {
          return false;
        }
        // Copy the folder if any of the sketch file path starts with this folder
        return sketchFilePaths.some((sketchFilePath) =>
          sketchFilePath.startsWith(resolvedSource)
        );
      };
    } else {
      filter = () => true;
    }

    const tempRoot = await this.createTempFolder();
    const temp = join(tempRoot, destinationFolderBasename);
    await fs.mkdir(temp, { recursive: true });

    // copy to temp folder
    await fs.cp(source, temp, {
      filter,
      recursive: true,
      force: true,
    });

    const sourceMainSketchFilePath = FileUri.fsPath(sketch.mainFileUri);
    // Can copy sketch with pde main sketch file: https://github.com/arduino/arduino-ide/issues/2377
    const ext = path.extname(sourceMainSketchFilePath);

    // rename the main sketch file
    await fs.rename(
      join(temp, `${sourceFolderBasename}${ext}`),
      join(temp, `${destinationFolderBasename}.ino`)
    );

    // copy to destination
    try {
      await fs.cp(temp, destination, { recursive: true, force: true });
      const copiedSketch = await this.doLoadSketch(destinationUri, false);
      return copiedSketch;
    } finally {
      // remove temp
      fs.rm(tempRoot, { recursive: true, force: true, maxRetries: 5 }); // no await
    }
  }

  async archive(sketch: Sketch, destinationUri: string): Promise<string> {
    await this.doLoadSketch(sketch.uri, false); // sanity check
    const { client } = await this.coreClient;
    const archivePath = FileUri.fsPath(destinationUri);
    // The CLI cannot override existing archives, so we have to wipe it manually: https://github.com/arduino/arduino-cli/issues/1160
    if (await exists(archivePath)) {
      await fs.unlink(archivePath);
    }
    const req = new ArchiveSketchRequest();
    req.setSketchPath(FileUri.fsPath(sketch.uri));
    req.setArchivePath(archivePath);
    await new Promise<string>((resolve, reject) => {
      client.archiveSketch(req, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(destinationUri);
      });
    });
    return destinationUri;
  }

  async getIdeTempFolderUri(sketch: SketchRef): Promise<string> {
    const genBuildPath = await this.getIdeTempFolderPath(sketch);
    return FileUri.create(genBuildPath).toString();
  }

  private async getIdeTempFolderPath(sketch: SketchRef): Promise<string> {
    const sketchPath = FileUri.fsPath(sketch.uri);
    await fs.readdir(sketchPath); // Validates the sketch folder and rejects if not accessible.
    const suffix = crypto.createHash('md5').update(sketchPath).digest('hex');
    return path.join(
      this.isTempSketch.tempDirRealpath,
      `arduino-ide2-${suffix}`
    );
  }

  async getBuildPath(sketch: Sketch): Promise<string[]> {
    const sketchPath = FileUri.fsPath(sketch.uri);

    let basePath: string;
    try {
      basePath = userCacheDir();
    } catch {
      // Fallback to /tmp
      const { tempDirRealpath } = this.isTempSketch;
      basePath = tempDirRealpath;
    }
    const buildPaths = [this.buildPathMD5Hash(basePath, sketchPath)];

    // If on Windows, provide both the upper and the lowercase drive letter MD5 hashes. All together four paths are expected:
    // One of them should match if the sketch is not yet compiled.
    // https://github.com/arduino/arduino-ide/pull/1809#discussion_r1071031040
    if (isWindows && Win32DriveRegex.test(basePath)) {
      const toggleFirstCharCasing = (s: string) =>
        startsWithUpperCase(s) ? firstToLowerCase(s) : firstToUpperCase(s);
      const otherCaseDirRealPath = toggleFirstCharCasing(basePath);
      buildPaths.push(this.buildPathMD5Hash(otherCaseDirRealPath, sketchPath));
      if (Win32DriveRegex.test(sketchPath)) {
        const otherCaseSketchPath = toggleFirstCharCasing(sketchPath);
        buildPaths.push(
          this.buildPathMD5Hash(basePath, otherCaseSketchPath),
          this.buildPathMD5Hash(otherCaseDirRealPath, otherCaseSketchPath)
        );
      }
    }
    return buildPaths;
  }

  private buildPathMD5Hash(basePath: string, path: string): string {
    return join(basePath, 'arduino', 'sketches', this.buildFolderMD5Hash(path));
  }

  private buildFolderMD5Hash(path: string): string {
    return crypto.createHash('md5').update(path).digest('hex').toUpperCase();
  }

  // Returns the default.ino from the settings or from default folder.
  private async loadInoContent(): Promise<string> {
    if (!this.inoContent) {
      this.inoContent = new Deferred<string>();
      const settings = await this.settingsReader.read();
      if (settings) {
        const inoBlueprintPath = settings['arduino.sketch.inoBlueprint'];
        if (inoBlueprintPath && typeof inoBlueprintPath === 'string') {
          try {
            const inoContent = await fs.readFile(inoBlueprintPath, {
              encoding: 'utf8',
            });
            this.inoContent.resolve(inoContent);
          } catch (err) {
            if (ErrnoException.isENOENT(err)) {
              // Ignored. The custom `.ino` blueprint file is optional.
            } else {
              throw err;
            }
          }
        }
      }
      this.inoContent.resolve(DefaultIno);
    }

    return this.inoContent.promise;
  }
}

interface SketchWithDetails extends Sketch {
  readonly mtimeMs: number;
}

function isNotFoundError(err: unknown): err is ServiceError {
  return ServiceError.is(err) && err.code === 5; // `NOT_FOUND` https://grpc.github.io/grpc/core/md_doc_statuscodes.html
}

/**
 * Tries to detect whether the error was caused by an invalid main sketch file name.
 * IDE2 should handle gracefully when there is an invalid sketch folder name.
 * See the [spec](https://arduino.github.io/arduino-cli/latest/sketch-specification/#sketch-root-folder) for details.
 * The CLI does not have error codes (https://github.com/arduino/arduino-cli/issues/1762),
 * IDE2 cannot parse the error message (https://github.com/arduino/arduino-cli/issues/1968#issuecomment-1306936142)
 * so it checks if a sketch even if it's invalid can be discovered from the requested path.
 * Nothing guarantees that the invalid existing main sketch file still exits by the time client performs the sketch move.
 */
async function isInvalidSketchNameError(
  cliErr: unknown,
  requestSketchPath: string
): Promise<string | undefined> {
  return isNotFoundError(cliErr)
    ? isAccessibleSketchPath(requestSketchPath)
    : undefined;
}

/**
 * The `path` argument is valid, if accessible and either pointing to a `.ino` file,
 * or it's a directory, and one of the files in the directory is an `.ino` file.
 *
 * `undefined` if `path` was pointing to neither an accessible sketch file nor a sketch folder.
 *
 * The sketch folder name and sketch file name can be different. This method is not sketch folder name compliant.
 * The `path` must be an absolute, resolved path. This method does not handle EACCES (Permission denied) errors.
 * This method handles `UNKNOWN` errors ([nodejs/node#19965](https://github.com/nodejs/node/issues/19965#issuecomment-380750573)).
 *
 * When `fallbackToInvalidFolderPath` is `true`, and the `path` is an accessible folder without any sketch files,
 * this method returns with the `path` argument instead of `undefined`.
 */
export async function isAccessibleSketchPath(
  path: string,
  fallbackToInvalidFolderPath = false
): Promise<string | undefined> {
  let stats: Stats | undefined = undefined;
  try {
    stats = await fs.stat(path);
  } catch (err) {
    if (ErrnoException.isENOENT(err) || ErrnoException.isUNKNOWN(err)) {
      return undefined;
    }
    throw err;
  }
  if (!stats) {
    return undefined;
  }
  if (stats.isFile()) {
    return path.endsWith('.ino') ? path : undefined;
  }
  const entries = await fs.readdir(path, { withFileTypes: true });
  const sketchFilename = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ino'))
    .map(({ name }) => name)
    // A folder might contain multiple sketches. It's OK to pick the first one as IDE2 cannot do much,
    // but ensure a deterministic behavior as `readdir(3)` does not guarantee an order. Sort them.
    .sort((left, right) => left.localeCompare(right))[0];
  if (sketchFilename) {
    return join(path, sketchFilename);
  }
  // If no sketches found in the folder, but the folder exists,
  // return with the path of the empty folder and let IDE2's frontend
  // figure out the workspace root.
  return fallbackToInvalidFolderPath ? path : undefined;
}

/*
 * When a new sketch is created, add a suffix to distinguish it
 * from other new sketches I created today.
 * If 'sketch_jul8a' is already used, go with 'sketch_jul8b'.
 * If 'sketch_jul8b' already used, go with 'sketch_jul8c'.
 * When it reach 'sketch_jul8z', go with 'sketch_jul8aa',
 * and so on.
 */
function sketchIndexToLetters(num: number): string {
  let out = '';
  let pow;
  do {
    pow = Math.floor(num / 26);
    const mod = num % 26;
    out = (mod ? String.fromCharCode(96 + mod) : (--pow, 'z')) + out;
    num = pow;
  } while (pow > 0);
  return out;
}

async function exists(pathLike: string): Promise<boolean> {
  try {
    await fs.access(pathLike, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively discovers sketches in the `root` folder give by the filesystem path.
 * Missing `root` must be handled by callers. This function expects an accessible `root` directory.
 */
export async function discoverSketches(
  root: string,
  container: Mutable<SketchContainer>,
  logger?: ILogger
): Promise<SketchContainer> {
  const pathToAllSketchFiles = await glob(
    '/!(libraries|hardware)/**/*.{ino,pde}',
    { root }
  );
  // if no match try to glob the sketchbook as a sketch folder
  if (!pathToAllSketchFiles.length) {
    pathToAllSketchFiles.push(...(await glob('/*.{ino,pde}', { root })));
  }

  // Sort by path length to filter out nested sketches, such as the `Nested_folder` inside the `Folder` sketch.
  //
  // `directories#user`
  // |
  // +--Folder
  //    |
  //    +--Folder.ino
  //    |
  //    +--Nested_folder
  //       |
  //       +--Nested_folder.ino
  pathToAllSketchFiles.sort((left, right) => {
    if (left.length === right.length) {
      // Sort alphabetically for tests consistency
      return left.localeCompare(right);
    }
    return left.length - right.length;
  });

  const getOrCreateChildContainer = (
    container: SketchContainer,
    segments: string[]
  ): SketchContainer => {
    // the sketchbook is a sketch folder
    if (segments.length === 1) {
      return container;
    }
    const segmentsCopy = segments.slice();
    let currentContainer = container;
    while (segmentsCopy.length > 2) {
      const currentSegment = segmentsCopy.shift();
      if (!currentSegment) {
        throw new Error(
          `'currentSegment' was not set when processing sketch container: ${JSON.stringify(
            container
          )}, original segments: ${JSON.stringify(
            segments
          )}, current container: ${JSON.stringify(
            currentContainer
          )}, current working segments: ${JSON.stringify(segmentsCopy)}`
        );
      }
      let childContainer = currentContainer.children.find(
        (childContainer) => childContainer.label === currentSegment
      );
      if (!childContainer) {
        childContainer = SketchContainer.create(currentSegment);
        currentContainer.children.push(childContainer);
      }
      currentContainer = childContainer;
    }
    if (segmentsCopy.length !== 2) {
      throw new Error(
        `Expected exactly two segments. A sketch folder name and the main sketch file name. For example, ['ExampleSketchName', 'ExampleSketchName.{ino,pde}]. Was: ${segmentsCopy}`
      );
    }
    return currentContainer;
  };

  // If the container has a sketch with the same name, it cannot have a child container.
  // See above example about how to ignore nested sketches.
  const prune = (
    container: Mutable<SketchContainer>
  ): Mutable<SketchContainer> => {
    for (const sketch of container.sketches) {
      const childContainerIndex = container.children.findIndex(
        (childContainer) => childContainer.label === sketch.name
      );
      if (childContainerIndex >= 0) {
        container.children.splice(childContainerIndex, 1);
      }
    }
    container.children.forEach(prune);
    return container;
  };

  for (const pathToSketchFile of pathToAllSketchFiles) {
    const relative = path.relative(root, pathToSketchFile);
    if (!relative) {
      logger?.warn(
        `Could not determine relative sketch path from the root <${root}> to the sketch <${pathToSketchFile}>. Skipping. Relative path was: ${relative}`
      );
      continue;
    }
    const segments = relative.split(path.sep);
    let sketchName: string;
    let sketchFilename: string;
    if (!segments.length) {
      // no segments.
      logger?.warn(
        `Expected at least one segment relative path ${relative} from the root <${root}> to the sketch <${pathToSketchFile}>. Skipping.`
      );
      continue;
    } else if (segments.length === 1) {
      // The sketchbook root is a sketch folder
      sketchName = path.basename(root);
      sketchFilename = segments[0];
    } else {
      // the folder name and the sketch name must match. For example, `Foo/foo.ino` is invalid.
      // drop the folder name from the sketch name, if `.ino` or `.pde` remains, it's valid
      sketchName = segments[segments.length - 2];
      sketchFilename = segments[segments.length - 1];
    }
    const sketchFileExtension = segments[segments.length - 1].replace(
      new RegExp(escapeRegExpCharacters(sketchName)),
      ''
    );
    if (sketchFileExtension !== '.ino' && sketchFileExtension !== '.pde') {
      logger?.warn(
        `Mismatching sketch file <${sketchFilename}> and sketch folder name <${sketchName}>. Skipping`
      );
      continue;
    }
    const child = getOrCreateChildContainer(container, segments);
    child.sketches.push({
      name: sketchName,
      uri: FileUri.create(path.dirname(pathToSketchFile)).toString(),
    });
  }

  return prune(container);
}

/**
 * Replica of Go `os.UserCacheDir()`.
 * https://github.com/golang/go/blob/777f43ab27bde4c662cd0a663f807f74f3fbab0f/src/os/file.go#L477
 */
export function userCacheDir(): string {
  let dir: string | undefined;
  const platform = os.platform();

  switch (platform) {
    case 'darwin': {
      dir = path.join(os.homedir(), '/Library/Caches');
      break;
    }
    case 'win32': {
      dir = process.env.LocalAppData || undefined;
      if (!dir) {
        throw new Error('%LocalAppData% is not defined');
      }
      break;
    }
    default: {
      dir = process.env.XDG_CACHE_HOME || undefined;
      if (!dir) {
        dir = path.join(os.homedir() + '/.cache');
      } else if (!path.isAbsolute(dir)) {
        throw new Error('path in $XDG_CACHE_HOME is relative');
      }
    }
  }

  return dir;
}
